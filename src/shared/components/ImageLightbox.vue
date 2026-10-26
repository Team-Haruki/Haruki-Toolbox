<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideExternalLink, LucideLoader2, LucideZoomIn, LucideZoomOut } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"

export type ImageLightboxItem = {
  /** Tab label (Normal / Trained, Banner / Logo…). */
  label: string
  /** Ordered candidate URLs, same contract as SekaiAssetImage. */
  sources: readonly (string | null | undefined)[]
  alt?: string
}

/**
 * Full-size artwork viewer with optional item tabs.
 *
 * The image box takes the artwork's own aspect ratio (known once it loads),
 * capped by the viewport, so a wide banner on a phone is a short wide box
 * rather than a fixed-height black letterbox. Pointer devices toggle a 2×
 * zoom on click; touch devices double-tap to zoom, pinch natively, and
 * swipe sideways between items. ← / → switch items from the keyboard.
 */
const props = withDefaults(defineProps<{
  items: readonly ImageLightboxItem[]
  title?: string | null
  description?: string | null
}>(), {
  title: null,
  description: null,
})

const open = defineModel<boolean>("open", { default: false })
const index = defineModel<number>("index", { default: 0 })

const { t } = useI18n()

/** Default box ratio before the artwork reports its own (card art is 7:4). */
const DEFAULT_RATIO = 7 / 4
const TAP_MOVE_PX = 10
const TAP_MS = 300
const DOUBLE_TAP_MS = 300
const SWIPE_MIN_PX = 48
const SWIPE_MAX_MS = 600

const zoomed = ref(false)
const loadedUrl = ref<string | null>(null)
const failed = ref(false)
const ratio = ref<number | null>(null)
const viewerRef = ref<HTMLElement | null>(null)

const current = computed(() => props.items[Math.min(Math.max(0, index.value), Math.max(0, props.items.length - 1))] ?? null)

watch(open, (value) => {
  if (!value) {
    zoomed.value = false
  }
})

watch(() => current.value?.sources.join("\n"), () => {
  loadedUrl.value = null
  failed.value = false
  ratio.value = null
  zoomed.value = false
})

const openUrl = computed(() => (
  loadedUrl.value
  ?? current.value?.sources.find((url): url is string => typeof url === "string" && url !== "")
  ?? null
))

const loading = computed(() => current.value != null && loadedUrl.value == null && !failed.value)

/**
 * Unzoomed: as wide as the dialog allows, but never taller than the viewport
 * minus the header, with the width following the height cap so the box
 * hugs the artwork instead of letter-boxing it.
 */
const boxStyle = computed(() => {
  const aspect = ratio.value ?? DEFAULT_RATIO
  if (zoomed.value) {
    return { aspectRatio: String(aspect) }
  }
  return {
    aspectRatio: String(aspect),
    width: `min(100%, calc(var(--lightbox-max-h) * ${aspect}))`,
  }
})

function selectItem(value: unknown) {
  const parsed = Number(value)
  if (Number.isInteger(parsed) && parsed >= 0 && parsed < props.items.length) {
    index.value = parsed
  }
}

function step(delta: number) {
  selectItem(index.value + delta)
}

function handleLoad(url: string) {
  loadedUrl.value = url
  const image = viewerRef.value?.querySelector("img")
  if (image && image.naturalWidth > 0 && image.naturalHeight > 0) {
    ratio.value = image.naturalWidth / image.naturalHeight
  }
}

function isCoarsePointer(): boolean {
  return typeof window !== "undefined" && (window.matchMedia?.("(pointer: coarse)").matches ?? false)
}

function toggleZoom(event: MouseEvent) {
  // Touch devices double-tap (below); click-to-zoom is for pointers.
  if (isCoarsePointer()) {
    return
  }
  event.preventDefault()
  zoomed.value = !zoomed.value
}

// Touch: a quick double tap toggles the zoom; a horizontal flick (while not
// zoomed, where a drag pans instead) moves to the previous / next item.
let touchStart: { x: number; y: number; at: number } | null = null
let lastTapAt = 0

function handleTouchStart(event: TouchEvent) {
  if (event.touches.length !== 1) {
    touchStart = null
    return
  }
  const touch = event.touches[0]
  touchStart = { x: touch.clientX, y: touch.clientY, at: Date.now() }
}

