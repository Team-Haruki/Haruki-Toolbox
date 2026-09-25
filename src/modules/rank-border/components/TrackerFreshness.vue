<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { useRankBorderContext } from "../composables/rank-border-context"
import { useNowSecond } from "../composables/useNowSecond"

/**
 * Tracker freshness next to the live status: "updated N seconds ago" from the
 * tracker's own status timestamp, recomputed every second on the client so it
 * keeps ticking between refreshes; the data's as-of time is in the tooltip.
 */
const props = defineProps<{ statusTimestamp: number | null; asOf: number | null }>()

const { t } = useI18n()
const { ui } = useRankBorderContext()
const now = useNowSecond(1_000)

const lagLabel = computed(() =>
  props.statusTimestamp ? ui.formatElapsed(Math.max(0, now.value - props.statusTimestamp)) : null,
)
const asOfTitle = computed(() =>
  props.asOf ? t("rankBorder.meta.dataAsOf", { time: ui.formatTimestamp(props.asOf) }) : undefined,
)
</script>

<template>
  <span v-if="lagLabel" class="text-xs text-muted-foreground tabular-nums" :title="asOfTitle">
    {{ t("rankBorder.meta.refreshedAt") }} {{ lagLabel }}
  </span>
</template>
