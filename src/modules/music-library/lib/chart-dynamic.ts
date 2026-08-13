/**
 * SUS chart parsing for the dynamic (scrolling) preview — a TypeScript port
 * of the note/timing model from Team-Haruki/pjsekai-scores-rs (MIT), reduced
 * to what the canvas player needs. Bar positions use plain doubles: equal
 * rationals divide to identical IEEE values, so equality-based note linking
 * stays exact.
 */

export type ChartFlickDirection = "up" | "left" | "right" | "down"

export type ChartVisTap = {
  time: number
  /** 0-based display lane (0..11). */
  lane: number
  width: number
  critical: boolean
  /** Trace ("trend") notes render hollow and small. */
  trace: boolean
  damage: boolean
  flick: ChartFlickDirection | null
}

export type ChartHoldPoint = {
  time: number
  lane: number
  width: number
  /** Visible relay tick at this point. */
  tick: boolean
}

export type ChartVisHold = {
  critical: boolean
  points: ChartHoldPoint[]
  /** Flick direction attached to the hold end, if any. */
  endFlick: ChartFlickDirection | null
  /** Whether the head/end carry tap heads (guide slides do not). */
  startVisible: boolean
  endVisible: boolean
}

export type ChartBarLine = {
  time: number
  bar: number
}

export type DynamicChart = {
  taps: ChartVisTap[]
  holds: ChartVisHold[]
  barLines: ChartBarLine[]
  bpmEvents: { time: number; bpm: number }[]
  /** Time of the last note (seconds from chart zero). */
  duration: number
}

const TAP_CRITICAL_TYPES = new Set([2, 6, 8])
const TAP_TREND_TYPES = new Set([5, 6])
const TAP_NONE_TYPES = new Set([7, 8])
const TAP_DAMAGE_TYPE = 4
const TAP_FLICK_TYPE = 3

type RawNote = {
  kind: "tap" | "slide" | "directional"
  bar: number
  lane: number
  width: number
  noteType: number
  /** Slide only. */
  channel: number
  decoration: boolean
  /** Linking results (indices into the raw note array). */
  tapIdx: number
  directionalIdx: number
  nextIdx: number
  headIdx: number
  deleted: boolean
}

type TimingEvent = {
  bar: number
  bpm: number | null
  barLength: number | null
}

function base36Char(char: string): number {
  const code = char.charCodeAt(0)
  if (code >= 48 && code <= 57) {
    return code - 48
  }
  if (code >= 65 && code <= 90) {
    return code - 65 + 10
  }
  if (code >= 97 && code <= 122) {
    return code - 97 + 10
  }
  return 0
}

function base36Two(text: string): number {
  if (text.length >= 2) {
    return base36Char(text[0]) * 36 + base36Char(text[1])
  }
  return text.length === 1 ? base36Char(text[0]) : 0
}

/** Splits score line data into (fraction-of-bar, two-char token) pairs. */
function parseScoreData(data: string): Array<[number, string]> {
  const pairs: Array<[number, string]> = []
  const length = data.length
  for (let index = 0; index + 1 < length; index += 2) {
    const pair = data.slice(index, index + 2)
    if (pair !== "00") {
      pairs.push([index / length, pair])
    }
  }

  return pairs
}

const SCORE_LINE = /^#(\w+):\s*(.*)$/
const EVENT_HEADER = /^(\d{3})02$/
const BPM_DEF_HEADER = /^BPM(..)$/
const BPM_REF_HEADER = /^(\d{3})08$/
const TAP_HEADER = /^(\d{3})1(.)$/
const SLIDE_HEADER = /^(\d{3})3(.)(.)$/
const DIRECTIONAL_HEADER = /^(\d{3})5(.)$/
const DECO_SLIDE_HEADER = /^(\d{3})9(.)(.)$/

