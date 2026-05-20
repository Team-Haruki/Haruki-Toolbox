import { resolveCharacterIconUrl } from "@/shared/sekai/data-sources"

export type SekaiGameCharacter = {
  id?: number
  firstName?: string
  givenName?: string
  firstNameEnglish?: string
  givenNameEnglish?: string
  unit?: string
}

export type SekaiEvent = {
  id?: number
  name?: string
  eventType?: string
  startAt?: number
  aggregateAt?: number
  assetbundleName?: string
}

export type SekaiMusic = {
  id?: number
  seq?: number
  title?: string
  assetbundleName?: string
  publishedAt?: number
}

export type SekaiMusicDifficulty = {
  musicId?: number
  musicDifficulty?: string
  playLevel?: number
  totalNoteCount?: number
}

export type CharacterOption = {
  id: number
  value: string
  label: string
  unit: string | null
  iconUrl: string
}

export type EventOption = {
  id: number
  value: string
  label: string
  eventType: string | null
  startAt: number | null
}

export type MusicOption = {
  id: number
  value: string
  label: string
  seq: number | null
}

export type MusicDifficultyOption = {
  value: string
  label: string
  playLevel: number | null
}

export function buildCharacterOptions(items: SekaiGameCharacter[] | null): CharacterOption[] {
  return (items ?? [])
    .map((item) => {
      const id = normalizePositiveNumber(item.id)
      if (!id) {
        return null
      }

      return {
        id,
        value: String(id),
        label: resolveCharacterName(item, id),
        unit: normalizeText(item.unit),
        iconUrl: resolveCharacterIconUrl(id),
      }
    })
    .filter((item): item is CharacterOption => item != null)
    .sort((a, b) => a.id - b.id)
}

export function buildEventOptions(items: SekaiEvent[] | null): EventOption[] {
  return (items ?? [])
    .map((item) => {
      const id = normalizePositiveNumber(item.id)
      if (!id) {
        return null
      }

      return {
        id,
        value: String(id),
        label: normalizeText(item.name) ?? `#${id}`,
        eventType: normalizeText(item.eventType),
        startAt: normalizePositiveNumber(item.startAt),
      }
    })
    .filter((item): item is EventOption => item != null)
    .sort((a, b) => (b.startAt ?? 0) - (a.startAt ?? 0))
}

export function buildMusicOptions(items: SekaiMusic[] | null): MusicOption[] {
  return (items ?? [])
    .map((item) => {
      const id = normalizePositiveNumber(item.id)
      if (!id) {
        return null
      }

      return {
        id,
        value: String(id),
        label: normalizeText(item.title) ?? `#${id}`,
        seq: normalizePositiveNumber(item.seq),
      }
    })
    .filter((item): item is MusicOption => item != null)
    .sort((a, b) => (a.seq ?? a.id) - (b.seq ?? b.id))
}

export function resolveMusicDifficultyOptions(
  musicId: string | number | null,
  items: SekaiMusicDifficulty[] | null,
): MusicDifficultyOption[] {
  const targetMusicId = typeof musicId === "string" ? Number(musicId) : musicId
  if (!targetMusicId || !Number.isFinite(targetMusicId)) {
    return []
  }

  return (items ?? [])
    .filter((item) => item.musicId === targetMusicId)
    .map((item) => {
      const difficulty = normalizeText(item.musicDifficulty)
      if (!difficulty) {
        return null
      }

      const playLevel = normalizePositiveNumber(item.playLevel)
      return {
        value: difficulty,
        label: playLevel ? `${difficulty} Lv.${playLevel}` : difficulty,
        playLevel,
      }
    })
    .filter((item): item is MusicDifficultyOption => item != null)
}

function resolveCharacterName(item: SekaiGameCharacter, id: number): string {
  const localized = `${normalizeText(item.firstName) ?? ""}${normalizeText(item.givenName) ?? ""}`
  if (localized) {
    return localized
  }

  const english = [normalizeText(item.givenNameEnglish), normalizeText(item.firstNameEnglish)]
    .filter((part): part is string => Boolean(part))
    .join(" ")
  return english || `#${id}`
}

function normalizeText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function normalizePositiveNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null
  }

  return value
}
