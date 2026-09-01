import type { ChartBpmInfo } from "./music-bpm"
import { formatBpmValue } from "./music-bpm"
import type { MusicVocalEntry } from "./music-data"

/** "m:ss" for player clocks; negative / NaN input clamps to 0:00. */
export function formatPlayerClock(seconds: number): string {
  const clamped = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  const minutes = Math.floor(clamped / 60)
  const remainder = Math.floor(clamped % 60)
  return `${minutes}:${String(remainder).padStart(2, "0")}`
}

/** Leading silence to skip; null / negative fillers count as none. */
export function resolveFillerSeconds(fillerSec: number | null | undefined): number {
  return fillerSec != null && Number.isFinite(fillerSec) && fillerSec > 0 ? fillerSec : 0
}

/** Media time → the position shown to the user (the filler is hidden). */
export function toDisplayTime(mediaTime: number, fillerSec: number | null | undefined): number {
  return Math.max(0, mediaTime - resolveFillerSeconds(fillerSec))
}

/** User position → media time, clamped into `[filler, duration]` when the duration is known. */
export function toMediaTime(
  displayTime: number,
  fillerSec: number | null | undefined,
  duration: number | null,
): number {
  const filler = resolveFillerSeconds(fillerSec)
  const target = filler + Math.max(0, Number.isFinite(displayTime) ? displayTime : 0)
  return duration != null && Number.isFinite(duration) && duration > 0 ? Math.min(target, duration) : target
}

/** Playable length shown as the clock total (duration minus filler). */
export function toDisplayDuration(duration: number | null, fillerSec: number | null | undefined): number | null {
  if (duration == null || !Number.isFinite(duration) || duration <= 0) {
    return null
  }
  return Math.max(0, duration - resolveFillerSeconds(fillerSec))
}

/** The chart preview plays the SEKAI version when available, else the first version with audio. */
export function resolvePreferredChartVocal(vocals: readonly MusicVocalEntry[]): MusicVocalEntry | null {
  return vocals.find((vocal) => vocal.musicVocalType === "sekai" && vocal.assetbundleName)
    ?? vocals.find((vocal) => vocal.assetbundleName)
    ?? null
}

/** "150" or "150 (120 → 150 → 180)" when the chart changes tempo. */
export function formatBpmLabel(info: ChartBpmInfo | null): string | null {
  if (info == null) {
    return null
  }

  const main = formatBpmValue(info.mainBpm)
  if (info.events.length <= 1) {
    return main
  }

  // Full chronological BPM sequence (consecutive duplicates already collapsed).
  const sequence = info.events.map((event) => formatBpmValue(event.bpm)).join(" → ")
  return `${main} (${sequence})`
}
