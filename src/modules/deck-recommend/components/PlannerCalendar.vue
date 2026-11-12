<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useTemplateRef } from "vue"
import { useI18n } from "vue-i18n"
import { useScrollEdges } from "@/composables/useScrollEdges"
import { resolveSekaiLiveBoostMultiplier } from "@/shared/sekai/live-boost"
import {
  buildPlannerRectangleHourKeys,
  PLANNER_HOUR_MS,
  type PlannerBrush,
  type PlannerCalendarDay,
  type PlannerCellCoordinate,
  type PlannerCells,
  type PlannerDayStat,
} from "../lib/planner-calendar"

const props = defineProps<{
  days: PlannerCalendarDay[]
  cells: PlannerCells
  brushes: PlannerBrush[]
  /** Active tool: a brush id or the special "eraser". */
  activeTool: string
  /** One entry per day, in order: what the day adds and the running total. */
  dayStats: readonly PlannerDayStat[]
  /** Hours before this no longer count toward the target and are drawn faded; null counts everything. */
  countFromMs: number | null
  /** The current time, to mark the hour the player is in. */
  nowMs: number
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
const compactFormatter = computed(() => new Intl.NumberFormat(locale.value, { notation: "compact", maximumFractionDigits: 1 }))

function isPastHour(hourStartMs: number) {
  return props.countFromMs != null && hourStartMs < props.countFromMs
}

function isCurrentHour(hourStartMs: number) {
  return props.nowMs >= hourStartMs && props.nowMs < hourStartMs + PLANNER_HOUR_MS
}

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

function beginStroke(hit: PlannerCellHit) {
  const currentBrushId = props.cells[hit.hourKey] ?? null
  strokeMode.value = props.activeTool === "eraser" || currentBrushId === props.activeTool
    ? "erase"
    : "paint"
  anchorCell = hit
  updatePreview(hit)
}

// Touch: the grid is wider than a phone, so a finger must still be able to
// scroll it. A touch therefore paints only on a tap (press and release
// without moving) or after a long press, which claims the gesture for drag
// painting; moving before the timer fires is a scroll and is left alone.
const LONG_PRESS_MS = 350
const TOUCH_SLOP_PX = 8

const grid = useTemplateRef<HTMLElement>("grid")
let pressTimer: ReturnType<typeof setTimeout> | null = null
let pendingTouch: { hit: PlannerCellHit; x: number; y: number; pointerId: number } | null = null
/** True while a long-press stroke owns the touch; touchmove is then prevented so no scroll starts. */
let touchStrokeActive = false

function cancelPendingTouch() {
  if (pressTimer != null) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
  pendingTouch = null
}

function handlePointerDown(event: PointerEvent) {
  const hit = cellHitFromEvent(event)
  if (hit == null) {
    return
  }

  if (event.pointerType === "touch") {
    cancelPendingTouch()
    pendingTouch = { hit, x: event.clientX, y: event.clientY, pointerId: event.pointerId }
    pressTimer = setTimeout(() => {
      pressTimer = null
      const pressed = pendingTouch
      pendingTouch = null
      if (pressed == null) {
        return
      }
      touchStrokeActive = true
      try {
        grid.value?.setPointerCapture(pressed.pointerId)
        navigator.vibrate?.(10)
      } catch {
        // Capture and haptics are best-effort.
      }
      beginStroke(pressed.hit)
    }, LONG_PRESS_MS)
    return
  }

  event.preventDefault()
  beginStroke(hit)
}

function handlePointerMove(event: PointerEvent) {
  if (pendingTouch != null) {
    if (Math.hypot(event.clientX - pendingTouch.x, event.clientY - pendingTouch.y) > TOUCH_SLOP_PX) {
      cancelPendingTouch()
    }
    return
  }

  if (strokeMode.value == null) {
    return
  }

  const hit = cellHitFromEvent(event)
  if (hit != null) {
    updatePreview(hit)
  }
}

function handlePointerUp() {
  if (pendingTouch != null) {
    // A tap: paint exactly the touched cell.
    const { hit } = pendingTouch
    cancelPendingTouch()
    beginStroke(hit)
  }
  finishStroke()
}

function handlePointerCancel() {
  cancelPendingTouch()
  finishStroke()
}

function handlePointerLeave(event: PointerEvent) {
  if (event.pointerType === "touch") {
    // A finger leaving the grid while scrolling is not a tap; a captured
    // long-press stroke keeps its pointer and ends on release instead.
    cancelPendingTouch()
    return
  }
  finishStroke()
}

function handleTouchMove(event: TouchEvent) {
  if (touchStrokeActive && event.cancelable) {
    event.preventDefault()
  }
}

function finishStroke() {
  const mode = strokeMode.value
  const hourKeys = [...pendingPreview.value]
  strokeMode.value = null
  anchorCell = null
  touchStrokeActive = false
  pendingPreview.value = new Set()
  if (mode == null || hourKeys.length === 0) {
    return
  }

  emit("stroke", { hourKeys, brushId: mode === "erase" ? null : props.activeTool })
}

onBeforeUnmount(cancelPendingTouch)

function isPreviewing(hourStartMs: number): boolean {
  return pendingPreview.value.has(String(hourStartMs))
}

// The 24-hour grid is wider than a phone: the day labels stay pinned on the
// left while the hours scroll, and the fade marks the hidden side.
const scroller = ref<HTMLElement | null>(null)
const { edgeClass } = useScrollEdges(scroller)
</script>

<template>
  <div>
    <p class="mb-2 text-xs text-muted-foreground pointer-coarse:hidden">{{ t("eventPlanner.calendar.dragHint") }}</p>
    <p class="mb-2 hidden text-xs text-muted-foreground pointer-coarse:block">{{ t("eventPlanner.calendar.touchHint") }}</p>
    <div :class="['relative', edgeClass]">
    <div ref="scroller" class="overflow-x-auto">
    <div
      ref="grid"
      class="min-w-[66rem] select-none touch-pan-x touch-pan-y [-webkit-touch-callout:none]"
      data-testid="planner-calendar"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerCancel"
      @pointerleave="handlePointerLeave"
      @touchmove="handleTouchMove"
      @contextmenu.prevent
    >
      <!-- Hour header -->
      <div class="mb-1 grid grid-cols-[5.5rem_repeat(24,minmax(2rem,1fr))_4.5rem_5.5rem] items-end gap-x-px">
        <span class="sticky left-0 z-10 bg-card" />
        <span
          v-for="hour in HOUR_COLUMNS"
          :key="hour"
          class="text-center text-[11px] tabular-nums text-muted-foreground"
        >
          {{ hour % 2 === 0 ? hour : "" }}
        </span>
        <span class="pr-1 text-right text-[11px] text-muted-foreground">{{ t("eventPlanner.calendar.dayPoints") }}</span>
        <span class="text-right text-[11px] text-muted-foreground">{{ t("eventPlanner.calendar.dayTotal") }}</span>
      </div>

      <div
        v-for="(day, dayIndex) in days"
        :key="day.dayStartMs"
        class="grid grid-cols-[5.5rem_repeat(24,minmax(2rem,1fr))_4.5rem_5.5rem] items-center gap-x-px py-0.5"
        data-testid="planner-day"
      >
        <span class="sticky left-0 z-10 self-stretch bg-card pr-2 text-right text-xs leading-[2rem] tabular-nums text-muted-foreground">
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
            isPastHour(hour.hourStartMs) ? 'opacity-35' : '',
            isCurrentHour(hour.hourStartMs) ? 'outline-2 -outline-offset-2 outline-foreground/70' : '',
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
        <!-- What the day adds, and where the total stands when it ends. -->
        <span
          class="pr-1 text-right text-xs tabular-nums"
          :class="(dayStats[dayIndex]?.points ?? 0) > 0 ? '' : 'text-muted-foreground'"
          style="grid-column-start: 26"
          data-testid="planner-day-points"
        >
          {{ (dayStats[dayIndex]?.points ?? 0) > 0 ? `+${compactFormatter.format(dayStats[dayIndex]!.points)}` : "–" }}
        </span>
        <span
          :class="[
            'text-right text-xs tabular-nums',
            dayStats[dayIndex]?.reachesTarget ? 'font-semibold text-primary' : dayStats[dayIndex]?.cumulative == null ? 'text-muted-foreground' : '',
          ]"
          :title="dayStats[dayIndex]?.reachesTarget ? t('eventPlanner.calendar.reachesTarget') : undefined"
          style="grid-column-start: 27"
          data-testid="planner-day-total"
        >
          {{ dayStats[dayIndex]?.cumulative != null ? compactFormatter.format(dayStats[dayIndex]!.cumulative!) : "–" }}
          <span v-if="dayStats[dayIndex]?.reachesTarget" class="block text-[10px] leading-none font-medium">{{ t("eventPlanner.calendar.reachesTarget") }}</span>
        </span>
      </div>
    </div>
    </div>
    </div>
  </div>
</template>