function makeRawNote(
  kind: RawNote["kind"],
  bar: number,
  lane: number,
  width: number,
  noteType: number,
  channel = 0,
  decoration = false,
): RawNote {
  return {
    kind,
    bar,
    lane,
    width,
    noteType,
    channel,
    decoration,
    tapIdx: -1,
    directionalIdx: -1,
    nextIdx: -1,
    headIdx: -1,
    deleted: false,
  }
}

export function parseDynamicChart(sus: string): DynamicChart {
  const notes: RawNote[] = []
  const events: TimingEvent[] = []
  const bpmDefinitions = new Map<number, number>()
  const bpmReferences: Array<{ bar: number; id: number }> = []

  for (const rawLine of sus.split(/\r?\n/)) {
    const match = SCORE_LINE.exec(rawLine.trim())
    if (!match) {
      continue
    }

    const header = match[1]
    const data = match[2].trim()

    const eventMatch = EVENT_HEADER.exec(header)
    if (eventMatch) {
      events.push({ bar: Number(eventMatch[1]), bpm: null, barLength: Number(data) || 4 })
      continue
    }

    const bpmDefMatch = BPM_DEF_HEADER.exec(header)
    if (bpmDefMatch) {
      const bpm = Number(data)
      if (Number.isFinite(bpm) && bpm > 0) {
        bpmDefinitions.set(base36Two(bpmDefMatch[1]), bpm)
      }
      continue
    }

    const bpmRefMatch = BPM_REF_HEADER.exec(header)
    if (bpmRefMatch) {
      for (const [beat, token] of parseScoreData(data)) {
        bpmReferences.push({ bar: Number(bpmRefMatch[1]) + beat, id: base36Two(token) })
      }
      continue
    }

    const tapMatch = TAP_HEADER.exec(header)
    if (tapMatch) {
      for (const [beat, token] of parseScoreData(data)) {
        notes.push(makeRawNote(
          "tap",
          Number(tapMatch[1]) + beat,
          base36Char(tapMatch[2]),
          base36Char(token[1]),
          base36Char(token[0]),
        ))
      }
      continue
    }

    const slideMatch = SLIDE_HEADER.exec(header) ?? DECO_SLIDE_HEADER.exec(header)
    if (slideMatch) {
      const decoration = header[3] === "9"
      for (const [beat, token] of parseScoreData(data)) {
        notes.push(makeRawNote(
          "slide",
          Number(slideMatch[1]) + beat,
          base36Char(slideMatch[2]),
          base36Char(token[1]),
          base36Char(token[0]),
          base36Char(slideMatch[3]),
          decoration,
        ))
      }
      continue
    }

    const directionalMatch = DIRECTIONAL_HEADER.exec(header)
    if (directionalMatch) {
      for (const [beat, token] of parseScoreData(data)) {
        notes.push(makeRawNote(
          "directional",
          Number(directionalMatch[1]) + beat,
          base36Char(directionalMatch[2]),
          base36Char(token[1]),
          base36Char(token[0]),
        ))
      }
    }
  }

  for (const reference of bpmReferences) {
    const bpm = bpmDefinitions.get(reference.id)
    if (bpm != null) {
      events.push({ bar: reference.bar, bpm, barLength: null })
    }
  }

  linkNotes(notes)
  const timing = buildTiming(events)
  return buildVisualization(notes, timing)
}

