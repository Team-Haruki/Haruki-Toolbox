<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideChevronRight, LucideSparkles } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import SekaiCardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"
import { EventBannerImage } from "@/modules/events"
import { resolveSekaiEventTypeLabel } from "@/shared/sekai/labels"
import { formatLocalizedDate } from "@/lib/date-time"
import { useSettingsStore } from "@/shared/stores/settings"
import FallbackImage from "@/modules/home/components/FallbackImage.vue"
import type {
  LiveCardEntry,
  LiveContentState,
  LiveEventView,
  LiveGachaEntry,
  LiveSongEntry,
} from "@/modules/home/composables/useLiveContent"
import type { SekaiRegion } from "@/types"

const props = defineProps<{
  state: LiveContentState
  region: SekaiRegion
  liveEvent: LiveEventView | null
  cards: LiveCardEntry[]
  gachas: LiveGachaEntry[]
  songs: LiveSongEntry[]
}>()

defineEmits<{ load: [] }>()

const { t, te } = useI18n()
const settingsStore = useSettingsStore()
const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

// The key visual is a multi-megabyte PNG: the small banner stands in, blurred,
// until it has loaded, and stays if it never does.
const artworkLoaded = ref(false)
const artworkFailed = ref(false)
watch(() => props.liveEvent?.backgroundUrl, () => {
  artworkLoaded.value = false
  artworkFailed.value = false
})

const phaseLabel = computed(() => {
  switch (props.liveEvent?.phase) {
    case "running":
      return t("home.live.running")
    case "upcoming":
      return t("home.live.upcoming")
    default:
      return t("home.live.ended")
  }
})

const eventTypeLabel = computed(() => {
  const eventType = props.liveEvent?.event.eventType
  return eventType ? resolveSekaiEventTypeLabel({ t, te }, eventType) : ""
})

function songDate(publishedAt: number): string {
  return formatLocalizedDate(publishedAt, "monthDay")
}
</script>

