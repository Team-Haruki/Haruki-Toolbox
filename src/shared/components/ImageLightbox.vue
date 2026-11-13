<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, useTemplateRef, watch } from "vue"
import { useElementSize, useEventListener, useScrollLock } from "@vueuse/core"
import { useI18n } from "vue-i18n"
import { LucideExternalLink, LucideLoader2, LucideTriangleAlert, LucideX, LucideZoomIn, LucideZoomOut } from "lucide-vue-next"
import {
  EMPTY_IMAGE_EDIT_HISTORY,
  IMAGE_ZOOM_STEP,
  MAX_IMAGE_ZOOM,
  MIN_IMAGE_ZOOM,
  canRedoImageEdit,
  canUndoImageEdit,
  fitImageSize,
  formatImageZoom,
  initialCropRect,
  loadImageSource,
  pushImageEdit,
  redoImageEdit,
  resetImageEdit,
  resolveImageFileName,
  saveBlob,
  undoImageEdit,
  type ImageEditHistory,
  type ImageEditOp,
  type ImageRect,
} from "image-edit-kit"
import { initialMaskRect, resolveHistoryShortcut, type ImageLightboxMode } from "@/lib/image-lightbox"
import { useImageEditCanvas } from "./image-lightbox/composables/useImageEditCanvas"
import { useImageStageView } from "./image-lightbox/composables/useImageStageView"
import LightboxAdjustMode from "./image-lightbox/LightboxAdjustMode.vue"
import LightboxCropMode from "./image-lightbox/LightboxCropMode.vue"
import LightboxDrawMode from "./image-lightbox/LightboxDrawMode.vue"
import LightboxExportMode from "./image-lightbox/LightboxExportMode.vue"
import LightboxMainToolbar from "./image-lightbox/LightboxMainToolbar.vue"
import LightboxMaskMode from "./image-lightbox/LightboxMaskMode.vue"
import LightboxModeShell from "./image-lightbox/LightboxModeShell.vue"
import LightboxRegionOverlay from "./image-lightbox/LightboxRegionOverlay.vue"
import LightboxStraightenMode from "./image-lightbox/LightboxStraightenMode.vue"
import LightboxTextMode from "./image-lightbox/LightboxTextMode.vue"
import LightboxToolButton from "./image-lightbox/LightboxToolButton.vue"

export type ImageLightboxItem = {
  /** Tab label (Normal / Trained, Banner / Logo…). */
  label: string
  /** Ordered candidate URLs, same contract as SekaiAssetImage. */
  sources: readonly (string | null | undefined)[]
  alt?: string
}

/**
 * Full-screen image viewer and light editor. It is its own layer over the
 * page, not a framed dialog: the picture fills the screen, with the item tabs
 * and close button on top and one bar of tools below. The picture zooms
 * (wheel, the buttons, a pinch, a double click) and drags around once it is
 * larger than the screen.
 *
 * Rotating and mirroring apply at once. Crop, straighten, adjust, mask, draw,
 * text and export are modes: each replaces the bar with its own controls
 * (`image-lightbox/Lightbox*Mode.vue`), with a panel above it when they need
 * more than a row, and is previewed on the picture until it is confirmed.
 *
 * The picture is fetched once (the asset hosts allow cross-origin reads) and
 * every edit is an operation replayed from it by image-edit-kit, so undo,
 * redo and saving always start from the original pixels. ← / → switch items,
 * Escape leaves the mode, then closes.
 */
const props = withDefaults(defineProps<{
  items: readonly ImageLightboxItem[]
  title?: string | null
  /** One line under the title (a notice about what the picture is). */
  description?: string | null
}>(), {
  title: null,
  description: null,
})

const open = defineModel<boolean>("open", { default: false })
const index = defineModel<number>("index", { default: 0 })

const { t } = useI18n()

const layer = useTemplateRef<HTMLElement>("layer")
const stage = useTemplateRef<HTMLElement>("stage")
const canvas = useTemplateRef<HTMLCanvasElement>("canvas")
const plainFrame = useTemplateRef<HTMLElement>("plainFrame")
const editFrame = useTemplateRef<HTMLElement>("editFrame")
const drawMode = useTemplateRef<InstanceType<typeof LightboxDrawMode>>("drawMode")

