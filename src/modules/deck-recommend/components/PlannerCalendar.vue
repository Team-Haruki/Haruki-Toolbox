<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import type { PlannerBrush, PlannerCalendarDay, PlannerCells } from "../lib/planner-calendar"

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

const HOUR_COLUMNS = Array.from({ length: 24 }, (_, hour) => hour)

// Stroke bookkeeping; only the preview set needs reactivity for highlights.
let strokeMode: "paint" | "erase" | null = null
let strokeKeys: Set<string> | null = null
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

  return `${hourLabel} · ${brush.name}`
}

function hourKeyFromEvent(event: PointerEvent): string | null {
  const element = document.elementFromPoint(event.clientX, event.clientY)
  const key = element?.closest("[data-hour]")?.getAttribute("data-hour")
  return key ?? null
}

function applyToStroke(hourKey: string) {
  if (strokeMode == null || strokeKeys == null || strokeKeys.has(hourKey)) {
    return
  }

  strokeKeys.add(hourKey)
  pendingPreview.value = new Set(strokeKeys)
}

function handlePointerDown(event: PointerEvent) {
  const hourKey = hourKeyFromEvent(event)
  if (hourKey == null) {
    return
  }

  event.preventDefault()
  const currentBrushId = props.cells[hourKey] ?? null
  strokeMode = props.activeTool === "eraser" || currentBrushId === props.activeTool
    ? "erase"
    : "paint"
  strokeKeys = new Set()
  applyToStroke(hourKey)
}

function handlePointerMove(event: PointerEvent) {
  if (strokeMode == null) {
    return
  }

  const hourKey = hourKeyFromEvent(event)
  if (hourKey != null) {
    applyToStroke(hourKey)
  }
}

function finishStroke() {
  if (strokeMode == null || strokeKeys == null || strokeKeys.size === 0) {
    strokeMode = null
    strokeKeys = null
    pendingPreview.value = new Set()
    return
  }

  const brushId = strokeMode === "erase" || props.activeTool === "eraser" ? null : props.activeTool
  emit("stroke", { hourKeys: [...strokeKeys], brushId })
  strokeMode = null
  strokeKeys = null
  pendingPreview.value = new Set()
}

function isPreviewing(hourStartMs: number): boolean {
  return pendingPreview.value.has(String(hourStartMs))
}
</script>

<template>
  <div class="overflow-x-auto">
    <div
      class="min-w-[46rem] select-none touch-none"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="finishStroke"
      @pointercancel="finishStroke"
      @pointerleave="finishStroke"
    >
      <!-- Hour header -->
      <div class="mb-1 flex items-center gap-px pl-24">
        <span
          v-for="hour in HOUR_COLUMNS"
          :key="hour"
          class="w-6 shrink-0 text-center text-[10px] tabular-nums text-muted-foreground"
        >
          {{ hour % 2 === 0 ? hour : "" }}
        </span>
      </div>

      <div v-for="day in days" :key="day.dayStartMs" class="flex items-center gap-px py-px">
        <span class="w-24 shrink-0 pr-2 text-right text-xs tabular-nums text-muted-foreground">
          {{ dayFormatter.format(day.dayStartMs) }}
        </span>
        <span
          class="flex gap-px"
          :style="{ marginLeft: `${day.hours[0]?.hourOfDay * 25}px` }"
        >
          <button
            v-for="hour in day.hours"
            :key="hour.hourStartMs"
            type="button"
            :data-hour="hour.hourStartMs"
            :class="[
              'h-7 w-6 shrink-0 rounded-[3px] border transition-colors',
              cellBrush(hour.hourStartMs) != null ? 'border-transparent' : 'border-border/50 bg-muted/30 hover:bg-muted/60',
              isPreviewing(hour.hourStartMs) ? 'ring-2 ring-primary/60' : '',
            ]"
            :style="cellStyle(hour.hourStartMs)"
            :title="cellTitle(hour.hourStartMs, hour.hourOfDay)"
          />
        </span>
      </div>
    </div>
  </div>
</template>
