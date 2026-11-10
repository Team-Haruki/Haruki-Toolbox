<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from "vue"
import { useEventListener, useScrollLock } from "@vueuse/core"
import { useI18n } from "vue-i18n"
import {
  LucideCheck,
  LucideCrop,
  LucideDownload,
  LucideExternalLink,
  LucideFlipHorizontal2,
  LucideFlipVertical2,
  LucideImageDown,
  LucideListRestart,
  LucideLoader2,
  LucideRotateCcw,
  LucideRotateCw,
  LucideTriangleAlert,
  LucideUndo2,
  LucideX,
  LucideZoomIn,
  LucideZoomOut,
} from "lucide-vue-next"
import {
  IMAGE_VIEW_FIT,
  IMAGE_ZOOM_STEP,
  MAX_IMAGE_ZOOM,
  MIN_IMAGE_ZOOM,
  clampImagePan,
  formatImageZoom,
  zoomImageView,
  type ImageView,
} from "@/lib/image-view"
import {
  CROP_ASPECTS,
  CROP_HANDLES,
  adjustCropRect,
  adjustCropRectWithAspect,
  fitCropRectToAspect,
  initialCropRect,
  resolveCropAspectRatio,
  isFullImageRect,
  resolveEditedFileName,
  resolveEditedImageSize,
  resolveImageFileName,
  type CropAspectKey,
  type CropHandle,
  type ImageEditOp,
  type ImageRect,
  type ImageSize,
} from "@/lib/image-edit"

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
 * and close button on top and one toolbar below — rotate either way, mirror
 * either way, crop, undo / reset, save the original file, save the picture
 * as edited (PNG). The picture zooms (wheel, the buttons, a pinch, a double
 * click) and drags around once it is larger than the screen.
 *
 * The picture is fetched once (the asset hosts allow cross-origin reads) and
 * every edit is replayed from it onto a canvas, so saving always starts from
 * the original pixels. ← / → switch items, Escape leaves the crop, then
 * closes.
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

const layerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const frameRef = ref<HTMLElement | null>(null)
const stageRef = ref<HTMLElement | null>(null)

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
const ops = ref<ImageEditOp[]>([])
const cropRect = ref<ImageRect | null>(null)
const saving = ref(false)
let loadToken = 0

const sourceSize = computed<ImageSize | null>(() => (source.value ? { width: source.value.width, height: source.value.height } : null))
const editedSize = computed<ImageSize | null>(() => (sourceSize.value ? resolveEditedImageSize(sourceSize.value, ops.value) : null))
const cropping = computed(() => cropRect.value != null)
const edited = computed(() => ops.value.length > 0)
const busy = computed(() => state.value !== "ready" || saving.value)
const cropApplicable = computed(() => (
  cropRect.value != null && editedSize.value != null && !isFullImageRect(cropRect.value, editedSize.value)
))

function releaseSource() {
  source.value?.close()
  source.value = null
  originalBlob.value = null
  originalUrl.value = null
}

async function load() {
  const token = ++loadToken
  releaseSource()
  ops.value = []
  cropRect.value = null
  if (!open.value || candidates.value.length === 0) {
    state.value = candidates.value.length === 0 && open.value ? "error" : "idle"
    return
  }
  state.value = "loading"
  for (const url of candidates.value) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        continue
      }
      const blob = await response.blob()
      const bitmap = await createImageBitmap(blob)
      if (token !== loadToken) {
        bitmap.close()
        return
      }
      source.value = bitmap
      originalBlob.value = blob
      originalUrl.value = url
      state.value = "ready"
      return
    } catch {
      // Network or decode failure: try the next candidate.
    }
    if (token !== loadToken) {
      return
    }
  }
  state.value = "plain"
}