const current = computed(() => props.items[Math.min(Math.max(0, index.value), Math.max(0, props.items.length - 1))] ?? null)
const candidates = computed(() => (current.value?.sources ?? []).filter((url): url is string => typeof url === "string" && url !== ""))

/**
 * `plain`: the picture cannot be read into a canvas (a host without
 * cross-origin access, or one that needs the session cookie), so it is shown
 * as an ordinary image: viewable, not editable.
 */
type LoadState = "idle" | "loading" | "ready" | "plain" | "error"
const state = ref<LoadState>("idle")
const source = shallowRef<ImageBitmap | null>(null)
const originalBlob = shallowRef<Blob | null>(null)
const originalUrl = ref<string | null>(null)
const history = shallowRef<ImageEditHistory>(EMPTY_IMAGE_EDIT_HISTORY)
const mode = ref<ImageLightboxMode>("none")
/** The rectangle selected on the picture while cropping or masking. */
const region = ref<ImageRect | null>(null)
const regionRatio = ref<number | null>(null)
let loading: AbortController | null = null

const { base, baseSize, displaySize, draft } = useImageEditCanvas({ canvas, source, ops: () => history.value.ops })

const ready = computed(() => state.value === "ready")
const edited = computed(() => history.value.ops.length > 0)
const originalName = computed(() => resolveImageFileName(originalUrl.value))

function releaseSource() {
  source.value?.close()
  source.value = null
  originalBlob.value = null
  originalUrl.value = null
}

async function load() {
  loading?.abort()
  const controller = new AbortController()
  loading = controller
  releaseSource()
  leaveMode()
  history.value = EMPTY_IMAGE_EDIT_HISTORY
  if (!open.value || candidates.value.length === 0) {
    state.value = candidates.value.length === 0 && open.value ? "error" : "idle"
    return
  }
  state.value = "loading"
  const loaded = await loadImageSource(candidates.value, { signal: controller.signal })
  if (controller.signal.aborted) {
    loaded?.bitmap.close()
    return
  }
  if (!loaded) {
    state.value = "plain"
    return
  }
  source.value = loaded.bitmap
  originalBlob.value = loaded.blob
  originalUrl.value = loaded.url
  state.value = "ready"
}

watch([open, () => candidates.value.join("\n")], () => {
  void load()
})

// ---- Zoom and pan; while drawing, one pointer belongs to the mode.
const stageView = useImageStageView({
  stage,
  frame: computed(() => (state.value === "plain" ? plainFrame.value : editFrame.value)),
  enabled: () => state.value === "ready" || state.value === "plain",
  doubleClickZoom: () => mode.value === "none" || mode.value === "straighten" || mode.value === "adjust" || mode.value === "export",
  drag: () => (mode.value === "draw" ? drawMode.value?.drag ?? null : null),
})
const { view, zoomed, panning } = stageView

// The picture is sized from the room the stage really has: a mode's panel takes some of it away.
const { width: stageWidth, height: stageHeight } = useElementSize(stage)
/** Kept clear above and below the picture, in screen pixels. */
const STAGE_MARGIN = 8
const stageRoom = computed(() => (stageWidth.value > 0 && stageHeight.value > STAGE_MARGIN * 2
  ? { maxWidth: stageWidth.value, maxHeight: stageHeight.value - STAGE_MARGIN * 2 }
  : null))
/** The picture's size on screen at scale 1: as large as fits, never enlarged. */
const frameSize = computed(() => (displaySize.value && stageRoom.value ? fitImageSize(displaySize.value, stageRoom.value) : null))
const frameStyle = computed(() => ({
  width: `${frameSize.value?.width ?? 0}px`,
  height: `${frameSize.value?.height ?? 0}px`,
  transform: stageView.viewTransform.value,
}))

// A new picture, or one whose shape just changed, starts from the fit view.
watch([source, () => `${baseSize.value?.width}x${baseSize.value?.height}`], stageView.resetView)
// A draft that changes the size, or a panel that changes the stage, must not leave the picture off screen.
watch([() => `${frameSize.value?.width}x${frameSize.value?.height}`, stageWidth, stageHeight], () => {
  void nextTick(stageView.clampView)
})

// ---- Edits and modes.
function push(op: ImageEditOp) {
  history.value = pushImageEdit(history.value, op)
}

