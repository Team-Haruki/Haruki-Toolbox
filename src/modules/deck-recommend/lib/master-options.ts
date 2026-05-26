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
  closedAt?: number
  assetbundleName?: string
}

export type SekaiWorldBloom = {
  id?: number
  eventId?: number
  gameCharacterId?: number
  worldBloomChapterType?: string
  chapterNo?: number
  chapterStartAt?: number
  chapterEndAt?: number
  aggregateAt?: number
}

export type SekaiEventTotalPowerLimit = {
  id?: number
  eventId?: number
  upperTotalPower?: number
}

export type SekaiEventCardBonusLimit = {
  id?: number
  eventId?: number
  memberCountLimit?: number
}

export type SekaiEventSkillScoreUpLimit = {
  id?: number
  eventId?: number
  scoreUpRateLimit?: number
}

export type SekaiMusic = {
  id?: number
  seq?: number
  title?: string
  pronunciation?: string
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

export type CharacterRankOption = CharacterOption & {
  maxRank: number
}

export type MysekaiGateOption = {
  id: number
  value: string
  label: string
  unit: string | null
  maxLevel: number
}

export type EventOption = {
  id: number
  value: string
  label: string
  eventType: string | null
  startAt: number | null
  aggregateAt: number | null
  closedAt: number | null
  assetbundleName: string | null
}

export type MusicOption = {
  id: number
  value: string
  label: string
  seq: number | null
  pronunciation: string | null
  assetbundleName: string | null
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

export function buildCharacterRankOptions(masterData: Record<string, unknown> | null): CharacterRankOption[] {
  const maxRankMap = buildCharacterMaxRankMap(masterData?.characterRanks)
  return buildCharacterOptions(Array.isArray(masterData?.gameCharacters) ? masterData.gameCharacters as SekaiGameCharacter[] : null)
    .map((option) => {
      const maxRank = maxRankMap.get(option.id)
      return maxRank
        ? {
            ...option,
            maxRank,
          }
        : null
    })
    .filter((option): option is CharacterRankOption => option != null)
}

export function buildMysekaiGateOptions(masterData: Record<string, unknown> | null): MysekaiGateOption[] {
  const maxLevelMap = buildMysekaiGateMaxLevelMap(masterData?.mysekaiGateLevels)
  const gates = Array.isArray(masterData?.mysekaiGates) ? masterData.mysekaiGates : []

  return gates
    .map((item) => {
      if (!isRecord(item)) {
        return null
      }

      const id = normalizePositiveNumber(item.id)
      const maxLevel = id ? maxLevelMap.get(id) : null
      if (!id || !maxLevel) {
        return null
      }

      return {
        id,
        value: String(id),
        label: resolveMysekaiGateName(item, id),
        unit: normalizeText(item.unit),
        maxLevel,
      }
    })
    .filter((option): option is MysekaiGateOption => option != null)
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
        aggregateAt: normalizePositiveNumber(item.aggregateAt),
        closedAt: normalizePositiveNumber(item.closedAt),
        assetbundleName: normalizeText(item.assetbundleName),
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
        pronunciation: normalizeText(item.pronunciation),
        assetbundleName: normalizeText(item.assetbundleName),
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
      const displayDifficulty = difficulty.toUpperCase()
      return {
        value: difficulty,
        label: playLevel ? `${displayDifficulty} Lv.${playLevel}` : displayDifficulty,
        playLevel,
      }
    })
    .filter((item): item is MusicDifficultyOption => item != null)
}

export function resolveDefaultEventOption(options: readonly EventOption[], now = Date.now()): EventOption | null {
  return resolveCurrentEventOption(options, now) ?? options[0] ?? null
}

export function resolveCurrentEventOption(options: readonly EventOption[], now = Date.now()): EventOption | null {
  return options.find((option) => isEventOptionActive(option, now)) ?? null
}

