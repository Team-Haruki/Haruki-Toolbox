<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "vue-i18n"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import {
  RiskEventCreateDialog,
  RiskEventDetailDialog,
  RiskEventStats,
  RiskEventsPanel,
  RiskRulesPanel,
} from "@/modules/admin-risk/components"
import { useRiskEvents } from "@/modules/admin-risk/composables/useRiskEvents"
import { useRiskRules } from "@/modules/admin-risk/composables/useRiskRules"

const { t } = useI18n()

const {
  range,
  statusFilter,
  severityFilter,
  eventsLoading,
  eventsError,
  events,
  totalEvents,
  eventPage,
  eventPageSize,
  totalPages,
  stats,
  statsLoading,
  pageSources,
  actionLoading,
  createOpen,
  newSeverity,
  newSource,
  newAction,
  newReason,
  newTargetUserId,
  createErrors,
  creating,
  detailOpen,
  detailEvent,
  openDetail,
  resolveConfirmOpen,
  eventToResolve,
  requestResolve,
  confirmResolve,
  setCreateOpen,
  handleCreate,
  reloadEvents,
  prevPage,
  nextPage,
  goToPage,
  formatDate,
} = useRiskEvents()

const {
  userStore,
  rulesLoading,
  rulesLoadError,
  rulesJson,
  rulesError,
  rulesDiff,
  rulesEdited,
  pendingChanges,
  rulesSaving,
  loadRules,
  saveRules,
  revertRules,
  formatRulesText,
  formatDate: formatRuleDate,
} = useRiskRules()
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <Tabs default-value="events">
      <TabsList>
        <TabsTrigger value="events">{{ t("adminRisk.tabs.events") }}</TabsTrigger>
        <TabsTrigger value="rules">{{ t("adminRisk.tabs.rules") }}</TabsTrigger>
      </TabsList>

      <TabsContent value="events" class="flex flex-col gap-4">
        <RiskEventStats
          :loading="statsLoading"
          :stats="stats"
          :range="range"
          :rows-loading="eventsLoading"
          :rows-failed="!!eventsError"
          :row-count="events.length"
          :page-sources="pageSources"
        />
        <RiskEventsPanel
          v-model:range="range"
          v-model:status-filter="statusFilter"
          v-model:severity-filter="severityFilter"
          :loading="eventsLoading"
          :error="eventsError"
          :events="events"
          :total-events="totalEvents"
          :event-page="eventPage"
          :event-page-size="eventPageSize"
          :total-pages="totalPages"
          :action-loading="actionLoading"
          :format-date="formatDate"
          @create="setCreateOpen(true)"
          @detail="openDetail"
          @resolve="requestResolve"
          @refresh="reloadEvents"
          @retry="reloadEvents"
          @update:event-page-size="eventPageSize = $event"
          @prev-page="prevPage"
          @next-page="nextPage"
          @go-to-page="goToPage"
        />
      </TabsContent>

      <TabsContent value="rules">
        <RiskRulesPanel
          v-model:rules-json="rulesJson"
          :user-is-super-admin="userStore.isSuperAdmin"
          :rules-loading="rulesLoading"
          :rules-load-error="rulesLoadError"
          :rules-error="rulesError"
          :rules-diff="rulesDiff"
          :rules-edited="rulesEdited"
          :pending-changes="pendingChanges"
          :rules-saving="rulesSaving"
          :format-date="formatRuleDate"
          @save="saveRules"
          @revert="revertRules"
          @format="formatRulesText"
          @retry="loadRules"
        />
      </TabsContent>
    </Tabs>

    <RiskEventCreateDialog
      v-model:severity="newSeverity"
      v-model:source="newSource"
      v-model:action="newAction"
      v-model:reason="newReason"
      v-model:target-user-id="newTargetUserId"
      :open="createOpen"
      :creating="creating"
      :errors="createErrors"
      @update:open="setCreateOpen"
      @create="handleCreate"
    />

    <RiskEventDetailDialog
      v-model:open="detailOpen"
      :event="detailEvent"
      :action-loading="actionLoading"
      :format-date="formatDate"
      @resolve="requestResolve"
    />

    <ConfirmDialog
      v-model:open="resolveConfirmOpen"
      :title="t('adminRisk.events.resolveDialog.title')"
      :description="t('adminRisk.events.resolveDialog.description', { action: eventToResolve?.action ?? '', id: eventToResolve?.id ?? '' })"
      :confirm-label="t('adminRisk.events.resolveDialog.confirm')"
      :on-confirm="confirmResolve"
    />
  </div>
</template>
