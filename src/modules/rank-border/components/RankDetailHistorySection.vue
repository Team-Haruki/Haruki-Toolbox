<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { useRankBorderContext } from "../composables/rank-border-context"
import { DETAIL_HEATMAP_HOURS_PER_DAY } from "../lib/rank-border-constants"

const { t } = useI18n()

const { detail, ui } = useRankBorderContext()

const {
  detailTraceScopeLabel,
  detailHeatmapDays,
  hasDetailHeatmap,
  detailUpdateRecords,
  selectHeatmapWindow,
} = detail
const {
  showRankBorderTooltip,
  moveRankBorderTooltip,
  hideRankBorderTooltip,
} = ui
</script>

<template>
  <div class="rank-border-detail-history">
    <section class="rank-border-heatmap-section grid min-w-0 gap-2 rounded-md border bg-muted/15 p-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-sm font-semibold">{{ t("rankBorder.result.heatmapTitle") }}</h3>
        <span class="text-right text-xs text-muted-foreground">
          {{ t("rankBorder.result.dailyHours") }} · {{ t("rankBorder.result.heatmapHint") }}
        </span>
      </div>
      <div v-if="hasDetailHeatmap" class="rank-border-heatmap-panel">
        <div class="rank-border-heatmap-row rank-border-heatmap-row--header" aria-hidden="true">
          <span class="rank-border-heatmap-corner" />
          <div class="rank-border-heatmap-hours">
            <span v-for="hour in DETAIL_HEATMAP_HOURS_PER_DAY" :key="`heatmap-hour-${hour}`">{{ hour - 1 }}</span>
          </div>
        </div>
        <div
          v-for="day in detailHeatmapDays"
          :key="day.key"
          class="rank-border-heatmap-row"
        >
          <span class="rank-border-heatmap-day-label">
            <span>{{ day.label }}</span>
          </span>
          <div class="rank-border-heatmap rank-border-heatmap--detail">
            <button
              v-for="cell in day.cells"
              :key="cell.key"
              type="button"
              :class="[
                'rank-border-heatmap-cell',
                `rank-border-heatmap-cell--${cell.status}`,
                cell.selectable ? 'rank-border-heatmap-cell--selectable' : '',
                cell.selected ? 'rank-border-heatmap-cell--selected' : '',
              ]"
              :disabled="!cell.selectable"
              :style="{ backgroundColor: cell.color, color: cell.textColor }"
              :aria-pressed="cell.selected"
              :aria-label="cell.label"
              @click="selectHeatmapWindow(cell)"
              @mouseenter="showRankBorderTooltip($event, cell.label)"
              @mousemove="moveRankBorderTooltip($event)"
              @mouseleave="hideRankBorderTooltip"
            >
              {{ cell.displayLabel }}
            </button>
          </div>
        </div>
      </div>
      <div v-else class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        {{ t("rankBorder.result.heatmapEmpty") }}
      </div>
    </section>

    <section v-if="detailUpdateRecords.length > 0" class="rank-border-update-section grid min-w-0 gap-2 rounded-md border bg-muted/15 p-3">
      <div class="flex items-center justify-between gap-2">
        <h3 class="text-sm font-semibold">{{ t("rankBorder.result.updateLog") }}</h3>
        <span class="text-xs text-muted-foreground">{{ detailTraceScopeLabel }}</span>
      </div>
      <div class="rank-border-update-log">
        <div class="rank-border-update-log__header">
          <span>{{ t("rankBorder.table.hourPoint") }}</span>
          <span>{{ t("rankBorder.table.rank") }}</span>
          <span>{{ t("rankBorder.table.growth") }}</span>
          <span>{{ t("rankBorder.table.pt") }}</span>
        </div>
        <div class="rank-border-update-log__rows">
          <div
            v-for="record in detailUpdateRecords"
            :key="record.key"
            class="rank-border-update-log__row"
          >
            <span>{{ record.time }}</span>
            <span>{{ record.rank }}</span>
            <span>{{ record.growth }}</span>
            <span>{{ record.score }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.rank-border-detail-history,
.rank-border-heatmap-section,
.rank-border-update-section {
  min-height: 0;
  overflow: hidden;
}

.rank-border-detail-history {
  display: grid;
  grid-area: heatmap;
  min-width: 0;
  min-height: 0;
  grid-template-rows: minmax(0, auto) minmax(8rem, 1fr);
  align-content: stretch;
  gap: 0.75rem;
  overflow: visible;
}

.rank-border-heatmap-section {
  display: grid;
  grid-template-rows: auto minmax(0, auto);
  align-content: start;
  min-height: 0;
}

.rank-border-update-section {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  align-content: stretch;
  min-height: 0;
}

.rank-border-heatmap {
  display: grid;
  min-width: 0;
}

.rank-border-heatmap-panel {
  display: grid;
  --rank-border-heatmap-label-width: 2.75rem;
  --rank-border-heatmap-gap: 0.125rem;
  --rank-border-heatmap-min-cell-size: 1.08rem;
  --rank-border-heatmap-cell-size: clamp(1.08rem, 1.56vw, 1.34rem);
  --rank-border-heatmap-grid-width: max(
    calc(100% - var(--rank-border-heatmap-label-width) - 0.375rem),
    calc(var(--rank-border-heatmap-min-cell-size) * 24 + var(--rank-border-heatmap-gap) * 23)
  );
  min-width: 0;
  min-height: 0;
  max-height: 15.75rem;
  gap: 0.25rem;
  overflow-x: auto;
  overflow-y: auto;
  overscroll-behavior-x: contain;
  padding-block: 0.0625rem 0.625rem;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.rank-border-heatmap-row {
  display: grid;
  width: 100%;
  min-width: 100%;
  grid-template-columns: var(--rank-border-heatmap-label-width) var(--rank-border-heatmap-grid-width);
  gap: 0.375rem;
  align-items: center;
  min-height: var(--rank-border-heatmap-cell-size);
}

.rank-border-heatmap-row--header {
  color: var(--muted-foreground);
}

.rank-border-heatmap-day-label {
  position: sticky;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  overflow: visible;
  padding-right: 0.125rem;
  background: linear-gradient(90deg, var(--background) 72%, color-mix(in oklab, var(--background) 0%, transparent));
  color: var(--muted-foreground);
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
}

.rank-border-heatmap-day-label span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.1rem;
  height: 1.1rem;
  border: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
  border-radius: 9999px;
  background: color-mix(in oklab, var(--background) 88%, var(--muted));
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.06);
}

