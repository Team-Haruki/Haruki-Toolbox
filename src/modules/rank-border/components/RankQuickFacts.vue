<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { ChartLine } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { useRankBorderContext } from "../composables/rank-border-context"
import type { RankBorderQuickFacts } from "../lib/rank-border-types"
import RelativeTime from "./RelativeTime.vue"

/**
 * Inline quick-view card under a leaderboard row. Every number here comes from
 * the already-loaded overview payload — expanding a row costs zero requests;
 * deep analysis lives on the standalone detail page.
 */
const props = defineProps<{ facts: RankBorderQuickFacts }>()

const { t } = useI18n()
const { ui } = useRankBorderContext()
const { openDetailPage } = ui

function openFullDetail() {
  openDetailPage(props.facts.kind === "line"
    ? { kind: "line", rank: props.facts.rank }
    : { kind: "rank", rank: props.facts.rank })
}
</script>

<template>
  <div class="rank-border-quick-facts">
    <div class="rank-border-quick-facts__metrics">
      <div>
        <span>{{ t("rankBorder.result.score") }}</span>
        <strong>{{ facts.scoreLabel }}</strong>
      </div>
      <div>
        <span>{{ t("rankBorder.result.latestPlain") }}</span>
        <strong><RelativeTime :timestamp="facts.timestamp" /></strong>
      </div>
      <div v-if="facts.hourlySpeedLabel">
        <span>{{ t("rankBorder.result.hourlySpeed") }}</span>
        <strong>{{ facts.hourlySpeedLabel }}</strong>
      </div>
      <div v-if="facts.playerGrowthLabel">
        <span>{{ t("rankBorder.result.playerGrowthShort") }}</span>
        <strong :class="facts.playerGrowthPositive ? 'text-emerald-600 dark:text-emerald-300' : ''">{{ facts.playerGrowthLabel }}</strong>
      </div>
      <div v-if="facts.rankGrowthLabel">
        <span>{{ facts.kind === "line" ? t("rankBorder.table.growth") : t("rankBorder.result.rankGrowthShort") }}</span>
        <strong :class="facts.rankGrowthPositive ? 'text-emerald-600 dark:text-emerald-300' : ''">{{ facts.rankGrowthLabel }}</strong>
      </div>
      <div v-if="facts.prevGapLabel">
        <span>{{ facts.prevLabel }}</span>
        <strong>{{ facts.prevGapLabel }}</strong>
      </div>
      <div v-if="facts.nextGapLabel">
        <span>{{ facts.nextLabel }}</span>
        <strong>{{ facts.nextGapLabel }}</strong>
      </div>
    </div>
    <div class="rank-border-quick-facts__actions">
      <Button type="button" size="sm" class="h-8" @click.stop="openFullDetail">
        <ChartLine class="size-4" />
        {{ t("rankBorder.actions.openDetailPage") }}
      </Button>
    </div>
  </div>
</template>

<style scoped>
.rank-border-quick-facts {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 0.625rem;
  border-top: 1px solid color-mix(in oklab, var(--border) 72%, transparent);
  background: color-mix(in oklab, var(--muted) 30%, transparent);
  padding: 0.625rem 0.75rem 0.75rem;
}

.rank-border-quick-facts__metrics {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
  gap: 0.375rem;
}

.rank-border-quick-facts__metrics div {
  min-width: 0;
  border: 1px solid color-mix(in oklab, var(--border) 78%, transparent);
  border-radius: 0.375rem;
  background: color-mix(in oklab, var(--background) 82%, transparent);
  padding: 0.45rem 0.5rem;
}

.rank-border-quick-facts__metrics span {
  display: block;
  overflow: hidden;
  color: var(--muted-foreground);
  font-size: 0.6875rem;
  line-height: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-quick-facts__metrics strong {
  display: block;
  overflow: hidden;
  margin-top: 0.125rem;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-quick-facts__actions {
  display: flex;
  align-items: flex-end;
}

@media (max-width: 520px) {
  .rank-border-quick-facts {
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
  }

  .rank-border-quick-facts__actions {
    justify-content: flex-end;
  }
}
</style>