/** The original with every operation so far replayed onto it. */
function renderEdited(bitmap: ImageBitmap, operations: readonly ImageEditOp[]): HTMLCanvasElement {
  let canvas = document.createElement("canvas")
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0)

  for (const op of operations) {
    const next = document.createElement("canvas")
    const context = next.getContext("2d")
    if (!context) {
      break
    }
    if (op.kind === "rotate") {
      next.width = canvas.height
      next.height = canvas.width
      context.translate(next.width / 2, next.height / 2)
      context.rotate((op.turns * Math.PI) / 2)
      context.drawImage(canvas, -canvas.width / 2, -canvas.height / 2)
    } else if (op.kind === "flip") {
      next.width = canvas.width
      next.height = canvas.height
      if (op.axis === "horizontal") {
        context.translate(next.width, 0)
        context.scale(-1, 1)
      } else {
        context.translate(0, next.height)
        context.scale(1, -1)
      }
      context.drawImage(canvas, 0, 0)
    } else {
      next.width = op.rect.width
      next.height = op.rect.height
      context.drawImage(canvas, op.rect.x, op.rect.y, op.rect.width, op.rect.height, 0, 0, op.rect.width, op.rect.height)
    }
    canvas = next
  }
  return canvas
}

function paint() {
  const target = canvasRef.value
  const bitmap = source.value
  if (!target || !bitmap) {
    return
  }
  const rendered = renderEdited(bitmap, ops.value)
  target.width = rendered.width
  target.height = rendered.height
  target.getContext("2d")?.drawImage(rendered, 0, 0)
}

watch([source, ops, canvasRef], () => {
  void nextTick(paint)
}, { deep: true })

watch([open, () => candidates.value.join("\n")], () => {
  void load()
})

// A new picture, or one whose shape just changed, starts from the fit view.
watch([source, () => `${editedSize.value?.width}x${editedSize.value?.height}`], resetView)

// ---- Zoom and pan. `scale` 1 fits the stage; the offset is in screen pixels.
const view = ref<ImageView>(IMAGE_VIEW_FIT)
const zoomed = computed(() => view.value.scale > MIN_IMAGE_ZOOM)
const viewStyle = computed(() => ({
  transform: `translate(${view.value.x}px, ${view.value.y}px) scale(${view.value.scale})`,
}))

function viewSizes() {
  const frame = frameRef.value
  const stage = stageRef.value
  if (!frame || !stage) {
    return null
  }
  return {
    frame: { width: frame.offsetWidth, height: frame.offsetHeight },
    stage: { width: stage.clientWidth, height: stage.clientHeight },
    stageRect: stage.getBoundingClientRect(),
  }
}

/** Zooms to `scale`, about a screen point when given (the pointer), else about the centre. */
function zoomTo(scale: number, clientX?: number, clientY?: number) {
  const sizes = viewSizes()
  if (!sizes) {
    return
  }
  const anchor = clientX == null || clientY == null
    ? { x: 0, y: 0 }
    : {
        x: clientX - (sizes.stageRect.left + sizes.stageRect.width / 2),
        y: clientY - (sizes.stageRect.top + sizes.stageRect.height / 2),
      }
  view.value = zoomImageView(view.value, scale, anchor, sizes.frame, sizes.stage)
}

function resetView() {
  view.value = IMAGE_VIEW_FIT
}

function handleWheel(event: WheelEvent) {
  if (state.value !== "ready" && state.value !== "plain") {
    return
  }
  zoomTo(view.value.scale * Math.exp(-event.deltaY * 0.0015), event.clientX, event.clientY)
}

function handleDoubleClick(event: MouseEvent) {
  if (cropping.value) {
    return
  }
  if (zoomed.value) {
    resetView()
  } else {
    zoomTo(2, event.clientX, event.clientY)
  }
}

// One pointer drags the picture; two pinch it.
const pointers = new Map<number, { x: number; y: number }>()
let panStart: { x: number; y: number; view: ImageView } | null = null
let pinchStart: { distance: number; scale: number } | null = null
const panning = ref(false)

function pinchDistance(): number {
  const [first, second] = [...pointers.values()]
  return first && second ? Math.hypot(first.x - second.x, first.y - second.y) : 0
}

function stagePointerDown(event: PointerEvent) {
  if (event.pointerType === "mouse" && event.button !== 0) {
    return
  }
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  if (pointers.size === 2) {
    panStart = null
    pinchStart = { distance: pinchDistance(), scale: view.value.scale }
  } else if (pointers.size === 1) {
    panStart = { x: event.clientX, y: event.clientY, view: view.value }
    panning.value = zoomed.value
  }
}

