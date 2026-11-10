<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideKeyRound,
  LucideListChecks,
  LucideLoader2,
  LucideMonitorSmartphone,
  LucidePackage,
  LucideSave,
  LucideWebhook,
} from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import SettingsFacts, { type SettingsFact } from "@/shared/components/settings/SettingsFacts.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsRow from "@/shared/components/settings/SettingsRow.vue"
import ConfigAllowedKeysGroup from "@/modules/admin-config/components/ConfigAllowedKeysGroup.vue"
import ConfigCredentialsGroup from "@/modules/admin-config/components/ConfigCredentialsGroup.vue"
import ConfigJsonEditor from "@/modules/admin-config/components/ConfigJsonEditor.vue"
import { useSystemConfig } from "@/modules/admin-config/composables/useSystemConfig"
import { readRuntimeFlag, readRuntimeText, summarizeRuntimeSecrets } from "@/modules/admin-config/lib/runtime-facts"

const { t } = useI18n()

const {
  editorOptions,
  apiKeysLoading,
  apiKeysLoadError,
  apiKeys,
  apiKeysDraft,
  apiKeyInput,
  apiKeyInputError,
  apiKeysSaving,
  apiKeysDirty,
  runtimeLoading,
  runtimeLoadError,
  runtimeConfig,
  runtimeJson,
  runtimeSaving,
  runtimeDirty,
  runtimeValidationError,
  runtimeSaveDialogOpen,
  deviceFlowEnabled,
  deviceFlowDialogOpen,
  deviceFlowTarget,
  deviceFlowSaving,
  loadApiKeys,
  loadRuntimeConfig,
  setApiKeyInput,
  addApiKeys,
  removeApiKey,
  restoreApiKey,
  resetApiKeys,
  saveApiKeys,
  requestSaveRuntimeConfig,
  setRuntimeSaveDialogOpen,
  confirmSaveRuntimeConfig,
  requestDeviceFlowChange,
  setDeviceFlowDialogOpen,
  confirmDeviceFlowChange,
} = useSystemConfig()

const deviceFlowSwitchDisabled = computed(() =>
  runtimeLoading.value || !!runtimeLoadError.value || runtimeDirty.value || deviceFlowSaving.value
)

const runtimeReady = computed(() => !runtimeLoading.value && !runtimeLoadError.value)

function onOff(value: boolean | null): string {
  return value === null ? "—" : t(value ? "adminConfig.status.on" : "adminConfig.status.off")
}

/**
 * The strip on top: what the two requests report, nothing derived beyond
 * counting. A value the backend did not send (or that failed to load) is a
 * dash.
 */
const statusFacts = computed<SettingsFact[]>(() => {
  const config = runtimeReady.value ? runtimeConfig.value : null
  const secrets = summarizeRuntimeSecrets(config)
  const proxyVersion = readRuntimeText(config, "harukiProxyVersion")
  return [
    {
      key: "deviceFlow",
      label: t("adminConfig.status.deviceFlow"),
      value: config ? onOff(deviceFlowEnabled.value) : "—",
      icon: LucideMonitorSmartphone,
    },
    {
      key: "webhook",
      label: t("adminConfig.status.webhook"),
      value: onOff(readRuntimeFlag(config, "webhookEnabled")),
      icon: LucideWebhook,
    },
    {
      key: "allowedKeys",
      label: t("adminConfig.status.allowedKeys"),
      value: apiKeysLoading.value || apiKeysLoadError.value ? "—" : apiKeys.value.length,
      icon: LucideListChecks,
    },
    {
      key: "secrets",
      label: t("adminConfig.status.secrets"),
      value: secrets.known > 0 ? t("adminConfig.status.secretsValue", secrets) : "—",
      icon: LucideKeyRound,
    },
    {
      key: "proxyVersion",
      label: t("adminConfig.status.proxyVersion"),
      value: proxyVersion || "—",
      icon: LucidePackage,
      mono: !!proxyVersion,
    },
  ]
})
</script>

