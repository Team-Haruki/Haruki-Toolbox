<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideChartLine,
  LucideChevronRight,
  LucideDisc3,
  LucideLayoutGrid,
  LucideSparkles,
  LucideWalletCards,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useSettingsStore } from "@/shared/stores/settings"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import {
  buildCatalogCardThumbnail,
  normalizeCatalogMasterCard,
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
  type CatalogMasterCard,
  type SekaiCardThumbnailView,
} from "@/shared/sekai/catalog"
import SekaiCardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"
import {
  EventBannerImage,
  EventTypeBadge,
  normalizeEventItems,
  resolveEventBackgroundUrl,
  type SekaiEventItem,
} from "@/modules/events"
import { resolveMusicJacketUrl } from "@/modules/music-library"
import { buildGachaLogoCandidates, normalizeCatalogGachas } from "@/modules/gachas"
import FallbackImage from "./FallbackImage.vue"

type SongEntry = { id: number; title: string; jacket: readonly string[] }
type GachaEntry = { id: number; name: string; logo: readonly string[] }

const CARD_LIMIT = 8
const SONG_LIMIT = 4
const GACHA_LIMIT = 3
const GACHA_LOOKBACK_MS = 12 * 60 * 60 * 1000

const HOME_EVENT_FILES = [
  "events",
  "eventCards",
  "cards",
  "eventMusics",
  "musics",
  "gachas",
] as const

const { t } = useI18n()
const sekaiDataStore = useSekaiDataStore()
const settingsStore = useSettingsStore()
const { region } = useEffectiveCatalogRegion()
const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

const state = ref<"checking" | "needs-opt-in" | "loading" | "ready" | "empty" | "error">("checking")
const currentEvent = ref<SekaiEventItem | null>(null)
const cardThumbnails = ref<{ id: number; title: string; thumbnail: SekaiCardThumbnailView }[]>([])
const songs = ref<SongEntry[]>([])
const gachas = ref<GachaEntry[]>([])
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

const backgroundUrl = computed(() => {
  const event = currentEvent.value
  if (!event) {
    return null
  }

  return resolveEventBackgroundUrl(
    region.value,
    event.assetbundleName,
    assetEndpoint.value,
  )
})

const remainingLabel = computed(() => {
  if (!currentEvent.value?.aggregateAt) {
    return ""
  }

  const remainingMs = currentEvent.value.aggregateAt - now.value
  if (remainingMs <= 0) {
    return t("home.currentEvent.ended")
  }

  const totalMinutes = Math.floor(remainingMs / 60_000)
  const days = Math.floor(totalMinutes / 1_440)
  const hours = Math.floor((totalMinutes % 1_440) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) {
    return t("home.currentEvent.remainingDays", { days, hours })
  }

  if (hours > 0) {
    return t("home.currentEvent.remainingHours", { hours, minutes })
  }

  return t("home.currentEvent.remainingMinutes", { minutes })
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

  await loadCurrentEvent()
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})

async function loadCurrentEvent() {
  state.value = "loading"
  try {
    await sekaiDataStore.ensureRegionData(region.value, { files: HOME_EVENT_FILES })
    const files = await readSekaiMasterFiles(region.value, HOME_EVENT_FILES)
    const timestamp = Date.now()
    const event = normalizeEventItems(files.events)
      .filter((item) => item.startAt != null && item.startAt <= timestamp
        && item.aggregateAt != null && timestamp < item.aggregateAt)
      .sort((left, right) => (right.startAt ?? 0) - (left.startAt ?? 0))[0] ?? null

    currentEvent.value = event
    if (!event) {
      cardThumbnails.value = []
      songs.value = []
      gachas.value = []
      state.value = "empty"
      return
    }

    cardThumbnails.value = selectEventCards(event.id, files.eventCards, files.cards)
    songs.value = selectEventSongs(event.id, files.eventMusics, files.musics)
    gachas.value = selectEventGachas(event, files.gachas)
    state.value = "ready"
  } catch {
    state.value = "error"
  }
}

function cardTitle(card: CatalogMasterCard): string {
  return card.prefix || `#${card.id}`
}

