import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { resolveSekaiGameAssetUrl } from "@/shared/sekai/data-sources"

export type ChartBpmEvent = {
  /** Bar position (fractional within the bar). */
  bar: number
  bpm: number
  /** Seconds spent at this BPM, assuming 4 beats per bar. */
  duration: number
}

export type ChartBpmInfo = {
  /** The BPM active for the longest total duration. */
  mainBpm: number
  events: ChartBpmEvent[]
  barCount: number
  duration: number
}

/** Chart lookup order used by the bot for BPM display. */
export const BPM_DIFFICULTY_CANDIDATES = ["expert", "append", "master", "hard", "normal", "easy"] as const

const SUS_LINE_PATTERN = /^#([A-Za-z0-9]{3})([A-Za-z0-9]{2})\s*:\s*(\S+)/

function parseDecimalInt(value: string): number | null {
  return /^\d+$/.test(value) ? Number(value) : null
}

function parseChartScore(chartText: string): { score: Map<string, string>; barCount: number } {
  const score = new Map<string, string>()
  let barCount = 0
  for (const rawLine of chartText.split(/\r?\n/)) {
    const match = SUS_LINE_PATTERN.exec(rawLine.trim())
    if (!match) {
      continue
    }
    const bar = match[1].toUpperCase()
    const key = match[2].toUpperCase()
    score.set(`${bar}|${key}`, match[3].trim())
    const barNumber = parseDecimalInt(bar)
    if (barNumber != null && barNumber + 1 > barCount) {
      barCount = barNumber + 1
    }
  }
  return { score, barCount }
}

function buildBpmPalette(score: ReadonlyMap<string, string>): Map<string, number> {
  const palette = new Map<string, number>()
  for (const [token, value] of score) {
    const [bar, key] = token.split("|")
    const bpm = Number(value)
    if (bar === "BPM" && Number.isFinite(bpm)) {
      palette.set(key, bpm)
    }
  }
  return palette
}

function listRawBpmEvents(
  score: ReadonlyMap<string, string>,
  palette: ReadonlyMap<string, number>,
): Array<{ bar: number; bpm: number }> {
  const events: Array<{ bar: number; bpm: number }> = []
  for (const [token, value] of score) {
    const [bar, key] = token.split("|")
    const barNumber = key === "08" ? parseDecimalInt(bar) : null
    if (barNumber == null) {
      continue
    }
    const length = Math.floor(value.length / 2)
    for (let index = 0; index < length; index += 1) {
      const reference = value.slice(index * 2, index * 2 + 2).toUpperCase()
      const bpm = reference === "00" ? undefined : palette.get(reference)
      if (bpm != null) {
        events.push({ bar: barNumber + index / length, bpm })
      }
    }
  }
  return events.sort((a, b) => a.bar - b.bar)
}

function collapseBpmEvents(rawEvents: readonly { bar: number; bpm: number }[]): ChartBpmEvent[] {
  const events: ChartBpmEvent[] = []
  for (const item of rawEvents) {
    if (events.at(-1)?.bpm !== item.bpm) {
      events.push({ bar: item.bar, bpm: item.bpm, duration: 0 })
    }
  }
  return events
}

function calculateBpmDurations(events: ChartBpmEvent[], barCount: number) {
  const durationByBpm = new Map<number, number>()
  let totalDuration = 0
  events.forEach((event, index) => {
    const nextBar = events[index + 1]?.bar ?? barCount
    event.duration = ((nextBar - event.bar) / event.bpm) * 4 * 60
    totalDuration += event.duration
    durationByBpm.set(event.bpm, (durationByBpm.get(event.bpm) ?? 0) + event.duration)
  })
  return { durationByBpm, totalDuration }
}

function findMainBpm(durationByBpm: ReadonlyMap<number, number>): number {
  let mainBpm = 0
  let mainDuration = -1
  for (const [bpm, duration] of durationByBpm) {
    if (duration > mainDuration) {
      mainBpm = bpm
      mainDuration = duration
    }
  }
  return mainBpm
}

/**
 * Extracts BPM info from a SUS chart text — a port of the bot's
 * `parseChartBPM`: `#BPMxx` lines define the palette, `#nnn08` lines place
 * palette references on bars, consecutive duplicate events collapse, and the
 * main BPM is the one active for the longest total duration (4 beats/bar).
 * Returns null when the chart has no usable BPM data.
 */
export function parseChartBpm(chartText: string): ChartBpmInfo | null {
  const { score, barCount } = parseChartScore(chartText)
  const rawEvents = listRawBpmEvents(score, buildBpmPalette(score))

  if (rawEvents.length === 0) {
    return null
  }

  const events = collapseBpmEvents(rawEvents)
  const { durationByBpm, totalDuration } = calculateBpmDurations(events, barCount)
  const mainBpm = findMainBpm(durationByBpm)

  return { mainBpm, events, barCount, duration: totalDuration }
}

/** `startapp/music/music_score/0001_01/expert.txt` — same layout the bot reads. */
export function buildMusicScoreAssetPath(musicId: number, difficulty: string): string | null {
  const normalized = difficulty.trim().toLowerCase()
  if (!Number.isInteger(musicId) || musicId <= 0 || normalized === "") {
    return null
  }

  return `startapp/music/music_score/${String(musicId).padStart(4, "0")}_01/${normalized}.txt`
}

/**
 * Cache-busting version for chart fetches: some score files were cached on the
 * CDN before the origin sent CORS headers, and those stale variants fail
 * browser fetches. Bumping this forces a fresh, CORS-enabled cache entry.
 */
const MUSIC_SCORE_URL_VERSION = "2"

export function resolveMusicScoreUrl(
  region: SekaiRegion,
  musicId: number,
  difficulty: string,
  preference: SekaiAssetEndpointPreference = "china",
): string | null {
  const assetPath = buildMusicScoreAssetPath(musicId, difficulty)
  if (!assetPath) {
    return null
  }

  return `${resolveSekaiGameAssetUrl(region, assetPath, preference)}?v=${MUSIC_SCORE_URL_VERSION}`
}

/** "150", "92.5" — trims float noise to at most one decimal place. */
export function formatBpmValue(value: number): string {
  if (!Number.isFinite(value)) {
    return "-"
  }

  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/** Distinct BPM values across events, ascending. */
export function collectBpmRange(info: ChartBpmInfo): number[] {
  return [...new Set(info.events.map((event) => event.bpm))].sort((a, b) => a - b)
}
