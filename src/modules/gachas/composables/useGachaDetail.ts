import { computed, ref, type ComputedRef, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useNowTick } from "@/composables/useNowTick"
import { resolveCatalogStatus, type CatalogStatus } from "@/shared/components/catalog/types"
import type { CatalogCharacter, CatalogMasterCard, SekaiUnit } from "@/shared/sekai/catalog"
import { useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { useCharactersIndex } from "@/shared/sekai/catalog-resources"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { isUnreleasedContent, useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import { useSettingsStore } from "@/shared/stores/settings"
import { useCardsIndex } from "@/modules/cards"
import { useEventsIndex } from "@/modules/events"
import { useGachaCeilExchange, useGachaCeilItems } from "@/modules/gachas/composables/useGachaCeilResources"
import { useGachaRecord } from "@/modules/gachas/composables/useGachaRecord"
import { useGachasIndex, type CatalogGachaSummary } from "@/modules/gachas/composables/useGachasIndex"
import {
  buildGachaBannerCandidates,
  buildGachaCeilItemIconCandidates,
  buildGachaImageCandidates,
  buildGachaLogoCandidates,
  stripGachaMarkup,
  type CatalogGacha,
  type CatalogGachaCeilItem,
} from "@/modules/gachas/lib/gacha-catalog"
import {
  buildGachaCeilExchangeRows,
  resolveGachaCeilExchangeSummary,
  resolveGachaCeilItem,
  type GachaCeilExchangeRow,
  type GachaCeilExchangeSummary,
} from "@/modules/gachas/lib/gacha-ceil"
import {
  buildGachaPickupCards,
  buildGachaPoolCards,
  collectGachaPoolCharacterIds,
  type GachaPoolCard,
} from "@/modules/gachas/lib/gacha-pool"
import {
  buildGachaRateSegments,
  buildGachaRateTable,
  type GachaRateSegment,
  type GachaRateTable,
} from "@/modules/gachas/lib/gacha-rates"
import { resolveGachaRelatedEvents, type GachaRelatedEvent } from "@/modules/gachas/lib/gacha-related"
import {
  buildGachaCardRateMap,
  buildGachaSimulatorModel,
  type GachaSimulatorModel,
} from "@/modules/gachas/lib/gacha-simulator"

export type GachaDetailModel = {
  region: Ref<SekaiRegion>
  assetEndpoint: ComputedRef<SekaiAssetEndpointPreference>
  /** Index summary — available as soon as the list index is built. */
  summary: ComputedRef<CatalogGachaSummary | null>
  /** Full record with pool weights, behaviors and information text. */
  gacha: ComputedRef<CatalogGacha | null>
  /** Sections that need the full record and the cards index. */
  sectionsLoading: ComputedRef<boolean>
  loading: ComputedRef<boolean>
  error: ComputedRef<string | null>
  notFound: ComputedRef<boolean>
  retrying: ComputedRef<boolean>
  reload: () => Promise<void>
  status: ComputedRef<CatalogStatus | null>
  unreleased: ComputedRef<boolean>
  blurArt: ComputedRef<boolean>
  blurUnreleased: ComputedRef<boolean>
  nowMs: Ref<number>
  heroSources: ComputedRef<string[]>
  bannerSources: ComputedRef<string[]>
  logoSources: ComputedRef<string[]>
  cardsById: ComputedRef<ReadonlyMap<number, CatalogMasterCard>>
  characterMap: ComputedRef<ReadonlyMap<number, CatalogCharacter>>
  unitColorMap: ComputedRef<ReadonlyMap<SekaiUnit, string> | null>
  simulatorModel: ComputedRef<GachaSimulatorModel | null>
  cardRates: ComputedRef<ReadonlyMap<number, number> | null>
  rateTable: ComputedRef<GachaRateTable | null>
  rateSegments: ComputedRef<GachaRateSegment[]>
  pickupCards: ComputedRef<GachaPoolCard[]>
  pickupCharacterIds: ComputedRef<number[]>
  poolCards: ComputedRef<GachaPoolCard[]>
  poolCharacters: ComputedRef<CatalogCharacter[]>
  ceilItem: ComputedRef<CatalogGachaCeilItem | null>
  ceilItemSources: ComputedRef<string[]>
  ceilItemsLoading: Ref<boolean>
  ceilExchangeSummary: ComputedRef<GachaCeilExchangeSummary | null>
  ceilExchangeRows: ComputedRef<GachaCeilExchangeRow[]>
  ceilBoxesAvailable: ComputedRef<boolean>
  ceilExchangeLoading: Ref<boolean>
  ceilExchangeError: Ref<string | null>
  openCeilExchange: () => void
  relatedEvents: ComputedRef<GachaRelatedEvent[]>
  eventsLoading: Ref<boolean>
  summaryText: ComputedRef<string>
  descriptionText: ComputedRef<string>
}

export function useGachaDetail(gachaId: Ref<number | null>): GachaDetailModel {
  const { region } = useEffectiveCatalogRegion()
  const settingsStore = useSettingsStore()
  const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)
  const now = useNowTick(30_000)
  const { hideUnreleased, blurUnreleased } = useUnreleasedContentDisplay()

  const gachas = useGachasIndex(region)
  const cards = useCardsIndex(region)
  const charactersIndex = useCharactersIndex(region)
  const events = useEventsIndex(region)
  const ceilItems = useGachaCeilItems(region)
  const record = useGachaRecord(region, gachaId)

  const ceilExchangeOpened = ref(false)
  const ceilExchange = useGachaCeilExchange(region, ceilExchangeOpened)

  const summary = computed(() => (gachaId.value != null ? gachas.data.value?.byId.get(gachaId.value) ?? null : null))
  const gacha = computed(() => record.data.value)

  const notFound = computed(() => gachaId.value == null || (gachas.ready.value && summary.value == null))
  const loading = computed(() => gachas.loading.value)
  const error = computed(() => gachas.error.value ?? record.error.value)
  const sectionsLoading = computed(() => (
    (record.loading.value && gacha.value == null)
    || (cards.loading.value && cards.data.value == null)
  ))

  const status = computed(() => (summary.value ? resolveCatalogStatus(summary.value.startAt, summary.value.endAt, now.value) : null))
  const unreleased = computed(() => summary.value != null && isUnreleasedContent(summary.value.startAt, now.value))
  const blurArt = computed(() => unreleased.value && blurUnreleased.value)

  const bannerAlias = computed(() => (summary.value ? gachas.data.value?.bannerAliasMap.get(summary.value.id) ?? null : null))
  const heroSources = computed(() => (summary.value
    ? buildGachaImageCandidates(summary.value, region.value, assetEndpoint.value, bannerAlias.value)
    : []))
  const bannerSources = computed(() => {
    const current = summary.value
    if (!current) {
      return []
    }
    const own = buildGachaBannerCandidates(current, region.value, assetEndpoint.value)
    const alias = bannerAlias.value != null
      ? buildGachaBannerCandidates({ id: bannerAlias.value, assetbundleName: "" }, region.value, assetEndpoint.value)
      : []
    return [...new Set([...own, ...alias])]
  })
  const logoSources = computed(() => (summary.value
    ? buildGachaLogoCandidates(summary.value, region.value, assetEndpoint.value)
    : []))

  const cardsById = computed<ReadonlyMap<number, CatalogMasterCard>>(() => cards.data.value?.byId ?? new Map())
  const cardRarityByCardId = computed(() => {
    const map = new Map<number, string>()
    for (const card of cards.data.value?.list ?? []) {
      if (card.cardRarityType) {
        map.set(card.id, card.cardRarityType)
      }
    }
    return map
  })
  const characterMap = computed<ReadonlyMap<number, CatalogCharacter>>(() => charactersIndex.data.value?.characterMap ?? new Map())
  const unitColorMap = computed(() => charactersIndex.data.value?.unitColorMap ?? null)

  const simulatorModel = computed(() => (gacha.value && cardRarityByCardId.value.size > 0
    ? buildGachaSimulatorModel(gacha.value, cardRarityByCardId.value)
    : null))
  const cardRates = computed<ReadonlyMap<number, number> | null>(() => (simulatorModel.value
    ? buildGachaCardRateMap(simulatorModel.value)
    : null))
  const rateTable = computed(() => (gacha.value
    ? buildGachaRateTable(gacha.value.rarityRates, gacha.value.details, cardRarityByCardId.value)
    : null))
  const rateSegments = computed(() => (gacha.value ? buildGachaRateSegments(gacha.value.rarityRates) : []))

  const pickupCards = computed(() => {
    const current = gacha.value
    if (!current) {
      return []
    }
    const entries = buildGachaPickupCards(current, cardsById.value, characterMap.value, cardRates.value, now.value)
    return hideUnreleased.value ? entries.filter((entry) => !entry.unreleased) : entries
  })
  const pickupCharacterIds = computed(() => collectGachaPoolCharacterIds(pickupCards.value))
  const poolCards = computed(() => {
    const current = gacha.value
    if (!current) {
      return []
    }
    const entries = buildGachaPoolCards(current, cardsById.value, characterMap.value, cardRates.value, now.value)
    return hideUnreleased.value ? entries.filter((entry) => !entry.unreleased) : entries
  })
  const poolCharacters = computed(() => collectGachaPoolCharacterIds(poolCards.value)
    .map((id) => characterMap.value.get(id))
    .filter((character): character is CatalogCharacter => character != null))

  const ceilItem = computed(() => (ceilItems.data.value && summary.value
    ? resolveGachaCeilItem(ceilItems.data.value, summary.value)
    : null))
  const ceilItemSources = computed(() => (ceilItem.value
    ? buildGachaCeilItemIconCandidates(ceilItem.value.assetbundleName, region.value, assetEndpoint.value)
    : []))
  const ceilExchangeSummary = computed(() => (ceilExchange.data.value && summary.value
    ? resolveGachaCeilExchangeSummary(ceilExchange.data.value, summary.value, ceilItem.value)
    : null))
  const ceilExchangeRows = computed(() => buildGachaCeilExchangeRows(ceilExchangeSummary.value, ceilExchange.data.value?.boxes ?? null))
  const ceilBoxesAvailable = computed(() => ceilExchange.data.value?.boxes.available ?? false)

  const relatedEvents = computed(() => {
    const index = events.data.value
    const current = summary.value
    if (!index || !current) {
      return []
    }
    return resolveGachaRelatedEvents(current, index.list, index.cardLinksByCard)
  })

  async function reload() {
    await Promise.all([
      gachas.reload(),
      record.reload(),
      cards.reload(),
      charactersIndex.reload(),
      events.reload(),
      ceilItems.reload(),
      ceilExchangeOpened.value ? ceilExchange.reload() : Promise.resolve(),
    ])
  }

  return {
    region,
    assetEndpoint,
    summary,
    gacha,
    sectionsLoading,
    loading,
    error,
    notFound,
    retrying: computed(() => gachas.refreshing.value || record.loading.value),
    reload,
    status,
    unreleased,
    blurArt,
    blurUnreleased,
    nowMs: now,
    heroSources,
    bannerSources,
    logoSources,
    cardsById,
    characterMap,
    unitColorMap,
    simulatorModel,
    cardRates,
    rateTable,
    rateSegments,
    pickupCards,
    pickupCharacterIds,
    poolCards,
    poolCharacters,
    ceilItem,
    ceilItemSources,
    ceilItemsLoading: ceilItems.loading,
    ceilExchangeSummary,
    ceilExchangeRows,
    ceilBoxesAvailable,
    ceilExchangeLoading: ceilExchange.loading,
    ceilExchangeError: ceilExchange.error,
    openCeilExchange: () => {
      ceilExchangeOpened.value = true
    },
    relatedEvents,
    eventsLoading: events.loading,
    summaryText: computed(() => (gacha.value ? stripGachaMarkup(gacha.value.information.summary) : "")),
    descriptionText: computed(() => (gacha.value ? stripGachaMarkup(gacha.value.information.description) : "")),
  }
}
