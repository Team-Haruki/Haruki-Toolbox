<script setup lang="ts">
import { computed, onMounted, ref } from "vue"

/**
 * A small ring that fills to a share of the whole; the figure goes in the
 * default slot, in the ring's centre. Fills once on mount.
 */
const props = defineProps<{
  /** 0–1; null draws the empty track. */
  ratio: number | null
  label: string
}>()

const RADIUS = 32
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const mounted = ref(false)
onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true
  })
})

const fill = computed(() => Math.min(1, Math.max(0, props.ratio ?? 0)))
const dashOffset = computed(() => CIRCUMFERENCE * (1 - (mounted.value ? fill.value : 0)))
</script>

<template>
  <div class="relative" role="img" :aria-label="label">
    <svg viewBox="0 0 80 80" class="block size-full -rotate-90" aria-hidden="true">
      <circle cx="40" cy="40" :r="RADIUS" fill="none" class="stroke-muted" stroke-width="8" />
      <circle
        v-if="fill > 0"
        cx="40"
        cy="40"
        :r="RADIUS"
        fill="none"
        class="ring-gauge__value stroke-primary"
        stroke-width="8"
        stroke-linecap="round"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="dashOffset"
      />
    </svg>
    <div class="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ring-gauge__value {
  transition: stroke-dashoffset 800ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .ring-gauge__value {
    transition: none;
  }
}
</style>
