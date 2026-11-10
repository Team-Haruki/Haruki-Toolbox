<script setup lang="ts">
import {
  BotSecurityAlertActionDialog,
  BotSecurityAlertDetailDialog,
  BotSecurityAlertsTable,
  BotSecurityFilters,
  BotSecurityOverview,
} from "@/modules/admin-bot-security/components"
import { useBotSecurityAlerts } from "@/modules/admin-bot-security/composables/useBotSecurityAlerts"
import type { BotSecurityAlertAction } from "@/modules/admin-bot-security/lib/alert-meta"
import type { BotSecurityAlert } from "@/types/admin"

const {
  filters,
  filtersExpanded,
  timeRangeError,
  statusOptions,
  kindOptions,
  applyFilters,
  resetFilters,
  filterByOpenKind,
  refresh,
  loading,
  loadError,
  alerts,
  total,
  page,
  pageSize,
  totalPages,
  prevPage,
  nextPage,
  goToPage,
  reload,
  summary,
  summaryLoading,
  summaryError,
  handledTotals,
  handledTotalsLoading,
  rowStats,
  rowTimeline,
  loadSummary,
  detailOpen,
  detailAlert,
  openDetail,
  actionOpen,
  actionAlert,
  actionKind,
  noteDraft,
  actionSaving,
  openAction,
  submitAction,
  kindLabel,
  statusLabel,
  formatTime,
  formatShortTime,
} = useBotSecurityAlerts()

// Dialogs do not stack: the detail dialog closes before the action dialog opens.
function openActionFromDetail(alert: BotSecurityAlert, action: BotSecurityAlertAction) {
  detailOpen.value = false
  openAction(alert, action)
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <BotSecurityOverview
      :loading="summaryLoading"
      :summary="summary"
      :error="summaryError"
      :handled-totals="handledTotals"
      :handled-totals-loading="handledTotalsLoading"
      :rows-loading="loading"
      :rows-failed="!!loadError"
      :row-stats="rowStats"
      :row-timeline="rowTimeline"
      :kind-label="kindLabel"
      :status-label="statusLabel"
      :format-short-time="formatShortTime"
      @select-kind="filterByOpenKind"
      @retry="loadSummary"
    />

    <BotSecurityFilters
      v-model:filters="filters"
      v-model:expanded="filtersExpanded"
      :status-options="statusOptions"
      :kind-options="kindOptions"
      :loading="loading"
      :time-range-error="timeRangeError"
      @apply="applyFilters"
      @reset="resetFilters"
    />

    <BotSecurityAlertsTable
      :loading="loading"
      :error="loadError"
      :alerts="alerts"
      :total="total"
      :page="page"
      :page-size="pageSize"
      :total-pages="totalPages"
      :action-saving="actionSaving"
      :kind-label="kindLabel"
      :status-label="statusLabel"
      :format-time="formatTime"
      :format-short-time="formatShortTime"
      @detail="openDetail"
      @action="openAction"
      @refresh="refresh"
      @retry="reload"
      @prev-page="prevPage"
      @next-page="nextPage"
      @go-to-page="goToPage"
      @update:page-size="pageSize = $event"
    />

    <BotSecurityAlertDetailDialog
      v-model:open="detailOpen"
      :alert="detailAlert"
      :action-saving="actionSaving"
      :kind-label="kindLabel"
      :status-label="statusLabel"
      :format-time="formatTime"
      @action="openActionFromDetail"
    />

    <BotSecurityAlertActionDialog
      v-model:open="actionOpen"
      v-model:note="noteDraft"
      :alert="actionAlert"
      :action="actionKind"
      :saving="actionSaving"
      :kind-label="kindLabel"
      @confirm="submitAction"
    />
  </div>
</template>
