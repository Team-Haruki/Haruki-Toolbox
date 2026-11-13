<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { ANNOTATION_COLORS } from "@/lib/image-lightbox"

/** The six colours a line or a text can take. */
const color = defineModel<string>({ required: true })

const { t } = useI18n()
</script>

<template>
  <div class="flex shrink-0 items-center gap-0.5 pointer-coarse:gap-0" role="group" :aria-label="t('catalog.lightbox.color')">
    <button
      v-for="option in ANNOTATION_COLORS"
      :key="option.key"
      type="button"
      :class="[
        'flex size-8 shrink-0 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/70 pointer-coarse:size-9',
        color === option.value ? 'bg-white/25' : 'hover:bg-white/15',
      ]"
      :aria-label="t(`catalog.lightbox.colors.${option.key}`)"
      :title="t(`catalog.lightbox.colors.${option.key}`)"
      :aria-pressed="color === option.value"
      :data-color="option.key"
      @click="color = option.value"
    >
      <span
        :class="['block rounded-full border border-white/50', color === option.value ? 'size-5' : 'size-4']"
        :style="{ backgroundColor: option.value }"
        aria-hidden="true"
      />
    </button>
  </div>
</template>