<template>
  <div class="@container flex w-full flex-col gap-5">
    <!-- What is in effect right now, before anything is edited. -->
    <SettingsGroup :title="t('adminConfig.status.title')" surface="card" data-testid="config-status">
      <div v-if="runtimeLoading" class="px-4 py-3">
        <Skeleton class="h-10 w-full" />
      </div>
      <SettingsFacts v-else :items="statusFacts" />
    </SettingsGroup>

    <!-- Wide: the lists on the left, the read-only facts and the raw editor on the right. -->
    <div class="grid items-start gap-5 @min-[62rem]:grid-cols-2">
      <div class="@container flex min-w-0 flex-col gap-5">
        <SettingsGroup :title="t('adminConfig.runtimeSwitches.title')" surface="card" data-testid="config-switches">
          <SettingsRow
            :icon="LucideMonitorSmartphone"
            :tone="runtimeReady && deviceFlowEnabled ? 'success' : 'default'"
            :label="t('adminConfig.runtimeSwitches.oauth2DeviceFlow.label')"
            :help="t('adminConfig.runtimeSwitches.oauth2DeviceFlow.description')"
            label-for="runtime-switch-oauth2-device-flow"
          >
            <Skeleton v-if="runtimeLoading" class="h-5 w-9 rounded-full" />
            <template v-else>
              <LucideLoader2 v-if="deviceFlowSaving" class="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
              <Switch
                id="runtime-switch-oauth2-device-flow"
                class="shrink-0"
                :model-value="deviceFlowEnabled"
                :disabled="deviceFlowSwitchDisabled"
                @update:model-value="requestDeviceFlowChange(Boolean($event))"
              />
            </template>
          </SettingsRow>
          <p
            v-if="runtimeDirty && !runtimeLoading"
            class="px-4 py-2.5 text-xs text-amber-800 dark:text-amber-300"
            role="status"
          >
            {{ t("adminConfig.runtimeSwitches.dirtyHint") }}
          </p>
          <p v-else class="px-4 py-2.5 text-xs text-muted-foreground">
            {{ t("adminConfig.runtimeSwitches.description") }}
          </p>
        </SettingsGroup>

        <ConfigAllowedKeysGroup
          :input="apiKeyInput"
          :loading="apiKeysLoading"
          :load-error="apiKeysLoadError"
          :keys="apiKeys"
          :draft="apiKeysDraft"
          :input-error="apiKeyInputError"
          :saving="apiKeysSaving"
          :dirty="apiKeysDirty"
          @update:input="setApiKeyInput"
          @add="addApiKeys"
          @remove="removeApiKey"
          @restore="restoreApiKey"
          @reset="resetApiKeys"
          @save="saveApiKeys"
          @retry="loadApiKeys"
        />
      </div>

      <div class="@container flex min-w-0 flex-col gap-5">
        <ConfigCredentialsGroup v-if="runtimeReady" :config="runtimeConfig" />

        <SettingsGroup :title="t('adminConfig.runtime.title')" surface="card" data-testid="config-runtime">
          <template #action>
            <Badge v-if="runtimeDirty" variant="amber" size="sm" role="status">
              <span class="size-1.5 rounded-full bg-current" aria-hidden="true" />
              {{ t("adminConfig.unsavedChanges") }}
            </Badge>
          </template>

          <div v-if="runtimeLoading" class="px-4 py-3">
            <Skeleton class="h-96 w-full rounded-md" />
          </div>
          <LoadErrorState
            v-else-if="runtimeLoadError"
            :title="t('adminConfig.loadError')"
            :description="runtimeLoadError.message"
            :detail="runtimeLoadError.detail"
            :retrying="runtimeLoading"
            @retry="loadRuntimeConfig()"
          />
          <div v-else class="px-4 py-3">
            <ConfigJsonEditor
              id="system-config-runtime"
              v-model="runtimeJson"
              :options="editorOptions"
              height-class="h-96"
              :validation-error="runtimeValidationError"
              :disabled="runtimeSaving"
            >
              <template #hint>{{ t("adminConfig.runtime.description") }}</template>
            </ConfigJsonEditor>
          </div>

          <template v-if="!runtimeLoadError" #footer>
            <Button :disabled="runtimeLoading || runtimeSaving || !runtimeDirty" @click="requestSaveRuntimeConfig">
              <LucideLoader2 v-if="runtimeSaving" class="size-4 animate-spin" />
              <LucideSave v-else class="size-4" />
              {{ t("common.save") }}
            </Button>
          </template>
        </SettingsGroup>
      </div>
    </div>

    <ConfirmDialog
      :open="deviceFlowDialogOpen"
      :title="deviceFlowTarget ? t('adminConfig.runtimeSwitches.oauth2DeviceFlow.enableTitle') : t('adminConfig.runtimeSwitches.oauth2DeviceFlow.disableTitle')"
      :description="deviceFlowTarget ? t('adminConfig.runtimeSwitches.oauth2DeviceFlow.enableDescription') : t('adminConfig.runtimeSwitches.oauth2DeviceFlow.disableDescription')"
      :confirm-label="deviceFlowTarget ? t('adminConfig.runtimeSwitches.oauth2DeviceFlow.confirmEnable') : t('adminConfig.runtimeSwitches.oauth2DeviceFlow.confirmDisable')"
      :destructive="!deviceFlowTarget"
      :on-confirm="confirmDeviceFlowChange"
      @update:open="setDeviceFlowDialogOpen"
    />

    <ConfirmDialog
      :open="runtimeSaveDialogOpen"
      :title="t('adminConfig.runtime.saveDialogTitle')"
      :description="t('adminConfig.runtime.saveDialogDescription')"
      :confirm-label="t('adminConfig.runtime.saveDialogConfirm')"
      :on-confirm="confirmSaveRuntimeConfig"
      @update:open="setRuntimeSaveDialogOpen"
    />
  </div>
</template>
