<script setup lang="ts">
import type { Component } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideCrop,
  LucideDownload,
  LucideFlipHorizontal2,
  LucideFlipVertical2,
  LucideGrid3x3,
  LucideImageDown,
  LucideListRestart,
  LucidePencilLine,
  LucideRedo2,
  LucideRotateCcw,
  LucideRotateCw,
  LucideRuler,
  LucideSlidersHorizontal,
  LucideType,
  LucideUndo2,
} from "lucide-vue-next"
import type { ImageEditOp } from "image-edit-kit"
import type { ImageLightboxMode } from "@/lib/image-lightbox"
import LightboxModeShell from "./LightboxModeShell.vue"
import LightboxToolButton from "./LightboxToolButton.vue"

/**
 * The viewer's bar when no mode is open: the one-press edits, the modes,
 * the history, and the two ways to save.
 */
defineProps<{
  /** The picture is decoded and can be edited. */
  ready: boolean
  edited: boolean
  canUndo: boolean
  canRedo: boolean
}>()

const emit = defineEmits<{
  op: [op: ImageEditOp]
  mode: [mode: ImageLightboxMode]
  undo: []
  redo: []
  reset: []
  saveOriginal: []
}>()

const { t } = useI18n()

const INSTANT_TOOLS: readonly { key: string; testid: string; icon: Component; op: ImageEditOp }[] = [
  { key: "rotateLeft", testid: "image-viewer-rotate-left", icon: LucideRotateCcw, op: { kind: "rotate", turns: -1 } },
  { key: "rotateRight", testid: "image-viewer-rotate-right", icon: LucideRotateCw, op: { kind: "rotate", turns: 1 } },
  { key: "flipHorizontal", testid: "image-viewer-flip-horizontal", icon: LucideFlipHorizontal2, op: { kind: "flip", axis: "horizontal" } },
  { key: "flipVertical", testid: "image-viewer-flip-vertical", icon: LucideFlipVertical2, op: { kind: "flip", axis: "vertical" } },
]

const MODE_TOOLS: readonly { mode: ImageLightboxMode; testid: string; icon: Component }[] = [
  { mode: "crop", testid: "image-viewer-crop-start", icon: LucideCrop },
  { mode: "straighten", testid: "image-viewer-straighten-start", icon: LucideRuler },
  { mode: "adjust", testid: "image-viewer-adjust-start", icon: LucideSlidersHorizontal },
  { mode: "mask", testid: "image-viewer-mask-start", icon: LucideGrid3x3 },
  { mode: "draw", testid: "image-viewer-draw-start", icon: LucidePencilLine },
  { mode: "text", testid: "image-viewer-text-start", icon: LucideType },
]
</script>

<template>
  <LightboxModeShell :label="t('catalog.lightbox.tools')" plain>
    <LightboxToolButton
      v-for="tool in INSTANT_TOOLS"
      :key="tool.key"
      :disabled="!ready"
      :aria-label="t(`catalog.lightbox.${tool.key}`)"
      :title="t(`catalog.lightbox.${tool.key}`)"
      :data-testid="tool.testid"
      @click="emit('op', tool.op)"
    >
      <component :is="tool.icon" class="size-4.5" />
    </LightboxToolButton>
    <span class="mx-1 h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />
    <LightboxToolButton
      v-for="tool in MODE_TOOLS"
      :key="tool.mode"
      :disabled="!ready"
      :aria-label="t(`catalog.lightbox.${tool.mode}`)"
      :title="t(`catalog.lightbox.${tool.mode}`)"
      :data-testid="tool.testid"
      @click="emit('mode', tool.mode)"
    >
      <component :is="tool.icon" class="size-4.5" />
    </LightboxToolButton>
    <span class="mx-1 h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />
    <LightboxToolButton :disabled="!ready || !canUndo" :aria-label="t('catalog.lightbox.undo')" :title="t('catalog.lightbox.undo')" data-testid="image-viewer-undo" @click="emit('undo')">
      <LucideUndo2 class="size-4.5" />
    </LightboxToolButton>
    <LightboxToolButton :disabled="!ready || !canRedo" :aria-label="t('catalog.lightbox.redo')" :title="t('catalog.lightbox.redo')" data-testid="image-viewer-redo" @click="emit('redo')">
      <LucideRedo2 class="size-4.5" />
    </LightboxToolButton>
    <LightboxToolButton :disabled="!ready || !edited" :aria-label="t('catalog.lightbox.reset')" :title="t('catalog.lightbox.reset')" data-testid="image-viewer-reset" @click="emit('reset')">
      <LucideListRestart class="size-4.5" />
    </LightboxToolButton>
    <span class="mx-1 h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />
    <LightboxToolButton variant="text" :disabled="!ready" data-testid="image-viewer-save-original" @click="emit('saveOriginal')">
      <LucideDownload class="size-4" aria-hidden="true" />
      {{ t("catalog.lightbox.saveOriginal") }}
    </LightboxToolButton>
    <LightboxToolButton :variant="edited ? 'primary' : 'text'" :disabled="!ready" data-testid="image-viewer-export" @click="emit('mode', 'export')">
      <LucideImageDown class="size-4" aria-hidden="true" />
      {{ t("catalog.lightbox.export") }}
    </LightboxToolButton>
  </LightboxModeShell>
</template>
