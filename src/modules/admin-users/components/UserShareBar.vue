<script setup lang="ts">
import { onMounted, ref } from "vue"

/**
 * A word-sized share bar for a stat tile: how much of a whole something is
 * (successful uploads of all uploads). It grows to its share once when it
 * appears, and simply shows it with "reduce motion" on. `label` is what
 * assistive tech reads, e.g. "83.3% succeeded".
 */
defineProps<{
  /** 0–100. */
  percent: number
  label: string
}>()

// Starts empty and takes its share on the next frame, so the width
// transition plays once on mount and again when the share changes.
const grown = ref(false)
onMounted(() => {
  requestAnimationFrame(() => {
    grown.value = true
  })
})
</script>

<template>
  <span
    class="block h-1.5 w-12 overflow-hidden rounded-full bg-muted"
    role="img"
    :aria-label="label"
    :title="label"
    data-slot="user-share-bar"
  >
    <span
      class="block h-full rounded-full bg-emerald-500 transition-[width] duration-700 ease-out motion-reduce:transition-none dark:bg-emerald-400"
      :style="{ width: grown ? `${Math.min(100, Math.max(0, percent))}%` : '0%' }"
    />
  </span>
</template>