.rank-border-heatmap-corner {
  position: sticky;
  left: 0;
  z-index: 3;
  background: linear-gradient(90deg, var(--background) 72%, color-mix(in oklab, var(--background) 0%, transparent));
}

.rank-border-heatmap-hours {
  display: grid;
  width: var(--rank-border-heatmap-grid-width);
  grid-template-columns: repeat(24, minmax(var(--rank-border-heatmap-min-cell-size), 1fr));
  gap: var(--rank-border-heatmap-gap);
  justify-content: stretch;
  color: var(--muted-foreground);
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-align: center;
}

.rank-border-heatmap-cell {
  appearance: none;
  border: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--rank-border-heatmap-cell-size);
  aspect-ratio: 1;
  min-height: var(--rank-border-heatmap-min-cell-size);
  min-width: 0;
  border-radius: 2px;
  background-clip: padding-box;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.16);
  cursor: default;
  font-size: 0.56rem;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
  overflow: hidden;
  text-align: center;
  transition: box-shadow 120ms ease, filter 120ms ease;
  user-select: none;
}

.rank-border-heatmap-cell--selectable {
  cursor: pointer;
}

.rank-border-heatmap-cell--selectable:hover {
  filter: brightness(1.05);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.32), 0 0 0 0.125rem color-mix(in oklab, currentColor 16%, transparent);
}

.rank-border-heatmap-cell--selectable:focus-visible {
  outline: 2px solid color-mix(in oklab, var(--primary) 70%, transparent);
  outline-offset: 2px;
}

.rank-border-heatmap-cell--selected {
  filter: saturate(1.12) brightness(1.04);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.55),
    0 0 0 0.1875rem color-mix(in oklab, var(--primary) 40%, transparent),
    inset 0 0 0 1px rgb(15 23 42 / 0.28);
}

.rank-border-heatmap--detail {
  width: var(--rank-border-heatmap-grid-width);
  grid-template-columns: repeat(24, minmax(var(--rank-border-heatmap-min-cell-size), 1fr));
  gap: var(--rank-border-heatmap-gap);
  min-height: 0;
  justify-content: stretch;
  overflow: visible;
}

.rank-border-heatmap-cell--before,
.rank-border-heatmap-cell--future {
  cursor: default;
  filter: grayscale(0.2);
}

.rank-border-heatmap-cell:disabled {
  opacity: 0.75;
}

