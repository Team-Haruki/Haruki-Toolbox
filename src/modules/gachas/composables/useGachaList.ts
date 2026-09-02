import { computed, type ComputedRef, type Ref } from "vue"
import { useNowTick } from "@/composables/useNowTick"
import { usePagedSlice } from "@/composables/usePagedSlice"
import type { CatalogStatus } from "@/shared/components/catalog/types"
import type { CatalogCharacter, SekaiUnit } from "@/shared/sekai/catalog"
import { useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { useCharactersIndex } from "@/shared/sekai/catalog-resources"
import { isUnreleasedContent, useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import { useSettingsStore } from "@/shared/stores/settings"
import { useCardsIndex } from "@/modules/cards"
import { isUpcomingHiddenByFilter } from "@/modules/events/lib/event-list"
import { useGachasIndex, type CatalogGachaSummary } from "@/modules/gachas/composables/useGachasIndex"
import { buildGachaImageCandidates } from "@/modules/gachas/lib/gacha-catalog"
import {
  buildGachaPickupCharacterMap,
  buildGachaSearchParts,
  collectGachaListYears,
  filterGachaList,
  resolveGachaListStatus,
  resolveGachaStatusUntil,
  sortGachaList,
} from "@/modules/gachas/lib/gacha-list"
import type { GachaListQuery } from "@/modules/gachas/lib/gachas-query"

export const GACHA_LIST_PICKUP_AVATARS = 5

export type GachaListTile = {
  gacha: CatalogGachaSummary
  status: CatalogStatus
  untilMs: number | null
  unreleased: boolean
  imageSources: string[]
  /** Distinct pickup characters, capped at `GACHA_LIST_PICKUP_AVATARS`. */
  pickupCharacters: CatalogCharacter[]
  extraPickupCount: number
}

export type GachaListModel = {
  region: Ref<string>
  loading: Ref<boolean>
  error: Ref<string | null>
  warning: Ref<string | null>
  refreshing: Ref<boolean>
  ready: ComputedRef<boolean>
  reload: () => Promise<void>
  characters: ComputedRef<CatalogCharacter[]>
  characterMap: ComputedRef<ReadonlyMap<number, CatalogCharacter>>
  unitColorMap: ComputedRef<ReadonlyMap<SekaiUnit, string> | null>
  cardNames: ComputedRef<ReadonlyMap<number, string>>
  types: ComputedRef<string[]>
  years: ComputedRef<number[]>
  total: ComputedRef<number>
  tiles: ComputedRef<GachaListTile[]>
  totalPages: ComputedRef<number>
  currentPage: ComputedRef<number>
  /** No results because the `upcoming` chip is on while unreleased content is hidden. */
  upcomingHidden: ComputedRef<boolean>
  blurUnreleased: ComputedRef<boolean>
}

/** List page state over the canonical gachas / cards / characters indexes. */
export function useGachaList(query: GachaListQuery): GachaListModel {
  const { region } = useEffectiveCatalogRegion()
  const settingsStore = useSettingsStore()
  const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)
  const gachas = useGachasIndex(region)
  const cards = useCardsIndex(region)
  const charactersIndex = useCharactersIndex(region)
  const now = useNowTick(30_000)
  const { hideUnreleased, blurUnreleased } = useUnreleasedContentDisplay()

  const list = computed(() => gachas.data.value?.list ?? [])
  const characterMap = computed<ReadonlyMap<number, CatalogCharacter>>(() => charactersIndex.data.value?.characterMap ?? new Map())
  const characters = computed(() => charactersIndex.data.value?.characters ?? [])
  const unitColorMap = computed(() => charactersIndex.data.value?.unitColorMap ?? null)

  const cardCharacterById = computed(() => {
    const map = new Map<number, number | null>()
    for (const card of cards.data.value?.list ?? []) {
      map.set(card.id, card.characterId)
    }
    return map
  })

  const cardNames = computed(() => {
    const map = new Map<number, string>()
    for (const card of cards.data.value?.list ?? []) {
      if (card.prefix) {
        map.set(card.id, card.prefix)
      }
    }
    return map
  })

  const pickupCharacterIdsByGacha = computed(() => buildGachaPickupCharacterMap(list.value, cardCharacterById.value))

  const searchPartsByGacha = computed(() => {
    const map = new Map<number, string[]>()
    for (const gacha of list.value) {
      const names: string[] = []
      for (const characterId of pickupCharacterIdsByGacha.value.get(gacha.id) ?? []) {
        const name = characterMap.value.get(characterId)?.name
        if (name) {
          names.push(name)
        }
      }
      map.set(gacha.id, buildGachaSearchParts(gacha, names))
    }
    return map
  })

  const visible = computed(() => (hideUnreleased.value
    ? list.value.filter((gacha) => !isUnreleasedContent(gacha.startAt, now.value))
    : list.value))

  const types = computed(() => {
    const seen = new Set<string>()
    for (const gacha of visible.value) {
      if (gacha.gachaType) {
        seen.add(gacha.gachaType)
      }
    }
    return [...seen]
  })

  const years = computed(() => collectGachaListYears(visible.value))

  const filtered = computed(() => sortGachaList(
    filterGachaList(visible.value, query, {
      pickupCharacterIdsByGacha: pickupCharacterIdsByGacha.value,
      searchPartsByGacha: searchPartsByGacha.value,
      nowMs: now.value,
    }),
    query.sort,
    query.dir,
  ))

  const page = computed({
    get: () => query.page,
    set: (value: number) => {
      query.page = value
    },
  })
  const pageSize = computed({
    get: () => query.size,
    set: (value: number) => {
      query.size = value
    },
  })
  const { pageItems, totalPages, currentPage } = usePagedSlice(filtered, page, pageSize)

  const tiles = computed<GachaListTile[]>(() => {
    const aliases = gachas.data.value?.bannerAliasMap
    return pageItems.value.map((gacha) => {
      const status = resolveGachaListStatus(gacha, now.value)
      const pickupCharacters: CatalogCharacter[] = []
      for (const characterId of pickupCharacterIdsByGacha.value.get(gacha.id) ?? []) {
        const character = characterMap.value.get(characterId)
        if (character) {
          pickupCharacters.push(character)
        }
      }
      return {
        gacha,
        status,
        untilMs: resolveGachaStatusUntil(gacha, status),
        unreleased: isUnreleasedContent(gacha.startAt, now.value),
        imageSources: buildGachaImageCandidates(gacha, region.value, assetEndpoint.value, aliases?.get(gacha.id)),
        pickupCharacters: pickupCharacters.slice(0, GACHA_LIST_PICKUP_AVATARS),
        extraPickupCount: Math.max(0, pickupCharacters.length - GACHA_LIST_PICKUP_AVATARS),
      }
    })
  })

  // Same rule as the events list: only when every selected status is
  // `upcoming` is the hidden-unreleased setting the reason for zero rows.
  const upcomingHidden = computed(() => isUpcomingHiddenByFilter(query, hideUnreleased.value, filtered.value.length))

  return {
    region,
    loading: gachas.loading,
    error: gachas.error,
    warning: gachas.warning,
    refreshing: gachas.refreshing,
    ready: gachas.ready,
    reload: async () => {
      await Promise.all([gachas.reload(), cards.reload(), charactersIndex.reload()])
    },
    characters,
    characterMap,
    unitColorMap,
    cardNames,
    types,
    years,
    total: computed(() => filtered.value.length),
    tiles,
    totalPages,
    currentPage,
    upcomingHidden,
    blurUnreleased,
  }
}
