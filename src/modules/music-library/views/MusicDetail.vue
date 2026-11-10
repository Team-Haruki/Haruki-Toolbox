<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { Skeleton } from "@/components/ui/skeleton"
import CatalogDetailShell from "@/shared/components/catalog/CatalogDetailShell.vue"
import ImageLightbox from "@/shared/components/ImageLightbox.vue"
import type { ImageLightboxItem } from "@/shared/components/ImageLightbox.vue"
import { applyCatalogRegionQuery, useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { resolveSekaiMusicCategoryLabel, resolveSekaiMusicTagLabel } from "@/shared/sekai/labels"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import { useSettingsStore } from "@/shared/stores/settings"
import MusicChartSection from "@/modules/music-library/components/MusicChartSection.vue"
import MusicAliasList from "@/modules/music-library/components/MusicAliasList.vue"
import MusicDetailHero from "@/modules/music-library/components/MusicDetailHero.vue"
import MusicEventLinks from "@/modules/music-library/components/MusicEventLinks.vue"
import MusicVocalPlayer from "@/modules/music-library/components/MusicVocalPlayer.vue"
import { useMusicAliases } from "@/modules/music-library/composables/useMusicAliases"
import { useMusicBpm } from "@/modules/music-library/composables/useMusicBpm"
import { useMusicCatalogDetail } from "@/modules/music-library/composables/useMusicCatalogDetail"
import { useMusicDateFormatter } from "@/modules/music-library/composables/useMusicDateFormatter"
import { useGlobalMusicPlayer } from "@/modules/music-library/composables/useGlobalMusicPlayer"
import { useMusicPlayerTrack } from "@/modules/music-library/composables/useMusicPlayerTrack"
import { resolveMusicJacketUrl } from "@/modules/music-library/lib/music-assets"
import { isMusicEntryUnreleased } from "@/modules/music-library/lib/music-filter"
import { formatMusicDate } from "@/modules/music-library/lib/music-view"
import { pickPreferredVocal } from "@/modules/music-library/player/player-track"

const props = defineProps<{
  musicId: string
}>()

const { t, te } = useI18n()
const settingsStore = useSettingsStore()
// A shared link names its server (`?region=`): apply it before the region is read.
applyCatalogRegionQuery()
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

// The song as the site-wide player takes it; the jacket's play button and the
// vocal list both start (or switch within) this one track.
const player = useGlobalMusicPlayer()
const playerTrack = useMusicPlayerTrack(() => (entry.value
  ? {
      region: region.value,
      preference: preference.value,
      entry: entry.value,
      vocals: vocals.value,
      characterMap: characterMap.value,
      outsideCharacterNames: outsideCharacterNames.value,
    }
  : null))
const songPlaying = computed(() => player.isCurrent(playerTrack.value) && player.playing.value)

function toggleSong() {
  const track = playerTrack.value
  if (!track) {
    return
  }
  if (player.isCurrent(track)) {
    player.toggle()
    return
  }
  player.play(track, pickPreferredVocal(track, settingsStore.preferredVocalType).id)
}

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
    :not-found-message="t('musicLibrary.detail.notFound', { musicId: props.musicId })"
    :retrying="refreshing"
    :unreleased="unreleased"
    class="py-4"
    @retry="reload"
  >
    <template #skeleton>
      <Skeleton class="h-64 w-full rounded-2xl" />
      <Skeleton class="h-56 w-full rounded-xl" />
    </template>

    <!-- The header block carries the title, so the shell's own heading is replaced. -->
    <template v-if="entry" #heading>
      <MusicDetailHero
        :entry="entry"
        :jacket-url="jacketUrl"
        :blurred="blurred"
        :unreleased="unreleased"
        :tags="tagBadges"
        :categories="categoryBadges"
        :date-label="dateLabel"
        :duration-seconds="durationSeconds"
        :bpm-label="bpmLabel"
        :unlock-sentence="releaseCondition?.sentence || null"
        :original-link="originalLink"
        :playable="playerTrack != null"
        :playing="songPlaying"
        @zoom="lightboxOpen = true"
        @toggle-play="toggleSong"
      >
        <MusicEventLinks
          :events="relatedEvents"
          :region="region"
          :preference="preference"
          :character-map="characterMap"
        />
        <MusicAliasList :music-id="entry.id" :aliases="aliases" />
      </MusicDetailHero>
    </template>

    <template v-if="entry">
      <!-- Under the header: who sings it. -->
      <MusicVocalPlayer
        :track="playerTrack"
        :vocals="vocals"
        :character-map="characterMap"
        :outside-character-names="outsideCharacterNames"
        :loading="vocalsLoading"
      />

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