function undo() {
  history.value = undoImageEdit(history.value)
}

function redo() {
  history.value = redoImageEdit(history.value)
}

function reset() {
  history.value = resetImageEdit(history.value)
}

function setDraft(ops: readonly ImageEditOp[]) {
  draft.value = ops
}

function enterMode(next: ImageLightboxMode) {
  const size = baseSize.value
  if (!ready.value || !size) {
    return
  }
  draft.value = []
  regionRatio.value = null
  region.value = next === "crop" ? initialCropRect(size) : next === "mask" ? initialMaskRect(size) : null
  mode.value = next
}

function leaveMode() {
  stageView.cancelDrag()
  mode.value = "none"
  region.value = null
  regionRatio.value = null
  draft.value = []
}

function applyOps(ops: readonly ImageEditOp[]) {
  history.value = ops.reduce((current, op) => pushImageEdit(current, op), history.value)
  leaveMode()
}

function saveOriginal() {
  if (originalBlob.value) {
    saveBlob(originalBlob.value, originalName.value)
  }
}

function selectItem(next: number) {
  if (Number.isInteger(next) && next >= 0 && next < props.items.length) {
    index.value = next
  }
}

function close() {
  open.value = false
}

// The layer covers the page: no scrolling behind it, focus moves in and comes back.
const scrollLocked = useScrollLock(typeof document === "undefined" ? null : document.body)
let previousFocus: HTMLElement | null = null

watch(open, async (value) => {
  scrollLocked.value = value
  if (value) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    await nextTick()
    layer.value?.focus({ preventScroll: true })
  } else {
    loading?.abort()
    releaseSource()
    leaveMode()
    stageView.releasePointers()
    state.value = "idle"
    previousFocus?.focus({ preventScroll: true })
    previousFocus = null
  }
})

// A mode swaps the bar's buttons: the one that had focus is gone, so focus goes back to the layer.
watch(mode, async () => {
  await nextTick()
  if (open.value && layer.value && !layer.value.contains(document.activeElement)) {
    layer.value.focus({ preventScroll: true })
  }
})

function isTyping(): boolean {
  const active = document.activeElement
  return active instanceof HTMLTextAreaElement || (active instanceof HTMLInputElement && active.type !== "range")
}