/** Port of the upstream multi-pass linking (`Score::init_notes`). */
function linkNotes(notes: RawNote[]): void {
  notes.sort((a, b) => a.bar - b.bar)

  const notesByBar = new Map<number, number[]>()
  for (let index = 0; index < notes.length; index += 1) {
    const note = notes[index]
    const displayLane = note.lane - 2
    if (displayLane < 0 || displayLane >= 12) {
      // Lane 0 carries SKILL/FEVER markers, not playable notes.
      note.deleted = true
      continue
    }

    const bucket = notesByBar.get(note.bar)
    if (bucket) {
      bucket.push(index)
    } else {
      notesByBar.set(note.bar, [index])
    }
  }

  // Attach directional (flick) notes to the tap at the same position.
  for (let index = 0; index < notes.length; index += 1) {
    const note = notes[index]
    if (note.deleted || note.kind !== "directional") {
      continue
    }

    for (const other of notesByBar.get(note.bar) ?? []) {
      const tap = notes[other]
      if (!tap.deleted && tap.kind === "tap"
        && tap.lane === note.lane && tap.width === note.width) {
        tap.deleted = true
        note.tapIdx = other
      }
    }
  }

  // Attach taps/directionals to slides, then chain slides by channel.
  for (let index = 0; index < notes.length; index += 1) {
    const note = notes[index]
    if (note.deleted || note.kind !== "slide") {
      continue
    }

    if (note.headIdx === -1) {
      note.headIdx = index
    }

    for (const other of notesByBar.get(note.bar) ?? []) {
      const candidate = notes[other]
      if (candidate.deleted || candidate.kind !== "tap") {
        continue
      }
      if (candidate.lane === note.lane && candidate.width === note.width) {
        candidate.deleted = true
        note.tapIdx = other
      }
    }

    for (const other of notesByBar.get(note.bar) ?? []) {
      const candidate = notes[other]
      if (candidate.deleted || candidate.kind !== "directional") {
        continue
      }
      if (candidate.lane === note.lane && candidate.width === note.width) {
        candidate.deleted = true
        note.directionalIdx = other
        if (candidate.tapIdx !== -1) {
          note.tapIdx = candidate.tapIdx
        }
      }
    }

    if (note.noteType !== 2) {
      for (let next = index + 1; next < notes.length; next += 1) {
        const candidate = notes[next]
        if (candidate.deleted || candidate.kind !== "slide") {
          continue
        }
        if (candidate.channel === note.channel && candidate.decoration === note.decoration) {
          note.nextIdx = next
          candidate.headIdx = note.headIdx
          break
        }
      }
    }
  }
}

type Timing = {
  /** Sorted (bar, cumulative seconds, bpm, barLength) checkpoints. */
  checkpoints: Array<{ bar: number; time: number; bpm: number; barLength: number }>
  lastBar: number
}

function buildTiming(events: TimingEvent[]): Timing {
  const sorted = [...events].sort((a, b) => a.bar - b.bar)
  const checkpoints: Timing["checkpoints"] = [{ bar: 0, time: 0, bpm: 120, barLength: 4 }]
  let lastBar = 0
  for (const event of sorted) {
    const previous = checkpoints[checkpoints.length - 1]
    const time = previous.time
      + (event.bar - previous.bar) * previous.barLength * 60 / previous.bpm
    checkpoints.push({
      bar: event.bar,
      time,
      bpm: event.bpm ?? previous.bpm,
      barLength: event.barLength ?? previous.barLength,
    })
    lastBar = Math.max(lastBar, event.bar)
  }

  return { checkpoints, lastBar }
}

function timeAtBar(timing: Timing, bar: number): number {
  let active = timing.checkpoints[0]
  for (const checkpoint of timing.checkpoints) {
    if (checkpoint.bar <= bar) {
      active = checkpoint
    } else {
      break
    }
  }

  return active.time + (bar - active.bar) * active.barLength * 60 / active.bpm
}

function flickDirection(directionalType: number): ChartFlickDirection {
  switch (directionalType) {
    case 3:
    case 5:
      return "left"
    case 4:
    case 6:
      return "right"
    case 2:
      return "down"
    default:
      return "up"
  }
}

function tapIsCritical(noteType: number): boolean {
  return TAP_CRITICAL_TYPES.has(noteType)
}

