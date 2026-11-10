import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useSettingsStore } from "@/shared/stores/settings"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import {
  buildCatalogCardThumbnail,
  normalizeCatalogMasterCard,
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
  type SekaiCardThumbnailView,
} from "@/shared/sekai/catalog"
import {
  normalizeEventItems,
  resolveEventBackgroundUrl,
  resolveEventBannerUrl,
  type SekaiEventItem,
} from "@/modules/events"
import { resolveMusicJacketUrl } from "@/modules/music-library"
import { buildGachaBannerAliasMap, buildGachaImageCandidates, normalizeCatalogGachas } from "@/modules/gachas"
import {
  selectFeaturedEvent,
  selectLiveGachas,
  selectRecentSongs,
  splitDuration,
  type LiveEventPhase,
} from "@/modules/home/lib/live-content"

const LIVE_FILES = ["events", "eventCards", "cards", "musics", "gachas"] as const
const CARD_LIMIT = 6
const GACHA_LIMIT = 3
const SONG_LIMIT = 8

export type LiveContentState = "checking" | "needs-opt-in" | "loading" | "ready" | "empty" | "error"

export interface LiveEventView {
  event: SekaiEventItem
  phase: LiveEventPhase
  /** "15 小时后结束"-style line for a running or upcoming event, "" once ended. */
  timeLabel: string
  /** When the next event starts, shown while the featured one has ended; "" when unknown. */
  nextLabel: string
  backgroundUrl: string | null
  /** Small banner shown blurred while the full artwork loads. */
  previewUrl: string | null
}

export interface LiveCardEntry {
  id: number
  title: string
  thumbnail: SekaiCardThumbnailView
}

export interface LiveGachaEntry {
  id: number
  name: string
  images: string[]
  timeLabel: string
}

export interface LiveSongEntry {
  id: number
  title: string
  jacket: string[]
  publishedAt: number
}

/**
 * What is on in the game right now for the visitor's catalog region: the
 * event to feature (running, about to start, or just ended), its cards, the
 * limited gachas that are open and the newest songs.
 *
 * Only small view records are kept; the master files are read once per load
 * and dropped, since `cards` and `gachas` are tens of megabytes on jp.
 */
