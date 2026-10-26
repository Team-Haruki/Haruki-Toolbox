<script setup lang="ts">
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  LucideFilter,
  LucideChevronDown,
  LucideRefreshCw,
  LucideSearch,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import FieldError from "@/shared/components/FieldError.vue"
import { UploadLogsSummary, UploadLogsTable } from "@/modules/admin-statistics/components"
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
  successRate,
  isSuccessRateHealthy,
  timeRangeLabel,
  donutData,
  methodChartData,
  methodTotal,
  dataTypeChartData,
  dataTypeTotal,
} = useUploadLogs()
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <Card>
      <CardHeader
        class="pb-3 cursor-pointer select-none"
        role="button"
        tabindex="0"
        :aria-expanded="filtersExpanded"
        @click="filtersExpanded = !filtersExpanded"
        @keydown.enter.prevent="filtersExpanded = !filtersExpanded"
        @keydown.space.prevent="filtersExpanded = !filtersExpanded"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <LucideFilter class="w-4 h-4 shrink-0 text-muted-foreground" />
            <CardTitle class="text-base truncate">{{ t("adminStatistics.uploadLogs.filters.title") }}</CardTitle>
          </div>
          <span class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            {{ filtersExpanded ? t("adminStatistics.uploadLogs.filters.collapse") : t("adminStatistics.uploadLogs.filters.expand") }}
            <LucideChevronDown
              class="w-4 h-4 transition-transform duration-200"
              :class="filtersExpanded ? 'rotate-180' : ''"
            />
          </span>
        </div>
      </CardHeader>
      <CardContent v-if="filtersExpanded" class="pt-0">
        <form class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" @submit.prevent="applyFilters">
          <div class="flex flex-col gap-1.5">
            <Label :for="UPLOAD_LOG_FILTER_IDS.from" class="text-sm">{{ t("adminStatistics.uploadLogs.filters.from") }}</Label>
            <DateTimePicker24h
              :id="UPLOAD_LOG_FILTER_IDS.from"
              v-model="filters.from"
              :invalid="!!timeRangeError"
              :placeholder="t('adminStatistics.uploadLogs.filters.fromPlaceholder')"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label :for="UPLOAD_LOG_FILTER_IDS.to" class="text-sm">{{ t("adminStatistics.uploadLogs.filters.to") }}</Label>
            <DateTimePicker24h
              :id="UPLOAD_LOG_FILTER_IDS.to"
              v-model="filters.to"
              :invalid="!!timeRangeError"
              :placeholder="t('adminStatistics.uploadLogs.filters.toPlaceholder')"
            />
            <FieldError id="upload-log-filter-time-range-error" :message="timeRangeError" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label :for="UPLOAD_LOG_FILTER_IDS.gameUser" class="text-sm">{{ t("adminStatistics.uploadLogs.filters.gameUid") }}</Label>
            <Input
              :id="UPLOAD_LOG_FILTER_IDS.gameUser"
              v-model="filters.gameUserId"
              :placeholder="t('adminStatistics.uploadLogs.filters.gameUidPlaceholder')"
              @keydown.enter.prevent="applyFilters"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="upload-log-filter-method" class="text-sm">{{ t("adminStatistics.uploadLogs.filters.method") }}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button id="upload-log-filter-method" type="button" variant="outline" class="w-full justify-between font-normal" :title="filterMethodTitle || undefined">
                  <span class="truncate">{{ filterMethodLabel }}</span>
                  <LucideChevronDown class="w-4 h-4 text-muted-foreground" />
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
          <div class="flex flex-col gap-1.5">
            <Label for="upload-log-filter-data-type" class="text-sm">{{ t("adminStatistics.uploadLogs.filters.dataType") }}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button id="upload-log-filter-data-type" type="button" variant="outline" class="w-full justify-between font-normal" :title="filterDataTypeTitle || undefined">
                  <span class="truncate">{{ filterDataTypeLabel }}</span>
                  <LucideChevronDown class="w-4 h-4 text-muted-foreground" />
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
          <div class="flex flex-col gap-1.5">
            <Label for="upload-log-filter-server" class="text-sm">{{ t("adminStatistics.uploadLogs.filters.server") }}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button id="upload-log-filter-server" type="button" variant="outline" class="w-full justify-between font-normal" :title="filterServerTitle || undefined">
                  <span class="truncate">{{ filterServerLabel }}</span>
                  <LucideChevronDown class="w-4 h-4 text-muted-foreground" />
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
          <div class="flex flex-col gap-1.5">
            <Label id="upload-log-filter-status-label" for="upload-log-filter-status" class="text-sm">{{ t("adminStatistics.uploadLogs.filters.status") }}</Label>
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
          <div class="flex flex-col gap-1.5">
            <Label id="upload-log-filter-sort-label" for="upload-log-filter-sort" class="text-sm">{{ t("adminStatistics.uploadLogs.filters.sort") }}</Label>
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

          <div class="sm:col-span-2 xl:col-span-3 flex flex-wrap flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <Button type="submit" size="sm" :disabled="loading">
                <LucideSearch class="w-4 h-4 mr-1" />
                {{ t("admin.filters.search") }}
              </Button>
              <Button type="button" variant="outline" size="sm" @click="resetFilters">
                <LucideRefreshCw class="w-4 h-4 mr-1" />
                {{ t("admin.filters.reset") }}
              </Button>
            </div>
            <span v-if="timeRangeLabel" class="text-xs text-muted-foreground mr-1">
              {{ t("adminStatistics.uploadLogs.timeRangeLabel") }} {{ timeRangeLabel }}
            </span>
          </div>
        </form>
      </CardContent>
    </Card>

    <UploadLogsSummary
      v-if="!loadError"
      :loading="loading"
      :total="total"
      :summary="summary"
      :success-rate="successRate"
      :is-success-rate-healthy="isSuccessRateHealthy"
      :donut-data="donutData"
      :method-chart-data="methodChartData"
      :method-total="methodTotal"
      :data-type-chart-data="dataTypeChartData"
      :data-type-total="dataTypeTotal"
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
