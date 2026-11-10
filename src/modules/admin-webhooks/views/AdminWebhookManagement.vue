<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import AdminMeterList, { type AdminMeterItem } from "@/modules/admin/components/AdminMeterList.vue"
import { sharePercent } from "@/modules/admin/lib/stat-visuals"
import { formatNumberCN, formatPercent } from "@/lib/number-format"
import {
  AdminWebhookDeleteDialog,
  AdminWebhookFormDialog,
  AdminWebhookOverview,
  AdminWebhookSettingsCard,
  AdminWebhookSubscribersDialog,
  AdminWebhookTable,
  AdminWebhookTokenDialog,
} from "@/modules/admin-webhooks/components"
import { useAdminWebhookManagement } from "@/modules/admin-webhooks/composables/useAdminWebhookManagement"
import { rankEndpointsBySubscriptions, summarizeWebhookEndpoints } from "@/modules/admin-webhooks/lib/webhook-stats"

const { t } = useI18n()

const {
  canMutate,
  settingsLoading,
  settingsSaving,
  settingsError,
  settings,
  settingsEnabled,
  settingsDirty,
  jwtSecretInput,
  jwtSecretError,
  disableConfirmOpen,
  endpointsLoading,
  endpointsError,
  loadSettings,
  loadEndpoints,
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

const summary = computed(() => summarizeWebhookEndpoints(endpoints.value))

/** Endpoints listed in the subscription breakdown before the rest folds into one line. */
const RANKED_ENDPOINT_LIMIT = 5
const ranked = computed(() => rankEndpointsBySubscriptions(endpoints.value, RANKED_ENDPOINT_LIMIT))

function callbackHost(callbackUrl: string): string {
  try {
    return new URL(callbackUrl).host
  } catch {
    return ""
  }
}

const rankedItems = computed<AdminMeterItem[]>(() =>
  ranked.value.top.map((endpoint) => {
    const host = callbackHost(endpoint.callbackUrl)
    return {
      key: endpoint.id,
      label: host ? `${endpoint.id} · ${host}` : endpoint.id,
      value: endpoint.count,
      text: `${formatNumberCN(endpoint.count)} · ${formatPercent(sharePercent(endpoint.count, summary.value.subscriptions), 0)}`,
    }
  })
)
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <AdminWebhookOverview
      :endpoints-loading="endpointsLoading"
      :endpoints-failed="!!endpointsError"
      :settings-loading="settingsLoading"
      :settings-failed="!!settingsError"
      :summary="summary"
      :total="endpointsTotal"
      :settings="settings"
    />

    <AdminWebhookTable
      :can-mutate="canMutate"
      :endpoints-loading="endpointsLoading"
      :error="endpointsError"
      :endpoints="endpoints"
      :endpoints-generated-at="endpointsGeneratedAt"
      :endpoints-total="endpointsTotal"
      :refreshing="refreshing"
      :format-date="formatDate"
      @retry="loadEndpoints"
      @refresh="refreshAll"
      @create="openCreateDialog"
      @open-subscribers="openSubscribers"
      @open-edit="openEditDialog"
      @confirm-delete="confirmDelete"
    />

    <div class="@container">
      <div class="grid items-start gap-4 @min-[52rem]:grid-cols-2">
        <AdminWebhookSettingsCard
          :can-mutate="canMutate"
          :settings-loading="settingsLoading"
          :settings-saving="settingsSaving"
          :error="settingsError"
          :settings="settings"
          :settings-enabled="settingsEnabled"
          :settings-dirty="settingsDirty"
          :jwt-secret-input="jwtSecretInput"
          :jwt-secret-error="jwtSecretError"
          @save-settings="saveSettings"
          @retry="loadSettings"
          @update:settings-enabled="settingsEnabled = $event"
          @update:jwt-secret-input="updateJwtSecretInput"
        />

        <!-- Which endpoints carry the subscriptions; counted from the list above. -->
        <SettingsGroup v-if="!endpointsError" :title="t('adminWebhooks.overview.rankTitle')" surface="card" data-testid="admin-webhook-ranking">
          <div class="px-4 py-3.5">
            <p class="mb-3 text-xs text-muted-foreground">{{ t("adminWebhooks.overview.rankHint") }}</p>
            <AdminMeterList
              :items="rankedItems"
              :total="summary.subscriptions"
              :loading="endpointsLoading"
              :empty-text="t('adminWebhooks.overview.rankEmpty')"
            />
            <p v-if="!endpointsLoading && ranked.rest > 0" class="mt-2.5 text-xs tabular-nums text-muted-foreground">
              {{ t("adminWebhooks.overview.rankRest", { count: formatNumberCN(ranked.rest) }) }}
            </p>
          </div>
        </SettingsGroup>
      </div>
    </div>

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
