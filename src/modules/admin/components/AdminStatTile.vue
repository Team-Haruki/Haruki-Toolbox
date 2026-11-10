<script setup lang="ts">
import type { Component } from "vue"
import { Skeleton } from "@/components/ui/skeleton"
import { LucideArrowDownRight, LucideArrowUpRight, LucideMinus } from "lucide-vue-next"
import AdminAnimatedNumber from "./AdminAnimatedNumber.vue"

export type AdminStatTone = "default" | "primary" | "success" | "warning" | "danger" | "info"
export type AdminStatTrend = {
  /** Already formatted, e.g. "+12.4%" or "−3". */
  text: string
  direction: "up" | "down" | "flat"
  /** Whether this direction is good news; colours the trend. Neutral when omitted. */
  good?: boolean
}

/**
 * One figure of an `AdminStatGrid`: a label, the number (counting up), and
 * optionally an icon, a line of context, a trend against the previous
 * period, and a slot at the bottom right for a sparkline.
 *
 *   <AdminStatTile :label="…" :value="total" :icon="Users" tone="primary"
 *     :detail="…" :trend="{ text: '+12%', direction: 'up', good: true }">
 *     <AdminSparkline :values="series" class="text-primary" />
 *   </AdminStatTile>
 *
 * Pass `text` instead of `value` for a figure that is not a plain number
 * ("3 / 5", "—"). `loading` shows a skeleton in place of the number.
 */
withDefaults(defineProps<{
  label: string
  value?: number | null
  /** Shown as is, instead of `value`. */
  text?: string | null
  format?: (value: number) => string
  icon?: Component
  tone?: AdminStatTone
  /** One short line under the number. */
  detail?: string | null
  trend?: AdminStatTrend | null
  loading?: boolean
}>(), {
  value: null,
  text: null,
  format: undefined,
  icon: undefined,
  tone: "default",
  detail: null,
  trend: null,
  loading: false,
})

const ICON_TONE: Record<AdminStatTone, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  danger: "bg-destructive/15 text-destructive-tint-foreground",
  info: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
}

function trendClass(trend: AdminStatTrend): string {
  if (trend.good == null || trend.direction === "flat") {
    return "text-muted-foreground"
  }
  return trend.good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
}
</script>

<template>
  <!-- Always inside an `AdminStatGrid`, which is the container these
       queries measure: below 28rem the grid is two across on a phone, so the
       tile drops its icon well and a step of type size to keep the number
       on one line. -->
  <div class="flex min-w-0 items-start gap-3 bg-card px-3 py-3 @min-[28rem]:px-4 @min-[28rem]:py-3.5" data-slot="admin-stat-tile">
    <span
      v-if="icon"
      :class="['mt-0.5 hidden size-8 shrink-0 items-center justify-center rounded-lg @min-[28rem]:flex', ICON_TONE[tone]]"
      aria-hidden="true"
    >
      <component :is="icon" class="size-4" />
    </span>
    <div class="min-w-0 flex-1">
      <p class="truncate text-xs text-muted-foreground" :title="label">{{ label }}</p>
      <Skeleton v-if="loading" class="mt-1 h-7 w-20" />
      <p v-else class="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-xl leading-tight font-semibold @min-[28rem]:text-2xl">
        <span v-if="text != null" class="tabular-nums">{{ text }}</span>
        <AdminAnimatedNumber v-else-if="value != null" :value="value" :format="format" />
        <span v-else class="text-muted-foreground">—</span>
        <span
          v-if="trend"
          :class="['inline-flex items-center gap-0.5 text-xs font-medium tabular-nums', trendClass(trend)]"
        >
          <LucideArrowUpRight v-if="trend.direction === 'up'" class="size-3.5" aria-hidden="true" />
          <LucideArrowDownRight v-else-if="trend.direction === 'down'" class="size-3.5" aria-hidden="true" />
          <LucideMinus v-else class="size-3.5" aria-hidden="true" />
          {{ trend.text }}
        </span>
      </p>
      <!-- Context on the left, the sparkline on the right of the same line:
           the label and the number above keep the tile's full width. -->
      <div v-if="!loading && (detail || $slots.default)" class="mt-0.5 flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
        <p v-if="detail" class="min-w-0 text-xs tabular-nums text-muted-foreground">{{ detail }}</p>
        <div v-if="$slots.default" class="ml-auto shrink-0">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
