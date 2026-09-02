<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideZoomIn } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import ImageLightbox, { type ImageLightboxItem } from "@/shared/components/ImageLightbox.vue"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { resolveEventBackgroundUrl, resolveEventBannerUrl, resolveEventLogoUrl } from "@/modules/events/lib/event-assets"
import type { SekaiEventItem } from "@/modules/events/lib/event-filter"

/**
 * Detail hero: the story banner on a dimmed event background. Clicking
 * opens the lightbox with Banner / Logo / Background tabs.
 */
const props = withDefaults(defineProps<{
  event: SekaiEventItem
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  blur?: boolean
  /** Column layout — banner over the thumbnails — for a narrow sidebar. */
  stacked?: boolean
}>(), {
  blur: false,
  stacked: false,
})

const { t } = useI18n()

const bannerUrl = computed(() => resolveEventBannerUrl(props.region, props.event.assetbundleName, props.assetEndpoint))
const logoUrl = computed(() => resolveEventLogoUrl(props.region, props.event.assetbundleName, props.assetEndpoint))
const backgroundUrl = computed(() => resolveEventBackgroundUrl(props.region, props.event.assetbundleName, props.assetEndpoint))

const backgroundFailed = ref(false)

const lightboxItems = computed<ImageLightboxItem[]>(() => [
  { label: t("eventCatalog.hero.banner"), sources: [bannerUrl.value], alt: props.event.name },
  { label: t("eventCatalog.hero.logo"), sources: [logoUrl.value], alt: props.event.name },
  { label: t("eventCatalog.hero.background"), sources: [backgroundUrl.value], alt: props.event.name },
])

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

function openLightbox(index: number) {
  lightboxIndex.value = index
  lightboxOpen.value = true
}
</script>

<template>
  <div class="relative overflow-hidden rounded-xl border bg-card shadow-sm" data-slot="event-hero">
    <div v-if="backgroundUrl && !backgroundFailed" class="absolute inset-0" aria-hidden="true">
      <SekaiAssetImage
        :sources="[backgroundUrl]"
        alt=""
        fit="cover"
        :blur="blur"
        img-class="opacity-30 dark:opacity-20"
        placeholder-class="hidden"
        @exhausted="backgroundFailed = true"
      />
    </div>
    <div class="absolute inset-0 bg-gradient-to-r from-background/85 to-background/40" aria-hidden="true" />
    <div :class="['relative flex flex-col items-center gap-3 p-4', stacked ? '' : 'sm:flex-row sm:p-5']">
      <button
        type="button"
        :class="[
          'group relative aspect-[2/1] w-full shrink-0 overflow-hidden rounded-lg bg-muted/60 shadow-sm ring-1 ring-border focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
          stacked ? '' : 'max-w-sm sm:w-72',
        ]"
        :title="t('catalog.detail.zoom')"
        :aria-label="t('catalog.detail.zoom')"
        @click="openLightbox(0)"
      >
        <SekaiAssetImage
          :sources="[bannerUrl, logoUrl]"
          :alt="event.name"
          fit="contain"
          eager
          :blur="blur"
        />
        <span class="pointer-events-none absolute right-1.5 bottom-1.5 rounded-full bg-background/80 p-1 text-muted-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <LucideZoomIn class="size-4" aria-hidden="true" />
        </span>
      </button>
      <div :class="['flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2', stacked ? '' : 'sm:justify-start']">
        <button
          type="button"
          class="relative h-16 w-28 overflow-hidden rounded-md bg-muted/40 ring-1 ring-border transition-colors hover:bg-muted/70 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          :title="t('eventCatalog.hero.logo')"
          :aria-label="t('eventCatalog.hero.logo')"
          @click="openLightbox(1)"
        >
          <SekaiAssetImage :sources="[logoUrl]" :alt="t('eventCatalog.hero.logo')" fit="contain" :blur="blur" />
        </button>
        <button
          v-if="backgroundUrl"
          type="button"
          class="relative h-16 w-28 overflow-hidden rounded-md bg-muted/40 ring-1 ring-border transition-colors hover:bg-muted/70 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          :title="t('eventCatalog.hero.background')"
          :aria-label="t('eventCatalog.hero.background')"
          @click="openLightbox(2)"
        >
          <SekaiAssetImage :sources="[backgroundUrl]" :alt="t('eventCatalog.hero.background')" fit="cover" :blur="blur" />
        </button>
      </div>
    </div>
    <ImageLightbox v-model:open="lightboxOpen" v-model:index="lightboxIndex" :items="lightboxItems" :title="event.name" />
  </div>
</template>
