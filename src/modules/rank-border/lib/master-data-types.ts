/**
 * Master-data record shapes and pure option builders for the rank-border
 * module. Loading/caching lives in `../composables/useRankBorderMasterData`.
 */

export type SekaiEvent = {
  id?: number
  name?: string
  eventType?: string
  startAt?: number
  aggregateAt?: number
  closedAt?: number
  assetbundleName?: string
}

export type SekaiWorldBloom = {
  id?: number
  name?: string
  chapterName?: string
  title?: string
  eventId?: number
  gameCharacterId?: number
  chapterNo?: number
  chapterStartAt?: number
  chapterEndAt?: number
  aggregateAt?: number
}

export type SekaiGameCharacter = {
  id?: number
  firstName?: string
  givenName?: string
  firstNameEnglish?: string
  givenNameEnglish?: string
  unit?: string
}

export type RankBorderMasterCard = {
  id?: number
  characterId?: number
  cardRarityType?: string
  attr?: string
  prefix?: string
  assetbundleName?: string
}

export type RankBorderMasterHonor = {
  id?: number
  name?: string
  groupId?: number
  groupID?: number
  honorRarity?: string
  assetbundleName?: string
  levels?: Array<{
    level?: number
    assetbundleName?: string
    honorRarity?: string
  }>
}

export type RankBorderMasterHonorGroup = {
  id?: number
  name?: string
  honorType?: string
  backgroundAssetbundleName?: string
  backgroundAssetBundleName?: string
  frameName?: string
}

export type RankBorderMasterBondsHonor = {
  id?: number
  name?: string
  gameCharacterUnitId1?: number
  gameCharacterUnitID1?: number
  gameCharacterUnitId2?: number
  gameCharacterUnitID2?: number
  honorRarity?: string
  configurableUnitVirtualSinger?: boolean
}

export type RankBorderMasterBondsHonorWord = {
  id?: number
  assetbundleName?: string
  assetBundleName?: string
  name?: string
}

export type RankBorderMasterGameCharacterUnit = {
  id?: number
  gameCharacterId?: number
  gameCharacterID?: number
  unit?: string
}

export type RankBorderEventOption = {
  id: number
  value: string
  label: string
  eventType: string | null
  startAt: number | null
  aggregateAt: number | null
  closedAt: number | null
  assetbundleName: string | null
  isWorldBloom: boolean
}

export type RankBorderWorldBloomCharacterOption = {
  id: number
  value: string
  label: string
  active: boolean
  chapterNo: number | null
  chapterStartAt: number | null
  chapterEndAt: number | null
  aggregateAt: number | null
}

export function buildEventOptions(events: SekaiEvent[], worldBlooms: SekaiWorldBloom[]): RankBorderEventOption[] {
  const now = Math.floor(Date.now() / 1000)
  const worldBloomEventIds = new Set(
    worldBlooms
      .map((item) => normalizePositiveNumber(item.eventId))
      .filter((eventId): eventId is number => eventId != null),
  )

  return events
    .map((event) => {
      const id = normalizePositiveNumber(event.id)
      if (!id) {
        return null
      }

      const startAt = normalizeSekaiTimestamp(event.startAt)
      if (startAt != null && startAt > now) {
        return null
      }

      const eventType = normalizeText(event.eventType)
      return {
        id,
        value: String(id),
        label: normalizeText(event.name) ?? `#${id}`,
        eventType,
        startAt,
        aggregateAt: normalizeSekaiTimestamp(event.aggregateAt),
        closedAt: normalizeSekaiTimestamp(event.closedAt),
        assetbundleName: normalizeText(event.assetbundleName),
        isWorldBloom: eventType === "world_bloom" || worldBloomEventIds.has(id),
      }
    })
    .filter((item): item is RankBorderEventOption => item != null)
    .sort((a, b) => (b.startAt ?? 0) - (a.startAt ?? 0))
}

export function buildWorldBloomCharacterOptions(
  selectedEventId: string | null,
  worldBlooms: SekaiWorldBloom[],
  gameCharacters: SekaiGameCharacter[],
): RankBorderWorldBloomCharacterOption[] {
  const now = Math.floor(Date.now() / 1000)
  const eventId = Number(selectedEventId)
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return []
  }

  const characterMap = new Map(
    gameCharacters
      .map((character) => {
        const id = normalizePositiveNumber(character.id)
        return id ? [id, character] as const : null
      })
      .filter((item): item is readonly [number, SekaiGameCharacter] => item != null),
  )

  return worldBlooms
    .filter((chapter) => normalizePositiveNumber(chapter.eventId) === eventId)
    .map((chapter) => {
      const id = normalizePositiveNumber(chapter.gameCharacterId)
      if (!id) {
        return null
      }

      const chapterStartAt = normalizeSekaiTimestamp(chapter.chapterStartAt)
      if (chapterStartAt != null && chapterStartAt > now) {
        return null
      }

      const chapterNo = normalizePositiveNumber(chapter.chapterNo)
      const chapterEndAt = normalizeSekaiTimestamp(chapter.chapterEndAt)
      const aggregateAt = normalizeSekaiTimestamp(chapter.aggregateAt)
      const character = characterMap.get(id)
      const characterName = character ? resolveCharacterName(character, id) : `#${id}`
      const chapterName = normalizeText(chapter.name)
        ?? normalizeText(chapter.chapterName)
        ?? normalizeText(chapter.title)
      const chapterLabel = chapterName
        ? `${chapterName} / ${characterName}`
        : chapterNo
          ? `Chapter ${chapterNo} / ${characterName}`
          : characterName
      return {
        id,
        value: String(id),
        label: chapterNo ? `Ch.${chapterNo} ${chapterLabel}` : chapterLabel,
        active: chapterStartAt != null
          && (aggregateAt ?? chapterEndAt) != null
          && chapterStartAt <= now
          && (aggregateAt ?? chapterEndAt)! >= now,
        chapterNo,
        chapterStartAt,
        chapterEndAt,
        aggregateAt,
      }
    })
    .filter((item): item is RankBorderWorldBloomCharacterOption => item != null)
    .sort((a, b) => (a.chapterNo ?? a.id) - (b.chapterNo ?? b.id))
}

function resolveCharacterName(character: SekaiGameCharacter, fallbackId: number): string {
  const localizedName = [normalizeText(character.firstName), normalizeText(character.givenName)]
    .filter((item): item is string => item != null)
    .join("")
  if (localizedName) {
    return localizedName
  }

  const englishName = [normalizeText(character.firstNameEnglish), normalizeText(character.givenNameEnglish)]
    .filter((item): item is string => item != null)
    .join(" ")
  return englishName || `#${fallbackId}`
}

export function buildMasterRecordMap<T extends { id?: number }>(items: T[]) {
  const map = new Map<number, T>()
  for (const item of items) {
    if (typeof item.id === "number" && item.id > 0) {
      map.set(item.id, item)
    }
  }
  return map
}

function normalizePositiveNumber(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function normalizeSekaiTimestamp(value: unknown): number | null {
  const parsed = normalizePositiveNumber(value)
  if (parsed == null) {
    return null
  }

  return parsed > 10_000_000_000 ? Math.floor(parsed / 1000) : parsed
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}