.rank-border-update-log {
  display: grid;
  align-self: stretch;
  height: clamp(11rem, 24svh, 15rem);
  min-height: 0;
  max-height: clamp(11rem, 24svh, 15rem);
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background: color-mix(in oklab, var(--background) 74%, transparent);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.rank-border-update-log__title {
  border-bottom: 1px solid var(--border);
  padding: 0.32rem 0.5rem;
  color: var(--foreground);
  font-size: 0.75rem;
  font-weight: 650;
  line-height: 1.15;
}

.rank-border-update-log__header,
.rank-border-update-log__row {
  display: grid;
  grid-template-columns: 4.6rem 3rem 5rem minmax(7.25rem, 1fr);
  gap: 0.5rem;
  align-items: center;
  min-width: 0;
  padding: 0.26rem 0.5rem;
  line-height: 1.2;
}

.rank-border-update-log__header {
  border-bottom: 1px solid var(--border);
  color: var(--muted-foreground);
  font-weight: 600;
}

.rank-border-update-log__rows {
  min-height: 0;
  padding-bottom: 0.375rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.rank-border-update-log__row {
  color: var(--foreground);
}

.rank-border-update-log__row span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-update-log__header span:last-child,
.rank-border-update-log__row span:last-child {
  text-align: right;
}

.rank-border-update-log__row:nth-child(odd) {
  background: color-mix(in oklab, var(--muted) 42%, transparent);
}

@media (min-width: 768px) and (max-width: 1180px) {
  .rank-border-heatmap-section,
  .rank-border-update-section {
    padding: 0.75rem;
  }

  .rank-border-heatmap-row {
    --rank-border-heatmap-label-width: 2.35rem;
    gap: 0.25rem;
  }

  .rank-border-update-log__header,
  .rank-border-update-log__row {
    grid-template-columns: 4.3rem 2.8rem 4.8rem minmax(6.8rem, 1fr);
    gap: 0.25rem;
    padding: 0.2rem 0.375rem;
  }
}

@media (min-width: 768px) and (max-width: 900px) {
  .rank-border-detail-history,
  .rank-border-heatmap-section,
  .rank-border-update-section {
    min-height: auto;
    overflow: visible;
  }

  .rank-border-detail-history {
    grid-template-rows: auto minmax(10rem, auto);
    overflow: visible;
  }

  .rank-border-update-log {
    height: auto;
    max-height: 14rem;
  }
}

@media (min-width: 768px) and (max-height: 840px) {
  .rank-border-heatmap-section,
  .rank-border-update-section {
    padding: 0.625rem;
  }

  .rank-border-update-log__title,
  .rank-border-update-log__header,
  .rank-border-update-log__row {
    padding-block: 0.1875rem;
  }
}

@media (max-width: 767px) {
  .rank-border-detail-history,
  .rank-border-heatmap-section,
  .rank-border-update-section {
    min-height: auto;
    overflow: visible;
  }

  .rank-border-detail-history {
    grid-template-rows: auto auto;
    overflow: visible;
  }

  .rank-border-heatmap-section,
  .rank-border-update-section {
    padding: 0.625rem;
  }

  .rank-border-heatmap-section,
  .rank-border-update-section {
    align-content: start;
  }

  .rank-border-heatmap-section {
    grid-template-rows: auto max-content;
  }

  .rank-border-update-section {
    grid-template-rows: auto auto;
  }

  .rank-border-heatmap-section > div:first-child,
  .rank-border-update-section > div:first-child {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .rank-border-heatmap-row {
    --rank-border-heatmap-label-width: 2.2rem;
    gap: 0.25rem;
  }

  .rank-border-heatmap-panel {
    --rank-border-heatmap-min-cell-size: 1rem;
    --rank-border-heatmap-cell-size: clamp(1rem, 3.6vw, 1.18rem);
    --rank-border-heatmap-gap: 0.125rem;
    max-height: 13.75rem;
  }

  .rank-border-update-log {
    height: 14.5rem;
    max-height: 14.5rem;
    overflow: auto;
  }

  .rank-border-update-log__header,
  .rank-border-update-log__row {
    grid-template-columns: 4.2rem 2.75rem 4.25rem minmax(5.5rem, 1fr);
    gap: 0.25rem;
    padding-inline: 0.375rem;
  }
}

@media (max-width: 380px) {
  .rank-border-update-log__header,
  .rank-border-update-log__row {
    grid-template-columns: 3.9rem 2.35rem 3.75rem minmax(4.8rem, 1fr);
    font-size: 0.6875rem;
  }
}
</style>
