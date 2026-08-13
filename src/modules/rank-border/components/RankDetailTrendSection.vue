<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { useRankBorderContext } from "../composables/rank-border-context"
import { chartLabelTop } from "../lib/rank-border-chart"
import {
  DETAIL_CHART_HEIGHT,
  DETAIL_CHART_WIDTH,
} from "../lib/rank-border-constants"

const { t } = useI18n()

const { detail, ui } = useRankBorderContext()

const {
  detailTraceScopeLabel,
  detailTraceLoading,
  detailTraceStats,
  detailCharts,
  comparisonRank,
  chartPointStyle,
} = detail
const {
  formatPt,
  showRankBorderTooltip,
  moveRankBorderTooltip,
  hideRankBorderTooltip,
} = ui
</script>

<template>
  <section class="rank-border-trend-panel grid min-w-0 gap-2 rounded-md border bg-muted/15 p-3">
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-sm font-semibold">{{ t("rankBorder.result.trendSection") }}</h3>
      <span class="text-xs text-muted-foreground">{{ detailTraceScopeLabel }}</span>
    </div>

    <div v-if="detailTraceLoading && !detailTraceStats.hasChart" class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
      {{ t("rankBorder.result.waitingTrace") }}
    </div>
    <div v-else-if="detailTraceStats.hasChart" class="rank-border-trend-grid">
      <div class="min-h-0 rounded-md border bg-background/70 p-2.5">
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <p class="text-sm font-medium">{{ t("rankBorder.result.rtrChart") }}</p>
          <span class="text-xs text-muted-foreground">RT</span>
        </div>
        <div class="rank-border-chart-frame rank-border-chart-frame--detail">
          <div class="rank-border-chart-plot">
            <svg
              class="rank-border-chart-svg text-sky-600 dark:text-sky-300"
              :viewBox="`0 0 ${DETAIL_CHART_WIDTH} ${DETAIL_CHART_HEIGHT}`"
              preserveAspectRatio="none"
              aria-label="rank trend"
            >
              <line
                v-for="line in detailCharts.rankReferenceLines"
                :key="`dialog-rtr-grid-${line.value}`"
                class="rank-border-chart-grid"
                x1="0"
                :x2="DETAIL_CHART_WIDTH"
                :y1="line.y"
                :y2="line.y"
              />
              <path class="rank-border-detail-line" :d="detailCharts.rankPath" />
            </svg>
            <button
              v-for="point in detailCharts.rankPoints"
              :key="point.key"
              type="button"
              class="rank-border-chart-point"
              :style="chartPointStyle(point)"
              :aria-label="point.label"
              @mouseenter="showRankBorderTooltip($event, point.label)"
              @mousemove="moveRankBorderTooltip($event)"
              @mouseleave="hideRankBorderTooltip"
            />
          </div>
          <div class="rank-border-chart-labels" aria-hidden="true">
            <span
              v-for="line in detailCharts.rankReferenceLines"
              :key="`dialog-rtr-label-${line.value}`"
              class="rank-border-chart-label"
              :style="{ top: chartLabelTop(line) }"
            >
              {{ line.label }}
            </span>
          </div>
        </div>
        <div class="rank-border-chart-time-axis" aria-hidden="true">
          <span
            v-for="tick in detailCharts.timeTicks"
            :key="tick.key"
            :style="{ left: tick.left }"
          >
            {{ tick.label }}
          </span>
        </div>
      </div>

      <div class="min-h-0 rounded-md border bg-background/70 p-2.5">
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <p class="text-sm font-medium">{{ t("rankBorder.result.ptrChart") }}</p>
          <span class="text-xs text-muted-foreground">pt</span>
        </div>
        <div class="rank-border-chart-frame rank-border-chart-frame--detail">
          <div class="rank-border-chart-plot">
            <svg
              class="rank-border-chart-svg text-cyan-600 dark:text-cyan-300"
              :viewBox="`0 0 ${DETAIL_CHART_WIDTH} ${DETAIL_CHART_HEIGHT}`"
              preserveAspectRatio="none"
              aria-label="score trend"
            >
              <line
                v-for="line in detailCharts.scoreReferenceLines"
                :key="`dialog-ptr-grid-${line.value}`"
                class="rank-border-chart-grid"
                x1="0"
                :x2="DETAIL_CHART_WIDTH"
                :y1="line.y"
                :y2="line.y"
              />
              <line
                v-for="line in detailCharts.plannerLines"
                :key="`dialog-ptr-plan-${line.key}`"
                :class="[
                  'rank-border-chart-plan-line',
                  line.tone === 'target' ? 'rank-border-chart-plan-line--target' : '',
                ]"
                x1="0"
                :x2="DETAIL_CHART_WIDTH"
                :y1="line.y"
                :y2="line.y"
              />
              <path
                v-if="detailCharts.comparisonScorePath"
                class="rank-border-detail-line rank-border-detail-line--comparison"
                :d="detailCharts.comparisonScorePath"
              />
              <path class="rank-border-detail-line" :d="detailCharts.scorePath" />
            </svg>
            <button
              v-for="point in detailCharts.scorePoints"
              :key="point.key"
              type="button"
              class="rank-border-chart-point"
              :style="chartPointStyle(point)"
              :aria-label="point.label"
              @mouseenter="showRankBorderTooltip($event, point.label)"
              @mousemove="moveRankBorderTooltip($event)"
              @mouseleave="hideRankBorderTooltip"
            />
          </div>
          <div class="rank-border-chart-labels" aria-hidden="true">
            <span
              v-for="line in detailCharts.scoreReferenceLines"
              :key="`dialog-ptr-label-${line.value}`"
              class="rank-border-chart-label"
              :style="{ top: chartLabelTop(line) }"
            >
              {{ line.label }}
            </span>
          </div>
        </div>
        <div class="rank-border-chart-time-axis" aria-hidden="true">
          <span
            v-for="tick in detailCharts.timeTicks"
            :key="tick.key"
            :style="{ left: tick.left }"
          >
            {{ tick.label }}
          </span>
        </div>
        <div
          v-if="detailCharts.plannerLines.length > 0 || detailCharts.comparisonScorePath"
          class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground"
        >
          <span v-if="detailCharts.comparisonScorePath" class="inline-flex items-center gap-1">
            <span class="inline-block h-0.5 w-4 rounded-full bg-purple-500/90" />
            {{ t("rankBorder.comparison.legend", { rank: comparisonRank != null ? `T${comparisonRank}` : "-" }) }}
          </span>
          <span
            v-for="line in detailCharts.plannerLines"
            :key="`ptr-legend-${line.key}`"
            class="inline-flex items-center gap-1"
          >
            <span
              class="inline-block h-0.5 w-4 rounded-full"
              :class="line.tone === 'target' ? 'bg-amber-500/90' : 'bg-emerald-500/90'"
            />
            {{ line.label }} {{ formatPt(line.value) }}
          </span>
        </div>
      </div>

      <div class="min-h-0 rounded-md border bg-background/70 p-2.5">
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <p class="text-sm font-medium">{{ t("rankBorder.result.speedChart") }}</p>
          <span class="text-xs text-muted-foreground">pt/h</span>
        </div>
        <div class="rank-border-chart-frame rank-border-chart-frame--detail">
          <div class="rank-border-chart-plot">
            <svg
              class="rank-border-chart-svg text-emerald-600 dark:text-emerald-300"
              :viewBox="`0 0 ${DETAIL_CHART_WIDTH} ${DETAIL_CHART_HEIGHT}`"
              preserveAspectRatio="none"
              aria-label="speed trend"
            >
              <line
                v-for="line in detailCharts.speedReferenceLines"
                :key="`dialog-spd-grid-${line.value}`"
                class="rank-border-chart-grid"
                x1="0"
                :x2="DETAIL_CHART_WIDTH"
                :y1="line.y"
                :y2="line.y"
              />
              <path
                v-if="detailCharts.comparisonSpeedPath"
                class="rank-border-detail-line rank-border-detail-line--comparison"
                :d="detailCharts.comparisonSpeedPath"
              />
              <path class="rank-border-detail-line" :d="detailCharts.speedPath" />
            </svg>
            <button
              v-for="point in detailCharts.speedPoints"
              :key="point.key"
              type="button"
              class="rank-border-chart-point"
              :style="chartPointStyle(point)"
              :aria-label="point.label"
              @mouseenter="showRankBorderTooltip($event, point.label)"
              @mousemove="moveRankBorderTooltip($event)"
              @mouseleave="hideRankBorderTooltip"
            />
          </div>
          <div class="rank-border-chart-labels" aria-hidden="true">
            <span
              v-for="line in detailCharts.speedReferenceLines"
              :key="`dialog-spd-label-${line.value}`"
              class="rank-border-chart-label"
              :style="{ top: chartLabelTop(line) }"
            >
              {{ line.label }}
            </span>
          </div>
        </div>
        <div class="rank-border-chart-time-axis" aria-hidden="true">
          <span
            v-for="tick in detailCharts.timeTicks"
            :key="tick.key"
            :style="{ left: tick.left }"
          >
            {{ tick.label }}
          </span>
        </div>
      </div>
    </div>
    <div v-else class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
      {{ t("rankBorder.result.emptyTrace") }}
    </div>
  </section>
