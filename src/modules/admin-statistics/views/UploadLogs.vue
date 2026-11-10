<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import DateTimePicker24h from "@/components/ui/datetime-picker/DateTimePicker24h.vue"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LucideChevronDown,
  LucideListFilter,
  LucideRefreshCw,
  LucideSearch,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import FieldError from "@/shared/components/FieldError.vue"
import UploadLogsSummary from "@/modules/admin-statistics/components/UploadLogsSummary.vue"
import UploadLogsTable from "@/modules/admin-statistics/components/UploadLogsTable.vue"
import { UPLOAD_LOG_FILTER_IDS, useUploadLogs } from "@/modules/admin-statistics/composables/useUploadLogs"

const { t, locale } = useI18n()

const {
  loading,
  loadError,
  logs,
  total,
  page,
  pageSize,
  totalPages,
  summary,
  analytics,
  analyticsLoading,
  analyticsError,
  loadAnalytics,
  activeFilterCount,
  filtersExpanded,
  filters,
  timeRangeError,
  uploadMethods,
  dataTypeOptions,
  servers,
  sortOptions,
  successOptions,
  toggleMethodFilter,
  toggleDataTypeFilter,
  toggleServerFilter,
  filterMethodLabel,
  filterDataTypeLabel,
  filterServerLabel,
  filterMethodTitle,
  filterDataTypeTitle,
  filterServerTitle,
  applyFilters,
  resetFilters,
  reload,
  prevPage,
  nextPage,
  goToPage,
  methodLabel,
  serverLabel,
  formatTime,
  dataTypeLabel,
  timeRangeLabel,
} = useUploadLogs()

const FILTER_PANEL_ID = "upload-log-filter-panel"
const FIELD_LABEL = "text-xs font-normal text-muted-foreground"
</script>

