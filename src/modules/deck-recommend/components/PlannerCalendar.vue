<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { resolveSekaiLiveBoostMultiplier } from "@/shared/sekai/live-boost"
import {
  buildPlannerRectangleHourKeys,
  type PlannerBrush,
  type PlannerCalendarDay,
  type PlannerCellCoordinate,
  type PlannerCells,
} from "../lib/planner-calendar"

const props = defineProps<{
  days: PlannerCalendarDay[]
  cells: PlannerCells
  brushes: PlannerBrush[]
  /** Active tool: a brush id or the special "eraser". */
  activeTool: string
}>()

const emit = defineEmits<{
  /** One completed paint/erase stroke over the given hour cells. */
  stroke: [changes: { hourKeys: string[]; brushId: string | null }]
}>()

const { t, locale } = useI18n()

const brushById = computed(() => new Map(props.brushes.map((brush) => [brush.id, brush])))

const dayFormatter = computed(() => new Intl.DateTimeFormat(locale.value, {
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
}))

const exactRateFormatter = computed(() => new Intl.NumberFormat(locale.value))

/** Loops per hour of the painted brush; rest cells stay unlabeled. */
function cellPlaysLabel(hourStartMs: number): string {
  const brush = cellBrush(hourStartMs)
  if (brush == null || brush.playsPerHour == null || !(brush.playsPerHour > 0)) {
    return ""
  }

  return String(brush.playsPerHour)
}

/** "×5"-style boost multiplier of the painted brush; hidden at ×1. */
function cellBoostLabel(hourStartMs: number): string {
  const brush = cellBrush(hourStartMs)
  if (brush == null) {
    return ""
  }

  const multiplier = resolveSekaiLiveBoostMultiplier(brush.boostCount ?? 0)
  return multiplier > 1 ? `×${multiplier}` : ""
}

const HOUR_COLUMNS = Array.from({ length: 24 }, (_, hour) => hour)

// A stroke selects the day/hour rectangle between the anchor cell and the
// current cell, so dragging batch-fills whole time ranges across days.
const strokeMode = ref<"paint" | "erase" | null>(null)
let anchorCell: PlannerCellCoordinate | null = null
const pendingPreview = ref<Set<string>>(new Set())

function cellBrush(hourStartMs: number): PlannerBrush | null {
  const brushId = props.cells[String(hourStartMs)]
  return brushId != null ? brushById.value.get(brushId) ?? null : null
}

function cellStyle(hourStartMs: number) {
  const brush = cellBrush(hourStartMs)
  if (brush == null) {
    return {}
  }

  return { backgroundColor: brush.color }
}

function cellTitle(hourStartMs: number, hourOfDay: number): string {
  const brush = cellBrush(hourStartMs)
  const hourLabel = t("eventPlanner.calendar.hourLabel", { hour: hourOfDay })
  if (brush == null) {
    return hourLabel
  }

  const plays = brush.playsPerHour != null && brush.playsPerHour > 0
    ? ` · ${t("eventPlanner.calendar.playsPerHour", { count: brush.playsPerHour })}`
    : ""
  const boostLabel = cellBoostLabel(hourStartMs)
  const boost = boostLabel ? ` · ${boostLabel}` : ""
  const rate = brush.pointsPerHour > 0
    ? ` · ${t("eventPlanner.brushes.perHour", { points: exactRateFormatter.value.format(brush.pointsPerHour) })}`
    : ""
  return `${hourLabel} · ${brush.name}${plays}${boost}${rate}`
}

type PlannerCellHit = PlannerCellCoordinate & { hourKey: string }

function cellHitFromEvent(event: PointerEvent): PlannerCellHit | null {
  const element = document.elementFromPoint(event.clientX, event.clientY)
  const cell = element?.closest<HTMLElement>("[data-hour]")
  const hourKey = cell?.dataset.hour
  if (cell == null || hourKey == null) {
    return null
  }

  return {
    hourKey,
    dayIndex: Number(cell.dataset.dayIndex),
    hourOfDay: Number(cell.dataset.hourOfDay),
  }
}