function handleTouchEnd(event: TouchEvent) {
  const start = touchStart
  touchStart = null
  if (!start || event.changedTouches.length !== 1) {
    return
  }
  const touch = event.changedTouches[0]
  const dx = touch.clientX - start.x
  const dy = touch.clientY - start.y
  const elapsed = Date.now() - start.at

  if (Math.abs(dx) < TAP_MOVE_PX && Math.abs(dy) < TAP_MOVE_PX && elapsed < TAP_MS) {
    const now = Date.now()
    if (now - lastTapAt < DOUBLE_TAP_MS) {
      lastTapAt = 0
      event.preventDefault()
      zoomed.value = !zoomed.value
    } else {
      lastTapAt = now
    }
    return
  }

  if (zoomed.value || props.items.length < 2) {
    return
  }
  if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5 && elapsed < SWIPE_MAX_MS) {
    step(dx < 0 ? 1 : -1)
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (props.items.length < 2) {
    return
  }
  if (event.key === "ArrowRight") {
    event.preventDefault()
    step(1)
  } else if (event.key === "ArrowLeft") {
    event.preventDefault()
    step(-1)
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="flex max-h-[100dvh] w-[100vw] max-w-[100vw] flex-col gap-0 overflow-hidden rounded-none border-0 p-0 [--lightbox-max-h:calc(100dvh-3.5rem)] sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-[min(96vw,80rem)] sm:rounded-lg sm:border sm:p-0 sm:[--lightbox-max-h:calc(100dvh-5.5rem)]"
      @keydown="handleKeydown"
    >
      <div class="flex min-w-0 items-center gap-2 border-b py-2 pr-12 pl-3 sm:pl-4">
        <div class="min-w-0 flex-1">
          <DialogTitle class="truncate text-sm font-semibold">
            {{ title ?? current?.alt ?? current?.label ?? "" }}
          </DialogTitle>
          <DialogDescription :class="description ? 'truncate text-xs text-muted-foreground' : 'sr-only'">
            {{ description ?? t("catalog.lightbox.description") }}
          </DialogDescription>
        </div>
        <ToggleGroup
          v-if="items.length > 1"
          type="single"
          variant="segment"
          size="sm"
          :model-value="String(index)"
          :aria-label="t('catalog.lightbox.items')"
          @update:model-value="selectItem"
        >
          <ToggleGroupItem v-for="(item, itemIndex) in items" :key="itemIndex" :value="String(itemIndex)">
            {{ item.label }}
          </ToggleGroupItem>
        </ToggleGroup>
        <Button
          variant="ghost"
          size="sm"
          class="hidden h-8 gap-1 px-2 text-xs [@media(pointer:fine)]:inline-flex"
          :aria-pressed="zoomed"
          :aria-label="zoomed ? t('catalog.lightbox.zoomOut') : t('catalog.lightbox.zoomIn')"
          @click="zoomed = !zoomed"
        >
          <LucideZoomOut v-if="zoomed" class="size-4" />
          <LucideZoomIn v-else class="size-4" />
          <span class="hidden sm:inline">{{ zoomed ? t("catalog.lightbox.zoomOut") : t("catalog.lightbox.zoomIn") }}</span>
        </Button>
        <Button v-if="openUrl" as-child variant="ghost" size="sm" class="h-8 gap-1 px-2 text-xs">
          <a
            :href="openUrl"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="t('catalog.lightbox.openInNewTab')"
            :title="t('catalog.lightbox.openInNewTab')"
          >
            <LucideExternalLink class="size-4" />
            <span class="hidden sm:inline">{{ t("catalog.lightbox.openInNewTab") }}</span>
          </a>
        </Button>
      </div>
      <!-- Touch devices have no hover hint for the gestures; one quiet line says them. -->
      <p class="border-b px-3 py-1 text-[11px] text-muted-foreground [@media(pointer:fine)]:hidden">
        {{ t("catalog.lightbox.touchZoom") }}<template v-if="items.length > 1"> · {{ t("catalog.lightbox.touchSwipe") }}</template>
      </p>
      <div
        ref="viewerRef"
        :class="[
          'relative flex min-h-0 flex-1 overflow-auto bg-black/90',
          // Centering an overflowing flex child hides its start; zoomed boxes anchor top-left.
          zoomed ? 'items-start justify-start' : 'items-center justify-center',
        ]"
        :style="{ touchAction: zoomed ? 'pan-x pan-y pinch-zoom' : 'pinch-zoom' }"
        @touchstart.passive="handleTouchStart"
        @touchend="handleTouchEnd"
        @touchcancel="touchStart = null"
      >
        <div
          :class="zoomed ? 'relative w-[200%] max-w-none self-start' : 'relative mx-auto max-h-[var(--lightbox-max-h)]'"
          :style="boxStyle"
          @click="toggleZoom"
        >
          <SekaiAssetImage
            v-if="current"
            :sources="current.sources"
            :alt="current.alt ?? current.label"
            fit="contain"
            eager
            :shimmer="false"
            :img-class="zoomed ? 'cursor-zoom-out' : '[@media(pointer:fine)]:cursor-zoom-in'"
            placeholder-class="bg-transparent text-white/70"
            @load="handleLoad"
            @exhausted="failed = true"
          />
          <div
            v-if="loading"
            class="pointer-events-none absolute inset-0 flex items-center justify-center text-white/70"
            aria-hidden="true"
          >
            <LucideLoader2 class="size-8 animate-spin" />
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