export function useLiveContent() {
  const { t } = useI18n()
  const sekaiDataStore = useSekaiDataStore()
  const settingsStore = useSettingsStore()
  const { region } = useEffectiveCatalogRegion()
  const { hideUnreleased, blurUnreleased } = useUnreleasedContentDisplay()
  const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)
  // An event that has not started is unreleased content: it is featured only
  // when the visitor chose to see such content unblurred.
  const allowUpcoming = computed(() => !hideUnreleased.value && !blurUnreleased.value)

  const state = ref<LiveContentState>("checking")
  const events = shallowRef<SekaiEventItem[]>([])
  const cards = shallowRef<LiveCardEntry[]>([])
  const cardsEventId = ref<number | null>(null)
  const openGachas = shallowRef<Array<Omit<LiveGachaEntry, "timeLabel"> & { endAt: number }>>([])
  const songs = shallowRef<LiveSongEntry[]>([])
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | null = null

  function formatDuration(ms: number): string {
    const parts = splitDuration(ms)
    return t(`home.live.duration.${parts.unit}`, { days: parts.days, hours: parts.hours, minutes: parts.minutes })
  }

  const featured = computed(() => selectFeaturedEvent(events.value, now.value, { allowUpcoming: allowUpcoming.value }))

  const liveEvent = computed<LiveEventView | null>(() => {
    const current = featured.value
    if (!current) {
      return null
    }

    const { event, phase, nextStartAt } = current
    let timeLabel = ""
    if (phase === "running" && event.aggregateAt != null) {
      timeLabel = t("home.live.endsIn", { duration: formatDuration(event.aggregateAt - now.value) })
    } else if (phase === "upcoming" && event.startAt != null) {
      timeLabel = t("home.live.startsIn", { duration: formatDuration(event.startAt - now.value) })
    }

    return {
      event,
      phase,
      timeLabel,
      nextLabel: phase === "ended" && nextStartAt != null
        ? t("home.live.nextStartsIn", { duration: formatDuration(nextStartAt - now.value) })
        : "",
      backgroundUrl: resolveEventBackgroundUrl(region.value, event.assetbundleName, assetEndpoint.value),
      previewUrl: resolveEventBannerUrl(region.value, event.assetbundleName, assetEndpoint.value),
    }
  })

  const gachas = computed<LiveGachaEntry[]>(() =>
    openGachas.value
      .filter((gacha) => gacha.endAt > now.value)
      .map((gacha) => ({
        id: gacha.id,
        name: gacha.name,
        images: gacha.images,
        timeLabel: t("home.live.endsIn", { duration: formatDuration(gacha.endAt - now.value) }),
      }))
  )

  function selectEventCards(eventId: number, rawEventCards: unknown, rawCards: unknown): LiveCardEntry[] {
    const cardIds = normalizeCatalogRecords(rawEventCards)
      .filter((record) => normalizeCatalogNumber(record.eventId) === eventId)
      .map((record) => normalizeCatalogNumber(record.cardId))
      .filter((cardId): cardId is number => cardId != null)
    if (cardIds.length === 0) {
      return []
    }

    const wanted = new Set(cardIds)
    const found = new Map<number, LiveCardEntry>()
    for (const record of normalizeCatalogRecords(rawCards)) {
      const id = normalizeCatalogNumber(record.id)
      if (id == null || !wanted.has(id)) {
        continue
      }
      const card = normalizeCatalogMasterCard(record)
      if (card) {
        found.set(card.id, {
          id: card.id,
          title: card.prefix || `#${card.id}`,
          thumbnail: buildCatalogCardThumbnail(card, region.value, assetEndpoint.value),
        })
      }
    }

    return cardIds
      .map((cardId) => found.get(cardId))
      .filter((card): card is LiveCardEntry => card != null)
      .slice(0, CARD_LIMIT)
  }

  async function load() {
    state.value = "loading"
    try {
      await sekaiDataStore.ensureRegionData(region.value, { files: LIVE_FILES })
      const files = await readSekaiMasterFiles(region.value, LIVE_FILES)
      const timestamp = Date.now()
      now.value = timestamp

      events.value = normalizeEventItems(files.events)
      const current = selectFeaturedEvent(events.value, timestamp, { allowUpcoming: allowUpcoming.value })
      cards.value = current ? selectEventCards(current.event.id, files.eventCards, files.cards) : []
      cardsEventId.value = current?.event.id ?? null

      const allGachas = normalizeCatalogGachas(files.gachas)
      const aliases = buildGachaBannerAliasMap(allGachas)
      openGachas.value = selectLiveGachas(allGachas, timestamp, GACHA_LIMIT).map((gacha) => ({
        id: gacha.id,
        name: gacha.name,
        endAt: gacha.endAt ?? timestamp,
        images: [
          ...buildGachaImageCandidates(gacha, region.value, assetEndpoint.value, aliases.get(gacha.id)),
          ...(region.value === "jp" ? [] : buildGachaImageCandidates(gacha, "jp", assetEndpoint.value, aliases.get(gacha.id))),
        ],
      }))

      const musicRecords = normalizeCatalogRecords(files.musics).map((record) => ({
        id: normalizeCatalogNumber(record.id) ?? 0,
        title: normalizeCatalogString(record.title),
        assetbundleName: normalizeCatalogString(record.assetbundleName),
        publishedAt: normalizeCatalogNumber(record.publishedAt),
      }))
      songs.value = selectRecentSongs(musicRecords.filter((music) => music.id > 0 && music.assetbundleName), timestamp, SONG_LIMIT)
        .map((music) => ({
          id: music.id,
          title: music.title || `#${music.id}`,
          publishedAt: music.publishedAt ?? timestamp,
          jacket: [
            resolveMusicJacketUrl(region.value, music.assetbundleName, assetEndpoint.value),
            region.value === "jp" ? null : resolveMusicJacketUrl("jp", music.assetbundleName, assetEndpoint.value),
          ].filter((url): url is string => url != null),
        }))

      state.value = current || openGachas.value.length > 0 || songs.value.length > 0 ? "ready" : "empty"
    } catch {
      state.value = "error"
    }
  }

  // The page was left open across an event boundary: the cards belong to the
  // previous event, so read the data again.
  watch(() => featured.value?.event.id ?? null, (eventId) => {
    if (state.value === "ready" && eventId !== cardsEventId.value) {
      void load()
    }
  })

  onMounted(async () => {
    timer = setInterval(() => {
      now.value = Date.now()
    }, 30_000)
    await sekaiDataStore.loadRegionCacheState(region.value)
    if (!sekaiDataStore.regionStates[region.value].masterFetchVersion) {
      state.value = "needs-opt-in"
      return
    }
    await load()
  })

  onBeforeUnmount(() => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  })

  return { state, region, liveEvent, cards, gachas, songs, load }
}
