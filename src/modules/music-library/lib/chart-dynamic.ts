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

type ChartParseState = {
  notes: RawNote[]
  events: TimingEvent[]
  bpmDefinitions: Map<number, number>
  bpmReferences: Array<{ bar: number; id: number }>
}

function appendScoreNotes(data: string, createNote: (beat: number, token: string) => RawNote): RawNote[] {
  return parseScoreData(data).map(([beat, token]) => createNote(beat, token))
}

function parseTimingLine(header: string, data: string, state: ChartParseState): boolean {
  const eventMatch = EVENT_HEADER.exec(header)
  if (eventMatch) {
    state.events.push({ bar: Number(eventMatch[1]), bpm: null, barLength: Number(data) || 4 })
    return true
  }

  const bpmDefMatch = BPM_DEF_HEADER.exec(header)
  if (bpmDefMatch) {
    const bpm = Number(data)
    if (Number.isFinite(bpm) && bpm > 0) {
      state.bpmDefinitions.set(base36Two(bpmDefMatch[1]), bpm)
    }
    return true
  }

  const bpmRefMatch = BPM_REF_HEADER.exec(header)
  if (!bpmRefMatch) {
    return false
  }
  const baseBar = Number(bpmRefMatch[1])
  state.bpmReferences.push(...parseScoreData(data).map(([beat, token]) => ({
    bar: baseBar + beat,
    id: base36Two(token),
  })))
  return true
}

function parseNoteLine(header: string, data: string, notes: RawNote[]): void {
  const tapMatch = TAP_HEADER.exec(header)
  if (tapMatch) {
    const baseBar = Number(tapMatch[1])
    notes.push(...appendScoreNotes(data, (beat, token) => makeRawNote(
      "tap",
      baseBar + beat,
      base36Char(tapMatch[2]),
      base36Char(token[1]),
      base36Char(token[0]),
    )))
    return
  }

  const slideMatch = SLIDE_HEADER.exec(header) ?? DECO_SLIDE_HEADER.exec(header)
  if (slideMatch) {
    const baseBar = Number(slideMatch[1])
    const decoration = header[3] === "9"
    notes.push(...appendScoreNotes(data, (beat, token) => makeRawNote(
      "slide",
      baseBar + beat,
      base36Char(slideMatch[2]),
      base36Char(token[1]),
      base36Char(token[0]),
      base36Char(slideMatch[3]),
      decoration,
    )))
    return
  }

  const directionalMatch = DIRECTIONAL_HEADER.exec(header)
  if (directionalMatch) {
    const baseBar = Number(directionalMatch[1])
    notes.push(...appendScoreNotes(data, (beat, token) => makeRawNote(
      "directional",
      baseBar + beat,
      base36Char(directionalMatch[2]),
      base36Char(token[1]),
      base36Char(token[0]),
    )))
  }
}

function parseChartLine(rawLine: string, state: ChartParseState): void {
  const match = SCORE_LINE.exec(rawLine.trim())
  if (!match) {
    return
  }

  const header = match[1]
  const data = match[2].trim()
  if (!parseTimingLine(header, data, state)) {
    parseNoteLine(header, data, state.notes)
  }
}

function appendReferencedBpmEvents(state: ChartParseState): void {
  for (const reference of state.bpmReferences) {
    const bpm = state.bpmDefinitions.get(reference.id)
    if (bpm != null) {
      state.events.push({ bar: reference.bar, bpm, barLength: null })
    }
  }
}

export function parseDynamicChart(sus: string): DynamicChart {
  const state: ChartParseState = {
    notes: [],
    events: [],
    bpmDefinitions: new Map(),
    bpmReferences: [],
  }

  for (const rawLine of sus.split(/\r?\n/)) {
    parseChartLine(rawLine, state)
  }

  appendReferencedBpmEvents(state)
  linkNotes(state.notes)
  const timing = buildTiming(state.events)
  return buildVisualization(state.notes, timing)
}

function indexNotesByBar(notes: RawNote[]): Map<number, number[]> {
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
  return notesByBar
}

function notesSharePosition(left: RawNote, right: RawNote): boolean {
  return left.lane === right.lane && left.width === right.width
}

function attachDirectionalNotes(notes: RawNote[], notesByBar: ReadonlyMap<number, number[]>): void {
  for (let index = 0; index < notes.length; index += 1) {
    const note = notes[index]
    if (note.deleted || note.kind !== "directional") {
      continue
    }

    for (const other of notesByBar.get(note.bar) ?? []) {
      const tap = notes[other]
      if (!tap.deleted && tap.kind === "tap" && notesSharePosition(tap, note)) {
        tap.deleted = true
        note.tapIdx = other
      }
    }
  }
}

function attachSlideTap(note: RawNote, notes: RawNote[], noteIndices: readonly number[]): void {
  for (const other of noteIndices) {
    const candidate = notes[other]
    if (!candidate.deleted && candidate.kind === "tap" && notesSharePosition(candidate, note)) {
      candidate.deleted = true
      note.tapIdx = other
    }
  }
}

function attachSlideDirectional(note: RawNote, notes: RawNote[], noteIndices: readonly number[]): void {
  for (const other of noteIndices) {
    const candidate = notes[other]
    if (candidate.deleted || candidate.kind !== "directional" || !notesSharePosition(candidate, note)) {
      continue
    }

    candidate.deleted = true
    note.directionalIdx = other
    if (candidate.tapIdx !== -1) {
      note.tapIdx = candidate.tapIdx
    }
  }
}

