import type { Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { normalizeCatalogNumber, normalizeCatalogRecords } from "@/shared/sekai/catalog"
import { useCatalogResource, type CatalogResource } from "@/shared/sekai/use-catalog-resource"
import { buildEventBonusAttrMap, normalizeEventDeckBonus, type EventDeckBonusRow } from "@/modules/events/lib/event-bonus"
import { normalizeEventItems, sortEventsByStartAtDesc, type SekaiEventItem } from "@/modules/events/lib/event-filter"
import { normalizeEventRankingRewardRanges, type EventRankingRewardRange } from "@/modules/events/lib/event-rewards"

/**
 * The only resource that reads `events.json`, `eventCards.json` and
 * `eventDeckBonuses.json`. Shared by the event list/detail, card detail
 * (related events), gacha detail (related event) and music pages.
 */
export const EVENTS_INDEX_KEY = "events/index"
export const EVENTS_INDEX_FILES = ["events", "eventCards", "eventDeckBonuses"] as const

/** One `eventCards` row. `leaderBonusRate` is absent on the en dump. */
export type EventCardLink = {
  eventId: number
  cardId: number
  bonusRate: number | null
  leaderBonusRate: number | null
  isDisplayCardStory: boolean
}

export type EventsIndex = {
  /** Every event, newest `startAt` first. */
  list: SekaiEventItem[]
  byId: Map<number, SekaiEventItem>
  cardLinksByEvent: Map<number, EventCardLink[]>
  cardLinksByCard: Map<number, EventCardLink[]>
  /** eventId → bonus card attributes (list attribute filter). */
  bonusAttrMap: Map<number, Set<string>>
  /** eventId → `gameCharacterUnitId`s carrying a character bonus (list character filter). */
  bonusCharacterUnitIdsByEvent: Map<number, Set<number>>
  /** eventId → normalized `eventDeckBonuses` rows (detail bonus section). */
  deckBonusesByEvent: Map<number, EventDeckBonusRow[]>
  /** eventId → ranking reward ranges, ascending by `fromRank` (detail rewards section). */
  rankingRewardRangesByEvent: Map<number, EventRankingRewardRange[]>
}

export function buildEventsIndex(files: Record<string, unknown>): EventsIndex {
  const rawEvents = normalizeCatalogRecords(files.events)
  const list = sortEventsByStartAtDesc(normalizeEventItems(rawEvents))
  const byId = new Map<number, SekaiEventItem>()
  for (const event of list) {
    byId.set(event.id, event)
  }

  const rankingRewardRangesByEvent = new Map<number, EventRankingRewardRange[]>()
  for (const record of rawEvents) {
    const eventId = normalizeCatalogNumber(record.id)
    if (!eventId || !byId.has(eventId)) {
      continue
    }
    const ranges = normalizeEventRankingRewardRanges(record.eventRankingRewardRanges)
    if (ranges.length > 0) {
      rankingRewardRangesByEvent.set(eventId, ranges)
    }
  }

  const cardLinksByEvent = new Map<number, EventCardLink[]>()
  const cardLinksByCard = new Map<number, EventCardLink[]>()
  for (const record of normalizeCatalogRecords(files.eventCards)) {
    const eventId = normalizeCatalogNumber(record.eventId)
    const cardId = normalizeCatalogNumber(record.cardId)
    if (!eventId || !cardId) {
      continue
    }
    const link: EventCardLink = {
      eventId,
      cardId,
      bonusRate: normalizeCatalogNumber(record.bonusRate),
      leaderBonusRate: normalizeCatalogNumber(record.leaderBonusRate),
      isDisplayCardStory: record.isDisplayCardStory === true,
    }
    const byEvent = cardLinksByEvent.get(eventId)
    if (byEvent) {
      byEvent.push(link)
    } else {
      cardLinksByEvent.set(eventId, [link])
    }
    const byCard = cardLinksByCard.get(cardId)
    if (byCard) {
      byCard.push(link)
    } else {
      cardLinksByCard.set(cardId, [link])
    }
  }

  const bonusCharacterUnitIdsByEvent = new Map<number, Set<number>>()
  const deckBonusesByEvent = new Map<number, EventDeckBonusRow[]>()
  for (const record of normalizeCatalogRecords(files.eventDeckBonuses)) {
    const bonus = normalizeEventDeckBonus(record)
    if (!bonus) {
      continue
    }
    const rows = deckBonusesByEvent.get(bonus.eventId)
    const row: EventDeckBonusRow = {
      gameCharacterUnitId: bonus.gameCharacterUnitId,
      cardAttr: bonus.cardAttr,
      bonusRate: bonus.bonusRate,
    }
    if (rows) {
      rows.push(row)
    } else {
      deckBonusesByEvent.set(bonus.eventId, [row])
    }
    if (bonus.gameCharacterUnitId == null) {
      continue
    }
    const ids = bonusCharacterUnitIdsByEvent.get(bonus.eventId)
    if (ids) {
      ids.add(bonus.gameCharacterUnitId)
    } else {
      bonusCharacterUnitIdsByEvent.set(bonus.eventId, new Set([bonus.gameCharacterUnitId]))
    }
  }

  return {
    list,
    byId,
    cardLinksByEvent,
    cardLinksByCard,
    bonusAttrMap: buildEventBonusAttrMap(files.eventDeckBonuses),
    bonusCharacterUnitIdsByEvent,
    deckBonusesByEvent,
    rankingRewardRangesByEvent,
  }
}

export function useEventsIndex(region: Ref<SekaiRegion>): CatalogResource<EventsIndex> {
  return useCatalogResource(region, EVENTS_INDEX_KEY, EVENTS_INDEX_FILES, buildEventsIndex)
}
