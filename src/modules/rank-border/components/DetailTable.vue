<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router"

export type DetailTableColumn = {
  key: string
  label: string
  align?: "left" | "right"
  /** Dropped on a narrow panel; the essential columns stay. */
  wideOnly?: boolean
}

export type DetailTableCell = {
  text: string
  /** 0–1: draws a bar under the value so the rows compare at a glance. */
  meter?: number | null
  to?: RouteLocationRaw | null
}

export type DetailTableRow = {
  key: string | number
  cells: readonly DetailTableCell[]
}

/**
 * A plain figures table for the detail page (daily totals, seat holders):
 * hairline rows, right-aligned numbers, and an optional meter under a value.
 * Columns marked `wideOnly` drop out when the panel is narrow, so a phone
 * shows the essentials without scrolling sideways.
 */
const props = defineProps<{
  title: string
  caption?: string | null
  columns: readonly DetailTableColumn[]
  rows: readonly DetailTableRow[]
}>()

/**
 * Edge padding per column. The last column that survives on a narrow panel
 * carries the right gutter there, since the true last one may be hidden.
 */
function cellPadding(index: number) {
  const last = props.columns.length - 1
  let lastNarrow = last
  while (lastNarrow > 0 && props.columns[lastNarrow]?.wideOnly) {
    lastNarrow -= 1
  }
  return [
    index === 0 ? "pl-4" : "pl-3",
    index === last ? "pr-4" : index === lastNarrow ? "pr-4 @min-[36rem]:pr-0" : "",
  ]
}
</script>

<template>
  <section class="@container flex min-w-0 flex-col rounded-xl border bg-card" data-slot="rank-detail-table">
    <header class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 pt-3 pb-2">
      <h2 class="text-sm font-semibold">{{ title }}</h2>
      <p v-if="caption" class="text-xs text-muted-foreground">{{ caption }}</p>
    </header>
    <div class="max-h-[22rem] overflow-y-auto overscroll-contain [scrollbar-width:thin]">
      <table class="w-full border-collapse text-sm tabular-nums">
        <thead class="sticky top-0 bg-card">
          <tr class="text-[11px] text-muted-foreground">
            <th
              v-for="(column, index) in columns"
              :key="column.key"
              scope="col"
              :class="[
                'border-b border-border/60 py-1.5 font-normal whitespace-nowrap',
                cellPadding(index),
                column.align === 'right' ? 'text-right' : 'text-left',
                column.wideOnly ? 'hidden @min-[36rem]:table-cell' : '',
              ]"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/60">
          <tr v-for="row in rows" :key="row.key">
            <td
              v-for="(column, index) in columns"
              :key="column.key"
              :class="[
                'py-1.5 align-top whitespace-nowrap',
                cellPadding(index),
                index === 0 ? 'text-muted-foreground' : '',
                column.align === 'right' ? 'text-right' : 'text-left',
                column.wideOnly ? 'hidden @min-[36rem]:table-cell' : '',
              ]"
            >
              <RouterLink
                v-if="row.cells[index]?.to"
                :to="row.cells[index]!.to!"
                class="underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
              >
                {{ row.cells[index]!.text }}
              </RouterLink>
              <template v-else>{{ row.cells[index]?.text ?? "" }}</template>
              <span
                v-if="row.cells[index]?.meter != null"
                class="mt-1 block h-1 overflow-hidden rounded-full bg-muted"
                aria-hidden="true"
              >
                <span class="block h-full rounded-full bg-primary/70" :style="{ width: `${Math.round(row.cells[index]!.meter! * 100)}%` }" />
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
