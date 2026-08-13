<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { useRankBorderContext } from "../composables/rank-border-context"
import type { DetailState } from "../lib/rank-border-types"

const { t } = useI18n()

defineProps<{ activeDetail: DetailState }>()

const { detail, ui } = useRankBorderContext()

const {
  detailTraceStats,
  comparisonRank,
  comparisonStatLines,
  previousDetailLabel,
  nextDetailLabel,
} = detail
const {
  formatPt,
  formatGrowth,
  formatPerHour,
  formatLoopCount,
  formatRankShift,
} = ui
</script>

<template>
  <section class="rank-border-detail-stats rounded-md border bg-muted/15 p-2 sm:p-3">
    <div class="rank-border-stat">
      <p>{{ t("rankBorder.result.hourlySpeed") }}</p>
      <strong>{{ formatPerHour(detailTraceStats.hourlySpeed) }}</strong>
      <span v-if="comparisonStatLines" class="rank-border-stat__comparison">
        <span>T{{ comparisonRank }} {{ comparisonStatLines.hourlySpeed.value }}</span>
        <span
          v-if="comparisonStatLines.hourlySpeed.tone"
          :class="comparisonStatLines.hourlySpeed.tone === 'up' ? 'text-emerald-500' : 'text-red-500'"
        >
          {{ comparisonStatLines.hourlySpeed.tone === "up" ? "▲" : "▼" }} {{ comparisonStatLines.hourlySpeed.diff }}
        </span>
      </span>
    </div>
    <div class="rank-border-stat">
      <p>{{ t("rankBorder.result.recentAveragePt") }}</p>
      <strong>{{ formatPt(detailTraceStats.recentAveragePt) }}</strong>
      <span v-if="comparisonStatLines" class="rank-border-stat__comparison">
        <span>T{{ comparisonRank }} {{ comparisonStatLines.recentAveragePt.value }}</span>
        <span
          v-if="comparisonStatLines.recentAveragePt.tone"
          :class="comparisonStatLines.recentAveragePt.tone === 'up' ? 'text-emerald-500' : 'text-red-500'"
        >
          {{ comparisonStatLines.recentAveragePt.tone === "up" ? "▲" : "▼" }} {{ comparisonStatLines.recentAveragePt.diff }}
        </span>
      </span>
    </div>
    <div class="rank-border-stat">
      <p>{{ t("rankBorder.result.latestPointGrowth") }}</p>
      <strong>{{ formatGrowth(detailTraceStats.latestPointGrowth) }}</strong>
      <span v-if="comparisonStatLines" class="rank-border-stat__comparison">
        <span>T{{ comparisonRank }} {{ comparisonStatLines.latestPointGrowth.value }}</span>
        <span
          v-if="comparisonStatLines.latestPointGrowth.tone"
          :class="comparisonStatLines.latestPointGrowth.tone === 'up' ? 'text-emerald-500' : 'text-red-500'"
        >
          {{ comparisonStatLines.latestPointGrowth.tone === "up" ? "▲" : "▼" }} {{ comparisonStatLines.latestPointGrowth.diff }}
        </span>
      </span>
    </div>
    <div class="rank-border-stat">
      <p>{{ t("rankBorder.result.twentyMinTripleSpeed") }}</p>
      <strong>{{ formatPerHour(detailTraceStats.threeWindowSpeed) }}</strong>
      <span v-if="comparisonStatLines" class="rank-border-stat__comparison">
        <span>T{{ comparisonRank }} {{ comparisonStatLines.threeWindowSpeed.value }}</span>
        <span
          v-if="comparisonStatLines.threeWindowSpeed.tone"
          :class="comparisonStatLines.threeWindowSpeed.tone === 'up' ? 'text-emerald-500' : 'text-red-500'"
        >
          {{ comparisonStatLines.threeWindowSpeed.tone === "up" ? "▲" : "▼" }} {{ comparisonStatLines.threeWindowSpeed.diff }}
        </span>
      </span>
    </div>
    <div class="rank-border-stat">
      <p>{{ t("rankBorder.result.loopCount") }}</p>
      <strong>{{ formatLoopCount(detailTraceStats.loopCount) }}</strong>
      <span v-if="comparisonStatLines" class="rank-border-stat__comparison">
        <span>T{{ comparisonRank }} {{ comparisonStatLines.loopCount.value }}</span>
        <span
          v-if="comparisonStatLines.loopCount.tone"
          :class="comparisonStatLines.loopCount.tone === 'up' ? 'text-emerald-500' : 'text-red-500'"
        >
          {{ comparisonStatLines.loopCount.tone === "up" ? "▲" : "▼" }} {{ comparisonStatLines.loopCount.diff }}
        </span>
      </span>
    </div>
    <div class="rank-border-stat">
      <p>{{ t("rankBorder.result.rankShift") }}</p>
      <strong>{{ formatRankShift(detailTraceStats.rankShift) }}</strong>
    </div>
    <div class="rank-border-stat">
      <p>{{ previousDetailLabel(activeDetail) }}</p>
      <strong>{{ formatGrowth(detailTraceStats.previousGap) }}</strong>
    </div>
    <div class="rank-border-stat">
      <p>{{ nextDetailLabel(activeDetail) }}</p>
      <strong>{{ formatGrowth(detailTraceStats.nextGap) }}</strong>
    </div>
  </section>
</template>

<style scoped>
.rank-border-detail-stats {
  display: grid;
  grid-area: stats;
  min-width: 0;
  min-height: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-self: start;
  align-content: start;
  gap: 0.5rem;
  overflow: hidden;
}

.rank-border-stat {
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background: color-mix(in oklab, var(--background) 74%, transparent);
  padding: 0.5rem;
}

.rank-border-stat__comparison {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 0.125rem 0.375rem;
  margin-top: 0.25rem;
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  color: var(--muted-foreground);
}

.rank-border-stat p {
  overflow: hidden;
  color: var(--muted-foreground);
  font-size: 0.75rem;
  line-height: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-stat strong {
  display: block;
  overflow: hidden;
  margin-top: 0.25rem;
  font-size: 0.9375rem;
  font-variant-numeric: tabular-nums;
  font-weight: 650;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 768px) and (max-width: 1180px) {
  .rank-border-detail-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.375rem;
    padding: 0.75rem;
  }

  .rank-border-stat {
    padding: 0.4375rem;
  }

  .rank-border-stat p {
    font-size: 0.6875rem;
  }

  .rank-border-stat strong {
    margin-top: 0.125rem;
    font-size: 0.8125rem;
  }
}

@media (min-width: 768px) and (max-width: 900px) {
  .rank-border-detail-stats {
    min-height: auto;
    overflow: visible;
  }
}

@media (min-width: 768px) and (max-height: 840px) {
  .rank-border-detail-stats {
    padding: 0.625rem;
  }
}

@media (max-width: 767px) {
  .rank-border-detail-stats {
    min-height: auto;
    overflow: visible;
  }

  .rank-border-detail-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-content: start;
    padding: 0.5rem;
  }

  .rank-border-stat {
    padding: 0.4375rem;
  }

  .rank-border-stat p {
    font-size: 0.6875rem;
  }

  .rank-border-stat strong {
    font-size: 0.8125rem;
  }
}
</style>