function buildVisualization(notes: RawNote[], timing: Timing): DynamicChart {
  const taps: ChartVisTap[] = []
  const holds: ChartVisHold[] = []
  let duration = 0

  const trackTime = (time: number) => {
    duration = Math.max(duration, time)
  }

  for (let index = 0; index < notes.length; index += 1) {
    const note = notes[index]
    if (note.deleted) {
      continue
    }

    const lane = note.lane - 2
    const time = timeAtBar(timing, note.bar)

    if (note.kind === "tap") {
      if (TAP_NONE_TYPES.has(note.noteType)) {
        continue
      }

      taps.push({
        time,
        lane,
        width: note.width,
        critical: tapIsCritical(note.noteType),
        trace: TAP_TREND_TYPES.has(note.noteType),
        damage: note.noteType === TAP_DAMAGE_TYPE,
        flick: note.noteType === TAP_FLICK_TYPE ? "up" : null,
      })
      trackTime(time)
      continue
    }

    if (note.kind === "directional") {
      const attachedTap = note.tapIdx !== -1 ? notes[note.tapIdx] : null
      taps.push({
        time,
        lane,
        width: note.width,
        critical: attachedTap != null && tapIsCritical(attachedTap.noteType),
        trace: attachedTap != null && TAP_TREND_TYPES.has(attachedTap.noteType),
        damage: false,
        flick: flickDirection(note.noteType),
      })
      trackTime(time)
      continue
    }

    // Slides: emit one hold per chain, walking from its head.
    if (note.kind === "slide" && note.headIdx === index) {
      const points: ChartHoldPoint[] = []
      let critical = false
      let endFlick: ChartFlickDirection | null = null
      let cursor: RawNote | null = note
      let guard = 0
      while (cursor != null && guard < 10_000) {
        guard += 1
        const pointTime = timeAtBar(timing, cursor.bar)
        points.push({
          time: pointTime,
          lane: cursor.lane - 2,
          width: cursor.width,
          tick: cursor.noteType === 3,
        })
        trackTime(pointTime)

        const cursorTap = cursor.tapIdx !== -1 ? notes[cursor.tapIdx] : null
        if (cursorTap != null && tapIsCritical(cursorTap.noteType)) {
          critical = true
        }
        if (cursor.noteType === 2 && cursor.directionalIdx !== -1) {
          endFlick = flickDirection(notes[cursor.directionalIdx].noteType)
        }

        cursor = cursor.nextIdx !== -1 ? notes[cursor.nextIdx] : null
      }

      if (points.length >= 2) {
        // Guide (decoration) chains carry no tappable heads.
        holds.push({
          critical,
          points,
          endFlick,
          startVisible: !note.decoration,
          endVisible: !note.decoration,
        })
      }
    }
  }

  taps.sort((a, b) => a.time - b.time)
  holds.sort((a, b) => a.points[0].time - b.points[0].time)

  const barLines: ChartBarLine[] = []
  for (let bar = 0; bar <= 5000; bar += 1) {
    const time = timeAtBar(timing, bar)
    if (time > duration + 2) {
      break
    }
    barLines.push({ time, bar })
  }

  const bpmEvents: { time: number; bpm: number }[] = []
  for (const checkpoint of timing.checkpoints) {
    const last = bpmEvents[bpmEvents.length - 1]
    if (last && last.time === checkpoint.time) {
      // Later checkpoints at the same instant win (e.g. over the 120 default).
      last.bpm = checkpoint.bpm
    } else if (!last || last.bpm !== checkpoint.bpm) {
      bpmEvents.push({ time: checkpoint.time, bpm: checkpoint.bpm })
    }
  }

  return { taps, holds, barLines, bpmEvents, duration }
}

/** Linear lane interpolation along a hold's points at the given time. */
export function holdEdgesAtTime(
  hold: ChartVisHold,
  time: number,
): { left: number; right: number } | null {
  const points = hold.points
  if (time < points[0].time || time > points[points.length - 1].time) {
    return null
  }

  for (let index = 0; index + 1 < points.length; index += 1) {
    const from = points[index]
    const to = points[index + 1]
    if (time > to.time) {
      continue
    }

    const span = to.time - from.time
    const ratio = span <= 0 ? 0 : (time - from.time) / span
    const left = from.lane + (to.lane - from.lane) * ratio
    const width = from.width + (to.width - from.width) * ratio
    return { left, right: left + width }
  }

  return null
}
