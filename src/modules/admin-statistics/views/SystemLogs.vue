<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { LucideDownload, LucideRefreshCw, LucideRotateCcw, LucideSearch, LucideX } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import SimpleSelect from "@/shared/components/SimpleSelect.vue"
import AdminPagination from "@/modules/admin/components/AdminPagination.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import SystemLogsDetailDialog from "@/modules/admin-statistics/components/SystemLogsDetailDialog.vue"
import SystemLogsSummary from "@/modules/admin-statistics/components/SystemLogsSummary.vue"
import SystemLogsTable from "@/modules/admin-statistics/components/SystemLogsTable.vue"
import { useSystemLogs } from "@/modules/admin-statistics/composables/useSystemLogs"
import { formatNumberCN } from "@/lib/number-format"
import {
  DEFAULT_SYSTEM_LOG_RANGE,
  SYSTEM_LOG_ACTOR_TYPE_FILTERS,
  SYSTEM_LOG_RANGES,
  SYSTEM_LOG_RESULT_FILTERS,
  type SystemLogActorTypeFilter,
  type SystemLogRange,
  type SystemLogResultFilter,
} from "@/modules/admin-statistics/lib/logs-system-query"

const { t } = useI18n()

const {
  loading,
  loadError,
  logs,
  page,
  pageSize,
  total,
  totalPages,
  search,
  result,
  actorType,
  range,
  activeFilterCount,
  rangeLabel,
  summary,
  summaryLoading,
  summaryError,
  detailOpen,
  detailLog,
  detailLoading,
  detailError,
  detailText,
  showDetail,
  retryDetail,
  copyDetail,
  handleExport,
  applySearch,
  resetSearch,
  resetFilters,
  reload,
  loadSummary,
  prevPage,
  nextPage,
  goToPage,
  formatTime,
} = useSystemLogs()

const actorTypeOptions = computed(() =>
  SYSTEM_LOG_ACTOR_TYPE_FILTERS.map((value) => ({
    value,
    label: value === "all"
      ? t("adminStatistics.systemLogs.filters.allActorTypes")
      : t(`adminStatistics.systemLogs.actorType.${value}`),
  })),
)

const rangeOptions = computed(() =>
  SYSTEM_LOG_RANGES.map((value) => ({ value, label: t(`adminStatistics.systemLogs.range.last${value}`) })),
)

const canReset = computed(() => activeFilterCount.value > 0 || range.value !== DEFAULT_SYSTEM_LOG_RANGE)

function setResult(value: AcceptableValue | AcceptableValue[] | undefined) {
  const next = SYSTEM_LOG_RESULT_FILTERS.find((option) => option === value)
  if (next) {
    result.value = next satisfies SystemLogResultFilter
  }
}

function setActorType(value: string) {
  const next = SYSTEM_LOG_ACTOR_TYPE_FILTERS.find((option) => option === value)
  if (next) {
    actorType.value = next satisfies SystemLogActorTypeFilter
  }
}

function setRange(value: string) {
  const next = SYSTEM_LOG_RANGES.find((option) => option === value)
  if (next) {
    range.value = next satisfies SystemLogRange
  }
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col gap-4">
    <SystemLogsSummary
      :summary="summary"
      :loading="summaryLoading"
      :error="summaryError"
      :range-label="rangeLabel"
      :logs="logs"
      :logs-loading="loading"
      @retry="loadSummary"
    />

    <AdminPanel flush>
      <!-- Filter toolbar: everything applies as it changes; the URL keeps it. -->
      <div class="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2.5" data-testid="system-logs-toolbar">
        <div class="relative min-w-[12rem] flex-1 basis-56">
          <LucideSearch class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            v-model="search"
            :aria-label="t('adminStatistics.systemLogs.searchActionPlaceholder')"
            :placeholder="t('adminStatistics.systemLogs.searchActionPlaceholder')"
            class="h-8 pr-8 pl-8"
            @keydown.enter.prevent="applySearch"
          />
          <button
            v-if="search"
            type="button"
            class="absolute top-1/2 right-1 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground pointer-coarse:size-9"
            :title="t('adminStatistics.systemLogs.resetSearch')"
            :aria-label="t('adminStatistics.systemLogs.resetSearch')"
            @click="resetSearch"
          >
            <LucideX class="size-4" aria-hidden="true" />
          </button>
        </div>

        <ToggleGroup
          type="single"
          variant="segment"
          size="sm"
          :model-value="result"
          :aria-label="t('adminStatistics.systemLogs.filters.result')"
          @update:model-value="setResult"
        >
          <ToggleGroupItem v-for="option in SYSTEM_LOG_RESULT_FILTERS" :key="option" :value="option">
            {{ option === "all" ? t("adminStatistics.systemLogs.filters.allResults") : t(`adminStatistics.common.${option}`) }}
          </ToggleGroupItem>
        </ToggleGroup>

        <SimpleSelect
          :model-value="actorType"
          :options="actorTypeOptions"
          :aria-label="t('adminStatistics.systemLogs.filters.actorType')"
          size="sm"
          trigger-class="w-[8.5rem]"
          @update:model-value="setActorType"
        />
        <SimpleSelect
          :model-value="range"
          :options="rangeOptions"
          :aria-label="t('adminStatistics.systemLogs.filters.range')"
          size="sm"
          trigger-class="w-[8.5rem]"
          @update:model-value="setRange"
        />

        <div class="ml-auto flex items-center gap-2">
          <Button v-if="canReset" variant="ghost" size="sm" @click="resetFilters">
            <LucideRotateCcw class="size-4" aria-hidden="true" />
            {{ t("admin.filters.reset") }}
          </Button>
          <Button size="sm" :disabled="loading" @click="applySearch">
            <LucideSearch class="size-4" aria-hidden="true" />
            {{ t("admin.filters.search") }}
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="size-8 px-0 has-[>svg]:px-0 pointer-coarse:size-10"
            :disabled="loading"
            :title="t('adminStatistics.systemLogs.refresh')"
            :aria-label="t('adminStatistics.systemLogs.refresh')"
            @click="reload"
          >
            <LucideRefreshCw :class="['size-4', loading ? 'animate-spin' : '']" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="sm" @click="handleExport">
            <LucideDownload class="size-4" aria-hidden="true" />
            {{ t("adminStatistics.systemLogs.exportButton") }}
          </Button>
        </div>
      </div>

      <!-- The rows lay themselves out by this width, not the viewport's. -->
      <div class="@container">
        <SystemLogsTable
          :logs="logs"
          :loading="loading"
          :error="loadError"
          :filtered="activeFilterCount > 0"
          :format-time="formatTime"
          @detail="showDetail"
          @retry="reload"
        />
      </div>

      <template v-if="!loadError" #footer>
        <AdminPagination
          :total="total"
          :page="page"
          :page-size="pageSize"
          :total-pages="totalPages"
          :disabled="loading"
          :total-label="t('adminStatistics.systemLogs.pagination.total', { total: formatNumberCN(total, '0') })"
          @update:page-size="pageSize = $event"
          @prev-page="prevPage"
          @next-page="nextPage"
          @go-to-page="goToPage"
        />
      </template>
    </AdminPanel>

    <SystemLogsDetailDialog
      v-model:open="detailOpen"
      :log="detailLog"
      :loading="detailLoading"
      :error="detailError"
      :detail-text="detailText"
      :format-time="formatTime"
      @retry="retryDetail"
      @copy="copyDetail"
    />
  </div>
</template>
