<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideLoader2, LucideRefreshCw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  AdminWebhookDeleteDialog,
  AdminWebhookFormDialog,
  AdminWebhookSettingsCard,
  AdminWebhookSubscribersDialog,
  AdminWebhookTable,
  AdminWebhookTokenDialog,
} from "@/modules/admin-webhooks/components"
import { useAdminWebhookManagement } from "@/modules/admin-webhooks/composables/useAdminWebhookManagement"

const { t } = useI18n()

const {
  canMutate,
  settingsLoading,
  settingsSaving,
  settings,
  settingsEnabled,
  jwtSecretInput,
  endpointsLoading,
  endpoints,
  endpointsGeneratedAt,
  endpointsTotal,
  formOpen,
  formMode,
  formId,
  formCredential,
  formCallbackUrl,
  formBearer,
  formEnabled,
  formClearBearer,
  formSaving,
  deleteOpen,
  deleting,
  deleteTarget,
  tokenDialogOpen,
  latestToken,
  latestTokenHeaderName,
  latestTokenWebhook,
  subscribersOpen,
  subscribersLoading,
  subscribers,
  subscribersGeneratedAt,
  subscribersWebhook,
  refreshAll,
  openCreateDialog,
  openEditDialog,
  saveWebhook,
  confirmDelete,
  executeDelete,
  saveSettings,
  openSubscribers,
  copyLatestToken,
  formatDate,
  serverLabel,
  dataTypeLabel,
} = useAdminWebhookManagement()

const refreshing = computed(() => settingsLoading.value || endpointsLoading.value)
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div class="flex justify-end">
      <Button variant="outline" size="sm" :disabled="refreshing" @click="refreshAll">
        <LucideLoader2 v-if="refreshing" class="w-4 h-4 mr-2 animate-spin" />
        <LucideRefreshCw v-else class="w-4 h-4 mr-2" />
        {{ t("adminWebhooks.actions.refresh") }}
      </Button>
    </div>

    <AdminWebhookSettingsCard
      :can-mutate="canMutate"
      :settings-loading="settingsLoading"
      :settings-saving="settingsSaving"
      :settings="settings"
      :settings-enabled="settingsEnabled"
      :jwt-secret-input="jwtSecretInput"
      @save-settings="saveSettings"
      @update:settings-enabled="settingsEnabled = $event"
      @update:jwt-secret-input="jwtSecretInput = $event"
    />

    <AdminWebhookTable
      :can-mutate="canMutate"
      :endpoints-loading="endpointsLoading"
      :endpoints="endpoints"
      :endpoints-generated-at="endpointsGeneratedAt"
      :endpoints-total="endpointsTotal"
      :format-date="formatDate"
      @create="openCreateDialog"
      @open-subscribers="openSubscribers"
      @open-edit="openEditDialog"
      @confirm-delete="confirmDelete"
    />

    <AdminWebhookFormDialog
      :open="formOpen"
      :form-mode="formMode"
      :form-id="formId"
      :form-credential="formCredential"
      :form-callback-url="formCallbackUrl"
      :form-bearer="formBearer"
      :form-enabled="formEnabled"
      :form-clear-bearer="formClearBearer"
      :form-saving="formSaving"
      @update:open="formOpen = $event"
      @update:form-id="formId = $event"
      @update:form-credential="formCredential = $event"
      @update:form-callback-url="formCallbackUrl = $event"
      @update:form-bearer="formBearer = $event"
      @update:form-enabled="formEnabled = $event"
      @update:form-clear-bearer="formClearBearer = $event"
      @save="saveWebhook"
    />

    <AdminWebhookDeleteDialog
      :open="deleteOpen"
      :deleting="deleting"
      :delete-target-id="deleteTarget?.id ?? ''"
      @update:open="deleteOpen = $event"
      @confirm="executeDelete"
    />

    <AdminWebhookTokenDialog
      :open="tokenDialogOpen"
      :token="latestToken"
      :token-header-name="latestTokenHeaderName"
      :webhook-id="latestTokenWebhook?.id ?? ''"
      @update:open="tokenDialogOpen = $event"
      @copy="copyLatestToken"
    />

    <AdminWebhookSubscribersDialog
      :open="subscribersOpen"
      :subscribers-loading="subscribersLoading"
      :subscribers="subscribers"
      :subscribers-generated-at="subscribersGeneratedAt"
      :webhook-id="subscribersWebhook?.id ?? ''"
      :format-date="formatDate"
      :server-label="serverLabel"
      :data-type-label="dataTypeLabel"
      @update:open="subscribersOpen = $event"
    />
  </div>
</template>
