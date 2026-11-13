<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideCalendarClock, LucideExpand } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { isCatalogPlaceholderDate, type CatalogStatus } from "@/shared/components/catalog/types"
import CatalogStatusBadge from "@/shared/components/catalog/CatalogStatusBadge.vue"
import GachaTypeBadge from "@/modules/gachas/components/GachaTypeBadge.vue"
import CatalogCountdown from "@/shared/components/catalog/CatalogCountdown.vue"
import CatalogTimeZoneHint from "@/shared/components/catalog/CatalogTimeZoneHint.vue"
import CatalogZonedTime from "@/shared/components/catalog/CatalogZonedTime.vue"
import ImageLightbox, { type ImageLightboxItem } from "@/shared/components/ImageLightbox.vue"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"

/**
 * The gacha page's header: the banner (opening the viewer with Banner / Logo)
 * beside what the gacha is — name, type, status — and when it runs, with the
 * countdown. The footer slot runs across the full width (its PICK UP members
 * and the events it came with).
 */
const props = withDefaults(defineProps<{
  name: string
  gachaId: number
  gachaType: string
  unreleased?: boolean
  heroSources: readonly string[]
  bannerSources: readonly string[]
  logoSources: readonly string[]
  startAt: number | null
  endAt: number | null
  status: CatalogStatus | null
  /** The server the gacha belongs to; its zone is shown next to local times. */
  region: SekaiRegion
  blur?: boolean
}>(), {
  unreleased: false,
  blur: false,
})

const { t } = useI18n()

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

const lightboxItems = computed<ImageLightboxItem[]>(() => [
  { label: t("gachaCatalog.detail.lightbox.banner"), sources: props.bannerSources, alt: props.name },
  { label: t("gachaCatalog.detail.lightbox.logo"), sources: props.logoSources, alt: props.name },
])

/** Permanent pools (end in 2099, whatever the status): no end date or countdown, "permanent" as the end instead. */
const permanent = computed(() => isCatalogPlaceholderDate(props.endAt, Date.now()))
/** An undecided start (2099 sentinel on unreleased pools): "TBD", and nothing to count down to. */
const startUndecided = computed(() => isCatalogPlaceholderDate(props.startAt, Date.now()))

const countdownTarget = computed(() => {
  if (props.status === "upcoming") {
    return startUndecided.value ? null : props.startAt
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
  <header class="overflow-hidden rounded-2xl border bg-card shadow-xs" data-slot="gacha-hero" data-testid="gacha-detail-hero">
    <div class="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <button
        type="button"
        :class="[
          'group relative block aspect-[2/1] w-full overflow-hidden bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 lg:aspect-auto lg:min-h-64',
          blur ? 'cursor-default' : 'cursor-pointer',
        ]"
        :aria-label="t('catalog.detail.zoom')"
        :disabled="blur"
        @click="openLightbox"
      >
        <SekaiAssetImage :sources="heroSources" :alt="name" fit="contain" :blur="blur" eager />
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
            <h1 class="min-w-0 text-2xl leading-tight font-bold">{{ name }}</h1>
            <span class="font-mono text-sm text-muted-foreground">#{{ gachaId }}</span>
          </div>
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <span
              v-if="unreleased"
              class="rounded bg-red-600 px-1.5 py-0.5 text-xs leading-none font-semibold text-white shadow-sm"
            >
              {{ t("sekaiUnreleased.badge") }}
            </span>
            <GachaTypeBadge :gacha-type="gachaType" />
            <CatalogStatusBadge v-if="status" :status="status" />
          </div>
        </div>

        <div class="flex flex-col gap-3" data-testid="gacha-period">
          <div class="flex items-center justify-between gap-2">
            <p class="flex items-center gap-1.5 text-sm font-medium">
              <LucideCalendarClock class="size-4 text-muted-foreground" aria-hidden="true" />
              {{ t("gachaCatalog.detail.period") }}
            </p>
            <CatalogTimeZoneHint :region="region" switchable />
          </div>
          <CatalogCountdown
            v-if="countdownTarget != null"
            :target-ms="countdownTarget"
            :label="countdownLabel"
            :start-ms="status === 'ongoing' ? startAt : null"
          />
          <dl class="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-2 text-sm tabular-nums">
            <dt class="text-muted-foreground">{{ t("gachaCatalog.detail.startAt") }}</dt>
            <dd>
              <span v-if="startUndecided">{{ t("catalog.status.tbd") }}</span>
              <CatalogZonedTime v-else :value="startAt" :region="region" :fallback="t('gachas.common.dateFallback')" />
            </dd>
            <dt class="text-muted-foreground">{{ t("gachaCatalog.detail.endAt") }}</dt>
            <dd>
              <span v-if="permanent">{{ t("catalog.status.permanent") }}</span>
              <CatalogZonedTime v-else :value="endAt" :region="region" :fallback="t('gachas.common.dateFallback')" />
            </dd>
          </dl>
        </div>
      </div>
    </div>

    <div v-if="$slots.footer" class="flex flex-col gap-4 border-t px-4 py-3.5 sm:px-5" data-testid="gacha-hero-footer">
      <slot name="footer" />
    </div>

    <ImageLightbox v-model:open="lightboxOpen" v-model:index="lightboxIndex" :items="lightboxItems" :title="name" />
  </header>
</template>