function selectEventCards(eventId: number, rawEventCards: unknown, rawCards: unknown) {
  const cardIds = normalizeCatalogRecords(rawEventCards)
    .filter((record) => normalizeCatalogNumber(record.eventId) === eventId)
    .map((record) => normalizeCatalogNumber(record.cardId))
    .filter((cardId): cardId is number => cardId != null)
  if (cardIds.length === 0) {
    return []
  }

  const cardIdSet = new Set(cardIds)
  const cardMap = new Map<number, CatalogMasterCard>()
  for (const record of normalizeCatalogRecords(rawCards)) {
    const card = normalizeCatalogMasterCard(record)
    if (card && cardIdSet.has(card.id)) {
      cardMap.set(card.id, card)
    }
  }

  return cardIds
    .map((cardId) => cardMap.get(cardId))
    .filter((card): card is CatalogMasterCard => card != null)
    .slice(0, CARD_LIMIT)
    .map((card) => ({
      id: card.id,
      title: cardTitle(card),
      thumbnail: buildCatalogCardThumbnail(card, region.value, assetEndpoint.value),
    }))
}

function selectEventSongs(eventId: number, rawEventMusics: unknown, rawMusics: unknown): SongEntry[] {
  const musicIds = normalizeCatalogRecords(rawEventMusics)
    .filter((record) => normalizeCatalogNumber(record.eventId) === eventId)
    .map((record) => normalizeCatalogNumber(record.musicId))
    .filter((musicId): musicId is number => musicId != null)
  if (musicIds.length === 0) {
    return []
  }

  const musicMap = new Map<number, { title: string; assetbundleName: string }>()
  for (const record of normalizeCatalogRecords(rawMusics)) {
    const id = normalizeCatalogNumber(record.id)
    const assetbundleName = normalizeCatalogString(record.assetbundleName)
    if (id != null && assetbundleName) {
      musicMap.set(id, { title: normalizeCatalogString(record.title) || `#${id}`, assetbundleName })
    }
  }

  const seen = new Set<number>()
  const entries: SongEntry[] = []
  for (const musicId of musicIds) {
    if (seen.has(musicId)) {
      continue
    }
    seen.add(musicId)
    const music = musicMap.get(musicId)
    if (!music) {
      continue
    }
    const jacket = [resolveMusicJacketUrl(region.value, music.assetbundleName, assetEndpoint.value)]
    if (region.value !== "jp") {
      jacket.push(resolveMusicJacketUrl("jp", music.assetbundleName, assetEndpoint.value))
    }
    entries.push({
      id: musicId,
      title: music.title,
      jacket: jacket.filter((url): url is string => url != null),
    })
    if (entries.length >= SONG_LIMIT) {
      break
    }
  }
  return entries
}

function selectEventGachas(event: SekaiEventItem, rawGachas: unknown): GachaEntry[] {
  if (event.startAt == null || event.aggregateAt == null) {
    return []
  }

  const windowStart = event.startAt - GACHA_LOOKBACK_MS
  const windowEnd = event.aggregateAt
  return normalizeCatalogGachas(rawGachas)
    .filter((gacha) => gacha.startAt != null && gacha.startAt >= windowStart && gacha.startAt <= windowEnd)
    .sort((left, right) => (left.startAt ?? 0) - (right.startAt ?? 0))
    .slice(0, GACHA_LIMIT)
    .map((gacha) => {
      const logo = buildGachaLogoCandidates(gacha, region.value, assetEndpoint.value)
      if (region.value !== "jp") {
        logo.push(...buildGachaLogoCandidates(gacha, "jp", assetEndpoint.value))
      }
      return { id: gacha.id, name: gacha.name, logo }
    })
}
</script>

