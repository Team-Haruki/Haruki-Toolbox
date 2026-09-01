import { computed, type ComputedRef, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useCardsIndex, type CardsIndex } from "@/modules/cards"
import { useEventsIndex, type EventsIndex } from "@/modules/events"
import { useCharactersIndex, type CharactersIndex } from "@/shared/sekai/catalog-resources"
import type { CatalogResource } from "@/shared/sekai/use-catalog-resource"
import {
  buildEventBoxMapFromCatalog,
  buildMusicEventBoxMapFromLinks,
  type EventBoxInfo,
} from "@/modules/music-library/lib/event-box"
import { listWorldLinkMusicIdsFromCatalog, type EventMusicsIndex } from "@/modules/music-library/lib/event-musics"
import {
  MUSIC_TAG_EVENT_BOX,
  MUSIC_TAG_WORLD_LINK,
  applyMusicTagByIds,
  type MusicLibraryEntry,
} from "@/modules/music-library/lib/music-data"
import { useEventMusicsResource } from "./useEventMusicsResource"

export type MusicEventContext = {
  events: CatalogResource<EventsIndex>
  cards: CatalogResource<CardsIndex>
  characters: CatalogResource<CharactersIndex>
  eventMusics: CatalogResource<EventMusicsIndex>
  /** eventId → box info ("N箱") of unit events. */
  eventBoxMap: ComputedRef<Map<number, EventBoxInfo>>
  /** musicId → box info of the song's earliest linked event. */
  musicEventBoxes: ComputedRef<Map<number, EventBoxInfo>>
  worldLinkMusicIds: ComputedRef<Set<number>>
  /** Appends the synthetic box / World Link tags derived from the event data. */
  tagEntries: (entries: readonly MusicLibraryEntry[]) => MusicLibraryEntry[]
}

/**
 * The event-side joins shared by the list and the detail page: box hints,
 * World Link tags and the song ↔ event links, all derived from the canonical
 * events / cards / characters indexes plus the module's `eventMusics`
 * resource. Everything degrades to empty maps until the indexes arrive.
 */
export function useMusicEventContext(region: Ref<SekaiRegion>): MusicEventContext {
  const events = useEventsIndex(region)
  const cards = useCardsIndex(region)
  const characters = useCharactersIndex(region)
  const eventMusics = useEventMusicsResource(region)

  const eventBoxMap = computed(() => {
    const eventsIndex = events.data.value
    const cardsIndex = cards.data.value
    const charactersIndex = characters.data.value
    if (!eventsIndex || !cardsIndex || !charactersIndex) {
      return new Map<number, EventBoxInfo>()
    }
    const unitByCharacter = new Map<number, string | null>()
    for (const character of charactersIndex.characters) {
      unitByCharacter.set(character.id, character.unit)
    }
    return buildEventBoxMapFromCatalog({
      events: eventsIndex.list,
      cardLinksByEvent: eventsIndex.cardLinksByEvent,
      cardsById: cardsIndex.byId,
      unitByCharacter,
    })
  })

  const musicEventBoxes = computed(() => {
    const links = eventMusics.data.value?.eventIdsByMusic
    return links ? buildMusicEventBoxMapFromLinks(links, eventBoxMap.value) : new Map<number, EventBoxInfo>()
  })

  const worldLinkMusicIds = computed(() => {
    const eventsIndex = events.data.value
    const links = eventMusics.data.value?.musicIdsByEvent
    return eventsIndex && links ? listWorldLinkMusicIdsFromCatalog(eventsIndex.list, links) : new Set<number>()
  })

  function tagEntries(entries: readonly MusicLibraryEntry[]): MusicLibraryEntry[] {
    return applyMusicTagByIds(
      applyMusicTagByIds(entries, musicEventBoxes.value, MUSIC_TAG_EVENT_BOX),
      worldLinkMusicIds.value,
      MUSIC_TAG_WORLD_LINK,
    )
  }

  return { events, cards, characters, eventMusics, eventBoxMap, musicEventBoxes, worldLinkMusicIds, tagEntries }
}
