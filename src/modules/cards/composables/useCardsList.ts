import { computed, type ComputedRef } from "vue"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { useSettingsStore } from "@/shared/stores/settings"
import { useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { useCharactersIndex } from "@/shared/sekai/catalog-resources"
import type { CatalogCharacter, CatalogMasterCard, SekaiUnit } from "@/shared/sekai/catalog"
import { useEventsIndex } from "@/modules/events"
import { useCardsIndex } from "@/modules/cards/composables/useCardsIndex"
import { useCardSkills } from "@/modules/cards/composables/useCardSkills"
import { collectWorldBloomCardIds } from "@/modules/cards/lib/card-filter"
import { buildCardMaxPowerMap } from "@/modules/cards/lib/card-power"

const EMPTY_CARDS: CatalogMasterCard[] = []
const EMPTY_CHARACTERS: CatalogCharacter[] = []

export type UseCardsListResult = {
  region: ComputedRef<SekaiRegion>
  assetEndpoint: ComputedRef<SekaiAssetEndpointPreference>
  /** First load of the cards or characters index (no data yet). */
  loading: ComputedRef<boolean>
  /** Any load in flight, including background refreshes. */
  refreshing: ComputedRef<boolean>
  error: ComputedRef<string | null>
  /** Cards and characters are available and not loading. */
  ready: ComputedRef<boolean>
  cards: ComputedRef<CatalogMasterCard[]>
  characters: ComputedRef<CatalogCharacter[]>
  characterMap: ComputedRef<Map<number, CatalogCharacter>>
  unitColorMap: ComputedRef<Map<SekaiUnit, string>>
  supplyTypeMap: ComputedRef<Map<number, string>>
  /** Cards featured in a World Link event (supply-type reclassification). */
  worldBloomCardIds: ComputedRef<ReadonlySet<number>>
  /** skillId → skill filter type; empty until the skills resource resolves. */
  skillTypeBySkillId: ComputedRef<ReadonlyMap<number, string>>
  /** cardId → total base power at max level (the "power" sort). */
  maxPowerById: ComputedRef<ReadonlyMap<number, number>>
  reload: () => void
}

/**
 * Everything the `/cards` list needs: the cards / characters / events indexes
 * plus the skills resource. Events and skills only feed secondary filters,
 * so their loading state never blocks the grid.
 */
export function useCardsList(): UseCardsListResult {
  const settingsStore = useSettingsStore()
  const { region } = useEffectiveCatalogRegion()
  const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

  const cardsIndex = useCardsIndex(region)
  const charactersIndex = useCharactersIndex(region)
  const eventsIndex = useEventsIndex(region)
  const skills = useCardSkills(region)

  const loading = computed(() => cardsIndex.loading.value || charactersIndex.loading.value)
  const refreshing = computed(() => (
    cardsIndex.refreshing.value
    || charactersIndex.refreshing.value
    || eventsIndex.refreshing.value
    || skills.refreshing.value
  ))
  const error = computed(() => cardsIndex.error.value ?? charactersIndex.error.value)
  const ready = computed(() => !loading.value && cardsIndex.data.value != null && charactersIndex.data.value != null)

  const cards = computed(() => cardsIndex.data.value?.list ?? EMPTY_CARDS)
  const characters = computed(() => charactersIndex.data.value?.characters ?? EMPTY_CHARACTERS)
  const characterMap = computed(() => charactersIndex.data.value?.characterMap ?? new Map<number, CatalogCharacter>())
  const unitColorMap = computed(() => charactersIndex.data.value?.unitColorMap ?? new Map<SekaiUnit, string>())
  const supplyTypeMap = computed(() => cardsIndex.data.value?.supplyTypeMap ?? new Map<number, string>())

  const worldBloomCardIds = computed<ReadonlySet<number>>(() => {
    const events = eventsIndex.data.value
    return events ? collectWorldBloomCardIds(events.list, events.cardLinksByEvent) : new Set<number>()
  })

  const skillTypeBySkillId = computed<ReadonlyMap<number, string>>(
    () => skills.data.value?.filterTypeBySkillId ?? new Map<number, string>(),
  )

  const maxPowerById = computed<ReadonlyMap<number, number>>(
    () => buildCardMaxPowerMap(cardsIndex.data.value?.powerTables ?? new Map()),
  )

  function reload() {
    void Promise.all([
      cardsIndex.reload(),
      charactersIndex.reload(),
      eventsIndex.reload(),
      skills.reload(),
    ])
  }

  return {
    region,
    assetEndpoint,
    loading,
    refreshing,
    error,
    ready,
    cards,
    characters,
    characterMap,
    unitColorMap,
    supplyTypeMap,
    worldBloomCardIds,
    skillTypeBySkillId,
    maxPowerById,
    reload,
  }
}
