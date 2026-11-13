<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import {
  CROP_ASPECTS,
  fitCropRectToAspect,
  isNoopImageEditOp,
  resolveCropAspectRatio,
  type CropAspectKey,
  type ImageEditOp,
  type ImageRect,
  type ImageSize,
} from "image-edit-kit"
import LightboxModeShell from "./LightboxModeShell.vue"
import LightboxToolButton from "./LightboxToolButton.vue"

/** Crop: the selection's shape (free or a usual ratio) and its size; the selection itself is dragged on the picture. */
const props = defineProps<{
  size: ImageSize
}>()

const emit = defineEmits<{
  apply: [ops: ImageEditOp[]]
  cancel: []
}>()

const rect = defineModel<ImageRect>("rect", { required: true })
/** Width : height the selection is locked to, for the overlay's handles. */
const ratio = defineModel<number | null>("ratio", { default: null })

const { t } = useI18n()

const aspect = ref<CropAspectKey>("free")
const op = computed<ImageEditOp>(() => ({ kind: "crop", rect: rect.value }))
const applicable = computed(() => !isNoopImageEditOp(op.value, props.size))

function selectAspect(key: CropAspectKey) {
  aspect.value = key
  const next = resolveCropAspectRatio(key)
  ratio.value = next
  if (next != null) {
    rect.value = fitCropRectToAspect(rect.value, next, props.size)
  }
}
</script>

<template>
  <LightboxModeShell
    :label="t('catalog.lightbox.crop')"
    :confirm-label="t('catalog.lightbox.applyCrop')"
    :confirm-disabled="!applicable"
    confirm-testid="image-viewer-crop-apply"
    @cancel="emit('cancel')"
    @confirm="emit('apply', [op])"
  >
    <div class="flex shrink-0 items-center" role="group" :aria-label="t('catalog.lightbox.cropAspect')">
      <LightboxToolButton
        v-for="option in CROP_ASPECTS"
        :key="option.key"
        variant="chip"
        :pressed="aspect === option.key"
        :data-aspect="option.key"
        @click="selectAspect(option.key)"
      >
        {{ option.key === "free" ? t("catalog.lightbox.cropFree") : option.key }}
      </LightboxToolButton>
    </div>
    <span class="mx-1 h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />
    <p class="shrink-0 px-2 text-xs tabular-nums text-white/70" data-testid="image-viewer-crop-size">
      {{ rect.width }} × {{ rect.height }}
    </p>
  </LightboxModeShell>
</template>
