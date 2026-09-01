<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideCalendarDays, LucideZoomIn } from "lucide-vue-next"
import { formatLocalizedDateTime } from "@/lib/date-time"
import type { CatalogStatus } from "@/shared/components/catalog/types"
import CatalogCountdown from "@/shared/components/catalog/CatalogCountdown.vue"
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
  blur?: boolean
}>(), {
  blur: false,
})

const { t } = useI18n()

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

const lightboxItems = computed<ImageLightboxItem[]>(() => [
  { label: t("gachaCatalog.detail.lightbox.banner"), sources: props.bannerSources, alt: props.name },
  { label: t("gachaCatalog.detail.lightbox.logo"), sources: props.logoSources, alt: props.name },
])

const countdownTarget = computed(() => {
  if (props.status === "upcoming") {
    return props.startAt
  }
  if (props.status === "ongoing") {
    return props.endAt
  }
  return null
})

const countdownLabel = computed(() => (props.status === "upcoming"
  ? t("catalog.countdown.toStart")
  : t("catalog.countdown.toEnd")))

function formatDate(value: number | null): string {
  return formatLocalizedDateTime(value, undefined, t("gachas.common.dateFallback"))
}

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
      class="group relative mx-auto aspect-[2/1] w-full max-w-3xl overflow-hidden rounded-lg bg-muted ring-1 ring-border outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
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

    <div class="flex flex-col gap-2 rounded-md border bg-card px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <p class="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums">
        <LucideCalendarDays class="size-4 shrink-0" aria-hidden="true" />
        <span>{{ formatDate(startAt) }} – {{ formatDate(endAt) }}</span>
      </p>
      <CatalogCountdown
        v-if="countdownTarget != null"
        :target-ms="countdownTarget"
        :label="countdownLabel"
        :start-ms="status === 'ongoing' ? startAt : null"
        class="sm:min-w-64"
      />
    </div>

    <ImageLightbox v-model:open="lightboxOpen" v-model:index="lightboxIndex" :items="lightboxItems" :title="name" />
  </div>
</template>
