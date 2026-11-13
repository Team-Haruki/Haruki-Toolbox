<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef, watch, type Component } from "vue"
import { useI18n } from "vue-i18n"
import { LucideAlignCenter, LucideAlignLeft, LucideAlignRight, LucideBold, LucideItalic } from "lucide-vue-next"
import {
  IMAGE_TEXT_ALIGNS,
  measureImageTextBox,
  type ImageEditOp,
  type ImagePoint,
  type ImageSize,
  type ImageTextAlign,
} from "image-edit-kit"
import {
  DEFAULT_ANNOTATION_COLOR,
  TEXT_EFFECTS,
  TEXT_FONTS,
  TEXT_ROTATION_RANGE,
  buildTextOp,
  formatSignedValue,
  initialTextAt,
  moveTextAt,
  realignTextAt,
  resolveArrowNudge,
  resizeTextAt,
  resolveHandleRotation,
  resolveTextSizeRange,
  type TextEffect,
  type TextFontKey,
} from "@/lib/image-lightbox"
import LightboxColorSwatches from "./LightboxColorSwatches.vue"
import LightboxModeShell from "./LightboxModeShell.vue"
import LightboxSlider from "./LightboxSlider.vue"
import LightboxToolButton from "./LightboxToolButton.vue"

/**
 * Text: a few lines typed in the panel, with a colour, a weight, a slant, an
 * alignment, a typeface, something to keep it readable on any picture (an
 * outline or a plate), a size anywhere in a range and a rotation. It is previewed on the
 * picture as it is typed and starts in the middle; the frame around it moves
 * it (a drag, or the arrow keys once it has focus), and the round handle
 * above the frame turns it.
 */
const props = defineProps<{
  size: ImageSize
  /** The element drawn exactly as large as the picture: the text's frame is placed in it. */
  frame: HTMLElement | null
}>()

const emit = defineEmits<{
  draft: [ops: ImageEditOp[]]
  apply: [ops: ImageEditOp[]]
  cancel: []
}>()

const { t } = useI18n()

const ALIGN_ICONS: Record<ImageTextAlign, Component> = {
  left: LucideAlignLeft,
  center: LucideAlignCenter,
  right: LucideAlignRight,
}
const MAX_INPUT_ROWS = 3

const input = useTemplateRef<HTMLTextAreaElement>("input")
const box = useTemplateRef<HTMLElement>("box")
const sizeRange = computed(() => resolveTextSizeRange(props.size))

const text = ref("")
const color = ref(DEFAULT_ANNOTATION_COLOR)
const fontSize = ref(sizeRange.value.initial)
const bold = ref(true)
const italic = ref(false)
const align = ref<ImageTextAlign>("center")
const font = ref<TextFontKey>("sans")
const effect = ref<TextEffect>("outline")
const rotation = ref(0)
const at = ref<ImagePoint>(initialTextAt(props.size, fontSize.value))

const blank = computed(() => text.value.trim() === "")
const inputRows = computed(() => Math.min(MAX_INPUT_ROWS, text.value.split("\n").length))
const op = computed(() => buildTextOp({
  text: text.value,
  at: at.value,
  size: fontSize.value,
  color: color.value,
  font: font.value,
  bold: bold.value,
  italic: italic.value,
  align: align.value,
  effect: effect.value,
  rotation: rotation.value,
}))
const ops = computed<ImageEditOp[]>(() => (blank.value ? [] : [op.value]))

watch(ops, (value) => emit("draft", value))

// The slider's value: the first line keeps its middle while the size changes.
const sizeModel = computed({
  get: () => fontSize.value,
  set: (next: number) => {
    at.value = resizeTextAt(at.value, fontSize.value, next)
    fontSize.value = next
  },
})

function selectAlign(next: ImageTextAlign) {
  if (!blank.value) {
    // The lines stay where they are: only their anchor moves to the new edge.
    at.value = realignTextAt(at.value, measureImageTextBox({ ...op.value, background: undefined }), next)
  }
  align.value = next
}

