<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import CatalogDetailShell from "@/shared/components/catalog/CatalogDetailShell.vue"
import ImageLightbox from "@/shared/components/ImageLightbox.vue"
import type { ImageLightboxItem } from "@/shared/components/ImageLightbox.vue"
import { useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { resolveSekaiMusicCategoryLabel, resolveSekaiMusicTagLabel } from "@/shared/sekai/labels"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import { useSettingsStore } from "@/shared/stores/settings"
import MusicChartSection from "@/modules/music-library/components/MusicChartSection.vue"
import MusicDifficultiesSection from "@/modules/music-library/components/MusicDifficultiesSection.vue"
import MusicEventsSection from "@/modules/music-library/components/MusicEventsSection.vue"
import MusicInfoSection from "@/modules/music-library/components/MusicInfoSection.vue"
import MusicJacket from "@/modules/music-library/components/MusicJacket.vue"
import MusicOriginalSection from "@/modules/music-library/components/MusicOriginalSection.vue"
import MusicUnlockSection from "@/modules/music-library/components/MusicUnlockSection.vue"
import MusicVocalPlayer from "@/modules/music-library/components/MusicVocalPlayer.vue"
import { useMusicAliases } from "@/modules/music-library/composables/useMusicAliases"
import { useMusicBpm } from "@/modules/music-library/composables/useMusicBpm"
import { useMusicCatalogDetail } from "@/modules/music-library/composables/useMusicCatalogDetail"
import { useMusicDateFormatter } from "@/modules/music-library/composables/useMusicDateFormatter"
import { resolveMusicJacketUrl } from "@/modules/music-library/lib/music-assets"
import { isMusicEntryUnreleased } from "@/modules/music-library/lib/music-filter"
import { formatMusicDate } from "@/modules/music-library/lib/music-view"

const props = defineProps<{
  musicId: string
}>()

const { t, te } = useI18n()
const settingsStore = useSettingsStore()
const { region } = useEffectiveCatalogRegion()
const { blurUnreleased } = useUnreleasedContentDisplay()
const preference = computed(() => settingsStore.currentAssetEndpoint)

const musicId = computed(() => {
  const parsed = Number(props.musicId)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
})

const {
  entry,
  vocals,
  characterMap,
  outsideCharacterNames,
  relatedEvents,
  releaseCondition,
  originalLink,
  durationSeconds,
  loading,
  refreshing,
  error,
  notFound,
  vocalsLoading,
  eventsLoading,
  reload,
} = useMusicCatalogDetail(region, musicId)
const { bpmLabel } = useMusicBpm(entry, region, preference)
const aliases = useMusicAliases(musicId)
const dateFormatter = useMusicDateFormatter()

const unreleased = computed(() => entry.value != null && isMusicEntryUnreleased(entry.value))
const blurred = computed(() => unreleased.value && blurUnreleased.value)
const jacketUrl = computed(() => (
  entry.value ? resolveMusicJacketUrl(region.value, entry.value.assetbundleName, preference.value) : null
))
const dateLabel = computed(() => formatMusicDate(entry.value?.publishedAt ?? null, dateFormatter.value))

const tagBadges = computed(() => (entry.value?.tags ?? []).map((tag) => ({
  key: `tag:${tag}`,
  label: resolveSekaiMusicTagLabel({ t, te }, tag),
})))
const categoryBadges = computed(() => (entry.value?.categories ?? []).map((category) => ({
  key: `category:${category}`,
  label: resolveSekaiMusicCategoryLabel({ t, te }, category),
})))

const lightboxOpen = ref(false)
const lightboxItems = computed<ImageLightboxItem[]>(() => [
  { label: t("musicCatalog.detail.jacket"), sources: [jacketUrl.value], alt: entry.value?.title ?? "" },
])
</script>

<template>
  <CatalogDetailShell
    :title="entry?.title ?? null"
    :entity-id="musicId"
    :list-title="t('musicLibrary.list.title')"
    list-route="/music"
    :loading="loading"
    :error="error"
    :not-found="notFound"
    :not-found-message="t('musicLibrary.detail.notFound')"
    :retrying="refreshing"
    :unreleased="unreleased"
    class="py-4"
    @retry="reload"
  >
    <template #badges>
      <Badge v-for="badge in tagBadges" :key="badge.key" variant="muted">{{ badge.label }}</Badge>
      <Badge v-for="badge in categoryBadges" :key="badge.key" variant="default">{{ badge.label }}</Badge>
    </template>

    <template #skeleton>
      <div class="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <div class="flex flex-col gap-4">
          <Skeleton class="mx-auto aspect-square w-full max-w-80 rounded-lg" />
          <Skeleton class="h-72 w-full rounded-xl" />
        </div>
        <div class="flex flex-col gap-4">
          <Skeleton class="h-36 w-full rounded-xl" />
          <Skeleton class="h-56 w-full rounded-xl" />
        </div>
      </div>
    </template>

    <template v-if="entry">
      <!-- Sidebar + main, not paired cards: every section here has a height
           the data decides (six or five difficulties, one or ten vocals, any
           number of events, seventy aliases), so two columns of matched pairs
           always left one side short. The sidebar holds what the song *is*,
           the main column stacks what it *has*, and neither has to line up. -->
      <div class="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <div class="flex min-w-0 flex-col gap-4">
          <button
            type="button"
            class="relative mx-auto aspect-square w-full max-w-80 overflow-hidden rounded-lg shadow-sm transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default disabled:hover:opacity-100"
            :title="t('catalog.detail.zoom')"
            :aria-label="t('catalog.detail.zoom')"
            :disabled="blurred || jacketUrl == null"
            @click="lightboxOpen = true"
          >
            <MusicJacket :url="jacketUrl" :alt="entry.title" class="size-full" :blur="blurred" eager />
          </button>
          <MusicInfoSection
            :entry="entry"
            :date-label="dateLabel"
            :duration-seconds="durationSeconds"
            :bpm-label="bpmLabel"
            :aliases="aliases"
          />
        </div>

        <div class="flex min-w-0 flex-col gap-4">
          <MusicDifficultiesSection :entry="entry" />

          <MusicVocalPlayer
            :music-id="musicId"
            :region="region"
            :preference="preference"
            :filler-sec="entry.fillerSec"
            :vocals="vocals"
            :character-map="characterMap"
            :outside-character-names="outsideCharacterNames"
            :loading="vocalsLoading"
          />

          <MusicEventsSection
            :events="relatedEvents"
            :region="region"
            :preference="preference"
            :character-map="characterMap"
            :loading="eventsLoading"
          />

          <MusicUnlockSection v-if="releaseCondition" :condition="releaseCondition" />

          <MusicOriginalSection v-if="originalLink" :link="originalLink" />
        </div>
      </div>

      <!-- Last and full width: the score and its transport want the whole
           row, and it is the one section a reader scrolls to on purpose. It is
           already self-contained, so moving it to its own route later (custom
           charts) is a matter of mounting it elsewhere. -->
      <MusicChartSection
        :entry="entry"
        :region="region"
        :preference="preference"
        :jacket-url="jacketUrl"
        :vocals="vocals"
      />

      <ImageLightbox v-model:open="lightboxOpen" :items="lightboxItems" :title="entry.title" />
    </template>
  </CatalogDetailShell>
</template>
