<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideCalendarDays, LucideInfinity, LucideZoomIn } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { isCatalogPermanentEnd, type CatalogStatus } from "@/shared/components/catalog/types"
import CatalogCountdown from "@/shared/components/catalog/CatalogCountdown.vue"
import CatalogTimeZoneHint from "@/shared/components/catalog/CatalogTimeZoneHint.vue"
import CatalogZonedTime from "@/shared/components/catalog/CatalogZonedTime.vue"
import ImageLightbox, { type ImageLightboxItem } from "@/shared/components/ImageLightbox.vue"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"

/** Banner hero (click → lightbox with Banner / Logo tabs) plus the period and countdown strip. */
const props = withDefaults(defineProps<{
  name: string
  heroSources: readonly string[]
  bannerSources: readonly string[]
  logoSources: readonly string[]
  startAt: number | null
  endAt: number | null
  status: CatalogStatus | null
  /** The server the gacha belongs to; its zone is shown next to local times. */
  region: SekaiRegion
  blur?: boolean
  /** Sidebar layout: full-width banner, dates and countdown stacked. */
  stacked?: boolean
}>(), {
  blur: false,
  stacked: false,
})

const { t } = useI18n()

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

const lightboxItems = computed<ImageLightboxItem[]>(() => [
  { label: t("gachaCatalog.detail.lightbox.banner"), sources: props.bannerSources, alt: props.name },
  { label: t("gachaCatalog.detail.lightbox.logo"), sources: props.logoSources, alt: props.name },
])

/** Permanent pools (end in 2099): no countdown, a "permanent" line instead. */
const permanent = computed(() => props.status === "ongoing" && isCatalogPermanentEnd(props.endAt, Date.now()))

const countdownTarget = computed(() => {
  if (props.status === "upcoming") {
    return props.startAt
  }
  if (props.status === "ongoing" && !permanent.value) {
    return props.endAt
  }
  return null
})

const countdownLabel = computed(() => (props.status === "upcoming"
  ? t("catalog.countdown.toStart")
  : t("catalog.countdown.toEnd")))

function openLightbox() {
  if (props.blur) {
    return
  }
  lightboxIndex.value = 0
  lightboxOpen.value = true
}
</script>

<template>
  <div class="flex flex-col gap-3" data-slot="gacha-hero">
    <button
      type="button"
      :class="[
        'group relative aspect-[2/1] w-full overflow-hidden rounded-lg bg-muted ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default',
        stacked ? '' : 'mx-auto max-w-3xl',
      ]"
      :aria-label="t('catalog.detail.zoom')"
      :disabled="blur"
      @click="openLightbox"
    >
      <SekaiAssetImage :sources="heroSources" :alt="name" fit="contain" :blur="blur" eager />
      <span
        v-if="!blur"
        class="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        <LucideZoomIn class="size-3.5" aria-hidden="true" />
        {{ t("catalog.detail.zoom") }}
      </span>
    </button>

    <div :class="['flex flex-col gap-2 rounded-md border bg-card px-3 py-2.5', stacked ? '' : 'sm:flex-row sm:items-center sm:justify-between']">
      <div class="flex flex-wrap items-start gap-x-1.5 gap-y-1 text-sm text-muted-foreground tabular-nums">
        <LucideCalendarDays class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <CatalogZonedTime :value="startAt" :region="region" :fallback="t('gachas.common.dateFallback')" />
        <span aria-hidden="true">–</span>
        <span v-if="permanent">{{ t("catalog.status.permanent") }}</span>
        <CatalogZonedTime v-else :value="endAt" :region="region" :fallback="t('gachas.common.dateFallback')" />
        <CatalogTimeZoneHint :region="region" />
      </div>
      <p v-if="permanent" class="flex items-center gap-1.5 text-sm text-muted-foreground">
        <LucideInfinity class="size-4 shrink-0" aria-hidden="true" />
        {{ t("gachaCatalog.detail.permanentHint") }}
      </p>
      <CatalogCountdown
        v-if="countdownTarget != null"
        :target-ms="countdownTarget"
        :label="countdownLabel"
        :start-ms="status === 'ongoing' ? startAt : null"
        :class="stacked ? '' : 'sm:min-w-64'"
      />
    </div>

    <ImageLightbox v-model:open="lightboxOpen" v-model:index="lightboxIndex" :items="lightboxItems" :title="name" />
  </div>
</template>