// The frame around the text, in shares of the picture: what a drag takes hold
// of. The measured box is the upright one; the text turns about its middle,
// and so does the frame.
const boxStyle = computed(() => {
  if (blank.value) {
    return null
  }
  const measured = measureImageTextBox(op.value)
  return {
    left: `${(measured.x / props.size.width) * 100}%`,
    top: `${(measured.y / props.size.height) * 100}%`,
    width: `${(measured.width / props.size.width) * 100}%`,
    height: `${(measured.height / props.size.height) * 100}%`,
    rotate: `${rotation.value}deg`,
  }
})

// Pointer movement in screen pixels, scaled to image pixels by how large the picture is drawn.
let drag: { x: number; y: number; at: ImagePoint; scale: number } | null = null

function beginDrag(event: PointerEvent) {
  const width = props.frame?.getBoundingClientRect().width ?? 0
  if (width <= 0) {
    return
  }
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  drag = { x: event.clientX, y: event.clientY, at: at.value, scale: props.size.width / width }
}

function moveDrag(event: PointerEvent) {
  if (drag) {
    at.value = moveTextAt(drag.at, (event.clientX - drag.x) * drag.scale, (event.clientY - drag.y) * drag.scale, props.size)
  }
}

function endDrag() {
  drag = null
}

function nudge(event: KeyboardEvent) {
  const move = resolveArrowNudge(event.key, event.shiftKey, props.size)
  if (move) {
    event.preventDefault()
    at.value = moveTextAt(at.value, move.x, move.y, props.size)
  }
}

let turning = false

function beginTurn(event: PointerEvent) {
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  turning = true
}

function moveTurn(event: PointerEvent) {
  const bounds = box.value?.getBoundingClientRect()
  if (!turning || !bounds) {
    return
  }
  // The frame turns about its middle, so its bounding box keeps that middle.
  rotation.value = resolveHandleRotation(
    { x: event.clientX, y: event.clientY },
    { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 },
  )
}

function endTurn() {
  turning = false
}

onMounted(() => {
  // On a touch screen the keyboard would cover the picture before anything is chosen.
  if (window.matchMedia("(pointer: fine)").matches) {
    void nextTick(() => input.value?.focus({ preventScroll: true }))
  }
})
</script>