function handleKeydown(event: KeyboardEvent) {
  // A key pressed inside an input method belongs to it (Escape drops its candidate).
  if (!open.value || event.isComposing) {
    return
  }
  if (event.key === "Escape") {
    event.preventDefault()
    if (mode.value === "none") {
      close()
    } else {
      leaveMode()
    }
    return
  }
  if (event.key === "Tab") {
    // Keep Tab inside the layer.
    const root = layer.value
    // Controls hidden at this width (the zoom buttons on a phone) cannot take focus.
    const focusable = Array.from(root?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), [tabindex='0']") ?? [])
      .filter((element) => element.getClientRects().length > 0)
    if (!root || focusable.length === 0) {
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    const outside = !root.contains(active)
    if (event.shiftKey && (outside || active === first || active === root)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (outside || active === last)) {
      event.preventDefault()
      first.focus()
    }
    return
  }
  const shortcut = resolveHistoryShortcut(event)
  if (shortcut) {
    // Only where the bar offers undo: a mode's unconfirmed draft is not a step.
    if (ready.value && !isTyping() && (mode.value === "none" || mode.value === "draw")) {
      event.preventDefault()
      if (shortcut === "undo") {
        undo()
      } else {
        redo()
      }
    }
    return
  }
  if (mode.value !== "none" || props.items.length < 2 || event.altKey || event.ctrlKey || event.metaKey) {
    return
  }
  const count = props.items.length
  if (event.key === "ArrowRight") {
    event.preventDefault()
    selectItem((index.value + 1) % count)
  } else if (event.key === "ArrowLeft") {
    event.preventDefault()
    selectItem((index.value - 1 + count) % count)
  }
}

useEventListener(window, "keydown", handleKeydown)

onBeforeUnmount(() => {
  loading?.abort()
  releaseSource()
  scrollLocked.value = false
})

const heading = computed(() => props.title ?? current.value?.alt ?? current.value?.label ?? "")
const pictureLabel = computed(() => current.value?.alt ?? current.value?.label ?? heading.value)
const stageCursor = computed(() => {
  if (mode.value === "draw") {
    return "cursor-crosshair"
  }
  return zoomed.value ? (panning.value ? "cursor-grabbing" : "cursor-grab") : ""
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      ref="layer"
      role="dialog"
      aria-modal="true"
      :aria-label="heading || t('catalog.lightbox.description')"
      tabindex="-1"
      class="fixed inset-0 z-50 flex flex-col bg-black text-white outline-none"
      data-testid="image-viewer"
      :data-state="state"
      :data-mode="mode"
      :data-ops="history.ops.length"
    >
      <!-- Top: what this is, the item tabs, and the way out. -->
      <div class="flex shrink-0 items-center gap-2 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4">
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold">{{ heading }}</p>
          <p v-if="description" class="truncate text-[11px] text-white/60">{{ description }}</p>
          <p v-else-if="displaySize" class="text-[11px] tabular-nums text-white/60" data-testid="image-viewer-size">
            {{ displaySize.width }} × {{ displaySize.height }}
          </p>
        </div>
        <div
          v-if="items.length > 1"
          class="flex shrink-0 rounded-full bg-white/10 p-0.5"
          role="group"
          :aria-label="t('catalog.lightbox.items')"
        >
          <button
            v-for="(item, itemIndex) in items"
            :key="itemIndex"
            type="button"
            :class="[
              'h-8 rounded-full px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-40 pointer-coarse:h-9',
              itemIndex === index ? 'bg-white text-black' : 'text-white/80 hover:text-white',
            ]"
            :aria-pressed="itemIndex === index"
            :disabled="mode !== 'none'"
            @click="selectItem(itemIndex)"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="hidden shrink-0 items-center rounded-full bg-white/10 p-0.5 sm:flex" role="group" :aria-label="t('catalog.lightbox.zoom')">
          <LightboxToolButton variant="small-icon" :disabled="view.scale <= MIN_IMAGE_ZOOM" :aria-label="t('catalog.lightbox.zoomOut')" :title="t('catalog.lightbox.zoomOut')" data-testid="image-viewer-zoom-out" @click="stageView.zoomTo(view.scale / IMAGE_ZOOM_STEP)">
            <LucideZoomOut class="size-4" />
          </LightboxToolButton>
          <LightboxToolButton variant="readout" :disabled="!zoomed" :aria-label="t('catalog.lightbox.zoomReset')" :title="t('catalog.lightbox.zoomReset')" data-testid="image-viewer-zoom-reset" @click="stageView.resetView">
            {{ formatImageZoom(view.scale) }}
          </LightboxToolButton>
          <LightboxToolButton variant="small-icon" :disabled="view.scale >= MAX_IMAGE_ZOOM" :aria-label="t('catalog.lightbox.zoomIn')" :title="t('catalog.lightbox.zoomIn')" data-testid="image-viewer-zoom-in" @click="stageView.zoomTo(view.scale * IMAGE_ZOOM_STEP)">
            <LucideZoomIn class="size-4" />
          </LightboxToolButton>
        </div>
        <LightboxToolButton :aria-label="t('common.close')" :title="t('common.close')" data-testid="image-viewer-close" @click="close">
          <LucideX class="size-5" />
        </LightboxToolButton>
      </div>

      <!-- Stage: the picture, as large as fits; zoomed, it drags around. -->
      <div
        ref="stage"
        :class="['relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden select-none', stageCursor]"
        data-testid="image-viewer-stage"
        @wheel.prevent="stageView.onWheel"
        @dblclick="stageView.onDoubleClick"
        @pointerdown="stageView.onPointerDown"
        @pointermove="stageView.onPointerMove"
        @pointerup="stageView.onPointerUp"
        @pointercancel="stageView.onPointerCancel"
      >
        <div v-if="state === 'loading'" class="flex items-center gap-2 text-sm text-white/70">
          <LucideLoader2 class="size-6 animate-spin" aria-hidden="true" />
          {{ t("catalog.lightbox.loading") }}
        </div>
        <div v-else-if="state === 'error'" class="flex max-w-sm flex-col items-center gap-3 text-center text-sm text-white/80" role="alert">
          <LucideTriangleAlert class="size-6" aria-hidden="true" />
          {{ t("catalog.lightbox.loadFailed") }}
          <a
            v-if="candidates[0]"
            :href="candidates[0]"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 rounded-full border border-white/30 px-3 py-1.5 font-medium outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <LucideExternalLink class="size-4" aria-hidden="true" />
            {{ t("catalog.lightbox.openInNewTab") }}
          </a>
        </div>
        <div
          v-else-if="state === 'plain'"
          ref="plainFrame"
          class="inline-flex max-h-full max-w-full will-change-transform"
          :style="{ transform: stageView.viewTransform.value }"
        >
          <img
            :src="candidates[0]"
            :alt="pictureLabel"
            class="max-w-full object-contain"
            draggable="false"
            :style="{ maxHeight: stageRoom ? `${stageRoom.maxHeight}px` : '100%' }"
            @error="state = 'error'"
          >
        </div>
        <!-- The frame is exactly the drawn picture, so the selection overlay's percentages are the picture's. -->
        <div
          v-show="ready && frameSize"
          ref="editFrame"
          class="relative shrink-0 overflow-hidden will-change-transform"
          :style="frameStyle"
          data-testid="image-viewer-frame"
        >
          <!-- The picture is named on a wrapper: a canvas takes no role of its own. -->
          <div class="size-full" role="img" :aria-label="pictureLabel">
            <canvas ref="canvas" class="block size-full" aria-hidden="true" />
          </div>
          <LightboxRegionOverlay
            v-if="region && baseSize && (mode === 'crop' || mode === 'mask')"
            v-model:rect="region"
            :size="baseSize"
            :ratio="regionRatio"
            :variant="mode"
            :data-testid="mode === 'crop' ? 'image-viewer-crop' : 'image-viewer-mask'"
          />
        </div>
      </div>

      <!-- Tools: one row, scrolling sideways on a phone; a mode puts its panel above it. -->
      <div class="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
        <LightboxModeShell v-if="state === 'plain' && candidates[0]" :label="t('catalog.lightbox.tools')" plain>
          <LightboxToolButton variant="text" :href="candidates[0]">
            <LucideExternalLink class="size-4" aria-hidden="true" />
            {{ t("catalog.lightbox.openInNewTab") }}
          </LightboxToolButton>
        </LightboxModeShell>
        <LightboxCropMode
          v-else-if="mode === 'crop' && region && baseSize"
          v-model:rect="region"
          v-model:ratio="regionRatio"
          :size="baseSize"
          @apply="applyOps"
          @cancel="leaveMode"
        />
        <LightboxStraightenMode v-else-if="mode === 'straighten'" @draft="setDraft" @apply="applyOps" @cancel="leaveMode" />
        <LightboxAdjustMode v-else-if="mode === 'adjust'" @draft="setDraft" @apply="applyOps" @cancel="leaveMode" />
        <LightboxMaskMode
          v-else-if="mode === 'mask' && region && baseSize"
          v-model:rect="region"
          :size="baseSize"
          @draft="setDraft"
          @apply="applyOps"
          @cancel="leaveMode"
        />
        <LightboxDrawMode
          v-else-if="mode === 'draw' && baseSize"
          ref="drawMode"
          :size="baseSize"
          :frame="editFrame"
          :shown-width="frameSize?.width ?? null"
          :can-undo="canUndoImageEdit(history)"
          @draft="setDraft"
          @commit="push"
          @undo="undo"
          @done="leaveMode"
        />
        <LightboxTextMode
          v-else-if="mode === 'text' && baseSize"
          :size="baseSize"
          :frame="editFrame"
          @draft="setDraft"
          @apply="applyOps"
          @cancel="leaveMode"
        />
        <LightboxExportMode
          v-else-if="mode === 'export' && base && baseSize"
          :source="base"
          :size="baseSize"
          :edited="edited"
          :original-name="originalName"
          @cancel="leaveMode"
          @saved="leaveMode"
        />
        <LightboxMainToolbar
          v-else
          :ready="ready"
          :edited="edited"
          :can-undo="canUndoImageEdit(history)"
          :can-redo="canRedoImageEdit(history)"
          @op="push"
          @mode="enterMode"
          @undo="undo"
          @redo="redo"
          @reset="reset"
          @save-original="saveOriginal"
        />
      </div>
    </div>
  </Teleport>
</template>
