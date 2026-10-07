<script setup lang="ts">
import {
  BotSecurityAlertActionDialog,
  BotSecurityAlertDetailDialog,
  BotSecurityAlertsTable,
  BotSecurityFiltersCard,
  BotSecuritySummaryStrip,
} from "@/modules/admin-bot-security/components"
import { useBotSecurityAlerts } from "@/modules/admin-bot-security/composables/useBotSecurityAlerts"
import type { BotSecurityAlertAction } from "@/modules/admin-bot-security/lib/alert-meta"
import type { BotSecurityAlert } from "@/types/admin"

const {
  filters,
  filtersExpanded,
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
  totalPages,
  prevPage,
  nextPage,
  reload,
  summary,
  summaryLoading,
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
    <BotSecuritySummaryStrip
      :loading="summaryLoading"
      :summary="summary"
      :kind-label="kindLabel"
      @select-kind="filterByOpenKind"
    />

    <BotSecurityFiltersCard
      v-model:filters="filters"
      v-model:expanded="filtersExpanded"
      :status-options="statusOptions"
      :kind-options="kindOptions"
      :loading="loading"
      @apply="applyFilters"
      @reset="resetFilters"
    />

    <BotSecurityAlertsTable
      :loading="loading"
      :error="loadError"
      :alerts="alerts"
      :total="total"
      :page="page"
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