function stagePointerMove(event: PointerEvent) {
  if (!pointers.has(event.pointerId)) {
    return
  }
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  if (pinchStart && pointers.size === 2) {
    const [first, second] = [...pointers.values()]
    const distance = pinchDistance()
    if (pinchStart.distance > 0 && distance > 0) {
      zoomTo(pinchStart.scale * (distance / pinchStart.distance), (first.x + second.x) / 2, (first.y + second.y) / 2)
    }
    return
  }
  const sizes = viewSizes()
  if (panStart && sizes && zoomed.value) {
    view.value = clampImagePan({
      scale: view.value.scale,
      x: panStart.view.x + (event.clientX - panStart.x),
      y: panStart.view.y + (event.clientY - panStart.y),
    }, sizes.frame, sizes.stage)
  }
}

function stagePointerUp(event: PointerEvent) {
  pointers.delete(event.pointerId)
  pinchStart = null
  const remaining = [...pointers.values()][0]
  panStart = remaining ? { x: remaining.x, y: remaining.y, view: view.value } : null
  panning.value = false
}

function push(op: ImageEditOp) {
  ops.value = [...ops.value, op]
}

function undo() {
  ops.value = ops.value.slice(0, -1)
}

function reset() {
  ops.value = []
}

// The selection's shape: free, or locked to one of the usual ratios.
const cropAspect = ref<CropAspectKey>("free")

function startCrop() {
  if (editedSize.value) {
    cropAspect.value = "free"
    cropRect.value = initialCropRect(editedSize.value)
  }
}

function selectCropAspect(key: CropAspectKey) {
  cropAspect.value = key
  const ratio = resolveCropAspectRatio(key)
  if (ratio != null && cropRect.value && editedSize.value) {
    cropRect.value = fitCropRectToAspect(cropRect.value, ratio, editedSize.value)
  }
}

function applyCrop() {
  if (cropRect.value && cropApplicable.value) {
    push({ kind: "crop", rect: cropRect.value })
  }
  cropRect.value = null
}

// Dragging the selection: pointer movement in screen pixels, scaled to image
// pixels by how large the canvas is drawn.
let drag: { handle: CropHandle; startX: number; startY: number; rect: ImageRect; scale: number } | null = null

function beginDrag(handle: CropHandle, event: PointerEvent) {
  const frame = frameRef.value
  if (!cropRect.value || !editedSize.value || !frame) {
    return
  }
  const width = frame.getBoundingClientRect().width
  if (width <= 0) {
    return
  }
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  drag = { handle, startX: event.clientX, startY: event.clientY, rect: cropRect.value, scale: editedSize.value.width / width }
}

function moveDrag(event: PointerEvent) {
  if (!drag || !editedSize.value) {
    return
  }
  const dx = (event.clientX - drag.startX) * drag.scale
  const dy = (event.clientY - drag.startY) * drag.scale
  const ratio = resolveCropAspectRatio(cropAspect.value)
  cropRect.value = ratio == null
    ? adjustCropRect(drag.rect, drag.handle, dx, dy, editedSize.value)
    : adjustCropRectWithAspect(drag.rect, drag.handle, dx, dy, editedSize.value, ratio)
}

function endDrag() {
  drag = null
}

const cropStyle = computed(() => {
  const rect = cropRect.value
  const size = editedSize.value
  if (!rect || !size) {
    return undefined
  }
  return {
    left: `${(rect.x / size.width) * 100}%`,
    top: `${(rect.y / size.height) * 100}%`,
    width: `${(rect.width / size.width) * 100}%`,
    height: `${(rect.height / size.height) * 100}%`,
  }
})

const HANDLE_CLASS: Record<Exclude<CropHandle, "move">, string> = {
  nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
  n: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize",
  ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
  e: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
  se: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
  s: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize",
  sw: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
  w: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const originalName = computed(() => resolveImageFileName(originalUrl.value))

function saveOriginal() {
  if (originalBlob.value) {
    download(originalBlob.value, originalName.value)
  }
}

function saveEdited() {
  const bitmap = source.value
  if (!bitmap || saving.value) {
    return
  }
  saving.value = true
  renderEdited(bitmap, ops.value).toBlob((blob) => {
    saving.value = false
    if (blob) {
      download(blob, resolveEditedFileName(originalName.value))
    }
  }, "image/png")
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
    layerRef.value?.focus({ preventScroll: true })
  } else {
    loadToken += 1
    releaseSource()
    state.value = "idle"
    previousFocus?.focus({ preventScroll: true })
    previousFocus = null
  }
})