<template>
  <div class="flex w-full min-w-0 flex-col gap-4">
    <!-- Filters: one panel whose heading folds it away; the fields flow by the panel's own width. -->
    <section class="@container min-w-0 overflow-hidden rounded-xl border bg-card" data-testid="upload-logs-filters">
      <h2>
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none pointer-coarse:min-h-11"
          :aria-expanded="filtersExpanded"
          :aria-controls="FILTER_PANEL_ID"
          @click="filtersExpanded = !filtersExpanded"
        >
          <span class="flex min-w-0 items-center gap-2">
            <LucideListFilter class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span class="truncate text-sm font-semibold">{{ t("adminStatistics.uploadLogs.filters.title") }}</span>
            <span
              v-if="activeFilterCount > 0"
              class="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs leading-4 font-medium text-primary tabular-nums"
              data-testid="upload-logs-active-filters"
            >
              {{ t("adminStatistics.uploadLogs.filters.activeCount", { count: activeFilterCount }) }}
            </span>
          </span>
          <span class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            {{ filtersExpanded ? t("adminStatistics.uploadLogs.filters.collapse") : t("adminStatistics.uploadLogs.filters.expand") }}
            <LucideChevronDown
              class="size-4 transition-transform duration-200 motion-reduce:transition-none"
              :class="filtersExpanded ? 'rotate-180' : ''"
              aria-hidden="true"
            />
          </span>
        </button>
      </h2>
      <form
        v-if="filtersExpanded"
        :id="FILTER_PANEL_ID"
        class="grid grid-cols-1 gap-x-3 gap-y-3 border-t border-border/60 px-4 py-3 @min-[30rem]:grid-cols-2 @min-[56rem]:grid-cols-4"
        @submit.prevent="applyFilters"
      >
        <div class="flex min-w-0 flex-col gap-1">
          <Label :for="UPLOAD_LOG_FILTER_IDS.from" :class="FIELD_LABEL">{{ t("adminStatistics.uploadLogs.filters.from") }}</Label>
          <DateTimePicker24h
            :id="UPLOAD_LOG_FILTER_IDS.from"
            v-model="filters.from"
            :invalid="!!timeRangeError"
            :placeholder="t('adminStatistics.uploadLogs.filters.fromPlaceholder')"
          />
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <Label :for="UPLOAD_LOG_FILTER_IDS.to" :class="FIELD_LABEL">{{ t("adminStatistics.uploadLogs.filters.to") }}</Label>
          <DateTimePicker24h
            :id="UPLOAD_LOG_FILTER_IDS.to"
            v-model="filters.to"
            :invalid="!!timeRangeError"
            :placeholder="t('adminStatistics.uploadLogs.filters.toPlaceholder')"
          />
          <FieldError id="upload-log-filter-time-range-error" :message="timeRangeError" />
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <Label :for="UPLOAD_LOG_FILTER_IDS.gameUser" :class="FIELD_LABEL">{{ t("adminStatistics.uploadLogs.filters.gameUid") }}</Label>
          <Input
            :id="UPLOAD_LOG_FILTER_IDS.gameUser"
            v-model="filters.gameUserId"
            :placeholder="t('adminStatistics.uploadLogs.filters.gameUidPlaceholder')"
            @keydown.enter.prevent="applyFilters"
          />
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <Label for="upload-log-filter-method" :class="FIELD_LABEL">{{ t("adminStatistics.uploadLogs.filters.method") }}</Label>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button id="upload-log-filter-method" type="button" variant="outline" class="w-full justify-between font-normal" :title="filterMethodTitle || undefined">
                <span class="truncate">{{ filterMethodLabel }}</span>
                <LucideChevronDown class="size-4 text-muted-foreground" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-64">
              <DropdownMenuCheckboxItem
                v-for="opt in uploadMethods"
                :key="opt.value"
                :model-value="filters.method.includes(opt.value)"
                @update:model-value="toggleMethodFilter(opt.value, !!$event)"
                @select.prevent
              >
                {{ opt.label }}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <Label for="upload-log-filter-data-type" :class="FIELD_LABEL">{{ t("adminStatistics.uploadLogs.filters.dataType") }}</Label>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button id="upload-log-filter-data-type" type="button" variant="outline" class="w-full justify-between font-normal" :title="filterDataTypeTitle || undefined">
                <span class="truncate">{{ filterDataTypeLabel }}</span>
                <LucideChevronDown class="size-4 text-muted-foreground" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-64">
              <DropdownMenuCheckboxItem
                v-for="opt in dataTypeOptions"
                :key="opt.value"
                :model-value="filters.dataType.includes(opt.value)"
                @update:model-value="toggleDataTypeFilter(opt.value, !!$event)"
                @select.prevent
              >
                {{ opt.label }}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <Label for="upload-log-filter-server" :class="FIELD_LABEL">{{ t("adminStatistics.uploadLogs.filters.server") }}</Label>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button id="upload-log-filter-server" type="button" variant="outline" class="w-full justify-between font-normal" :title="filterServerTitle || undefined">
                <span class="truncate">{{ filterServerLabel }}</span>
                <LucideChevronDown class="size-4 text-muted-foreground" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-64">
              <DropdownMenuCheckboxItem
                v-for="opt in servers"
                :key="opt.value"
                :model-value="filters.server.includes(opt.value)"
                @update:model-value="toggleServerFilter(opt.value, !!$event)"
                @select.prevent
              >
                {{ opt.label }}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <Label id="upload-log-filter-status-label" for="upload-log-filter-status" :class="FIELD_LABEL">{{ t("adminStatistics.uploadLogs.filters.status") }}</Label>
          <Select id="upload-log-filter-status" :key="locale" v-model="filters.success">
            <SelectTrigger aria-labelledby="upload-log-filter-status-label" class="w-full">
              <SelectValue :placeholder="t('adminStatistics.uploadLogs.filters.allStatuses')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in successOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <Label id="upload-log-filter-sort-label" for="upload-log-filter-sort" :class="FIELD_LABEL">{{ t("adminStatistics.uploadLogs.filters.sort") }}</Label>
          <Select id="upload-log-filter-sort" :key="locale" v-model="filters.sort">
            <SelectTrigger aria-labelledby="upload-log-filter-sort-label" class="w-full">
              <SelectValue :placeholder="t('adminStatistics.uploadLogs.filters.sortPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="col-span-full flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" :disabled="loading">
            <LucideSearch class="size-4" aria-hidden="true" />
            {{ t("admin.filters.search") }}
          </Button>
          <Button type="button" variant="outline" size="sm" @click="resetFilters">
            <LucideRefreshCw class="size-4" aria-hidden="true" />
            {{ t("admin.filters.reset") }}
          </Button>
        </div>
      </form>
    </section>

    <UploadLogsSummary
      v-if="!loadError"
      :loading="loading"
      :total="total"
      :summary="summary"
      :analytics="analytics"
      :analytics-loading="analyticsLoading"
      :analytics-error="analyticsError"
      :range-label="timeRangeLabel"
      :method-label="methodLabel"
      :data-type-label="dataTypeLabel"
      :server-label="serverLabel"
      @retry-analytics="loadAnalytics"
    />

    <UploadLogsTable
      :loading="loading"
      :error="loadError"
      :logs="logs"
      :total="total"
      :page="page"
      :page-size="pageSize"
      :total-pages="totalPages"
      :method-label="methodLabel"
      :server-label="serverLabel"
      :data-type-label="dataTypeLabel"
      :format-time="formatTime"
      @retry="reload"
      @update:page-size="pageSize = $event"
      @prev-page="prevPage"
      @next-page="nextPage"
      @go-to-page="goToPage"
    />
  </div>
</template>