<template>
  <Teleport v-if="frame && boxStyle" :to="frame">
    <div
      ref="box"
      class="absolute box-content -translate-x-1.5 -translate-y-1.5 cursor-move touch-none rounded-sm p-1.5 outline-1 outline-dashed outline-white/90 [filter:drop-shadow(0_0_1px_rgb(0_0_0/0.9))] focus-visible:outline-2 focus-visible:outline-solid"
      :style="boxStyle"
      role="button"
      tabindex="0"
      :aria-label="t('catalog.lightbox.moveText')"
      aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
      data-testid="image-viewer-text-box"
      @keydown="nudge"
      @pointerdown.stop="beginDrag"
      @pointermove="moveDrag"
      @pointerup="endDrag"
      @pointercancel="endDrag"
    >
      <span class="pointer-events-none absolute bottom-full left-1/2 h-4 border-l border-dashed border-white/90" aria-hidden="true" />
      <span
        class="absolute bottom-full left-1/2 mb-4 size-4 -translate-x-1/2 cursor-grab rounded-full border-2 border-black/40 bg-white pointer-coarse:size-6"
        data-testid="image-viewer-text-rotate"
        @pointerdown.stop="beginTurn"
        @pointermove="moveTurn"
        @pointerup="endTurn"
        @pointercancel="endTurn"
      />
    </div>
  </Teleport>
  <LightboxModeShell
    :label="t('catalog.lightbox.text')"
    :confirm-disabled="blank"
    @cancel="emit('cancel')"
    @confirm="emit('apply', ops)"
  >
    <template #panel>
      <div class="flex flex-col gap-1.5">
        <textarea
          ref="input"
          v-model="text"
          :rows="inputRows"
          class="block w-full resize-none rounded-2xl border border-white/20 bg-black/40 px-3.5 py-2 text-base/6 text-white outline-none placeholder:text-white/40 focus-visible:ring-2 focus-visible:ring-white/70 sm:text-sm/6"
          :placeholder="t('catalog.lightbox.textPlaceholder')"
          :aria-label="t('catalog.lightbox.text')"
          autocomplete="off"
          data-testid="image-viewer-text-input"
        />
        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <LightboxColorSwatches v-model="color" />
          <div class="flex shrink-0 items-center gap-0.5" role="group" :aria-label="t('catalog.lightbox.textStyle')">
            <LightboxToolButton
              variant="icon-chip"
              :pressed="bold"
              :aria-label="t('catalog.lightbox.bold')"
              :title="t('catalog.lightbox.bold')"
              data-text-style="bold"
              @click="bold = !bold"
            >
              <LucideBold class="size-4" />
            </LightboxToolButton>
            <LightboxToolButton
              variant="icon-chip"
              :pressed="italic"
              :aria-label="t('catalog.lightbox.italic')"
              :title="t('catalog.lightbox.italic')"
              data-text-style="italic"
              @click="italic = !italic"
            >
              <LucideItalic class="size-4" />
            </LightboxToolButton>
          </div>
          <div class="flex shrink-0 items-center gap-0.5" role="group" :aria-label="t('catalog.lightbox.textAlign')">
            <LightboxToolButton
              v-for="option in IMAGE_TEXT_ALIGNS"
              :key="option"
              variant="icon-chip"
              :pressed="align === option"
              :aria-label="t(`catalog.lightbox.textAligns.${option}`)"
              :title="t(`catalog.lightbox.textAligns.${option}`)"
              :data-text-align="option"
              @click="selectAlign(option)"
            >
              <component :is="ALIGN_ICONS[option]" class="size-4" />
            </LightboxToolButton>
          </div>
          <div class="flex shrink-0 items-center gap-0.5" role="group" :aria-label="t('catalog.lightbox.textFont')">
            <LightboxToolButton
              v-for="option in TEXT_FONTS"
              :key="option.key"
              variant="chip"
              :pressed="font === option.key"
              :style="{ fontFamily: option.family }"
              :data-text-font="option.key"
              @click="font = option.key"
            >
              {{ t(`catalog.lightbox.textFonts.${option.key}`) }}
            </LightboxToolButton>
          </div>
          <div class="flex shrink-0 items-center gap-0.5" role="group" :aria-label="t('catalog.lightbox.textEffect')">
            <LightboxToolButton
              v-for="option in TEXT_EFFECTS"
              :key="option"
              variant="chip"
              :pressed="effect === option"
              :data-text-effect="option"
              @click="effect = option"
            >
              {{ t(`catalog.lightbox.textEffects.${option}`) }}
            </LightboxToolButton>
          </div>
        </div>
        <LightboxSlider
          v-model="sizeModel"
          :label="t('catalog.lightbox.textSize')"
          :min="sizeRange.min"
          :max="sizeRange.max"
          :readout="String(fontSize)"
          :reset-to="sizeRange.initial"
          :reset-label="t('common.reset')"
          data-testid="image-viewer-text-size"
        />
        <LightboxSlider
          v-model="rotation"
          :label="t('catalog.lightbox.textRotation')"
          :min="TEXT_ROTATION_RANGE.min"
          :max="TEXT_ROTATION_RANGE.max"
          :step="TEXT_ROTATION_RANGE.step"
          :readout="formatSignedValue(rotation, '°')"
          :reset-label="t('catalog.lightbox.resetValue')"
          data-testid="image-viewer-text-rotation"
        />
      </div>
    </template>
  </LightboxModeShell>
</template>