<template>
  <section class="flex flex-col gap-4" aria-labelledby="home-live-title" data-testid="home-live">
    <!-- The featured event, with the caller's content (the event tools) beside it. -->
    <div :class="['grid gap-x-4 gap-y-5', $slots.aside ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : '']">
      <div class="flex min-w-0 flex-col gap-2">
        <div class="flex items-baseline gap-2 px-0.5">
          <h2 id="home-live-title" class="flex items-center gap-1.5 text-sm font-semibold">
            <LucideSparkles class="size-4 text-primary" aria-hidden="true" />
            {{ t("home.live.title") }}
          </h2>
          <span class="text-xs text-muted-foreground">{{ t(`sekaiRegion.labels.${region}`) }}</span>
        </div>

    <!-- Loading -->
    <Skeleton v-if="state === 'checking' || state === 'loading'" class="min-h-60 w-full flex-1 rounded-2xl sm:min-h-72 lg:min-h-84" />

    <!-- The game data has never been loaded on this device -->
    <div
      v-else-if="state === 'needs-opt-in'"
      class="home-live-invite relative isolate flex min-h-52 flex-1 flex-col items-start justify-center gap-3 overflow-hidden rounded-2xl border p-5 sm:p-7"
      data-testid="home-live-opt-in"
    >
      <div>
        <p class="text-base font-semibold">{{ t("home.live.optInTitle") }}</p>
        <p class="mt-1 max-w-md text-sm text-muted-foreground">{{ t("home.live.optInHint") }}</p>
      </div>
      <Button size="sm" @click="$emit('load')">{{ t("home.live.load") }}</Button>
    </div>

    <p
      v-else-if="state === 'empty' || state === 'error' || !liveEvent"
      class="flex min-h-32 flex-1 items-center rounded-2xl border bg-card p-5 text-sm text-muted-foreground"
    >
      {{ state === "error" ? t("home.live.error") : t("home.live.none") }}
    </p>

        <!-- Featured event: its key visual fills the panel -->
        <article
          v-else
          class="relative isolate flex min-h-60 flex-1 flex-col justify-end overflow-hidden rounded-2xl bg-slate-900 text-white shadow-sm sm:min-h-72 lg:min-h-84"
          data-testid="home-live-event"
          :data-phase="liveEvent.phase"
        >
          <div class="absolute inset-0 -z-10" aria-hidden="true">
            <FallbackImage
              v-if="liveEvent.previewUrl"
              :candidates="[liveEvent.previewUrl]"
              alt=""
              img-class="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
            />
            <img
              v-if="liveEvent.backgroundUrl && !artworkFailed"
              :src="liveEvent.backgroundUrl"
              alt=""
              decoding="async"
              fetchpriority="high"
              :class="[
                'absolute inset-0 h-full w-full object-cover object-[62%_22%] transition-opacity duration-700',
                artworkLoaded ? 'opacity-100' : 'opacity-0',
              ]"
              @load="artworkLoaded = true"
              @error="artworkFailed = true"
            >
            <div class="absolute inset-0 bg-[linear-gradient(to_top_right,rgb(8_12_24/0.86)_0%,rgb(8_12_24/0.5)_34%,rgb(8_12_24/0.06)_66%,transparent_100%)]" />
          </div>

          <div class="absolute inset-x-3 top-3 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
            <p class="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-full bg-black/45 px-3 py-1 text-xs font-medium backdrop-blur-md">
              <span class="inline-flex items-center gap-1.5">
                <span
                  :class="['size-1.5 rounded-full', liveEvent.phase === 'running' ? 'bg-emerald-400' : liveEvent.phase === 'upcoming' ? 'bg-amber-300' : 'bg-white/60']"
                  aria-hidden="true"
                />
                {{ phaseLabel }}
              </span>
              <span v-if="liveEvent.timeLabel" class="text-white/85">{{ liveEvent.timeLabel }}</span>
              <span v-else-if="liveEvent.nextLabel" class="text-white/85">{{ liveEvent.nextLabel }}</span>
            </p>
            <!-- Not the themed badge: its tint is unreadable over artwork. -->
            <p v-if="eventTypeLabel" class="shrink-0 rounded-full bg-black/45 px-3 py-1 text-xs font-medium backdrop-blur-md">
              {{ eventTypeLabel }}
            </p>
          </div>

          <div class="flex flex-col gap-3 p-4 pt-16 sm:p-6 sm:pt-20 md:flex-row md:items-end md:justify-between">
            <div class="min-w-0">
              <RouterLink
                :to="`/events/${liveEvent.event.id}`"
                class="relative block h-20 w-44 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white sm:h-28 sm:w-60"
                :aria-label="liveEvent.event.name"
              >
                <EventBannerImage
                  class="object-left-bottom drop-shadow-[0_2px_10px_rgb(0_0_0/0.55)]"
                  :region="region"
                  :assetbundle-name="liveEvent.event.assetbundleName"
                  alt=""
                  :preference="assetEndpoint"
                  variant="logo"
                  eager
                />
              </RouterLink>
              <p class="mt-1.5 line-clamp-1 text-sm font-medium text-white/90 [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]">
                {{ liveEvent.event.name }}
              </p>
              <RouterLink
                :to="`/events/${liveEvent.event.id}`"
                class="mt-3 inline-flex h-9 items-center gap-1 rounded-full border border-white/30 bg-white/15 pl-4 pr-2.5 text-sm font-semibold backdrop-blur-md outline-none transition-colors hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/70 pointer-coarse:h-10"
              >
                {{ t("home.live.eventDetail") }}
                <LucideChevronRight class="size-4" />
              </RouterLink>
            </div>

            <!-- The event's cards -->
            <ul v-if="cards.length" class="flex shrink-0 items-end gap-1.5" :aria-label="t('home.live.eventCards')">
              <li v-for="card in cards" :key="card.id" class="w-12 sm:w-14">
                <RouterLink
                  :to="`/cards/${card.id}`"
                  class="block rounded-md shadow-[0_4px_14px_rgb(0_0_0/0.45)] outline-none focus-visible:ring-2 focus-visible:ring-white"
                  :title="card.title"
                >
                  <SekaiCardThumbnail :thumbnail="card.thumbnail" :title="card.title" />
                </RouterLink>
              </li>
            </ul>
          </div>
        </article>

      </div>

      <div v-if="$slots.aside" class="flex min-w-0 flex-col">
        <slot name="aside" />
      </div>
    </div>

    <!-- Filmstrip: the limited gachas that are open, then the newest songs. -->
    <div
      v-if="state === 'ready' && (gachas.length > 0 || songs.length > 0)"
      class="flex flex-col gap-x-8 gap-y-4 lg:flex-row"
    >
      <div v-if="gachas.length" class="min-w-0 lg:shrink-0" data-testid="home-live-gachas">
        <h3 class="mb-2 px-0.5 text-xs font-semibold text-muted-foreground">{{ t("home.live.gachas") }}</h3>
        <ul class="-my-1 flex gap-3 overflow-x-auto px-0.5 py-1">
          <li v-for="gacha in gachas" :key="gacha.id" class="shrink-0">
            <RouterLink
              :to="`/gachas/${gacha.id}`"
              class="relative block aspect-[488/208] h-24 overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-black/5 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-26 dark:ring-white/10"
              :title="gacha.name"
            >
              <FallbackImage :candidates="gacha.images" :alt="gacha.name" img-class="h-full w-full object-cover" />
              <span class="absolute bottom-1.5 left-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                {{ gacha.timeLabel }}
              </span>
            </RouterLink>
          </li>
        </ul>
      </div>

      <div v-if="songs.length" class="min-w-0 flex-1" data-testid="home-live-songs">
        <h3 class="mb-2 px-0.5 text-xs font-semibold text-muted-foreground">{{ t("home.live.newSongs") }}</h3>
        <ul class="-my-1 flex gap-3.5 overflow-x-auto px-0.5 py-1">
          <li v-for="song in songs" :key="song.id" class="w-18 shrink-0 sm:w-20">
            <RouterLink :to="`/music/${song.id}`" class="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span class="block aspect-square overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                <FallbackImage :candidates="song.jacket" alt="" img-class="h-full w-full object-cover" />
              </span>
              <span class="mt-1.5 block truncate text-xs font-medium group-hover:text-primary">{{ song.title }}</span>
              <span class="block text-[11px] text-muted-foreground">{{ songDate(song.publishedAt) }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
