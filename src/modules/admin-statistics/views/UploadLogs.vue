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
import { UploadLogsSummary, UploadLogsTable } from "@/modules/admin-statistics/components"
import { useUploadLogs } from "@/modules/admin-statistics/composables/useUploadLogs"

const { t, locale } = useI18n()

const {
  loading,
  logs,
  total,
  page,
  totalPages,
  summary,
  filtersExpanded,
  filterFrom,
  filterTo,
  filterMethod,
  filterDataType,
  filterServer,
  filterSuccess,
  filterSort,
  filterGameUserId,
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
  applyFilters,
  resetFilters,
  prevPage,
  nextPage,
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
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">{{ t("adminStatistics.uploadLogs.filters.from") }}</Label>
            <DateTimePicker24h v-model="filterFrom" :placeholder="t('adminStatistics.uploadLogs.filters.fromPlaceholder')" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">{{ t("adminStatistics.uploadLogs.filters.to") }}</Label>
            <DateTimePicker24h v-model="filterTo" :placeholder="t('adminStatistics.uploadLogs.filters.toPlaceholder')" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">{{ t("adminStatistics.uploadLogs.filters.gameUid") }}</Label>
            <Input v-model="filterGameUserId" :placeholder="t('adminStatistics.uploadLogs.filters.gameUidPlaceholder')" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">{{ t("adminStatistics.uploadLogs.filters.method") }}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" class="w-full justify-between font-normal">
                  <span class="truncate">{{ filterMethodLabel }}</span>
                  <LucideChevronDown class="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-64">
                <DropdownMenuCheckboxItem
                  v-for="opt in uploadMethods"
                  :key="opt.value"
                  :model-value="filterMethod.includes(opt.value)"
                  @update:model-value="toggleMethodFilter(opt.value, !!$event)"
                  @select.prevent
                >
                  {{ opt.label }}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">{{ t("adminStatistics.uploadLogs.filters.dataType") }}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" class="w-full justify-between font-normal">
                  <span class="truncate">{{ filterDataTypeLabel }}</span>
                  <LucideChevronDown class="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-64">
                <DropdownMenuCheckboxItem
                  v-for="opt in dataTypeOptions"
                  :key="opt.value"
                  :model-value="filterDataType.includes(opt.value)"
                  @update:model-value="toggleDataTypeFilter(opt.value, !!$event)"
                  @select.prevent
                >
                  {{ opt.label }}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">{{ t("adminStatistics.uploadLogs.filters.server") }}</Label>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" class="w-full justify-between font-normal">
                  <span class="truncate">{{ filterServerLabel }}</span>
                  <LucideChevronDown class="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-64">
                <DropdownMenuCheckboxItem
                  v-for="opt in servers"
                  :key="opt.value"
                  :model-value="filterServer.includes(opt.value)"
                  @update:model-value="toggleServerFilter(opt.value, !!$event)"
                  @select.prevent
                >
                  {{ opt.label }}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">{{ t("adminStatistics.uploadLogs.filters.status") }}</Label>
            <Select :key="locale" v-model="filterSuccess">
              <SelectTrigger class="w-full">
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
            <Label class="text-sm">{{ t("adminStatistics.uploadLogs.filters.sort") }}</Label>
            <Select :key="locale" v-model="filterSort">
              <SelectTrigger class="w-full">
                <SelectValue :placeholder="t('adminStatistics.uploadLogs.filters.sortPlaceholder')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="flex flex-wrap flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
          <div class="flex items-center gap-2">
            <Button size="sm" @click="applyFilters">
              <LucideSearch class="w-4 h-4 mr-1" />
              {{ t("adminStatistics.uploadLogs.actions.search") }}
            </Button>
            <Button variant="outline" size="sm" @click="resetFilters">
              <LucideRefreshCw class="w-4 h-4 mr-1" />
              {{ t("common.reset") }}
            </Button>
          </div>
          <span v-if="timeRangeLabel" class="text-xs text-muted-foreground mr-1">
            {{ t("adminStatistics.uploadLogs.timeRangeLabel") }} {{ timeRangeLabel }}
          </span>
        </div>
      </CardContent>
    </Card>

    <UploadLogsSummary
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
      :logs="logs"
      :total="total"
      :page="page"
      :total-pages="totalPages"
      :method-label="methodLabel"
      :server-label="serverLabel"
      :data-type-label="dataTypeLabel"
      :format-time="formatTime"
      @prev-page="prevPage"
      @next-page="nextPage"
    />
  </div>
</template>
