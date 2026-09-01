<script setup lang="ts">
import { computed } from "vue"
import { useRankBorderContext } from "../composables/rank-border-context"

/**
 * Leaf renderer for "N seconds/minutes ago" labels. It is the only leaderboard
 * node that subscribes to the shared clock, so a clock tick re-renders these
 * tiny spans instead of the whole list.
 */
const props = defineProps<{ timestamp: number | null }>()

const { ui } = useRankBorderContext()

const label = computed(() => ui.formatElapsed(ui.elapsedSince(props.timestamp)))
</script>

<template>
  <span>{{ label }}</span>
</template>
