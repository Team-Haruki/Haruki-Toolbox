<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import type { ImageEditOp } from "image-edit-kit"
import { STRAIGHTEN_RANGE, formatSignedValue } from "@/lib/image-lightbox"
import LightboxModeShell from "./LightboxModeShell.vue"
import LightboxSlider from "./LightboxSlider.vue"

/** Straighten: tilts the picture up to 45° either way, trimming the corners. */
const emit = defineEmits<{
  draft: [ops: ImageEditOp[]]
  apply: [ops: ImageEditOp[]]
  cancel: []
}>()

const { t } = useI18n()

const degrees = ref(0)
const ops = computed<ImageEditOp[]>(() => (degrees.value === 0 ? [] : [{ kind: "straighten", degrees: degrees.value }]))

watch(ops, (value) => emit("draft", value))
</script>

<template>
  <LightboxModeShell
    :label="t('catalog.lightbox.straighten')"
    :confirm-disabled="ops.length === 0"
    @cancel="emit('cancel')"
    @confirm="emit('apply', ops)"
  >
    <template #panel>
      <LightboxSlider
        v-model="degrees"
        :label="t('catalog.lightbox.angle')"
        :min="STRAIGHTEN_RANGE.min"
        :max="STRAIGHTEN_RANGE.max"
        :step="STRAIGHTEN_RANGE.step"
        :readout="formatSignedValue(degrees, '°')"
        :reset-label="t('catalog.lightbox.resetValue')"
        data-testid="image-viewer-straighten-slider"
      />
    </template>
  </LightboxModeShell>
</template>
