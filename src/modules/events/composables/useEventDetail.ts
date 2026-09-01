import { computed, type ComputedRef, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useNowTick } from "@/composables/useNowTick"
import type { CatalogStatus } from "@/shared/components/catalog/types"
import type { CatalogCharacter, CatalogMasterCard } from "@/shared/sekai/catalog"
import { useCharactersIndex } from "@/shared/sekai/catalog-resources"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import type { CatalogResource } from "@/shared/sekai/use-catalog-resource"
import { useCardsIndex } from "@/modules/cards"
import { useGachasIndex, type CatalogGachaSummary, type GachasIndex } from "@/modules/gachas"
import { useMusicsIndex, type MusicLibraryEntry } from "@/modules/music-library"
import { useEventDetailExtras } from "@/modules/events/composables/useEventDetailExtras"
import { useEventsIndex, type EventCardLink, type EventsIndex } from "@/modules/events/composables/useEventsIndex"
import { aggregateEventDeckBonusRows, type EventBonusGroup } from "@/modules/events/lib/event-bonus"
import type { CheerfulCarnivalTeam, EventDetailExtras, EventStory } from "@/modules/events/lib/event-extras"
import { isEventUnreleased, type SekaiEventItem, type SekaiWorldBloomChapter } from "@/modules/events/lib/event-filter"
import { resolveEventCatalogStatus } from "@/modules/events/lib/event-list"
import { buildEventRarityBonusTable, type EventRarityBonusRow } from "@/modules/events/lib/event-rarity-bonus"
import { resolveEventRelatedGachas, type RelatedGachasResult } from "@/modules/events/lib/event-related-gachas"
import type { EventRankingRewardRange } from "@/modules/events/lib/event-rewards"

const EMPTY_CHARACTER_MAP: ReadonlyMap<number, CatalogCharacter> = new Map()
const EMPTY_UNIT_MAP = new Map<number, { gameCharacterId: number; unit: string | null }>()
const NO_RELATED_GACHAS: RelatedGachasResult<CatalogGachaSummary> = { gachas: [], matchedBy: "none" }

export type EventDetailCard = {
  card: CatalogMasterCard
  link: EventCardLink
}

export type EventDetailMusic = {
  seq: number
  entry: MusicLibraryEntry
}

export type UseEventDetailResult = {
  eventsIndex: CatalogResource<EventsIndex>
  extras: CatalogResource<EventDetailExtras>
  gachasIndex: CatalogResource<GachasIndex>
  event: ComputedRef<SekaiEventItem | null>
  notFound: ComputedRef<boolean>
  status: ComputedRef<CatalogStatus | null>
  unreleased: ComputedRef<boolean>
  blurUnreleased: ComputedRef<boolean>
  now: Ref<number>
  characterMap: ComputedRef<ReadonlyMap<number, CatalogCharacter>>
  bonusGroups: ComputedRef<EventBonusGroup[]>
  rarityBonusTable: ComputedRef<EventRarityBonusRow[]>
  cards: ComputedRef<EventDetailCard[]>
  cardsLoading: ComputedRef<boolean>
  musics: ComputedRef<EventDetailMusic[]>
  musicsLoading: ComputedRef<boolean>
  chapters: ComputedRef<SekaiWorldBloomChapter[]>
  teams: ComputedRef<CheerfulCarnivalTeam[]>
  story: ComputedRef<EventStory | null>
  relatedGachas: ComputedRef<RelatedGachasResult<CatalogGachaSummary>>
  rewardRanges: ComputedRef<EventRankingRewardRange[]>
}

/**
 * Async state of the event detail page. The events index answers the
 * header immediately; cards, songs, gachas and the extras table stream into
 * their sections as they arrive.
 */
export function useEventDetail(region: Ref<SekaiRegion>, eventId: Ref<number | null>): UseEventDetailResult {
  const eventsIndex = useEventsIndex(region)
  const charactersIndex = useCharactersIndex(region)
  const cardsIndex = useCardsIndex(region)
  const gachasIndex = useGachasIndex(region)
  const musicsIndex = useMusicsIndex(region)
  const extras = useEventDetailExtras(region)
  const { blurUnreleased } = useUnreleasedContentDisplay()
  const now = useNowTick(30_000)

  const event = computed(() => {
    const id = eventId.value
    return id != null ? eventsIndex.data.value?.byId.get(id) ?? null : null
  })
  const notFound = computed(() => eventId.value == null || (eventsIndex.ready.value && event.value == null))
  const status = computed(() => (event.value ? resolveEventCatalogStatus(event.value, now.value) : null))
  const unreleased = computed(() => event.value != null && isEventUnreleased(event.value, now.value))

  const characterMap = computed(() => charactersIndex.data.value?.characterMap ?? EMPTY_CHARACTER_MAP)

  const bonusGroups = computed(() => {
    const id = eventId.value
    const rows = id != null ? eventsIndex.data.value?.deckBonusesByEvent.get(id) ?? [] : []
    return aggregateEventDeckBonusRows(rows, charactersIndex.data.value?.characterUnitById ?? EMPTY_UNIT_MAP)
  })

  const rarityBonusTable = computed(() => buildEventRarityBonusTable(extras.data.value?.rarityBonusRates ?? []))

  const cardLinks = computed(() => {
    const id = eventId.value
    return id != null ? eventsIndex.data.value?.cardLinksByEvent.get(id) ?? [] : []
  })

  const cards = computed<EventDetailCard[]>(() => {
    const byId = cardsIndex.data.value?.byId
    if (!byId) {
      return []
    }
    const entries: EventDetailCard[] = []
    for (const link of cardLinks.value) {
      const card = byId.get(link.cardId)
      if (card) {
        entries.push({ card, link })
      }
    }
    return entries
  })

  const musics = computed<EventDetailMusic[]>(() => {
    const id = eventId.value
    const byId = musicsIndex.data.value?.byId
    if (id == null || !byId) {
      return []
    }
    const entries: EventDetailMusic[] = []
    for (const row of extras.data.value?.musicsByEvent.get(id) ?? []) {
      const entry = byId.get(row.musicId)
      if (entry) {
        entries.push({ seq: row.seq, entry })
      }
    }
    return entries
  })

  const chapters = computed(() => {
    const id = eventId.value
    return id != null ? extras.data.value?.chaptersByEvent.get(id) ?? [] : []
  })

  const teams = computed(() => {
    const id = eventId.value
    return id != null ? extras.data.value?.teamsByEvent.get(id) ?? [] : []
  })

  const story = computed(() => {
    const id = eventId.value
    return id != null ? extras.data.value?.storiesByEvent.get(id) ?? null : null
  })

  const relatedGachas = computed(() => {
    const index = gachasIndex.data.value
    const current = event.value
    if (!index || !current) {
      return NO_RELATED_GACHAS
    }
    return resolveEventRelatedGachas(current, new Set(cardLinks.value.map((link) => link.cardId)), index.list)
  })

  const rewardRanges = computed(() => {
    const id = eventId.value
    return id != null ? eventsIndex.data.value?.rankingRewardRangesByEvent.get(id) ?? [] : []
  })

  return {
    eventsIndex,
    extras,
    gachasIndex,
    event,
    notFound,
    status,
    unreleased,
    blurUnreleased,
    now,
    characterMap,
    bonusGroups,
    rarityBonusTable,
    cards,
    cardsLoading: computed(() => cardsIndex.data.value == null && cardLinks.value.length > 0),
    musics,
    musicsLoading: computed(() => musicsIndex.data.value == null || extras.data.value == null),
    chapters,
    teams,
    story,
    relatedGachas,
    rewardRanges,
  }
}
