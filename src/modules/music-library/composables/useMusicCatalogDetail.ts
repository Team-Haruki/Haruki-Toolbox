import { computed, type ComputedRef, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import type { SekaiEventItem } from "@/modules/events"
import type { CatalogCharacter } from "@/shared/sekai/catalog"
import type { EventBoxInfo } from "@/modules/music-library/lib/event-box"
import { resolveMusicEvents } from "@/modules/music-library/lib/event-musics"
import type { MusicLibraryEntry, MusicVocalEntry } from "@/modules/music-library/lib/music-data"
import type { MusicReleaseCondition } from "@/modules/music-library/lib/music-extras"
import { useMusicDetailExtras } from "./useMusicDetailExtras"
import { useMusicDuration } from "./useMusicDuration"
import { useMusicEventContext } from "./useMusicEventContext"
import { useMusicsIndex } from "./useMusicsIndex"
import { useMusicVocalsResource } from "./useMusicVocalsResource"

export type MusicRelatedEvent = {
  event: SekaiEventItem
  box: EventBoxInfo | null
}

export type MusicCatalogDetail = {
  entry: ComputedRef<MusicLibraryEntry | null>
  vocals: ComputedRef<MusicVocalEntry[]>
  characterMap: ComputedRef<Map<number, CatalogCharacter>>
  outsideCharacterNames: ComputedRef<Map<number, string>>
  relatedEvents: ComputedRef<MusicRelatedEvent[]>
  releaseCondition: ComputedRef<MusicReleaseCondition | null>
  originalLink: ComputedRef<string | null>
  durationSeconds: ComputedRef<number | null>
  /** First load of the song index (nothing to show yet). */
  loading: ComputedRef<boolean>
  refreshing: ComputedRef<boolean>
  error: Ref<string | null>
  notFound: ComputedRef<boolean>
  /** Optional detail files still loading (unlock / original MV sections). */
  extrasLoading: ComputedRef<boolean>
  vocalsLoading: ComputedRef<boolean>
  eventsLoading: ComputedRef<boolean>
  reload: () => Promise<void>
}

/**
 * Detail-page state for one song: the index entry with its synthetic tags,
 * vocal versions, related events with box hints, unlock condition, original
 * MV link and duration — each section lights up as its resource arrives.
 */
export function useMusicCatalogDetail(region: Ref<SekaiRegion>, musicId: Ref<number | null>): MusicCatalogDetail {
  const musics = useMusicsIndex(region)
  const vocals = useMusicVocalsResource(region)
  const context = useMusicEventContext(region)
  const { events, characters, eventMusics } = context
  const enabled = computed(() => musicId.value != null)
  const extras = useMusicDetailExtras(region, enabled)
  const durationSeconds = useMusicDuration(region, musicId, extras.ready)

  const baseEntry = computed(() => (
    musicId.value != null ? musics.data.value?.byId.get(musicId.value) ?? null : null
  ))

  const entry = computed(() => {
    const base = baseEntry.value
    return base ? context.tagEntries([base])[0] ?? base : null
  })

  const relatedEvents = computed<MusicRelatedEvent[]>(() => {
    const id = musicId.value
    const links = eventMusics.data.value?.eventIdsByMusic
    const byId = events.data.value?.byId
    if (id == null || !links || !byId) {
      return []
    }
    return resolveMusicEvents(id, links, byId).map((event) => ({
      event,
      box: context.eventBoxMap.value.get(event.id) ?? null,
    }))
  })

  const resources = [musics, vocals, extras, events, context.cards, characters, eventMusics]

  return {
    entry,
    vocals: computed(() => (musicId.value != null ? vocals.data.value?.byMusic.get(musicId.value) ?? [] : [])),
    characterMap: computed(() => characters.data.value?.characterMap ?? new Map<number, CatalogCharacter>()),
    outsideCharacterNames: computed(() => extras.data.value?.outsideCharacterNames ?? new Map<number, string>()),
    relatedEvents,
    releaseCondition: computed(() => {
      const conditionId = entry.value?.releaseConditionId
      return conditionId != null ? extras.data.value?.releaseConditionsById.get(conditionId) ?? null : null
    }),
    originalLink: computed(() => (
      musicId.value != null ? extras.data.value?.originalLinkByMusic.get(musicId.value) ?? null : null
    )),
    durationSeconds,
    loading: computed(() => musics.loading.value),
    refreshing: computed(() => resources.some((resource) => resource.refreshing.value)),
    error: musics.error,
    notFound: computed(() => musicId.value == null || (musics.ready.value && baseEntry.value == null)),
    extrasLoading: computed(() => extras.loading.value),
    vocalsLoading: computed(() => vocals.loading.value),
    eventsLoading: computed(() => events.loading.value || eventMusics.loading.value),
    reload: async () => {
      await Promise.all(resources.map((resource) => resource.reload()))
    },
  }
}
