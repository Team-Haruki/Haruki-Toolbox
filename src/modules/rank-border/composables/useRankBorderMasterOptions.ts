import { computed, ref, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFile } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"

type SekaiEvent = {
  id?: number
  name?: string
  eventType?: string
  startAt?: number
  aggregateAt?: number
  closedAt?: number
  assetbundleName?: string
}

type SekaiWorldBloom = {
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

type SekaiGameCharacter = {
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

const REQUIRED_FILES = ["events", "worldBlooms", "gameCharacters"] as const
const PROFILE_ASSET_FILES = ["cards", "honors", "honorGroups", "bondsHonors", "bondsHonorWords", "gameCharacterUnits"] as const

export function useRankBorderMasterOptions(region: Ref<SekaiRegion>, selectedEventId: Ref<string | null>) {
  const sekaiDataStore = useSekaiDataStore()
  const events = ref<SekaiEvent[]>([])
  const worldBlooms = ref<SekaiWorldBloom[]>([])
  const gameCharacters = ref<SekaiGameCharacter[]>([])
  const cards = ref<RankBorderMasterCard[]>([])
  const honors = ref<RankBorderMasterHonor[]>([])
  const honorGroups = ref<RankBorderMasterHonorGroup[]>([])
  const bondsHonors = ref<RankBorderMasterBondsHonor[]>([])
  const bondsHonorWords = ref<RankBorderMasterBondsHonorWord[]>([])
  const gameCharacterUnits = ref<RankBorderMasterGameCharacterUnit[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const regionState = computed(() => sekaiDataStore.regionStates[region.value])
  const eventOptions = computed<RankBorderEventOption[]>(() =>
    buildEventOptions(events.value, worldBlooms.value),
  )
  const selectedEvent = computed(() =>
    eventOptions.value.find((option) => option.value === selectedEventId.value) ?? null,
  )
  const worldBloomCharacterOptions = computed<RankBorderWorldBloomCharacterOption[]>(() =>
    buildWorldBloomCharacterOptions(selectedEventId.value, worldBlooms.value, gameCharacters.value),
  )

  watch(
    () => [region.value, regionState.value.masterFetchVersion],
    () => {
      void loadOptions()
    },
    { immediate: true },
  )

  async function loadOptions(force = false) {
    loading.value = true
    error.value = null
    try {
      if (force || !hasRequiredFiles(regionState.value.files, REQUIRED_FILES)) {
        await sekaiDataStore.ensureRegionData(region.value, { force, files: REQUIRED_FILES })
      }

      const [eventData, worldBloomData, characterData] = await Promise.all([
        readSekaiMasterFile<SekaiEvent[]>(region.value, "events"),
        readSekaiMasterFile<SekaiWorldBloom[]>(region.value, "worldBlooms"),
        readSekaiMasterFile<SekaiGameCharacter[]>(region.value, "gameCharacters"),
      ])
      events.value = Array.isArray(eventData) ? eventData : []
      worldBlooms.value = Array.isArray(worldBloomData) ? worldBloomData : []
      gameCharacters.value = Array.isArray(characterData) ? characterData : []
    } catch (loadError) {
      events.value = []
      worldBlooms.value = []
      gameCharacters.value = []
      cards.value = []
      honors.value = []
      honorGroups.value = []
      bondsHonors.value = []
      bondsHonorWords.value = []
      gameCharacterUnits.value = []
      error.value = loadError instanceof Error ? loadError.message : String(loadError)
    } finally {
      loading.value = false
    }
  }

  async function loadProfileAssets(force = false) {
    try {
      if (force || !hasRequiredFiles(regionState.value.files, PROFILE_ASSET_FILES)) {
        await sekaiDataStore.ensureRegionData(region.value, { force, files: PROFILE_ASSET_FILES })
      }

      const [cardData, honorData, honorGroupData, bondsHonorData, bondsHonorWordData, gameCharacterUnitData] = await Promise.all([
        readOptionalMasterFile<RankBorderMasterCard[]>(region.value, "cards"),
        readOptionalMasterFile<RankBorderMasterHonor[]>(region.value, "honors"),
        readOptionalMasterFile<RankBorderMasterHonorGroup[]>(region.value, "honorGroups"),
        readOptionalMasterFile<RankBorderMasterBondsHonor[]>(region.value, "bondsHonors"),
        readOptionalMasterFile<RankBorderMasterBondsHonorWord[]>(region.value, "bondsHonorWords"),
        readOptionalMasterFile<RankBorderMasterGameCharacterUnit[]>(region.value, "gameCharacterUnits"),
      ])
      cards.value = Array.isArray(cardData) ? cardData : []
      honors.value = Array.isArray(honorData) ? honorData : []
      honorGroups.value = Array.isArray(honorGroupData) ? honorGroupData : []
      bondsHonors.value = Array.isArray(bondsHonorData) ? bondsHonorData : []
      bondsHonorWords.value = Array.isArray(bondsHonorWordData) ? bondsHonorWordData : []
      gameCharacterUnits.value = Array.isArray(gameCharacterUnitData) ? gameCharacterUnitData : []
    } catch {
      cards.value = []
      honors.value = []
      honorGroups.value = []
      bondsHonors.value = []
      bondsHonorWords.value = []
      gameCharacterUnits.value = []
    }
  }

  return {
    eventOptions,
    selectedEvent,
    worldBloomCharacterOptions,
    cards,
    honors,
    honorGroups,
    bondsHonors,
    bondsHonorWords,
    gameCharacterUnits,
    loading,
    error,
    reload: () => loadOptions(true),
    loadProfileAssets,
  }
}

function buildEventOptions(events: SekaiEvent[], worldBlooms: SekaiWorldBloom[]): RankBorderEventOption[] {
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

function buildWorldBloomCharacterOptions(
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

function hasRequiredFiles(cachedFiles: readonly string[], requiredFiles: readonly string[]): boolean {
  return requiredFiles.every((fileName) => cachedFiles.includes(fileName))
}

async function readOptionalMasterFile<T>(region: SekaiRegion, fileName: string): Promise<T | null> {
  try {
    return await readSekaiMasterFile<T>(region, fileName)
  } catch {
    return null
  }
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
