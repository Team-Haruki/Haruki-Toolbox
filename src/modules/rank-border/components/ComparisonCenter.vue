<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { ArrowLeftRight, ListOrdered, Plus, X } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"

export type ComparisonTableRow = {
  id: string
  label: string
  color: string | null
  removable: boolean
  loading: boolean
  error: boolean
  currentLabel: string
  gapLabel: string | null
  gapTone: "up" | "down" | null
  hourlySpeedLabel: string
  recentAverageLabel: string
  latestPointLabel: string
  threeWindowSpeedLabel: string
  loopCountLabel: string
}

/**
 * Comparison center on the detail page: add up to N rank/player targets, show
 * them as chips + a per-metric table; the traces themselves are overlaid on
 * the trend charts by the page.
 */
defineProps<{
  rows: ComparisonTableRow[]
  limit: number
  canAdd: boolean
  /** T100 seats + border lines from the overview, value = "rank:N" / "line:N". */
  targetOptions: ComboboxOption[]
}>()
const emit = defineEmits<{
  "add-target": [string]
  "add-player": [string]
  remove: [string]
}>()

const { t } = useI18n()

const pickerValue = ref<string | null>(null)
const playerInput = ref("")

function pickTarget(value: string | null) {
  if (typeof value === "string" && value) {
    emit("add-target", value)
  }
  // The picker is an action, not a selection: reset so the next pick fires too.
  pickerValue.value = null
}

function submitPlayer() {
  const value = playerInput.value.trim()
  if (!value) {
    return
  }
  emit("add-player", value)
  playerInput.value = ""
}
</script>

