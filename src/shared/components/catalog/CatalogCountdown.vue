<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideTimer } from "lucide-vue-next"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useNowTick } from "@/composables/useNowTick"

/**
 * Live countdown to `targetMs`. With `startMs` it also draws the elapsed
 * share of the window as a progress bar. Colors escalate under 24 h / 6 h.
 */
const props = withDefaults(defineProps<{
  targetMs: number | null
  label: string
  startMs?: number | null
  class?: string
}>(), {
  startMs: null,
  class: undefined,
})

const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS

const { t } = useI18n()
const now = useNowTick(1000)

const remainingMs = computed(() => (props.targetMs != null ? Math.max(0, props.targetMs - now.value) : null))

const parts = computed(() => {
  const remaining = remainingMs.value
  if (remaining == null) {
    return null
  }
  const totalSeconds = Math.floor(remaining / 1000)
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
})

const text = computed(() => {
  const value = parts.value
  if (!value) {
    return ""
  }
  if (remainingMs.value === 0) {
    return t("catalog.countdown.reached")
  }
  const segments: string[] = []
  if (value.days > 0) {
    segments.push(t("catalog.countdown.days", { days: value.days }))
  }
  if (value.days > 0 || value.hours > 0) {
    segments.push(t("catalog.countdown.hours", { hours: value.hours }))
  }
  segments.push(t("catalog.countdown.minutes", { minutes: value.minutes }))
  if (value.days === 0) {
    segments.push(t("catalog.countdown.seconds", { seconds: value.seconds }))
  }
  return segments.join(" ")
})

const urgency = computed<"normal" | "soon" | "imminent">(() => {
  const remaining = remainingMs.value
  if (remaining == null || remaining > DAY_MS) {
    return "normal"
  }
  return remaining > 6 * HOUR_MS ? "soon" : "imminent"
})

const progress = computed(() => {
  if (props.startMs == null || props.targetMs == null || props.targetMs <= props.startMs) {
    return null
  }
  const elapsed = now.value - props.startMs
  return Math.min(100, Math.max(0, (elapsed / (props.targetMs - props.startMs)) * 100))
})

const toneClass = computed(() => {
  switch (urgency.value) {
    case "imminent":
      return "text-rose-600 dark:text-rose-300"
    case "soon":
      return "text-amber-600 dark:text-amber-300"
    default:
      return "text-foreground"
  }
})

const progressColor = computed(() => {
  switch (urgency.value) {
    case "imminent":
      return "rgb(225 29 72)"
    case "soon":
      return "rgb(217 119 6)"
    default:
      return undefined
  }
})
</script>

<template>
  <div
    v-if="targetMs != null"
    :class="cn('flex flex-col gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm', props.class)"
    data-slot="catalog-countdown"
  >
    <div class="flex items-center justify-between gap-3">
      <span class="flex items-center gap-2 text-muted-foreground">
        <LucideTimer class="size-4" aria-hidden="true" />
        {{ label }}
      </span>
      <span :class="['font-medium tabular-nums', toneClass]" aria-live="off">{{ text }}</span>
    </div>
    <Progress v-if="progress != null" :model-value="progress" :color="progressColor" class="h-1.5" />
  </div>
</template>