export function resolveWorldBloomGameCharacterIds(
  eventId: string | number | null,
  events: SekaiEvent[] | null,
  worldBlooms: SekaiWorldBloom[] | null,
): number[] {
  const targetEventId = normalizeSelectNumber(eventId)
  if (!targetEventId || !isWorldBloomEvent(targetEventId, events)) {
    return []
  }

  const seen = new Set<number>()
  return (worldBlooms ?? [])
    .filter((item) =>
      item.eventId === targetEventId
      && item.worldBloomChapterType === "game_character"
      && normalizePositiveNumber(item.gameCharacterId),
    )
    .sort((a, b) => (normalizePositiveNumber(a.chapterNo) ?? 0) - (normalizePositiveNumber(b.chapterNo) ?? 0))
    .flatMap((item) => {
      const characterId = normalizePositiveNumber(item.gameCharacterId)
      if (!characterId || seen.has(characterId)) {
        return []
      }

      seen.add(characterId)
      return [characterId]
    })
}

export function resolveWorldBloomDefaultGameCharacterId(
  eventId: string | number | null,
  events: SekaiEvent[] | null,
  worldBlooms: SekaiWorldBloom[] | null,
  now = Date.now(),
): number | null {
  const targetEventId = normalizeSelectNumber(eventId)
  const characterIds = resolveWorldBloomGameCharacterIds(eventId, events, worldBlooms)
  if (!targetEventId || characterIds.length === 0 || !isEventActive(targetEventId, events, now)) {
    return characterIds[0] ?? null
  }

  const activeChapter = resolveWorldBloomGameCharacterChapters(targetEventId, events, worldBlooms)
    .find((chapter) => isWorldBloomChapterActive(chapter, now))
  return normalizePositiveNumber(activeChapter?.gameCharacterId) ?? characterIds[0] ?? null
}

export function resolveWorldBloomSupportDeckCount(
  eventId: string | number | null,
  worldBloomTurn: string | number | null = null,
): number {
  const turn = normalizeWorldBloomTurn(worldBloomTurn) ?? resolveWorldBloomTurnFromEventId(normalizeSelectNumber(eventId))

  switch (turn) {
    case 1:
      return 12
    case 2:
      return 20
    case 3:
      return 25
    default:
      return 25
  }
}

export function resolveEventTotalPowerLimit(
  eventId: string | number | null,
  items: unknown,
): number | null {
  const targetEventId = normalizeSelectNumber(eventId)
  if (!targetEventId || !Array.isArray(items)) {
    return null
  }

  const matched = items.find((item): item is SekaiEventTotalPowerLimit =>
    isRecord(item)
    && normalizePositiveNumber(item.eventId) === targetEventId
    && normalizePositiveNumber(item.upperTotalPower) != null,
  )
  return normalizePositiveNumber(matched?.upperTotalPower)
}

export function resolveEventCardBonusLimit(
  eventId: string | number | null,
  items: unknown,
): number | null {
  const targetEventId = normalizeSelectNumber(eventId)
  if (!targetEventId || !Array.isArray(items)) {
    return null
  }

  const matched = items.find((item): item is SekaiEventCardBonusLimit =>
    isRecord(item)
    && normalizePositiveNumber(item.eventId) === targetEventId
    && normalizePositiveNumber(item.memberCountLimit) != null,
  )
  return normalizePositiveNumber(matched?.memberCountLimit)
}

