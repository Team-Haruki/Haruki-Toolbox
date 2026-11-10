<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumberCN, formatPercent } from "@/lib/number-format"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import type { CountMatrix } from "@/modules/admin-statistics/lib/dashboard-metrics"
import { ratio } from "@/modules/admin-statistics/lib/dashboard-metrics"
import { resolveUploadDataTypeLabel, resolveUploadMethodLabel } from "@/modules/admin-statistics/lib/upload-log-meta"

/**
 * Upload method × data type: every pair's count in a grid, each cell tinted
 * by its size (one hue, stronger = more), with row and column totals. The
 * numbers are printed in the cells, so the tint only helps the eye find the
 * heavy pairs.
 */
const props = defineProps<{
  matrix: CountMatrix
  loading: boolean
  description?: string
}>()

const { t } = useI18n()

const rows = computed(() => props.matrix.rows.map((row, rowIndex) => ({
  ...row,
  label: resolveUploadMethodLabel(row.key, t),
  share: ratio(row.total, props.matrix.total),
  cells: props.matrix.cells[rowIndex] ?? [],
})))
const columns = computed(() => props.matrix.columns.map((column) => ({
  ...column,
  label: resolveUploadDataTypeLabel(column.key, t),
})))

// The tint fades in a frame after the cells render, once per data set.
const tinted = ref(false)
let tintFrame = 0
watch(() => props.matrix, async () => {
  cancelAnimationFrame(tintFrame)
  tinted.value = false
  await nextTick()
  tintFrame = requestAnimationFrame(() => {
    tinted.value = true
  })
}, { immediate: true })
onBeforeUnmount(() => cancelAnimationFrame(tintFrame))

function cellStyle(count: number) {
  if (count <= 0 || !tinted.value || props.matrix.max <= 0) {
    return { backgroundColor: "transparent" }
  }
  const strength = Math.round(8 + 34 * (count / props.matrix.max))
  return { backgroundColor: `color-mix(in oklab, var(--dash-uploads) ${strength}%, transparent)` }
}

function cellTitle(rowLabel: string, columnLabel: string, count: number): string {
  const share = ratio(count, props.matrix.total)
  return `${rowLabel} × ${columnLabel}: ${formatNumberCN(count)}${share === null ? "" : ` (${formatPercent(share * 100)})`}`
}
</script>

<template>
  <AdminPanel :title="t('adminStatistics.dashboard.matrix.title')" :description="description" flush>
    <div v-if="loading" class="flex flex-col gap-2.5 p-4" aria-busy="true">
      <Skeleton v-for="index in 4" :key="index" class="h-7 w-full" />
    </div>
    <p v-else-if="rows.length === 0" class="px-4 py-8 text-center text-xs text-muted-foreground">
      {{ t("adminStatistics.dashboard.breakdown.empty") }}
    </p>
    <div v-else class="@container overflow-x-auto">
      <table class="w-full border-collapse text-xs" data-testid="statistics-method-matrix">
        <thead>
          <tr class="border-b border-border/60 bg-muted/40 text-muted-foreground">
            <th scope="col" class="py-2 pr-2 pl-4 text-left font-medium">{{ t("adminStatistics.dashboard.matrix.method") }}</th>
            <th v-for="column in columns" :key="column.key" scope="col" class="px-2 py-2 text-right font-medium">
              {{ column.label }}
            </th>
            <th scope="col" class="px-4 py-2 text-right font-medium">{{ t("adminStatistics.dashboard.matrix.total") }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/60">
          <tr v-for="row in rows" :key="row.key">
            <th scope="row" class="min-w-24 py-1.5 pr-2 pl-4 text-left font-normal">{{ row.label }}</th>
            <td v-for="(count, columnIndex) in row.cells" :key="columns[columnIndex]?.key" class="p-1">
              <div
                class="rounded-md px-2 py-1 text-right tabular-nums transition-colors duration-700 motion-reduce:transition-none"
                :style="cellStyle(count)"
                :title="cellTitle(row.label, columns[columnIndex]?.label ?? '', count)"
              >
                <template v-if="count > 0">{{ formatNumberCN(count) }}</template>
                <span v-else class="text-muted-foreground/60" aria-hidden="true">·</span>
                <span v-if="count <= 0" class="sr-only">0</span>
              </div>
            </td>
            <td class="px-4 py-1.5 text-right tabular-nums whitespace-nowrap">
              <span class="font-medium">{{ formatNumberCN(row.total) }}</span>
              <span v-if="row.share !== null" class="ml-1.5 hidden text-muted-foreground @min-[26rem]:inline">{{ formatPercent(row.share * 100) }}</span>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t border-border/60 bg-muted/40 text-muted-foreground">
            <th scope="row" class="px-4 py-2 text-left font-medium">{{ t("adminStatistics.dashboard.matrix.total") }}</th>
            <td v-for="column in columns" :key="column.key" class="px-3 py-2 text-right tabular-nums">
              {{ formatNumberCN(column.total) }}
            </td>
            <td class="px-4 py-2 text-right font-medium tabular-nums text-foreground">{{ formatNumberCN(matrix.total) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </AdminPanel>
</template>
