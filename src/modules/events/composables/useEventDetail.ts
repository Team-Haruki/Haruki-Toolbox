import { computed, ref, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import {
  buildCatalogCharacterMap,
  normalizeCatalogMasterCard,
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  type CatalogCharacter,
  type CatalogMasterCard,
} from "@/shared/sekai/catalog"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { aggregateEventDeckBonuses, type EventBonusGroup } from "../lib/event-bonus"
import {
  normalizeEventItem,
  normalizeWorldBloomChapters,
  type SekaiEventItem,
  type SekaiWorldBloomChapter,
} from "../lib/event-filter"

const DETAIL_FILES = [
  "events",
  "eventCards",
  "cards",
  "eventDeckBonuses",
  "worldBlooms",
  "gameCharacters",
  "gameCharacterUnits",
] as const

export function useEventDetail(region: Ref<SekaiRegion>, eventId: Ref<number | null>) {
  const sekaiDataStore = useSekaiDataStore()
  const event = ref<SekaiEventItem | null>(null)
  const bonusGroups = ref<EventBonusGroup[]>([])
  const chapters = ref<SekaiWorldBloomChapter[]>([])
  const eventCards = ref<CatalogMasterCard[]>([])
  const characterMap = ref<Map<number, CatalogCharacter>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)
  const notFound = ref(false)

  const regionState = computed(() => sekaiDataStore.regionStates[region.value])

  watch(
    () => [region.value, regionState.value.masterFetchVersion, eventId.value],
    () => {
      void load()
    },
    { immediate: true },
  )

  async function load(force = false) {
    const id = eventId.value
    if (id == null || !Number.isInteger(id) || id <= 0) {
      event.value = null
      notFound.value = true
      return
    }

    loading.value = true
    error.value = null
    notFound.value = false
    try {
      if (force || !DETAIL_FILES.every((file) => regionState.value.files.includes(file))) {
        await sekaiDataStore.ensureRegionData(region.value, { force, files: DETAIL_FILES })
      }

      const files = await readSekaiMasterFiles(region.value, DETAIL_FILES)
      const rawEvent = normalizeCatalogRecords(files.events)
        .find((record) => normalizeCatalogNumber(record.id) === id)
      const normalizedEvent = rawEvent ? normalizeEventItem(rawEvent) : null
      event.value = normalizedEvent
      notFound.value = normalizedEvent == null

      bonusGroups.value = aggregateEventDeckBonuses(id, files.eventDeckBonuses, files.gameCharacterUnits)
      chapters.value = normalizeWorldBloomChapters(files.worldBlooms, id)
      characterMap.value = buildCatalogCharacterMap(files.gameCharacters)
      eventCards.value = selectEventCards(id, files.eventCards, files.cards)
    } catch (loadError) {
      event.value = null
      bonusGroups.value = []
      chapters.value = []
      eventCards.value = []
      characterMap.value = new Map()
      error.value = loadError instanceof Error ? loadError.message : String(loadError)
    } finally {
      loading.value = false
    }
  }

  return {
    event,
    bonusGroups,
    chapters,
    eventCards,
    characterMap,
    loading,
    error,
    notFound,
    reload: () => load(true),
  }
}

function selectEventCards(eventId: number, rawEventCards: unknown, rawCards: unknown): CatalogMasterCard[] {
  const cardIds = normalizeCatalogRecords(rawEventCards)
    .filter((record) => normalizeCatalogNumber(record.eventId) === eventId)
    .map((record) => normalizeCatalogNumber(record.cardId))
    .filter((cardId): cardId is number => cardId != null)
  if (cardIds.length === 0) {
    return []
  }

  const cardIdSet = new Set(cardIds)
  const cards = new Map<number, CatalogMasterCard>()
  for (const record of normalizeCatalogRecords(rawCards)) {
    const card = normalizeCatalogMasterCard(record)
    if (card && cardIdSet.has(card.id)) {
      cards.set(card.id, card)
    }
  }

  return cardIds
    .map((cardId) => cards.get(cardId))
    .filter((card): card is CatalogMasterCard => card != null)
}
