<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { tweenValue } from "../lib/stat-visuals"

/**
 * A number that counts up to its value when it first appears and glides to
 * the new value when the data refreshes. With "reduce motion" on it simply
 * shows the value. The final text is always the exact formatted value.
 *
 *   <AdminAnimatedNumber :value="total" />
 *   <AdminAnimatedNumber :value="rate" :format="(n) => `${n.toFixed(1)}%`" />
 */
const props = withDefaults(defineProps<{
  value: number
  /** Formats the number on every frame. Defaults to the locale's grouping, whole numbers. */
  format?: (value: number) => string
  /** Milliseconds for the count. */
  duration?: number
}>(), {
  format: undefined,
  duration: 700,
})

const { locale } = useI18n()
const shown = ref(0)
let frame = 0

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
}

function animateTo(target: number) {
  cancelAnimationFrame(frame)
  const from = shown.value
  if (prefersReducedMotion() || from === target || !Number.isFinite(target) || props.duration <= 0) {
    shown.value = target
    return
  }

  const startedAt = performance.now()
  const step = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / props.duration)
    shown.value = progress >= 1 ? target : tweenValue(from, target, progress)
    if (progress < 1) {
      frame = requestAnimationFrame(step)
    }
  }
  frame = requestAnimationFrame(step)
}

onMounted(() => animateTo(props.value))
watch(() => props.value, (value) => animateTo(value))
onBeforeUnmount(() => cancelAnimationFrame(frame))

const text = computed(() => {
  if (props.format) {
    return props.format(shown.value)
  }
  // Whole numbers while counting: "1,203.4871" flickering past reads as a glitch.
  return new Intl.NumberFormat(locale.value, { maximumFractionDigits: 0 }).format(shown.value)
})
</script>

<template>
  <span class="tabular-nums" data-slot="admin-animated-number">{{ text }}</span>
</template>
