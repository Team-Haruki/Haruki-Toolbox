<script setup lang="ts">
/**
 * One line of text that scrolls sideways only when it does not fit, the way a
 * player shows a long title. It loops with a pause at the start; text that
 * fits stays still. With reduced motion (the system's, or the site's low
 * effects mode) it falls back to an ellipsis.
 */
import { computed, nextTick, onMounted, ref, watch } from "vue"
import { usePreferredReducedMotion, useResizeObserver } from "@vueuse/core"
import { useSettingsStore } from "@/shared/stores/settings"

const props = withDefaults(defineProps<{
  text: string
  /** Scroll speed in px per second. */
  speed?: number
}>(), {
  speed: 32,
})

/** Gap between the end of the text and its repeat, in px. */
const GAP = 48

const settingsStore = useSettingsStore()
const reducedMotion = usePreferredReducedMotion()
const container = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const contentWidth = ref(0)
const overflowing = ref(false)

function measure() {
  const box = container.value
  const text = content.value
  if (!box || !text) {
    return
  }
  // An inline element has no scrollWidth; its box is the full, unclipped line.
  const width = Math.ceil(text.getBoundingClientRect().width)
  contentWidth.value = width
  overflowing.value = width > box.clientWidth + 1
}

onMounted(measure)
useResizeObserver(container, measure)
watch(() => props.text, () => {
  void nextTick(measure)
})

const scrolling = computed(() => (
  overflowing.value && reducedMotion.value !== "reduce" && !settingsStore.reducedVisualEffects
))
const trackStyle = computed(() => (scrolling.value
  ? {
      "--marquee-shift": `${contentWidth.value + GAP}px`,
      "--marquee-duration": `${Math.max(6, (contentWidth.value + GAP) / props.speed)}s`,
    }
  : undefined))
</script>

<template>
  <span
    ref="container"
    :class="['block min-w-0 overflow-hidden whitespace-nowrap', scrolling ? 'marquee-mask' : 'text-ellipsis']"
    :title="overflowing ? text : undefined"
    data-slot="marquee-text"
    :data-scrolling="scrolling ? 'true' : undefined"
  >
    <span :class="scrolling ? 'marquee-track inline-flex' : 'inline'" :style="trackStyle">
      <span ref="content" :class="scrolling ? 'shrink-0' : ''">{{ text }}</span>
      <span v-if="scrolling" class="shrink-0" :style="{ paddingLeft: `${GAP}px` }" aria-hidden="true">{{ text }}</span>
    </span>
  </span>
</template>

<style scoped>
.marquee-track {
  animation: marquee-scroll var(--marquee-duration) linear infinite;
  will-change: transform;
}

/* A soft right edge: the text visibly continues. The left edge stays sharp,
   or the first letter would sit under the fade while the text is at rest. */
.marquee-mask {
  mask-image: linear-gradient(to right, #000 calc(100% - 1rem), transparent);
}

/* Holds at the start, then travels exactly one text-plus-gap: the repeat
   lands where the original was, so the loop is seamless. */
@keyframes marquee-scroll {
  0%,
  14% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(calc(-1 * var(--marquee-shift)));
  }
}
</style>