<template>
  <section class="rank-border-comparison-center grid min-w-0 gap-3 rounded-md border bg-muted/15 p-3">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h3 class="text-sm font-semibold">{{ t("rankBorder.comparison.title") }}</h3>
      <span class="text-xs text-muted-foreground">{{ t("rankBorder.comparison.hint", { max: limit }) }}</span>
    </div>

    <div class="flex flex-wrap items-end gap-x-4 gap-y-2">
      <div class="grid min-w-0 flex-1 basis-56 gap-1">
        <span class="text-xs text-muted-foreground">{{ t("rankBorder.comparison.addRank") }}</span>
        <Combobox
          trigger-id="rank-comparison-picker"
          :model-value="pickerValue"
          :options="targetOptions"
          :disabled="!canAdd || targetOptions.length === 0"
          :clearable="false"
          trigger-class="rank-border-comparison-picker-trigger"
          content-class="rank-border-comparison-picker-content"
          :placeholder="t('rankBorder.comparison.targetPickerPlaceholder')"
          :search-placeholder="t('rankBorder.comparison.targetPickerSearch')"
          :empty-text="t('rankBorder.comparison.targetPickerEmpty')"
          :icon-component="ListOrdered"
          :aria-label="t('rankBorder.comparison.addRank')"
          @update:model-value="pickTarget"
        />
      </div>
      <div class="grid gap-1">
        <span class="text-xs text-muted-foreground">{{ t("rankBorder.comparison.addPlayer") }}</span>
        <div class="flex items-center gap-1.5">
          <Input
            v-model="playerInput"
            class="h-8 w-48 max-w-[60vw] text-xs"
            :placeholder="t('rankBorder.comparison.playerPlaceholder')"
            :aria-label="t('rankBorder.comparison.addPlayer')"
            :disabled="!canAdd"
            @keyup.enter="submitPlayer"
          />
          <Button variant="outline" size="sm" class="h-8 px-2 text-xs" :disabled="!canAdd" @click="submitPlayer">
            <Plus class="size-3.5" />
            {{ t("rankBorder.comparison.add") }}
          </Button>
        </div>
      </div>
    </div>

    <div v-if="rows.length <= 1" class="rank-border-comparison-empty">
      <ArrowLeftRight class="size-7 text-muted-foreground/50" />
      <p class="max-w-[22rem] text-xs leading-5 text-muted-foreground">{{ t("rankBorder.comparison.emptyHint") }}</p>
    </div>
    <div v-else class="rank-border-comparison-table">
      <div class="rank-border-comparison-table__scroll">
        <table>
          <thead>
            <tr>
              <th>{{ t("rankBorder.comparison.tableTarget") }}</th>
              <th>{{ t("rankBorder.comparison.current") }}</th>
              <th>{{ t("rankBorder.result.hourlySpeed") }}</th>
              <th>{{ t("rankBorder.result.recentAveragePt") }}</th>
              <th>{{ t("rankBorder.result.latestPointGrowth") }}</th>
              <th>{{ t("rankBorder.result.twentyMinTripleSpeed") }}</th>
              <th>{{ t("rankBorder.result.loopCount") }}</th>
              <th><span class="sr-only">{{ t("rankBorder.comparison.tableActions") }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>
                <span class="inline-flex min-w-0 items-center gap-1.5">
                  <span
                    v-if="row.color"
                    class="inline-block size-2 shrink-0 rounded-full"
                    :style="{ background: row.color }"
                    aria-hidden="true"
                  />
                  <span class="truncate font-medium">{{ row.label }}</span>
                </span>
              </td>
              <template v-if="row.loading">
                <td colspan="5" class="text-muted-foreground">{{ t("rankBorder.comparison.loading", { rank: row.label }) }}</td>
                <td />
              </template>
              <template v-else-if="row.error">
                <td colspan="5" class="text-muted-foreground">{{ t("rankBorder.comparison.empty", { rank: row.label }) }}</td>
                <td />
              </template>
              <template v-else>
                <td>
                  <span class="inline-flex min-w-0 flex-wrap items-baseline gap-x-1.5">
                    <span>{{ row.currentLabel }}</span>
                    <span
                      v-if="row.gapLabel"
                      :class="[
                        'text-[0.6875rem]',
                        row.gapTone === 'up' ? 'text-emerald-600 dark:text-emerald-300' : row.gapTone === 'down' ? 'text-red-500' : 'text-muted-foreground',
                      ]"
                    >
                      {{ row.gapTone === "up" ? "▲" : row.gapTone === "down" ? "▼" : "" }} {{ row.gapLabel }}
                    </span>
                  </span>
                </td>
                <td>{{ row.hourlySpeedLabel }}</td>
                <td>{{ row.recentAverageLabel }}</td>
                <td>{{ row.latestPointLabel }}</td>
                <td>{{ row.threeWindowSpeedLabel }}</td>
                <td>{{ row.loopCountLabel }}</td>
              </template>
              <td class="text-right">
                <Button
                  v-if="row.removable"
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="size-6"
                  :aria-label="t('rankBorder.comparison.remove', { label: row.label })"
                  @click="emit('remove', row.id)"
                >
                  <X class="size-3.5" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Packs controls to the top and lets the last row (table or empty state) fill
   the remaining height, so the card never shows dead stretch gaps when it sits
   beside the taller hero panel. */
.rank-border-comparison-center {
  grid-template-rows: auto auto minmax(0, 1fr);
  align-content: start;
}

.rank-border-comparison-empty {
  display: grid;
  min-height: 7rem;
  align-content: center;
  justify-items: center;
  gap: 0.5rem;
  border: 1px dashed color-mix(in oklab, var(--border) 80%, transparent);
  border-radius: 0.5rem;
  background: color-mix(in oklab, var(--background) 60%, transparent);
  padding: 1rem;
  text-align: center;
}

.rank-border-comparison-table {
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background: color-mix(in oklab, var(--background) 74%, transparent);
}

.rank-border-comparison-table__scroll {
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
}

table {
  width: 100%;
  min-width: 44rem;
  border-collapse: collapse;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

th,
td {
  max-width: 12rem;
  overflow: hidden;
  padding: 0.375rem 0.625rem;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

th {
  border-bottom: 1px solid var(--border);
  color: var(--muted-foreground);
  font-weight: 600;
}

tbody tr:nth-child(even) {
  background: color-mix(in oklab, var(--muted) 42%, transparent);
}

tbody tr:first-child td {
  font-weight: 600;
}

:deep(.rank-border-comparison-picker-trigger) {
  height: 2rem;
  min-width: 0;
  width: 100%;
  font-size: 0.75rem;
}
</style>

<style>
.rank-border-comparison-picker-content {
  width: min(92vw, 26rem);
}
</style>
