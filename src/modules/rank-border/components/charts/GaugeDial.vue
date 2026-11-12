<script setup lang="ts">
import { computed, onMounted, ref } from "vue"

/**
 * A half-circle dial: the arc fills to `ratio` of the scale and an optional
 * tick marks a reference point on it (an average, a target). The figure
 * itself goes in the default slot and sits in the dial's mouth; the scale's
 * ends are labelled underneath. The fill sweeps in once on mount.
 */
const props = defineProps<{
  /** 0–1 of the scale; null draws the empty track. */
  ratio: number | null
  /** 0–1 position of the reference tick. */
  marker?: number | null
  minLabel: string
  maxLabel: string
  /** What the dial says, for screen readers. */
  label: string
}>()

const RADIUS = 84
const ARC_LENGTH = Math.PI * RADIUS

const mounted = ref(false)
onMounted(() => {
  requestAnimationFrame(() => {
    mounted.value = true
  })
})

const clamp = (value: number) => Math.min(1, Math.max(0, value))
const fill = computed(() => clamp(props.ratio ?? 0))
const dashOffset = computed(() => ARC_LENGTH * (1 - (mounted.value ? fill.value : 0)))

const markerLine = computed(() => {
  if (props.marker == null) {
    return null
  }
  const angle = Math.PI * clamp(props.marker)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x1: 100 - (RADIUS - 11) * cos,
    y1: 100 - (RADIUS - 11) * sin,
    x2: 100 - (RADIUS + 11) * cos,
    y2: 100 - (RADIUS + 11) * sin,
  }
})
</script>

<template>
  <div role="img" :aria-label="label">
    <div class="relative">
      <svg viewBox="0 0 200 110" class="block w-full" aria-hidden="true">
        <path d="M 16 100 A 84 84 0 0 1 184 100" fill="none" class="stroke-muted" stroke-width="14" stroke-linecap="round" />
        <path
          v-if="fill > 0"
          d="M 16 100 A 84 84 0 0 1 184 100"
          fill="none"
          class="gauge-dial__value stroke-primary"
          stroke-width="14"
          stroke-linecap="round"
          :stroke-dasharray="ARC_LENGTH"
          :stroke-dashoffset="dashOffset"
        />
        <template v-if="markerLine">
          <line v-bind="markerLine" class="stroke-card" stroke-width="6" stroke-linecap="round" />
          <line v-bind="markerLine" class="stroke-foreground" stroke-width="2" stroke-linecap="round" />
        </template>
      </svg>
      <div class="absolute inset-x-0 bottom-0 flex flex-col items-center px-8 text-center">
        <slot />
      </div>
    </div>
    <div class="mt-1 flex justify-between px-1 text-[10px] tabular-nums text-muted-foreground" aria-hidden="true">
      <span>{{ minLabel }}</span>
      <span>{{ maxLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.gauge-dial__value {
  transition: stroke-dashoffset 800ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .gauge-dial__value {
    transition: none;
  }
}
</style>
