<script setup lang="ts">
import { computed, ref, type Component } from "vue"
import { useI18n } from "vue-i18n"
import { LucideCheck, LucideCircle, LucideMoveUpRight, LucidePencil, LucideSquare, LucideUndo2 } from "lucide-vue-next"
import { screenToImagePoint, type ImageEditOp, type ImagePoint, type ImageSize } from "image-edit-kit"
import {
  DEFAULT_ANNOTATION_COLOR,
  DRAW_TOOLS,
  SIZE_STEPS,
  buildDrawOp,
  resolveDrawWidths,
  type DrawTool,
  type SizeStep,
} from "@/lib/image-lightbox"
import type { StageDrag } from "./composables/useImageStageView"
import LightboxColorSwatches from "./LightboxColorSwatches.vue"
import LightboxModeShell from "./LightboxModeShell.vue"
import LightboxToolButton from "./LightboxToolButton.vue"

/**
 * Draw: a pen, an arrow, a box or an ellipse in one of six colours and three
 * widths. Each drag on the picture is shown while it is made and added as
 * soon as it ends, so the bar ends with Undo and Done instead of
 * Cancel / Apply.
 */
const props = defineProps<{
  size: ImageSize
  /** Where the picture is drawn on screen, for turning the pointer into image pixels. */
  frame: HTMLElement | null
  /** How wide the picture is drawn on screen, unzoomed, in CSS pixels: line widths are chosen by how they look. */
  shownWidth: number | null
  canUndo: boolean
}>()

const emit = defineEmits<{
  draft: [ops: ImageEditOp[]]
  commit: [op: ImageEditOp]
  undo: []
  done: []
}>()

const { t } = useI18n()

const TOOL_ICONS: Record<DrawTool, Component> = {
  pen: LucidePencil,
  arrow: LucideMoveUpRight,
  rect: LucideSquare,
  ellipse: LucideCircle,
}

const tool = ref<DrawTool>("pen")
const color = ref(DEFAULT_ANNOTATION_COLOR)
const widthStep = ref<SizeStep>("medium")
const widths = computed(() => resolveDrawWidths(props.size, props.shownWidth))

let points: ImagePoint[] = []

function sample(event: PointerEvent): ImagePoint | null {
  const frame = props.frame
  return frame
    ? screenToImagePoint({ x: event.clientX, y: event.clientY }, frame.getBoundingClientRect(), props.size)
    : null
}

function currentOp(): ImageEditOp | null {
  return buildDrawOp(tool.value, points, color.value, widths.value[widthStep.value])
}

function extend(event: PointerEvent) {
  const point = sample(event)
  if (!point) {
    return
  }
  points.push(point)
  const op = currentOp()
  emit("draft", op ? [op] : [])
}

const drag: StageDrag = {
  start(event) {
    points = []
    extend(event)
  },
  move: extend,
  end() {
    const op = currentOp()
    points = []
    emit("draft", [])
    if (op) {
      emit("commit", op)
    }
  },
  cancel() {
    points = []
    emit("draft", [])
  },
}

defineExpose({ drag })
</script>

<template>
  <LightboxModeShell :label="t('catalog.lightbox.draw')">
    <template #panel>
      <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <LightboxColorSwatches v-model="color" />
        <div class="flex shrink-0 items-center gap-0.5" role="group" :aria-label="t('catalog.lightbox.lineWidth')">
          <LightboxToolButton
            v-for="step in SIZE_STEPS"
            :key="step"
            variant="chip"
            :pressed="widthStep === step"
            :data-width="step"
            @click="widthStep = step"
          >
            {{ t(`catalog.lightbox.lineWidths.${step}`) }}
          </LightboxToolButton>
        </div>
      </div>
    </template>
    <div class="flex shrink-0 items-center gap-0.5" role="group" :aria-label="t('catalog.lightbox.drawTool')">
      <LightboxToolButton
        v-for="option in DRAW_TOOLS"
        :key="option"
        variant="icon-chip"
        :pressed="tool === option"
        :aria-label="t(`catalog.lightbox.drawTools.${option}`)"
        :title="t(`catalog.lightbox.drawTools.${option}`)"
        :data-tool="option"
        @click="tool = option"
      >
        <component :is="TOOL_ICONS[option]" class="size-4" />
      </LightboxToolButton>
    </div>
    <span class="mx-1 h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />
    <template #actions>
      <LightboxToolButton
        :disabled="!canUndo"
        :aria-label="t('catalog.lightbox.undo')"
        :title="t('catalog.lightbox.undo')"
        data-testid="image-viewer-draw-undo"
        @click="emit('undo')"
      >
        <LucideUndo2 class="size-4.5" />
      </LightboxToolButton>
      <LightboxToolButton variant="primary" data-testid="image-viewer-mode-confirm" @click="emit('done')">
        <LucideCheck class="size-4" aria-hidden="true" />
        {{ t("catalog.lightbox.done") }}
      </LightboxToolButton>
    </template>
  </LightboxModeShell>
</template>