function handleKeydown(event: KeyboardEvent) {
  if (!open.value) {
    return
  }
  if (event.key === "Escape") {
    event.preventDefault()
    if (cropping.value) {
      cropRect.value = null
    } else {
      close()
    }
    return
  }
  if (event.key === "Tab") {
    // Keep Tab inside the layer.
    const focusable = Array.from(layerRef.value?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href]") ?? [])
    if (focusable.length === 0) {
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement
    if (event.shiftKey && (active === first || active === layerRef.value)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
    return
  }
  if (cropping.value || props.items.length < 2 || event.altKey || event.ctrlKey || event.metaKey) {
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
  loadToken += 1
  releaseSource()
  scrollLocked.value = false
})

const heading = computed(() => props.title ?? current.value?.alt ?? current.value?.label ?? "")
// Each button names its own size and padding: two utilities for the same
// property on one element would leave the winner to the stylesheet's order.
const TOOL_BASE_CLASS = "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/70 disabled:pointer-events-none disabled:opacity-40"
const TOOL_QUIET_CLASS = "text-white/90 hover:bg-white/15 hover:text-white"
const toolClass = `${TOOL_BASE_CLASS} ${TOOL_QUIET_CLASS} h-10 px-3 text-sm`
const iconToolClass = `${TOOL_BASE_CLASS} ${TOOL_QUIET_CLASS} size-10`
const smallIconToolClass = `${TOOL_BASE_CLASS} ${TOOL_QUIET_CLASS} size-8`
const zoomReadoutClass = `${TOOL_BASE_CLASS} ${TOOL_QUIET_CLASS} h-8 min-w-14 px-2 text-xs tabular-nums`
const aspectToolClass = `${TOOL_BASE_CLASS} h-8 px-2.5 text-xs tabular-nums`
// The one action to finish with: dark text on a white pill.
const primaryToolClass = `${TOOL_BASE_CLASS} h-10 bg-white px-3 text-sm text-black hover:bg-white/90`
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      ref="layerRef"
      role="dialog"
      aria-modal="true"
      :aria-label="heading || t('catalog.lightbox.description')"
      tabindex="-1"
      class="fixed inset-0 z-50 flex flex-col bg-black text-white outline-none"
      data-testid="image-viewer"
      :data-state="state"
    >
      <!-- Top: what this is, the item tabs, and the way out. -->
      <div class="flex shrink-0 items-center gap-2 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4">
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold">{{ heading }}</p>
          <p v-if="description" class="truncate text-[11px] text-white/60">{{ description }}</p>
          <p v-else-if="editedSize" class="text-[11px] tabular-nums text-white/60" data-testid="image-viewer-size">
            {{ editedSize.width }} × {{ editedSize.height }}
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
            :disabled="cropping"
            @click="selectItem(itemIndex)"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="hidden shrink-0 items-center rounded-full bg-white/10 p-0.5 sm:flex" role="group" :aria-label="t('catalog.lightbox.zoom')">
          <button type="button" :class="smallIconToolClass" :disabled="view.scale <= MIN_IMAGE_ZOOM" :aria-label="t('catalog.lightbox.zoomOut')" :title="t('catalog.lightbox.zoomOut')" data-testid="image-viewer-zoom-out" @click="zoomTo(view.scale / IMAGE_ZOOM_STEP)">
            <LucideZoomOut class="size-4" />
          </button>
          <button type="button" :class="zoomReadoutClass" :disabled="!zoomed" :aria-label="t('catalog.lightbox.zoomReset')" :title="t('catalog.lightbox.zoomReset')" data-testid="image-viewer-zoom-reset" @click="resetView">
            {{ formatImageZoom(view.scale) }}
          </button>
          <button type="button" :class="smallIconToolClass" :disabled="view.scale >= MAX_IMAGE_ZOOM" :aria-label="t('catalog.lightbox.zoomIn')" :title="t('catalog.lightbox.zoomIn')" data-testid="image-viewer-zoom-in" @click="zoomTo(view.scale * IMAGE_ZOOM_STEP)">
            <LucideZoomIn class="size-4" />
          </button>
        </div>
        <button type="button" :class="iconToolClass" :aria-label="t('common.close')" :title="t('common.close')" data-testid="image-viewer-close" @click="close">
          <LucideX class="size-5" />
        </button>
      </div>

      <!-- Stage: the picture, as large as fits; zoomed, it drags around. -->
      <div
        ref="stageRef"
        :class="[
          'relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden select-none',
          zoomed ? (panning ? 'cursor-grabbing' : 'cursor-grab') : '',
        ]"
        data-testid="image-viewer-stage"
        @wheel.prevent="handleWheel"
        @dblclick="handleDoubleClick"
        @pointerdown="stagePointerDown"
        @pointermove="stagePointerMove"
        @pointerup="stagePointerUp"
        @pointercancel="stagePointerUp"
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
        <div v-else-if="state === 'plain'" ref="frameRef" class="inline-flex max-h-full max-w-full will-change-transform" :style="viewStyle">
          <img
            :src="candidates[0]"
            :alt="current?.alt ?? current?.label ?? heading"
            class="max-h-full max-w-full object-contain"
            draggable="false"
            :style="{ maxHeight: 'calc(100dvh - 9.5rem)' }"
            @error="state = 'error'"
          >
        </div>
        <!-- The frame is exactly the drawn picture, so the crop overlay's percentages are the picture's. -->
        <div
          v-show="state === 'ready'"
          :ref="(element) => { if (state !== 'plain') frameRef = element as HTMLElement | null }"
          class="relative inline-flex max-h-full max-w-full overflow-hidden will-change-transform"
          :style="viewStyle"
          data-testid="image-viewer-frame"
        >
          <canvas
            ref="canvasRef"
            class="block max-h-full max-w-full object-contain"
            :style="{ maxHeight: 'calc(100dvh - 9.5rem)' }"
            role="img"
            :aria-label="current?.alt ?? current?.label ?? heading"
          />
          <div v-if="cropRect" class="absolute inset-0 touch-none" data-testid="image-viewer-crop">
            <div
              class="absolute cursor-move shadow-[0_0_0_9999px_rgb(0_0_0/0.6)] ring-1 ring-white"
              :style="cropStyle"
              @pointerdown.stop="beginDrag('move', $event)"
              @pointermove="moveDrag"
              @pointerup="endDrag"
              @pointercancel="endDrag"
            >
              <span class="pointer-events-none absolute inset-x-0 top-1/3 border-t border-white/40" aria-hidden="true" />
              <span class="pointer-events-none absolute inset-x-0 top-2/3 border-t border-white/40" aria-hidden="true" />
              <span class="pointer-events-none absolute inset-y-0 left-1/3 border-l border-white/40" aria-hidden="true" />
              <span class="pointer-events-none absolute inset-y-0 left-2/3 border-l border-white/40" aria-hidden="true" />
              <span
                v-for="handle in CROP_HANDLES"
                :key="handle"
                :class="['absolute size-4 rounded-full border-2 border-black/40 bg-white pointer-coarse:size-6', HANDLE_CLASS[handle]]"
                :data-handle="handle"
                @pointerdown.stop="beginDrag(handle, $event)"
                @pointermove="moveDrag"
                @pointerup="endDrag"
                @pointercancel="endDrag"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Tools: one row, scrolling sideways on a phone. -->
      <div class="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
        <div
          class="mx-auto flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-white/10 p-1 backdrop-blur-md"
          role="toolbar"
          :aria-label="t('catalog.lightbox.tools')"
        >
          <template v-if="cropping">
            <div class="flex shrink-0 items-center" role="group" :aria-label="t('catalog.lightbox.cropAspect')">
              <button
                v-for="aspect in CROP_ASPECTS"
                :key="aspect.key"
                type="button"
                :class="[
                  aspectToolClass,
                  cropAspect === aspect.key ? 'bg-white/25 text-white' : 'text-white/70 hover:bg-white/15 hover:text-white',
                ]"
                :aria-pressed="cropAspect === aspect.key"
                :data-aspect="aspect.key"
                @click="selectCropAspect(aspect.key)"
              >
                {{ aspect.key === "free" ? t("catalog.lightbox.cropFree") : aspect.key }}
              </button>
            </div>
            <span class="mx-1 h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />
            <p class="shrink-0 px-2 text-xs tabular-nums text-white/70" data-testid="image-viewer-crop-size">
              {{ cropRect?.width }} × {{ cropRect?.height }}
            </p>
            <button type="button" :class="toolClass" @click="cropRect = null">
              <LucideX class="size-4" aria-hidden="true" />
              {{ t("common.cancel") }}
            </button>
            <button type="button" :class="primaryToolClass" :disabled="!cropApplicable" data-testid="image-viewer-crop-apply" @click="applyCrop">
              <LucideCheck class="size-4" aria-hidden="true" />
              {{ t("catalog.lightbox.applyCrop") }}
            </button>
          </template>
          <a
            v-else-if="state === 'plain' && candidates[0]"
            :href="candidates[0]"
            target="_blank"
            rel="noopener noreferrer"
            :class="toolClass"
          >
            <LucideExternalLink class="size-4" aria-hidden="true" />
            {{ t("catalog.lightbox.openInNewTab") }}
          </a>
          <template v-else>
            <button type="button" :class="iconToolClass" :disabled="busy" :aria-label="t('catalog.lightbox.rotateLeft')" :title="t('catalog.lightbox.rotateLeft')" data-testid="image-viewer-rotate-left" @click="push({ kind: 'rotate', turns: -1 })">
              <LucideRotateCcw class="size-4.5" />
            </button>
            <button type="button" :class="iconToolClass" :disabled="busy" :aria-label="t('catalog.lightbox.rotateRight')" :title="t('catalog.lightbox.rotateRight')" data-testid="image-viewer-rotate-right" @click="push({ kind: 'rotate', turns: 1 })">
              <LucideRotateCw class="size-4.5" />
            </button>
            <button type="button" :class="iconToolClass" :disabled="busy" :aria-label="t('catalog.lightbox.flipHorizontal')" :title="t('catalog.lightbox.flipHorizontal')" data-testid="image-viewer-flip-horizontal" @click="push({ kind: 'flip', axis: 'horizontal' })">
              <LucideFlipHorizontal2 class="size-4.5" />
            </button>
            <button type="button" :class="iconToolClass" :disabled="busy" :aria-label="t('catalog.lightbox.flipVertical')" :title="t('catalog.lightbox.flipVertical')" data-testid="image-viewer-flip-vertical" @click="push({ kind: 'flip', axis: 'vertical' })">
              <LucideFlipVertical2 class="size-4.5" />
            </button>
            <button type="button" :class="iconToolClass" :disabled="busy" :aria-label="t('catalog.lightbox.crop')" :title="t('catalog.lightbox.crop')" data-testid="image-viewer-crop-start" @click="startCrop">
              <LucideCrop class="size-4.5" />
            </button>
            <span class="mx-1 h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />
            <button type="button" :class="iconToolClass" :disabled="busy || !edited" :aria-label="t('catalog.lightbox.undo')" :title="t('catalog.lightbox.undo')" data-testid="image-viewer-undo" @click="undo">
              <LucideUndo2 class="size-4.5" />
            </button>
            <button type="button" :class="iconToolClass" :disabled="busy || !edited" :aria-label="t('catalog.lightbox.reset')" :title="t('catalog.lightbox.reset')" data-testid="image-viewer-reset" @click="reset">
              <LucideListRestart class="size-4.5" />
            </button>
            <span class="mx-1 h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />
            <button type="button" :class="toolClass" :disabled="state !== 'ready'" data-testid="image-viewer-save-original" @click="saveOriginal">
              <LucideDownload class="size-4" aria-hidden="true" />
              {{ t("catalog.lightbox.saveOriginal") }}
            </button>
            <button type="button" :class="edited ? primaryToolClass : toolClass" :disabled="busy || !edited" data-testid="image-viewer-save-edited" @click="saveEdited">
              <LucideLoader2 v-if="saving" class="size-4 animate-spin" aria-hidden="true" />
              <LucideImageDown v-else class="size-4" aria-hidden="true" />
              {{ t("catalog.lightbox.saveEdited") }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