export function resolveEventSkillScoreUpLimit(
  eventId: string | number | null,
  items: unknown,
): number | null {
  const targetEventId = normalizeSelectNumber(eventId)
  if (!targetEventId || !Array.isArray(items)) {
    return null
  }

  const matched = items.find((item): item is SekaiEventSkillScoreUpLimit =>
    isRecord(item)
    && normalizePositiveNumber(item.eventId) === targetEventId
    && normalizePositiveNumber(item.scoreUpRateLimit) != null,
  )
  const scoreUpRateLimit = normalizePositiveNumber(matched?.scoreUpRateLimit)
  return scoreUpRateLimit == null ? null : Math.max(0, scoreUpRateLimit - 100)
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

function resolveMysekaiGateName(item: Record<string, unknown>, id: number): string {
  return normalizeText(item.name)
    ?? normalizeText(item.mysekaiGateName)
    ?? normalizeText(item.displayName)
    ?? normalizeText(item.assetbundleName)
    ?? `#${id}`
}

function buildCharacterMaxRankMap(items: unknown): Map<number, number> {
  const map = new Map<number, number>()
  if (!Array.isArray(items)) {
    return map
  }

  for (const item of items) {
    if (!isRecord(item)) {
      continue
    }

    const characterId = normalizePositiveNumber(item.characterId) ?? normalizePositiveNumber(item.gameCharacterId)
    const rank = normalizePositiveNumber(item.characterRank) ?? normalizePositiveNumber(item.rank)
    if (characterId && rank) {
      map.set(characterId, Math.max(map.get(characterId) ?? 0, rank))
    }
  }

  return map
}

function buildMysekaiGateMaxLevelMap(items: unknown): Map<number, number> {
  const map = new Map<number, number>()
  if (!Array.isArray(items)) {
    return map
  }

  for (const item of items) {
    if (!isRecord(item)) {
      continue
    }

    const gateId = normalizePositiveNumber(item.mysekaiGateId)
    const level = normalizePositiveNumber(item.mysekaiGateLevel) ?? normalizePositiveNumber(item.level)
    if (gateId && level) {
      map.set(gateId, Math.max(map.get(gateId) ?? 0, level))
    }
  }

  return map
}

function normalizeText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function normalizeSelectNumber(value: string | number | null): number | null {
  const raw = typeof value === "string" ? Number(value) : value
  return normalizePositiveNumber(raw)
}

function normalizeWorldBloomTurn(value: string | number | null): 1 | 2 | 3 | null {
  const turn = normalizeSelectNumber(value)
  return turn === 1 || turn === 2 || turn === 3 ? turn : null
}

function normalizePositiveNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null
  }

  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function resolveWorldBloomTurnFromEventId(eventId: number | null): 1 | 2 | 3 | null {
  if (eventId == null) {
    return null
  }
  if (eventId > 1000) {
    const turn = Math.floor(eventId / 100_000) % 10 + 1
    return normalizeWorldBloomTurn(turn)
  }
  if (eventId <= 140) {
    return 1
  }
  if (eventId <= 180) {
    return 2
  }

  return 3
}

function isWorldBloomEvent(eventId: number, events: SekaiEvent[] | null): boolean {
  return (events ?? []).some((event) =>
    event.id === eventId
    && event.eventType === "world_bloom",
  )
}

function resolveWorldBloomGameCharacterChapters(
  eventId: number,
  events: SekaiEvent[] | null,
  worldBlooms: SekaiWorldBloom[] | null,
): SekaiWorldBloom[] {
  if (!isWorldBloomEvent(eventId, events)) {
    return []
  }

  return (worldBlooms ?? [])
    .filter((item) =>
      item.eventId === eventId
      && item.worldBloomChapterType === "game_character"
      && normalizePositiveNumber(item.gameCharacterId),
    )
    .sort((a, b) => (normalizePositiveNumber(a.chapterNo) ?? 0) - (normalizePositiveNumber(b.chapterNo) ?? 0))
}

function isEventOptionActive(option: EventOption, now: number): boolean {
  if (!option.startAt || option.startAt > now) {
    return false
  }

  const endAt = option.aggregateAt ?? option.closedAt
  return endAt == null || now < endAt
}

function isEventActive(eventId: number, events: SekaiEvent[] | null, now: number): boolean {
  const event = (events ?? []).find((item) => item.id === eventId)
  if (!event) {
    return false
  }

  return isEventOptionActive({
    id: eventId,
    value: String(eventId),
    label: "",
    eventType: normalizeText(event.eventType),
    startAt: normalizePositiveNumber(event.startAt),
    aggregateAt: normalizePositiveNumber(event.aggregateAt),
    closedAt: normalizePositiveNumber(event.closedAt),
    assetbundleName: normalizeText(event.assetbundleName),
  }, now)
}

function isWorldBloomChapterActive(chapter: SekaiWorldBloom, now: number): boolean {
  const startAt = normalizePositiveNumber(chapter.chapterStartAt)
  if (!startAt || startAt > now) {
    return false
  }

  const endAt = normalizePositiveNumber(chapter.aggregateAt) ?? normalizePositiveNumber(chapter.chapterEndAt)
  return endAt == null || now < endAt
}