</template>

<style scoped>
.rank-border-trend-panel {
  min-height: 0;
  overflow: hidden;
}

.rank-border-trend-grid {
  display: grid;
  min-height: 0;
  min-width: 0;
  grid-template-rows: repeat(3, minmax(9.75rem, 1fr));
  gap: 0.5rem;
}

.rank-border-trend-panel {
  grid-area: trend;
}

.rank-border-sparkline,
.rank-border-detail-line {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.rank-border-sparkline {
  stroke-width: 2.25;
}

.rank-border-detail-line {
  stroke-width: 1.85;
  vector-effect: non-scaling-stroke;
}

.rank-border-detail-line--comparison {
  stroke: rgb(168 85 247 / 0.85);
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
}

.rank-border-chart-plan-line {
  fill: none;
  stroke: rgb(16 185 129 / 0.9);
  stroke-width: 1.5;
  stroke-dasharray: 5 3;
  vector-effect: non-scaling-stroke;
}

.rank-border-chart-plan-line--target {
  stroke: rgb(245 158 11 / 0.9);
}

.rank-border-chart-frame {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 4.75rem;
  gap: 0.5rem;
  height: 6rem;
  min-width: 0;
}

.rank-border-chart-frame--dialog {
  height: 8.75rem;
}

.rank-border-chart-frame--detail {
  height: 7.15rem;
}

.rank-border-chart-plot {
  position: relative;
  min-width: 0;
  height: 100%;
}

.rank-border-chart-svg {
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.rank-border-chart-labels {
  position: relative;
  min-width: 0;
  height: 100%;
}

.rank-border-chart-label {
  position: absolute;
  right: 0;
  max-width: 100%;
  transform: translateY(-50%);
  color: var(--muted-foreground);
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-sparkline-baseline,
.rank-border-chart-grid {
  fill: none;
  stroke: var(--border);
  stroke-width: 1;
  opacity: 0.7;
}

.rank-border-chart-grid {
  stroke-dasharray: 3 3;
  opacity: 0.74;
}

.rank-border-chart-point {
  position: absolute;
  z-index: 2;
  width: 1.05rem;
  height: 1.05rem;
  transform: translate(-50%, -50%);
  border: 0.125rem solid transparent;
  border-radius: 9999px;
  background: transparent;
  cursor: crosshair;
  opacity: 0;
  padding: 0;
  transition: background-color 140ms ease, border-color 140ms ease, opacity 140ms ease, transform 140ms ease, box-shadow 140ms ease;
}

.rank-border-chart-point:hover {
  transform: translate(-50%, -50%) scale(1);
  border-color: currentColor;
  background: var(--background);
  box-shadow: 0 0 0 0.2rem color-mix(in oklab, currentColor 14%, transparent);
  opacity: 1;
}

.rank-border-chart-time-axis {
  position: relative;
  height: 1.15rem;
  margin-top: 0.45rem;
  margin-right: 5.25rem;
  border-top: 1px solid color-mix(in oklab, var(--border) 68%, transparent);
  color: var(--muted-foreground);
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
}

.rank-border-chart-time-axis span {
  position: absolute;
  top: 0.35rem;
  border-radius: 9999px;
  background: color-mix(in oklab, var(--background) 92%, transparent);
  padding-inline: 0.18rem;
  transform: translateX(-50%);
  white-space: nowrap;
}

@media (min-width: 768px) and (max-width: 1180px) {
  .rank-border-trend-panel {
    padding: 0.75rem;
  }

  .rank-border-chart-frame--detail {
    height: 6.5rem;
  }

  .rank-border-chart-frame {
    grid-template-columns: minmax(0, 1fr) 4.1rem;
    gap: 0.375rem;
  }

  .rank-border-chart-time-axis {
    margin-right: 4.5rem;
  }
}

@media (min-width: 768px) and (max-width: 900px) {
  .rank-border-trend-panel {
    min-height: auto;
    overflow: visible;
  }

  .rank-border-trend-grid {
    grid-template-rows: none;
  }
}

@media (min-width: 768px) and (max-height: 840px) {
  .rank-border-trend-panel {
    padding: 0.625rem;
  }

  .rank-border-chart-frame--detail {
    height: 6.35rem;
  }

  .rank-border-trend-grid {
    gap: 0.375rem;
  }
}

@media (max-width: 767px) {
  .rank-border-trend-panel {
    min-height: auto;
    overflow: visible;
  }

  .rank-border-trend-panel {
    padding: 0.625rem;
  }

  .rank-border-trend-grid {
    grid-template-rows: none;
    gap: 0.5rem;
  }

  .rank-border-trend-panel > div:first-child {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .rank-border-chart-frame {
    grid-template-columns: minmax(0, 1fr) 3.75rem;
  }

  .rank-border-chart-frame--detail {
    height: 6.5rem;
  }

  .rank-border-chart-time-axis {
    margin-right: 4.25rem;
  }
}
</style>
