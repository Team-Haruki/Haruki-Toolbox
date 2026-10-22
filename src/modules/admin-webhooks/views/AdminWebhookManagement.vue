<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideLoader2, LucideRefreshCw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
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
  settingsDirty,
  jwtSecretInput,
  jwtSecretError,
  disableConfirmOpen,
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
  formErrors,
  formDirty,
  deleteOpen,
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
  clearFormError,
  saveWebhook,
  confirmDelete,
  executeDelete,
  saveSettings,
  executeSaveSettings,
  updateJwtSecretInput,
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
      :settings-dirty="settingsDirty"
      :jwt-secret-input="jwtSecretInput"
      :jwt-secret-error="jwtSecretError"
      @save-settings="saveSettings"
      @update:settings-enabled="settingsEnabled = $event"
      @update:jwt-secret-input="updateJwtSecretInput"
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
      :form-errors="formErrors"
      :form-dirty="formDirty"
      @update:open="formOpen = $event"
      @update:form-id="formId = $event"
      @update:form-credential="formCredential = $event"
      @update:form-callback-url="formCallbackUrl = $event"
      @update:form-bearer="formBearer = $event"
      @update:form-enabled="formEnabled = $event"
      @update:form-clear-bearer="formClearBearer = $event"
      @clear-error="clearFormError"
      @save="saveWebhook"
    />

    <AdminWebhookDeleteDialog
      :open="deleteOpen"
      :delete-target-id="deleteTarget?.id ?? ''"
      :on-confirm="executeDelete"
      @update:open="deleteOpen = $event"
    />

    <!-- Turning global delivery off silences every endpoint, so it is confirmed first. -->
    <ConfirmDialog
      v-model:open="disableConfirmOpen"
      :title="t('adminWebhooks.settings.disableDialog.title')"
      :description="t('adminWebhooks.settings.disableDialog.description')"
      :confirm-label="t('adminWebhooks.settings.disableDialog.confirm')"
      destructive
      :on-confirm="executeSaveSettings"
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