function linkNextSlide(note: RawNote, index: number, notes: RawNote[]): void {
  if (note.noteType === 2) {
    return
  }

  for (let next = index + 1; next < notes.length; next += 1) {
    const candidate = notes[next]
    if (candidate.deleted || candidate.kind !== "slide") {
      continue
    }
    if (candidate.channel === note.channel && candidate.decoration === note.decoration) {
      note.nextIdx = next
      candidate.headIdx = note.headIdx
      return
    }
  }
}

function linkSlideNotes(notes: RawNote[], notesByBar: ReadonlyMap<number, number[]>): void {
  for (let index = 0; index < notes.length; index += 1) {
    const note = notes[index]
    if (note.deleted || note.kind !== "slide") {
      continue
    }

    note.headIdx = note.headIdx === -1 ? index : note.headIdx
    const noteIndices = notesByBar.get(note.bar) ?? []
    attachSlideTap(note, notes, noteIndices)
    attachSlideDirectional(note, notes, noteIndices)
    linkNextSlide(note, index, notes)
  }
}

/** Port of the upstream multi-pass linking (`Score::init_notes`). */
function linkNotes(notes: RawNote[]): void {
  notes.sort((a, b) => a.bar - b.bar)
  const notesByBar = indexNotesByBar(notes)
  // Attach directional flicks first, then taps/directionals to slide chains.
  attachDirectionalNotes(notes, notesByBar)
  linkSlideNotes(notes, notesByBar)
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

function buildTapVisualization(note: RawNote, time: number): ChartVisTap | null {
  if (TAP_NONE_TYPES.has(note.noteType)) {
    return null
  }
  return {
    time,
    lane: note.lane - 2,
    width: note.width,
    critical: tapIsCritical(note.noteType),
    trace: TAP_TREND_TYPES.has(note.noteType),
    damage: note.noteType === TAP_DAMAGE_TYPE,
    flick: note.noteType === TAP_FLICK_TYPE ? "up" : null,
  }
}

function buildDirectionalVisualization(note: RawNote, time: number, notes: RawNote[]): ChartVisTap {
  const attachedTap = note.tapIdx !== -1 ? notes[note.tapIdx] : null
  return {
    time,
    lane: note.lane - 2,
    width: note.width,
    critical: attachedTap != null && tapIsCritical(attachedTap.noteType),
    trace: attachedTap != null && TAP_TREND_TYPES.has(attachedTap.noteType),
    damage: false,
    flick: flickDirection(note.noteType),
  }
}

function buildSlideHold(
  note: RawNote,
  notes: RawNote[],
  timing: Timing,
): { hold: ChartVisHold | null; duration: number } {
  const points: ChartHoldPoint[] = []
  let critical = false
  let endFlick: ChartFlickDirection | null = null
  let duration = 0
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
    duration = Math.max(duration, pointTime)

    const cursorTap = cursor.tapIdx !== -1 ? notes[cursor.tapIdx] : null
    if (cursorTap != null && tapIsCritical(cursorTap.noteType)) {
      critical = true
    }
    if (cursor.noteType === 2 && cursor.directionalIdx !== -1) {
      endFlick = flickDirection(notes[cursor.directionalIdx].noteType)
    }
    cursor = cursor.nextIdx !== -1 ? notes[cursor.nextIdx] : null
  }

  const hold = points.length >= 2
    ? {
        critical,
        points,
        endFlick,
        startVisible: !note.decoration,
        endVisible: !note.decoration,
      }
    : null
  return { hold, duration }
}

function buildBarLines(timing: Timing, duration: number): ChartBarLine[] {
  const barLines: ChartBarLine[] = []
  for (let bar = 0; bar <= 5000; bar += 1) {
    const time = timeAtBar(timing, bar)
    if (time > duration + 2) {
      break
    }
    barLines.push({ time, bar })
  }
  return barLines
}

function buildBpmEvents(timing: Timing): { time: number; bpm: number }[] {
  const bpmEvents: { time: number; bpm: number }[] = []
  for (const checkpoint of timing.checkpoints) {
    const last = bpmEvents[bpmEvents.length - 1]
    if (last?.time === checkpoint.time) {
      // Later checkpoints at the same instant win (e.g. over the 120 default).
      last.bpm = checkpoint.bpm
    } else if (!last || last.bpm !== checkpoint.bpm) {
      bpmEvents.push({ time: checkpoint.time, bpm: checkpoint.bpm })
    }
  }
  return bpmEvents
}

function buildVisualization(notes: RawNote[], timing: Timing): DynamicChart {
  const taps: ChartVisTap[] = []
  const holds: ChartVisHold[] = []
  let duration = 0

  for (let index = 0; index < notes.length; index += 1) {
    const note = notes[index]
    if (note.deleted) {
      continue
    }

    const time = timeAtBar(timing, note.bar)
    if (note.kind === "tap") {
      const tap = buildTapVisualization(note, time)
      if (tap) {
        taps.push(tap)
        duration = Math.max(duration, time)
      }
      continue
    }

    if (note.kind === "directional") {
      taps.push(buildDirectionalVisualization(note, time, notes))
      duration = Math.max(duration, time)
      continue
    }

    // Slides: emit one hold per chain, walking from its head.
    if (note.headIdx === index) {
      const result = buildSlideHold(note, notes, timing)
      duration = Math.max(duration, result.duration)
      if (result.hold) {
        holds.push(result.hold)
      }
    }
  }

  taps.sort((a, b) => a.time - b.time)
  holds.sort((a, b) => a.points[0].time - b.points[0].time)

  return {
    taps,
    holds,
    barLines: buildBarLines(timing, duration),
    bpmEvents: buildBpmEvents(timing),
    duration,
  }
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
