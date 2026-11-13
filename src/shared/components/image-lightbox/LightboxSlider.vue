<script setup lang="ts">
import { useId } from "vue"

/**
 * One labelled slider of a mode panel with its value on the right. With
 * `resetLabel` the value is a button that puts the slider back to `resetTo`.
 */
const props = withDefaults(defineProps<{
  label: string
  min: number
  max: number
  step?: number
  /** The value as shown ("+12.5°", "92%"). */
  readout: string
  resetTo?: number
  resetLabel?: string | null
}>(), {
  step: 1,
  resetTo: 0,
  resetLabel: null,
})

const value = defineModel<number>({ required: true })
const id = useId()

function handleInput(event: Event) {
  const next = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(next)) {
    value.value = next
  }
}
</script>

<template>
  <div class="flex items-center gap-2">
    <label :for="id" class="w-16 shrink-0 truncate text-xs text-white/70">{{ label }}</label>
    <input
      :id="id"
      type="range"
      class="h-7 min-w-0 flex-1 cursor-pointer accent-white"
      :min="min"
      :max="max"
      :step="step"
      :value="value"
      @input="handleInput"
    >
    <button
      v-if="resetLabel"
      type="button"
      class="h-7 w-14 shrink-0 rounded-full text-right text-xs tabular-nums text-white/90 outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-white/70"
      :title="resetLabel"
      :aria-label="`${label} ${readout}, ${resetLabel}`"
      data-slider-reset
      @click="value = props.resetTo"
    >
      {{ readout }}
    </button>
    <span v-else class="w-14 shrink-0 text-right text-xs tabular-nums text-white/90">{{ readout }}</span>
  </div>
</template>
