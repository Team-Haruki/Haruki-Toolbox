/**
 * Pure logic for the calendar-based event planner: hour grid over the event
 * window, points-per-hour brushes, painted-cell summaries, and the song
 * PT ranking derived from the engine's music recommend output.
 */

export const PLANNER_HOUR_MS = 3_600_000

/** Rest is a built-in brush; painted hours contribute zero points. */
export const PLANNER_REST_BRUSH_ID = "rest"

export const PLANNER_BRUSH_COLORS = [
  "#33ccbb",
  "#7c6ef2",
  "#f2a03f",
  "#e2467d",
  "#4ec3f7",
  "#8bc34a",
  "#f26262",
  "#b366d9",
] as const

export type PlannerBrush = {
  id: string
  name: string
  color: string
  /** Event points contributed per painted hour. */
  pointsPerHour: number
  musicId: number | null
  difficulty: string | null
  eventPointPerPlay: number | null
  playsPerHour: number | null
  /** Card ids of the deck the brush was built from, for a thumbnail recap. */
  deckCardIds: number[]
}

export type PlannerCalendarHour = {
  hourStartMs: number
  hourOfDay: number
}

export type PlannerCalendarDay = {
  dayStartMs: number
  hours: PlannerCalendarHour[]
}

/**
 * Splits the event window into day rows of hour cells. Hours are aligned to
 * local wall-clock hours; partial first/last hours are included so the whole
 * window stays paintable.
 */
export function buildPlannerCalendar(startAt: number, aggregateAt: number): PlannerCalendarDay[] {
  if (!Number.isFinite(startAt) || !Number.isFinite(aggregateAt) || aggregateAt <= startAt) {
    return []
  }

  const firstHour = new Date(startAt)
  firstHour.setMinutes(0, 0, 0)

  const days: PlannerCalendarDay[] = []
  let current = firstHour.getTime()
  while (current < aggregateAt) {
    const date = new Date(current)
    const dayStart = new Date(current)
    dayStart.setHours(0, 0, 0, 0)
    let day = days[days.length - 1]
    if (day == null || day.dayStartMs !== dayStart.getTime()) {
      day = { dayStartMs: dayStart.getTime(), hours: [] }
      days.push(day)
    }

    day.hours.push({ hourStartMs: current, hourOfDay: date.getHours() })
    // DST-safe stepping: advance by one wall-clock hour.
    date.setHours(date.getHours() + 1, 0, 0, 0)
    current = date.getTime()
  }

  return days
}

export type PlannerCells = Readonly<Record<string, string>>

export type PlannerSummary = {
  plannedPoints: number
  plannedHours: number
  restHours: number
  hoursByBrush: Map<string, number>
}

/** Totals over painted cells; cells with unknown brush ids are ignored. */
export function summarizePlannerCells(
  cells: PlannerCells,
  brushes: readonly PlannerBrush[],
): PlannerSummary {
  const brushById = new Map(brushes.map((brush) => [brush.id, brush]))
  const hoursByBrush = new Map<string, number>()
  let plannedPoints = 0
  let plannedHours = 0
  let restHours = 0
  for (const brushId of Object.values(cells)) {
    const brush = brushById.get(brushId)
    if (brush == null) {
      continue
    }

    hoursByBrush.set(brushId, (hoursByBrush.get(brushId) ?? 0) + 1)
    if (brush.id === PLANNER_REST_BRUSH_ID) {
      restHours += 1
      continue
    }

    plannedHours += 1
    plannedPoints += brush.pointsPerHour
  }

  return { plannedPoints: Math.round(plannedPoints), plannedHours, restHours, hoursByBrush }
}

export function resolvePlannerRemainingPoint(input: {
  targetPoint: number | null
  currentPoint: number
  plannedPoints: number
}): number | null {
  if (input.targetPoint == null) {
    return null
  }

  return Math.max(0, input.targetPoint - input.currentPoint - input.plannedPoints)
}

/** Picks the least-used palette color for a new brush. */
export function pickPlannerBrushColor(existing: readonly PlannerBrush[]): string {
  const counts = new Map<string, number>()
  for (const brush of existing) {
    counts.set(brush.color, (counts.get(brush.color) ?? 0) + 1)
  }

  let best: string = PLANNER_BRUSH_COLORS[0]
  let bestCount = Number.POSITIVE_INFINITY
  for (const color of PLANNER_BRUSH_COLORS) {
    const count = counts.get(color) ?? 0
    if (count < bestCount) {
      best = color
      bestCount = count
    }
  }

  return best
}

/**
 * Plays per hour from the song length, assuming ~30s of loading/result
 * overhead per multi-live cycle.
 */
export function estimatePlaysPerHour(musicSeconds: number | null): number {
  if (musicSeconds == null || !Number.isFinite(musicSeconds) || musicSeconds <= 0) {
    return 30
  }

  return Math.max(1, Math.floor(3600 / (musicSeconds + 30)))
}

export type PlannerMusicDuration = Map<string, number>

/** `musicId:difficulty` → seconds, tolerant of the raw music metas shape. */
export function buildPlannerMusicDurations(rawMusicMetas: unknown): PlannerMusicDuration {
  const durations: PlannerMusicDuration = new Map()
  if (!Array.isArray(rawMusicMetas)) {
    return durations
  }

  for (const entry of rawMusicMetas) {
    if (entry == null || typeof entry !== "object") {
      continue
    }

    const record = entry as Record<string, unknown>
    const musicId = Number(record.music_id)
    const difficulty = typeof record.difficulty === "string" ? record.difficulty : ""
    const seconds = Number(record.music_time)
    if (Number.isInteger(musicId) && difficulty && Number.isFinite(seconds) && seconds > 0) {
      durations.set(`${musicId}:${difficulty}`, seconds)
    }
  }

  return durations
}

export type PlannerRankedSong = {
  musicId: number
  difficulty: string
  title: string
  eventPoint: number
  liveScore: number
  musicSeconds: number | null
  playsPerHour: number
  pointsPerHour: number
}

export type PlannerRankingSource = {
  music_id: number
  difficulty: string
  live_score: number
  event_point: number | null
}

/**
 * Joins the engine's music recommend output with titles and durations into a
 * points-per-hour ranking, best first. Songs without an event point (or not in
 * the title map, e.g. unreleased leaks) are skipped.
 */
export function buildPlannerSongRanking(
  results: readonly PlannerRankingSource[],
  titlesById: ReadonlyMap<number, string>,
  durations: PlannerMusicDuration,
): PlannerRankedSong[] {
  const rows: PlannerRankedSong[] = []
  for (const result of results) {
    const title = titlesById.get(result.music_id)
    if (title == null || result.event_point == null || result.event_point <= 0) {
      continue
    }

    const musicSeconds = durations.get(`${result.music_id}:${result.difficulty}`) ?? null
    const playsPerHour = estimatePlaysPerHour(musicSeconds)
    rows.push({
      musicId: result.music_id,
      difficulty: result.difficulty,
      title,
      eventPoint: result.event_point,
      liveScore: result.live_score,
      musicSeconds,
      playsPerHour,
      pointsPerHour: Math.round(result.event_point * playsPerHour),
    })
  }

  return rows.sort((a, b) => b.pointsPerHour - a.pointsPerHour
    || b.eventPoint - a.eventPoint
    || a.musicId - b.musicId)
}

/** Storage key for one plan: account + data region + event. */
export function buildPlannerPlanKey(accountKey: string, region: string, eventId: string): string {
  return `${accountKey}|${region}|${eventId}`
}
