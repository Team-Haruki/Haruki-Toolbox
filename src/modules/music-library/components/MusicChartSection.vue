<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { ScrollText } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { resolveMusicLongAudioUrl } from "@/modules/music-library/lib/music-assets"
import type { MusicLibraryEntry, MusicVocalEntry } from "@/modules/music-library/lib/music-data"
import { resolvePreferredChartVocal } from "@/modules/music-library/lib/music-player"
import ChartPreview from "./ChartPreview.vue"

/** Chart preview section; the dynamic preview plays the SEKAI vocal (or any) as its backing track. */
const props = defineProps<{
  entry: MusicLibraryEntry
  region: SekaiRegion
  preference: SekaiAssetEndpointPreference
  jacketUrl: string | null
  vocals: readonly MusicVocalEntry[]
}>()

const { t } = useI18n()

const audioUrl = computed(() => {
  const vocal = resolvePreferredChartVocal(props.vocals)
  return vocal ? resolveMusicLongAudioUrl(props.region, vocal.assetbundleName, props.preference) : null
})
</script>

<template>
  <CatalogDetailSection :title="t('musicLibrary.detail.chartPreview.title')" :icon="ScrollText">
    <ChartPreview
      :entry="entry"
      :region="region"
      :preference="preference"
      :jacket-url="jacketUrl"
      :audio-url="audioUrl"
    />
  </CatalogDetailSection>
</template>