function updatePreview(target: PlannerCellCoordinate) {
  if (anchorCell != null) {
    pendingPreview.value = new Set(buildPlannerRectangleHourKeys(props.days, anchorCell, target))
  }
}

function handlePointerDown(event: PointerEvent) {
  const hit = cellHitFromEvent(event)
  if (hit == null) {
    return
  }

  event.preventDefault()
  const currentBrushId = props.cells[hit.hourKey] ?? null
  strokeMode.value = props.activeTool === "eraser" || currentBrushId === props.activeTool
    ? "erase"
    : "paint"
  anchorCell = hit
  updatePreview(hit)
}

function handlePointerMove(event: PointerEvent) {
  if (strokeMode.value == null) {
    return
  }

  const hit = cellHitFromEvent(event)
  if (hit != null) {
    updatePreview(hit)
  }
}

function finishStroke() {
  const mode = strokeMode.value
  const hourKeys = [...pendingPreview.value]
  strokeMode.value = null
  anchorCell = null
  pendingPreview.value = new Set()
  if (mode == null || hourKeys.length === 0) {
    return
  }

  emit("stroke", { hourKeys, brushId: mode === "erase" ? null : props.activeTool })
}

function isPreviewing(hourStartMs: number): boolean {
  return pendingPreview.value.has(String(hourStartMs))
}
</script>

<template>
  <div class="overflow-x-auto">
    <p class="mb-2 text-xs text-muted-foreground">{{ t("eventPlanner.calendar.dragHint") }}</p>
    <div
      class="min-w-[58rem] select-none touch-none"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="finishStroke"
      @pointercancel="finishStroke"
      @pointerleave="finishStroke"
    >
      <!-- Hour header -->
      <div class="mb-1 grid grid-cols-[5.5rem_repeat(24,minmax(2rem,1fr))] gap-x-px">
        <span />
        <span
          v-for="hour in HOUR_COLUMNS"
          :key="hour"
          class="text-center text-[11px] tabular-nums text-muted-foreground"
        >
          {{ hour % 2 === 0 ? hour : "" }}
        </span>
      </div>

      <div
        v-for="(day, dayIndex) in days"
        :key="day.dayStartMs"
        class="grid grid-cols-[5.5rem_repeat(24,minmax(2rem,1fr))] items-center gap-x-px py-0.5"
      >
        <span class="pr-2 text-right text-xs tabular-nums text-muted-foreground">
          {{ dayFormatter.format(day.dayStartMs) }}
        </span>
        <button
          v-for="(hour, index) in day.hours"
          :key="hour.hourStartMs"
          type="button"
          :data-hour="hour.hourStartMs"
          :data-day-index="dayIndex"
          :data-hour-of-day="hour.hourOfDay"
          :class="[
            'flex aspect-square w-full items-center justify-center overflow-hidden rounded-[4px] border transition-colors',
            cellBrush(hour.hourStartMs) != null ? 'border-transparent' : 'border-border/50 bg-muted/30 hover:bg-muted/60',
            isPreviewing(hour.hourStartMs)
              ? strokeMode === 'erase' ? 'ring-2 ring-destructive/60' : 'ring-2 ring-primary/60'
              : '',
          ]"
          :style="{
            ...cellStyle(hour.hourStartMs),
            ...(index === 0 ? { gridColumnStart: hour.hourOfDay + 2 } : {}),
          }"
          :title="cellTitle(hour.hourStartMs, hour.hourOfDay)"
        >
          <span
            v-if="cellPlaysLabel(hour.hourStartMs)"
            class="flex flex-col items-center gap-px leading-none text-white/95 [text-shadow:0_1px_1px_rgba(0,0,0,0.35)]"
          >
            <span class="whitespace-nowrap text-[10px] font-semibold">{{ cellPlaysLabel(hour.hourStartMs) }}</span>
            <span v-if="cellBoostLabel(hour.hourStartMs)" class="whitespace-nowrap text-[8px] font-medium">
              {{ cellBoostLabel(hour.hourStartMs) }}
            </span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
