<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "vue-i18n"
import { RiskEventsPanel, RiskRulesPanel } from "@/modules/admin-risk/components"
import { useRiskManagement } from "@/modules/admin-risk/composables/useRiskManagement"

const { t } = useI18n()

const {
  userStore,
  eventsLoading,
  events,
  totalEvents,
  eventPage,
  eventPageSize,
  actionLoading,
  createOpen,
  newSeverity,
  newSource,
  newAction,
  newReason,
  newTargetUserId,
  creating,
  rulesLoading,
  rulesLoadError,
  rulesJson,
  rulesSaving,
  setCreateOpen,
  handleCreate,
  handleResolve,
  loadRules,
  saveRules,
  eventTotalPages,
  prevPage,
  nextPage,
  formatDate,
} = useRiskManagement()
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <Tabs default-value="events">
      <TabsList>
        <TabsTrigger value="events">{{ t("adminRisk.tabs.events") }}</TabsTrigger>
        <TabsTrigger value="rules">{{ t("adminRisk.tabs.rules") }}</TabsTrigger>
      </TabsList>

      <TabsContent value="events">
        <RiskEventsPanel
          :loading="eventsLoading"
          :events="events"
          :total-events="totalEvents"
          :event-page="eventPage"
          :event-page-size="eventPageSize"
          :action-loading="actionLoading"
          :creating="creating"
          :event-total-pages="eventTotalPages"
          :format-date="formatDate"
          :create-open="createOpen"
          @update:create-open="setCreateOpen"
          v-model:new-severity="newSeverity"
          v-model:new-source="newSource"
          v-model:new-action="newAction"
          v-model:new-reason="newReason"
          v-model:new-target-user-id="newTargetUserId"
          @create="handleCreate"
          @resolve="handleResolve"
          @prev-page="prevPage"
          @next-page="nextPage"
        />
      </TabsContent>

      <TabsContent value="rules">
        <RiskRulesPanel
          :user-is-super-admin="userStore.isSuperAdmin"
          :rules-loading="rulesLoading"
          :rules-load-error="rulesLoadError"
          :rules-saving="rulesSaving"
          v-model:rules-json="rulesJson"
          @save="saveRules"
          @retry="loadRules"
        />
      </TabsContent>
    </Tabs>
  </div>
</template>