<template>
  <Card class="w-full overflow-hidden py-0">
    <!-- Loading -->
    <div v-if="state === 'checking' || state === 'loading'" class="flex flex-col gap-3 p-4 sm:flex-row">
      <Skeleton class="h-24 w-full shrink-0 sm:w-56" />
      <div class="flex-1 space-y-2">
        <Skeleton class="h-5 w-2/3" />
        <Skeleton class="h-4 w-1/2" />
        <Skeleton class="h-10 w-full" />
      </div>
    </div>

    <!-- Opt-in required -->
    <div v-else-if="state === 'needs-opt-in'" class="flex flex-col gap-2 p-4">
      <p class="text-sm font-medium">{{ t("home.currentEvent.title", { region: region.toUpperCase() }) }}</p>
      <p class="text-sm text-muted-foreground">{{ t("home.currentEvent.optInHint") }}</p>
      <Button variant="outline" size="sm" class="self-start" @click="loadCurrentEvent">
        {{ t("home.currentEvent.load") }}
      </Button>
    </div>

    <!-- Empty / error -->
    <div v-else-if="state === 'empty' || state === 'error'" class="flex items-center gap-2 p-4">
      <LucideSparkles class="h-4 w-4 shrink-0 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">
        {{ state === "error" ? t("home.currentEvent.error") : t("home.currentEvent.none") }}
      </p>
    </div>

    <!-- Ready -->
    <div v-else-if="currentEvent" class="relative">
      <!-- Event background artwork -->
      <div v-if="backgroundUrl" class="absolute inset-0 opacity-25 dark:opacity-20" aria-hidden="true">
        <FallbackImage
          :candidates="[backgroundUrl]"
          alt=""
          img-class="h-full w-full object-cover"
        />
      </div>
      <div class="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/45" aria-hidden="true" />

      <div class="relative flex flex-col gap-4 p-4 lg:flex-row lg:items-stretch">
        <!-- Left: logo + heading -->
        <RouterLink
          :to="`/events/${currentEvent.id}`"
          class="group flex items-center gap-3 rounded-lg lg:w-64 lg:shrink-0 lg:flex-col lg:items-start lg:justify-center"
        >
          <div class="relative h-16 w-28 shrink-0 overflow-hidden rounded-md lg:h-24 lg:w-full">
            <EventBannerImage
              :region="region"
              :assetbundle-name="currentEvent.assetbundleName"
              :alt="currentEvent.name"
              :preference="assetEndpoint"
              variant="logo"
            />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <LucideSparkles class="h-3 w-3" />
              {{ t("home.currentEvent.badge") }}
            </div>
            <p class="mt-0.5 truncate text-sm font-bold group-hover:text-primary lg:whitespace-normal">
              {{ currentEvent.name }}
            </p>
            <div class="mt-1 flex flex-wrap items-center gap-1.5">
              <EventTypeBadge :event-type="currentEvent.eventType" />
              <span class="text-xs text-muted-foreground">{{ remainingLabel }}</span>
            </div>
          </div>
        </RouterLink>

        <!-- Right: sections + quick links -->
        <div class="flex min-w-0 flex-1 flex-col gap-3">
          <!-- Cards -->
          <section v-if="cardThumbnails.length" class="flex min-w-0 items-center gap-2">
            <span class="flex w-12 shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
              <LucideWalletCards class="h-3.5 w-3.5" />
            </span>
            <div class="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1">
              <RouterLink
                v-for="card in cardThumbnails"
                :key="card.id"
                :to="`/cards/${card.id}`"
                class="w-12 shrink-0 rounded focus-visible:outline-2 focus-visible:outline-ring"
                :title="card.title"
              >
                <SekaiCardThumbnail :thumbnail="card.thumbnail" :title="card.title" />
              </RouterLink>
            </div>
          </section>

          <!-- Songs -->
          <section v-if="songs.length" class="flex min-w-0 items-center gap-2">
            <span class="flex w-12 shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
              <LucideDisc3 class="h-3.5 w-3.5" />
            </span>
            <div class="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1">
              <RouterLink
                v-for="song in songs"
                :key="song.id"
                :to="`/music/${song.id}`"
                class="w-12 shrink-0 overflow-hidden rounded ring-1 ring-border focus-visible:outline-2 focus-visible:outline-ring"
                :title="song.title"
              >
                <FallbackImage :candidates="song.jacket" :alt="song.title" img-class="aspect-square h-full w-full object-cover" />
              </RouterLink>
            </div>
          </section>

          <!-- Gacha -->
          <section v-if="gachas.length" class="flex min-w-0 items-center gap-2">
            <span class="flex w-12 shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
              <LucideSparkles class="h-3.5 w-3.5" />
            </span>
            <div class="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1">
              <RouterLink
                v-for="gacha in gachas"
                :key="gacha.id"
                :to="`/gachas/${gacha.id}`"
                class="h-10 w-[4.5rem] shrink-0 overflow-hidden rounded ring-1 ring-border focus-visible:outline-2 focus-visible:outline-ring"
                :title="gacha.name"
              >
                <FallbackImage :candidates="gacha.logo" :alt="gacha.name" img-class="h-full w-full object-cover" />
              </RouterLink>
            </div>
          </section>

          <!-- Quick links -->
          <div class="mt-auto flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" class="h-8" as-child>
              <RouterLink to="/rank-border">
                <LucideChartLine class="mr-1 h-3.5 w-3.5" /> {{ t("home.currentEvent.links.rankBorder") }}
              </RouterLink>
            </Button>
            <Button variant="outline" size="sm" class="h-8" as-child>
              <RouterLink to="/deck-recommend">
                <LucideLayoutGrid class="mr-1 h-3.5 w-3.5" /> {{ t("home.currentEvent.links.deckRecommend") }}
              </RouterLink>
            </Button>
            <Button variant="ghost" size="sm" class="ml-auto h-8" as-child>
              <RouterLink :to="`/events/${currentEvent.id}`">
                {{ t("home.currentEvent.links.detail") }}
                <LucideChevronRight class="ml-0.5 h-3.5 w-3.5" />
              </RouterLink>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>
