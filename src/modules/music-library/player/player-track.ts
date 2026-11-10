/**
 * What the global player holds for one song: every playable vocal version
 * with its ready-made URL and labels, so the player bar needs no master data
 * of its own and keeps working after the page that started it is gone.
 */
import type { SekaiRegion } from "@/types"
import type { MusicVocalCharacter, MusicVocalEntry } from "@/modules/music-library/lib/music-data"
import { resolveFillerSeconds } from "@/modules/music-library/lib/music-player"

export type PlayerSinger = {
  /** Game character id for the avatar; null for outside singers. */
  characterId: number | null
  name: string
}

export type PlayerVocal = {
  id: number
  /** The game's `musicVocalType` ("sekai", "original_song", …). */
  type: string
  /** The unit a SEKAI version belongs to (its singers' unit); null when none can be told. */
  unit: string | null
  /** "SEKAI ver." style type label, already translated. */
  typeLabel: string
  caption: string
  singers: readonly PlayerSinger[]
  url: string
}

export type PlayerTrack = {
  region: SekaiRegion
  musicId: number
  title: string
  jacketUrl: string | null
  /** Leading silence baked into every vocal's audio; hidden from the clock. */
  fillerSec: number
  vocals: readonly PlayerVocal[]
}

export type BuildPlayerTrackInput = {
  region: SekaiRegion
  musicId: number
  title: string
  jacketUrl: string | null
  fillerSec: number | null | undefined
  vocals: readonly MusicVocalEntry[]
  resolveUrl: (vocal: MusicVocalEntry) => string | null
  typeLabel: (vocal: MusicVocalEntry) => string
  singerName: (character: MusicVocalCharacter) => string
  /** The unit a game-character singer belongs to (null for outside singers and unknown ids). */
  singerUnit?: (character: MusicVocalCharacter) => string | null
}

/** Versions without audio are left out; null when nothing is playable. */
export function buildPlayerTrack(input: BuildPlayerTrackInput): PlayerTrack | null {
  const vocals: PlayerVocal[] = []
  for (const vocal of input.vocals) {
    const url = input.resolveUrl(vocal)
    if (!url) {
      continue
    }
    vocals.push({
      id: vocal.id,
      type: vocal.musicVocalType,
      unit: resolveVocalUnit(vocal.characters.map((character) => input.singerUnit?.(character) ?? null)),
      typeLabel: input.typeLabel(vocal),
      caption: vocal.caption,
      singers: vocal.characters.map((character) => ({
        characterId: character.characterType === "game_character" ? character.characterId : null,
        name: input.singerName(character),
      })),
      url,
    })
  }
  if (vocals.length === 0) {
    return null
  }
  return {
    region: input.region,
    musicId: input.musicId,
    title: input.title,
    jacketUrl: input.jacketUrl,
    fillerSec: resolveFillerSeconds(input.fillerSec),
    vocals,
  }
}

const VIRTUAL_SINGER_UNIT = "piapro"

/**
 * The unit a group of singers stands for: the one most of them belong to.
 * Virtual singers guest in every unit's songs, so they only decide when
 * nobody else is singing.
 */
export function resolveVocalUnit(units: readonly (string | null)[]): string | null {
  const counts = new Map<string, number>()
  for (const unit of units) {
    if (unit) {
      counts.set(unit, (counts.get(unit) ?? 0) + 1)
    }
  }
  let best: string | null = null
  let bestCount = 0
  for (const [unit, count] of counts) {
    if (unit !== VIRTUAL_SINGER_UNIT && count > bestCount) {
      best = unit
      bestCount = count
    }
  }
  return best ?? (counts.has(VIRTUAL_SINGER_UNIT) ? VIRTUAL_SINGER_UNIT : null)
}

/** How the player marks a version at a glance. */
export type VocalBadge =
  | { kind: "unit"; unit: string }
  | { kind: "singers" }
  | { kind: "icon"; icon: "original" | "instrumental" | "vocal" }

/**
 * A SEKAI version is its unit's song, so it wears the unit's emblem; an
 * Another Vocal is about who sings, so it shows the singers; the virtual
 * singer version wears theirs; the original song and the instrumental get a
 * plain icon. Anything else shows its singers when it has any.
 */
export function resolveVocalBadge(vocal: Pick<PlayerVocal, "type" | "unit" | "singers">): VocalBadge {
  const hasAvatars = vocal.singers.some((singer) => singer.characterId != null)
  const singers: VocalBadge = hasAvatars ? { kind: "singers" } : { kind: "icon", icon: "vocal" }
  switch (vocal.type) {
    case "sekai":
      return vocal.unit ? { kind: "unit", unit: vocal.unit } : singers
    case "virtual_singer":
      return { kind: "unit", unit: VIRTUAL_SINGER_UNIT }
    case "original_song":
      return { kind: "icon", icon: "original" }
    case "instrumental":
      return { kind: "icon", icon: "instrumental" }
    default:
      return singers
  }
}

/** Vocal types tried in order for each preference; the first listed version is the last resort. */
const PREFERRED_VOCAL_ORDER: Record<string, readonly string[]> = {
  sekai: ["sekai"],
  original: ["original_song", "virtual_singer"],
}

/** The version a play button starts: the preferred kind when the song has it, else its first version. */
export function pickPreferredVocal(track: PlayerTrack, preference: string): PlayerVocal {
  for (const type of PREFERRED_VOCAL_ORDER[preference] ?? PREFERRED_VOCAL_ORDER.sekai) {
    const match = track.vocals.find((vocal) => vocal.type === type)
    if (match) {
      return match
    }
  }
  return track.vocals[0]
}

export function isSameTrack(left: PlayerTrack | null, right: PlayerTrack | null): boolean {
  return left != null && right != null && left.musicId === right.musicId && left.region === right.region
}

export function findPlayerVocal(track: PlayerTrack | null, vocalId: number | null): PlayerVocal | null {
  return vocalId == null ? null : track?.vocals.find((vocal) => vocal.id === vocalId) ?? null
}

/** "Singer A, Singer B" for the bar and the lock-screen artist line. */
export function describeSingers(vocal: PlayerVocal | null, separator = ", "): string {
  return vocal ? vocal.singers.map((singer) => singer.name).filter(Boolean).join(separator) : ""
}

/**
 * Gains for an equal-power crossfade at `progress` (0 → 1): the summed
 * loudness stays level, where a linear fade dips in the middle. Both vocal
 * versions share one backing track, so the dip would be audible.
 */
export function crossfadeGains(progress: number): { out: number; in: number } {
  const clamped = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 1
  return {
    out: Math.cos((clamped * Math.PI) / 2),
    in: Math.sin((clamped * Math.PI) / 2),
  }
}

/** How far apart two players may drift before the incoming one is re-seeked. */
export const VOCAL_SWITCH_TOLERANCE_SECONDS = 0.04

/**
 * Where the incoming version must seek to line up with the one playing, or
 * null when it is already close enough (a needless seek is an audible skip).
 */
export function resolveSwitchResync(activeTime: number, incomingTime: number): number | null {
  if (!Number.isFinite(activeTime) || !Number.isFinite(incomingTime)) {
    return null
  }
  return Math.abs(activeTime - incomingTime) > VOCAL_SWITCH_TOLERANCE_SECONDS ? activeTime : null
}

export function clampVolume(value: unknown, fallback = 1): number {
  const parsed = typeof value === "number" ? value : Number.NaN
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : fallback
}
