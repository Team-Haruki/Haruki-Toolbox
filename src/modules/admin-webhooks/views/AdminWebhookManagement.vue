<script setup lang="ts">
import {
  AdminWebhookDeleteDialog,
  AdminWebhookFormDialog,
  AdminWebhookSettingsCard,
  AdminWebhookSubscribersDialog,
  AdminWebhookTable,
  AdminWebhookTokenDialog,
} from "@/modules/admin-webhooks/components"
import { useAdminWebhookManagement } from "@/modules/admin-webhooks/composables/useAdminWebhookManagement"

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
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <AdminWebhookSettingsCard
      :can-mutate="canMutate"
      :settings-loading="settingsLoading"
      :endpoints-loading="endpointsLoading"
      :settings-saving="settingsSaving"
      :settings="settings"
      :settings-enabled="settingsEnabled"
      :jwt-secret-input="jwtSecretInput"
      @refresh="refreshAll"
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
