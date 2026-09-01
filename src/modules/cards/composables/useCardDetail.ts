import { computed, type ComputedRef, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { useNowTick } from "@/composables/useNowTick"
import { useSettingsStore } from "@/shared/stores/settings"
import { useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { useCharactersIndex } from "@/shared/sekai/catalog-resources"
import {
  buildCatalogCardThumbnail,
  cardRarityHasTrainedArt,
  SEKAI_UNITS,
  type CatalogCardThumbnail,
  type CatalogCharacter,
  type CatalogMasterCard,
  type SekaiUnit,
} from "@/shared/sekai/catalog"
import { useEventsIndex } from "@/modules/events"
import { useGachasIndex, type CatalogGachaSummary } from "@/modules/gachas"
import {
  useCardsIndex,
  type CardIndexExtras,
  type CardPowerBonus,
  type CardPowerTable,
} from "@/modules/cards/composables/useCardsIndex"
import { useCardDetailExtras } from "@/modules/cards/composables/useCardDetailExtras"
import { useCardSkills } from "@/modules/cards/composables/useCardSkills"
import {
  selectCardRelatedEvents,
  selectCardRelatedGachas,
  selectSameCharacterCards,
  type CardRelatedEvent,
} from "@/modules/cards/lib/card-detail"
import {
  collectWorldBloomCardIds,
  isCardUnreleased,
  resolveCardSupplyType,
  resolveCardUnit,
  type CardSupplyType,
} from "@/modules/cards/lib/card-filter"
import type { CardEpisodeRow, CardRarityInfo } from "@/modules/cards/lib/card-power"
import type { CardSkillRecord } from "@/modules/cards/lib/card-skill"

const EMPTY_EPISODES: CardEpisodeRow[] = []
const EMPTY_BONUSES: CardPowerBonus[] = []
const EMPTY_EVENTS: CardRelatedEvent[] = []
const EMPTY_GACHAS: CatalogGachaSummary[] = []

export type CardSameCharacterEntry = {
  card: CatalogMasterCard
  thumbnail: CatalogCardThumbnail
  unreleased: boolean
}

export type UseCardDetailResult = {
  region: ComputedRef<SekaiRegion>
  assetEndpoint: ComputedRef<SekaiAssetEndpointPreference>
  loading: ComputedRef<boolean>
  refreshing: ComputedRef<boolean>
  error: ComputedRef<string | null>
  notFound: ComputedRef<boolean>
  card: ComputedRef<CatalogMasterCard | null>
  character: ComputedRef<CatalogCharacter | null>
  unit: ComputedRef<SekaiUnit | null>
  supportUnit: ComputedRef<SekaiUnit | null>
  unitColorMap: ComputedRef<Map<SekaiUnit, string>>
  supplyType: ComputedRef<CardSupplyType | null>
  unreleased: ComputedRef<boolean>
  hasTrainedArt: ComputedRef<boolean>
  extras: ComputedRef<CardIndexExtras | null>
  powerTable: ComputedRef<CardPowerTable | null>
  /** Skill records (null while the skills resource loads). */
  skill: ComputedRef<CardSkillRecord | null>
  trainedSkill: ComputedRef<CardSkillRecord | null>
  skillsLoading: ComputedRef<boolean>
  episodes: ComputedRef<CardEpisodeRow[]>
  rarityInfo: ComputedRef<CardRarityInfo | null>
  masterLessons: ComputedRef<CardPowerBonus[]>
  canvasBonus: ComputedRef<CardPowerBonus | null>
  detailExtrasLoading: ComputedRef<boolean>
  relatedEvents: ComputedRef<CardRelatedEvent[]>
  eventsLoading: ComputedRef<boolean>
  relatedGachas: ComputedRef<CatalogGachaSummary[]>
  gachaBannerAliasMap: ComputedRef<ReadonlyMap<number, number>>
  gachasLoading: ComputedRef<boolean>
  sameCharacterCards: ComputedRef<CardSameCharacterEntry[]>
  /** Every card of the character, for the "view all" count. */
  characterCardCount: ComputedRef<number>
  reload: () => void
}

/**
 * Detail-page state for one card id: the canonical indexes (cards,
 * characters, events, gachas) plus the skills and detail-extras resources.
 * Secondary resources report their own loading flags so each section can
 * show its skeleton while the shell already renders the card.
 */
export function useCardDetail(cardId: Ref<number | null>): UseCardDetailResult {
  const settingsStore = useSettingsStore()
  const { region } = useEffectiveCatalogRegion()
  const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)
  const now = useNowTick(60_000)

  const cardsIndex = useCardsIndex(region)
  const charactersIndex = useCharactersIndex(region)
  const eventsIndex = useEventsIndex(region)
  const gachasIndex = useGachasIndex(region)
  const skills = useCardSkills(region)

  const card = computed(() => (cardId.value != null
    ? cardsIndex.data.value?.byId.get(cardId.value) ?? null
    : null))

  const detailExtras = useCardDetailExtras(region, computed(() => card.value != null))

  const loading = computed(() => cardsIndex.loading.value || charactersIndex.loading.value)
  const refreshing = computed(() => cardsIndex.refreshing.value || charactersIndex.refreshing.value)
  const error = computed(() => cardsIndex.error.value ?? charactersIndex.error.value)
  const notFound = computed(() => !loading.value && !error.value && cardsIndex.data.value != null && card.value == null)

  const characterMap = computed(() => charactersIndex.data.value?.characterMap ?? new Map<number, CatalogCharacter>())
  const unitColorMap = computed(() => charactersIndex.data.value?.unitColorMap ?? new Map<SekaiUnit, string>())
  const character = computed(() => (card.value?.characterId != null
    ? characterMap.value.get(card.value.characterId) ?? null
    : null))
  const unit = computed(() => (card.value ? resolveCardUnit(card.value, characterMap.value) : null))
  const supportUnit = computed<SekaiUnit | null>(() => {
    const value = card.value?.supportUnit
    return value && value !== "none" && (SEKAI_UNITS as readonly string[]).includes(value) ? (value as SekaiUnit) : null
  })

  const worldBloomCardIds = computed<ReadonlySet<number>>(() => {
    const events = eventsIndex.data.value
    return events ? collectWorldBloomCardIds(events.list, events.cardLinksByEvent) : new Set<number>()
  })
  const supplyType = computed(() => (card.value
    ? resolveCardSupplyType(card.value, cardsIndex.data.value?.supplyTypeMap ?? new Map(), worldBloomCardIds.value)
    : null))

  const unreleased = computed(() => card.value != null && isCardUnreleased(card.value.releaseAt, now.value))
  const hasTrainedArt = computed(() => card.value != null && cardRarityHasTrainedArt(card.value.cardRarityType))
  const extras = computed(() => (card.value ? cardsIndex.data.value?.extrasById.get(card.value.id) ?? null : null))
  const powerTable = computed(() => (card.value ? cardsIndex.data.value?.powerTables.get(card.value.id) ?? null : null))

  const skill = computed(() => (card.value?.skillId != null
    ? skills.data.value?.byId.get(card.value.skillId) ?? null
    : null))
  const trainedSkill = computed(() => (extras.value?.specialTrainingSkillId != null
    ? skills.data.value?.byId.get(extras.value.specialTrainingSkillId) ?? null
    : null))
  const skillsLoading = computed(() => skills.loading.value)

  const episodes = computed(() => (card.value
    ? detailExtras.data.value?.episodesByCard.get(card.value.id) ?? EMPTY_EPISODES
    : EMPTY_EPISODES))
  const rarityInfo = computed(() => (card.value
    ? detailExtras.data.value?.raritiesByType.get(card.value.cardRarityType) ?? null
    : null))
  const masterLessons = computed(() => (card.value
    ? detailExtras.data.value?.masterLessonsByRarity.get(card.value.cardRarityType) ?? EMPTY_BONUSES
    : EMPTY_BONUSES))
  const canvasBonus = computed(() => (card.value
    ? detailExtras.data.value?.canvasBonusByRarity.get(card.value.cardRarityType) ?? null
    : null))
  const detailExtrasLoading = computed(() => detailExtras.loading.value)

  const relatedEvents = computed(() => {
    const events = eventsIndex.data.value
    return card.value && events
      ? selectCardRelatedEvents(card.value.id, events.cardLinksByCard, events.byId)
      : EMPTY_EVENTS
  })
  const eventsLoading = computed(() => eventsIndex.loading.value)

  const relatedGachas = computed(() => {
    const gachas = gachasIndex.data.value
    return card.value && gachas
      ? selectCardRelatedGachas(card.value.id, gachas.gachaIdsByPickupCard, gachas.byId)
      : EMPTY_GACHAS
  })
  const gachaBannerAliasMap = computed<ReadonlyMap<number, number>>(
    () => gachasIndex.data.value?.bannerAliasMap ?? new Map<number, number>(),
  )
  const gachasLoading = computed(() => gachasIndex.loading.value)

  const sameCharacterCards = computed<CardSameCharacterEntry[]>(() => {
    if (!card.value) {
      return []
    }
    return selectSameCharacterCards(cardsIndex.data.value?.list ?? [], card.value).map((other) => ({
      card: other,
      thumbnail: buildCatalogCardThumbnail(other, region.value, assetEndpoint.value),
      unreleased: isCardUnreleased(other.releaseAt, now.value),
    }))
  })

  const characterCardCount = computed(() => (card.value?.characterId != null
    ? cardsIndex.data.value?.byCharacter.get(card.value.characterId)?.length ?? 0
    : 0))

  function reload() {
    void Promise.all([
      cardsIndex.reload(),
      charactersIndex.reload(),
      eventsIndex.reload(),
      gachasIndex.reload(),
      skills.reload(),
      detailExtras.reload(),
    ])
  }

  return {
    region,
    assetEndpoint,
    loading,
    refreshing,
    error,
    notFound,
    card,
    character,
    unit,
    supportUnit,
    unitColorMap,
    supplyType,
    unreleased,
    hasTrainedArt,
    extras,
    powerTable,
    skill,
    trainedSkill,
    skillsLoading,
    episodes,
    rarityInfo,
    masterLessons,
    canvasBonus,
    detailExtrasLoading,
    relatedEvents,
    eventsLoading,
    relatedGachas,
    gachaBannerAliasMap,
    gachasLoading,
    sameCharacterCards,
    characterCardCount,
    reload,
  }
}
