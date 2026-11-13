<script setup lang="ts">
import { computed, useTemplateRef } from "vue"
import { useI18n } from "vue-i18n"
import {
  CROP_HANDLES,
  adjustCropRect,
  adjustCropRectWithAspect,
  type CropHandle,
  type ImageRect,
  type ImageSize,
} from "image-edit-kit"
import { resolveArrowNudge } from "@/lib/image-lightbox"

/**
 * A rectangle selected on the picture: eight handles and the selection
 * itself to drag. It covers the frame exactly, so its percentages are the
 * picture's, whatever the zoom. The crop darkens what it would drop and
 * shows thirds; a mask leaves the picture as it is. From the keyboard the
 * selection and each handle take focus and the arrow keys move them (Shift
 * for a single pixel), through the same geometry as a drag.
 */
const props = withDefaults(defineProps<{
  /** The picture's size, in the pixels `rect` is in. */
  size: ImageSize
  /** Width : height the selection is locked to, or `null` for a free shape. */
  ratio?: number | null
  variant?: "crop" | "mask"
}>(), {
  ratio: null,
  variant: "crop",
})

const rect = defineModel<ImageRect>("rect", { required: true })

const { t } = useI18n()

const root = useTemplateRef<HTMLElement>("root")

// Pointer movement in screen pixels, scaled to image pixels by how large the picture is drawn.
let drag: { handle: CropHandle; startX: number; startY: number; rect: ImageRect; scale: number } | null = null

function beginDrag(handle: CropHandle, event: PointerEvent) {
  const width = root.value?.getBoundingClientRect().width ?? 0
  if (width <= 0) {
    return
  }
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  drag = { handle, startX: event.clientX, startY: event.clientY, rect: rect.value, scale: props.size.width / width }
}

function moveDrag(event: PointerEvent) {
  if (!drag) {
    return
  }
  const dx = (event.clientX - drag.startX) * drag.scale
  const dy = (event.clientY - drag.startY) * drag.scale
  rect.value = adjust(drag.rect, drag.handle, dx, dy)
}

function endDrag() {
  drag = null
}

function adjust(from: ImageRect, handle: CropHandle, dx: number, dy: number): ImageRect {
  return props.ratio == null
    ? adjustCropRect(from, handle, dx, dy, props.size)
    : adjustCropRectWithAspect(from, handle, dx, dy, props.size, props.ratio)
}

function nudge(handle: CropHandle, event: KeyboardEvent) {
  const move = resolveArrowNudge(event.key, event.shiftKey, props.size)
  if (!move) {
    return
  }
  event.preventDefault()
  if (props.ratio != null && handle.length === 2) {
    // A corner of a locked shape follows the larger of its two movements, so
    // a key along one axis alone would never shrink it: the key pulls the
    // corner outwards or inwards along both.
    const horizontal = handle.includes("e") ? 1 : -1
    const vertical = handle.includes("s") ? 1 : -1
    const outwards = move.x * horizontal + move.y * vertical
    rect.value = adjust(rect.value, handle, outwards * horizontal, (outwards / props.ratio) * vertical)
    return
  }
  rect.value = adjust(rect.value, handle, move.x, move.y)
}

const selectionStyle = computed(() => ({
  left: `${(rect.value.x / props.size.width) * 100}%`,
  top: `${(rect.value.y / props.size.height) * 100}%`,
  width: `${(rect.value.width / props.size.width) * 100}%`,
  height: `${(rect.value.height / props.size.height) * 100}%`,
}))

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
</script>

<template>
  <div ref="root" class="absolute inset-0 touch-none">
    <div
      :class="[
        'absolute cursor-move ring-1 ring-white',
        variant === 'crop' ? 'shadow-[0_0_0_9999px_rgb(0_0_0/0.6)]' : 'shadow-[0_0_0_1px_rgb(0_0_0/0.5)]',
      ]"
      :style="selectionStyle"
      data-region-selection
      @pointerdown.stop="beginDrag('move', $event)"
      @pointermove="moveDrag"
      @pointerup="endDrag"
      @pointercancel="endDrag"
    >
      <template v-if="variant === 'crop'">
        <span class="pointer-events-none absolute inset-x-0 top-1/3 border-t border-white/40" aria-hidden="true" />
        <span class="pointer-events-none absolute inset-x-0 top-2/3 border-t border-white/40" aria-hidden="true" />
        <span class="pointer-events-none absolute inset-y-0 left-1/3 border-l border-white/40" aria-hidden="true" />
        <span class="pointer-events-none absolute inset-y-0 left-2/3 border-l border-white/40" aria-hidden="true" />
      </template>
      <!-- The keyboard's hold on the whole selection; the pointer drags the selection itself. -->
      <span
        class="absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-white"
        role="button"
        tabindex="0"
        :aria-label="t('catalog.lightbox.moveSelection')"
        aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
        data-region-move
        @keydown="nudge('move', $event)"
      />
      <span
        v-for="handle in CROP_HANDLES"
        :key="handle"
        :class="['absolute size-4 rounded-full border-2 border-black/40 bg-white outline-none focus-visible:ring-2 focus-visible:ring-white pointer-coarse:size-6', HANDLE_CLASS[handle]]"
        :data-handle="handle"
        role="button"
        tabindex="0"
        :aria-label="`${t('catalog.lightbox.resizeSelection')} ${handle.toUpperCase()}`"
        aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
        @keydown="nudge(handle, $event)"
        @pointerdown.stop="beginDrag(handle, $event)"
        @pointermove="moveDrag"
        @pointerup="endDrag"
        @pointercancel="endDrag"
      />
    </div>
  </div>
</template>
