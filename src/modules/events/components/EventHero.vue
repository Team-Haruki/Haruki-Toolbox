<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideExpand } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import CatalogStatusBadge from "@/shared/components/catalog/CatalogStatusBadge.vue"
import type { CatalogStatus } from "@/shared/components/catalog/types"
import ImageLightbox, { type ImageLightboxItem } from "@/shared/components/ImageLightbox.vue"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import SekaiUnitLogo from "@/shared/components/SekaiUnitLogo.vue"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import EventTypeBadge from "@/modules/events/components/EventTypeBadge.vue"
import { resolveEventBackgroundUrl, resolveEventBannerUrl, resolveEventLogoUrl } from "@/modules/events/lib/event-assets"
import type { SekaiEventItem } from "@/modules/events/lib/event-filter"

/**
 * The event page's header: the key visual with the logo on it (opening the
 * viewer with Background / Logo / Banner) beside what the event is — name,
 * type, status, unit — and, through the default slot, its dates. The footer
 * slot runs across the full width (the gachas that came with the event).
 */
const props = withDefaults(defineProps<{
  event: SekaiEventItem
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  status: CatalogStatus | null
  unreleased?: boolean
  blur?: boolean
}>(), {
  unreleased: false,
  blur: false,
})

const { t } = useI18n()

const bannerUrl = computed(() => resolveEventBannerUrl(props.region, props.event.assetbundleName, props.assetEndpoint))
const logoUrl = computed(() => resolveEventLogoUrl(props.region, props.event.assetbundleName, props.assetEndpoint))
const backgroundUrl = computed(() => resolveEventBackgroundUrl(props.region, props.event.assetbundleName, props.assetEndpoint))

const backgroundFailed = ref(false)

// Without a key visual (old or test events) the banner stands in for it.
const lightboxItems = computed<ImageLightboxItem[]>(() => [
  ...(backgroundFailed.value || !backgroundUrl.value
    ? []
    : [{ label: t("eventCatalog.hero.background"), sources: [backgroundUrl.value], alt: props.event.name }]),
  { label: t("eventCatalog.hero.logo"), sources: [logoUrl.value], alt: props.event.name },
  { label: t("eventCatalog.hero.banner"), sources: [bannerUrl.value], alt: props.event.name },
])

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

function openLightbox() {
  if (props.blur) {
    return
  }
  lightboxIndex.value = 0
  lightboxOpen.value = true
}
</script>

<template>
  <header class="overflow-hidden rounded-2xl border bg-card shadow-xs" data-slot="event-hero" data-testid="event-detail-hero">
    <div class="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <!-- The key visual's own proportions (2048 × 1261), with the logo on a scrim. -->
      <button
        type="button"
        :class="[
          'group relative block aspect-[2048/1261] w-full overflow-hidden bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50',
          blur ? 'cursor-default' : 'cursor-pointer',
        ]"
        :aria-label="t('catalog.detail.zoom')"
        :disabled="blur"
        @click="openLightbox"
      >
        <template v-if="backgroundUrl && !backgroundFailed">
          <SekaiAssetImage
            :sources="[backgroundUrl]"
            :alt="event.name"
            fit="cover"
            eager
            :blur="blur"
            @exhausted="backgroundFailed = true"
          />
          <span class="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 to-transparent" aria-hidden="true" />
          <span class="pointer-events-none absolute bottom-3 left-3 h-1/3 w-1/2 max-w-72 sm:bottom-4 sm:left-4" aria-hidden="true">
            <SekaiAssetImage
              :sources="[logoUrl]"
              alt=""
              fit="contain"
              :blur="blur"
              img-class="object-left-bottom drop-shadow-[0_2px_10px_rgb(0_0_0/0.55)]"
              placeholder-class="hidden"
              :shimmer="false"
            />
          </span>
        </template>
        <span v-else class="absolute inset-0 p-6 sm:p-10">
          <span class="relative block size-full">
            <SekaiAssetImage :sources="[bannerUrl, logoUrl]" :alt="event.name" fit="contain" eager :blur="blur" />
          </span>
        </span>
        <span
          v-if="!blur"
          class="pointer-events-none absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 pointer-coarse:opacity-100"
          aria-hidden="true"
        >
          <LucideExpand class="size-3.5" />
          {{ t("catalog.detail.zoom") }}
        </span>
      </button>

      <div class="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
        <div class="flex flex-col gap-2">
          <div class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <h1 class="min-w-0 text-2xl leading-tight font-bold">{{ event.name }}</h1>
            <span class="font-mono text-sm text-muted-foreground">#{{ event.id }}</span>
          </div>
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span
              v-if="unreleased"
              class="rounded bg-red-600 px-1.5 py-0.5 text-xs leading-none font-semibold text-white shadow-sm"
            >
              {{ t("sekaiUnreleased.badge") }}
            </span>
            <EventTypeBadge :event-type="event.eventType" />
            <CatalogStatusBadge v-if="status" :status="status" />
            <SekaiUnitLogo v-if="event.unit" :unit="event.unit" size="sm" show-label class="text-xs text-muted-foreground" />
          </div>
        </div>

        <slot />
      </div>
    </div>

    <div v-if="$slots.footer" class="border-t px-4 py-3.5 sm:px-5" data-testid="event-hero-footer">
      <slot name="footer" />
    </div>

    <ImageLightbox v-model:open="lightboxOpen" v-model:index="lightboxIndex" :items="lightboxItems" :title="event.name" />
  </header>
</template>
