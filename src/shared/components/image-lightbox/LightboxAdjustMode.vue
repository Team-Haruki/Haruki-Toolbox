<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import type { ImageEditOp } from "image-edit-kit"
import {
  ADJUST_KEYS,
  ADJUST_RANGE,
  IMAGE_LOOKS,
  NEUTRAL_ADJUST_VALUES,
  buildAdjustOps,
  formatSignedValue,
  type AdjustValues,
  type ImageLook,
} from "@/lib/image-lightbox"
import LightboxModeShell from "./LightboxModeShell.vue"
import LightboxSlider from "./LightboxSlider.vue"
import LightboxToolButton from "./LightboxToolButton.vue"

/** Adjust: brightness, contrast, saturation and temperature, then an optional look over them. */
const emit = defineEmits<{
  draft: [ops: ImageEditOp[]]
  apply: [ops: ImageEditOp[]]
  cancel: []
}>()

const { t } = useI18n()

const values = reactive<AdjustValues>({ ...NEUTRAL_ADJUST_VALUES })
const look = ref<ImageLook>("none")
const ops = computed(() => buildAdjustOps(values, look.value))

watch(ops, (value) => emit("draft", value))
</script>

<template>
  <LightboxModeShell
    :label="t('catalog.lightbox.adjust')"
    :confirm-disabled="ops.length === 0"
    @cancel="emit('cancel')"
    @confirm="emit('apply', ops)"
  >
    <template #panel>
      <div class="flex flex-col gap-1">
        <LightboxSlider
          v-for="key in ADJUST_KEYS"
          :key="key"
          v-model="values[key]"
          :label="t(`catalog.lightbox.adjustments.${key}`)"
          :min="ADJUST_RANGE.min"
          :max="ADJUST_RANGE.max"
          :step="ADJUST_RANGE.step"
          :readout="formatSignedValue(values[key])"
          :reset-label="t('catalog.lightbox.resetValue')"
          :data-adjust="key"
        />
        <div class="mt-1 flex flex-wrap items-center gap-0.5" role="group" :aria-label="t('catalog.lightbox.look')">
          <LightboxToolButton
            v-for="option in IMAGE_LOOKS"
            :key="option"
            variant="chip"
            :pressed="look === option"
            :data-look="option"
            @click="look = option"
          >
            {{ t(`catalog.lightbox.looks.${option}`) }}
          </LightboxToolButton>
        </div>
      </div>
    </template>
  </LightboxModeShell>
</template>
