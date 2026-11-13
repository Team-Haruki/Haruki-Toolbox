<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import type { ImageEditOp, ImageRect, ImageSize } from "image-edit-kit"
import { MASK_KINDS, MASK_STRENGTH, buildMaskOp, type MaskKind } from "@/lib/image-lightbox"
import LightboxModeShell from "./LightboxModeShell.vue"
import LightboxSlider from "./LightboxSlider.vue"
import LightboxToolButton from "./LightboxToolButton.vue"

/** Mask: a mosaic or a blur over the region selected on the picture. */
const props = defineProps<{
  size: ImageSize
}>()

const emit = defineEmits<{
  draft: [ops: ImageEditOp[]]
  apply: [ops: ImageEditOp[]]
  cancel: []
}>()

const rect = defineModel<ImageRect>("rect", { required: true })

const { t } = useI18n()

const kind = ref<MaskKind>("pixelate")
const strength = ref<number>(MASK_STRENGTH.initial)
const ops = computed(() => [buildMaskOp(kind.value, strength.value, rect.value, props.size)])

watch(ops, (value) => emit("draft", value), { immediate: true })
</script>

<template>
  <LightboxModeShell
    :label="t('catalog.lightbox.mask')"
    @cancel="emit('cancel')"
    @confirm="emit('apply', ops)"
  >
    <template #panel>
      <LightboxSlider
        v-model="strength"
        :label="t('catalog.lightbox.strength')"
        :min="MASK_STRENGTH.min"
        :max="MASK_STRENGTH.max"
        :step="MASK_STRENGTH.step"
        :readout="String(strength)"
        data-testid="image-viewer-mask-strength"
      />
    </template>
    <div class="flex shrink-0 items-center" role="group" :aria-label="t('catalog.lightbox.maskKind')">
      <LightboxToolButton
        v-for="option in MASK_KINDS"
        :key="option"
        variant="chip"
        :pressed="kind === option"
        :data-mask="option"
        @click="kind = option"
      >
        {{ t(`catalog.lightbox.maskKinds.${option}`) }}
      </LightboxToolButton>
    </div>
    <span class="mx-1 h-5 w-px shrink-0 bg-white/20" aria-hidden="true" />
  </LightboxModeShell>
</template>
