<script setup lang="ts">
import { computed } from "vue"
import {
  Card,
  CardAction,
  CardTitle,
  CardHeader,
  CardFooter,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  LucideSave,
  LucideLoader2,
  LucideKeyRound,
  LucideSettings2,
  LucideToggleRight,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import ConfigJsonEditor from "@/modules/admin-config/components/ConfigJsonEditor.vue"
import { useSystemConfig } from "@/modules/admin-config/composables/useSystemConfig"

const { t } = useI18n()

const {
  editorOptions,
  apiKeysLoading,
  apiKeysLoadError,
  apiKeysJson,
  apiKeysSaving,
  apiKeysDirty,
  apiKeysValidationError,
  runtimeLoading,
  runtimeLoadError,
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
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <!-- API Keys -->
    <Card class="rounded-lg">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <LucideKeyRound class="h-4 w-4 shrink-0 text-muted-foreground" />
          {{ t("adminConfig.publicApiKeys.title") }}
        </CardTitle>
        <CardDescription>{{ t("adminConfig.publicApiKeys.description") }}</CardDescription>
        <CardAction>
          <span
            class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 transition-opacity duration-200 dark:text-amber-400"
            :class="apiKeysDirty ? 'opacity-100' : 'pointer-events-none opacity-0'"
            :aria-hidden="!apiKeysDirty"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-current" />
            {{ t("adminConfig.unsavedChanges") }}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Skeleton v-if="apiKeysLoading" class="h-64 w-full rounded-md" />
        <LoadErrorState
          v-else-if="apiKeysLoadError"
          :title="t('adminConfig.loadError')"
          :description="apiKeysLoadError.message"
          :detail="apiKeysLoadError.detail"
          :retrying="apiKeysLoading"
          @retry="loadApiKeys"
        />
        <ConfigJsonEditor
          v-else
          id="system-config-api-keys"
          v-model="apiKeysJson"
          :options="editorOptions"
          height-class="h-64"
          :validation-error="apiKeysValidationError"
          :disabled="apiKeysSaving"
        />
      </CardContent>
      <CardFooter v-if="!apiKeysLoadError" class="border-t justify-end">
        <Button :disabled="apiKeysLoading || apiKeysSaving || !apiKeysDirty" @click="saveApiKeys">
          <LucideLoader2 v-if="apiKeysSaving" class="w-4 h-4 mr-1 animate-spin" />
          <LucideSave v-else class="w-4 h-4 mr-1" />
          {{ t("common.save") }}
        </Button>
      </CardFooter>
    </Card>

    <!-- Runtime switches -->
    <Card class="rounded-lg">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <LucideToggleRight class="h-4 w-4 shrink-0 text-muted-foreground" />
          {{ t("adminConfig.runtimeSwitches.title") }}
        </CardTitle>
        <CardDescription>{{ t("adminConfig.runtimeSwitches.description") }}</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-3">
        <div class="flex flex-col gap-2 rounded-md border p-3">
          <div class="flex items-center justify-between gap-3">
            <Label for="runtime-switch-oauth2-device-flow">{{ t("adminConfig.runtimeSwitches.oauth2DeviceFlow.label") }}</Label>
            <LucideLoader2 v-if="runtimeLoading || deviceFlowSaving" class="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            <Switch
              v-else
              id="runtime-switch-oauth2-device-flow"
              class="shrink-0"
              :model-value="deviceFlowEnabled"
              :disabled="deviceFlowSwitchDisabled"
              @update:model-value="requestDeviceFlowChange(Boolean($event))"
            />
          </div>
          <!-- The long explanation sits under the label so it keeps a readable measure beside the switch. -->
          <p class="text-sm text-muted-foreground">{{ t("adminConfig.runtimeSwitches.oauth2DeviceFlow.description") }}</p>
        </div>
        <p v-if="runtimeDirty && !runtimeLoading" class="text-xs text-amber-600 dark:text-amber-400">
          {{ t("adminConfig.runtimeSwitches.dirtyHint") }}
        </p>
      </CardContent>
    </Card>

    <ConfirmDialog
      :open="deviceFlowDialogOpen"
      :title="deviceFlowTarget ? t('adminConfig.runtimeSwitches.oauth2DeviceFlow.enableTitle') : t('adminConfig.runtimeSwitches.oauth2DeviceFlow.disableTitle')"
      :description="deviceFlowTarget ? t('adminConfig.runtimeSwitches.oauth2DeviceFlow.enableDescription') : t('adminConfig.runtimeSwitches.oauth2DeviceFlow.disableDescription')"
      :confirm-label="deviceFlowTarget ? t('adminConfig.runtimeSwitches.oauth2DeviceFlow.confirmEnable') : t('adminConfig.runtimeSwitches.oauth2DeviceFlow.confirmDisable')"
      :destructive="!deviceFlowTarget"
      :on-confirm="confirmDeviceFlowChange"
      @update:open="setDeviceFlowDialogOpen"
    />

    <!-- Runtime Config -->
    <Card class="rounded-lg">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <LucideSettings2 class="h-4 w-4 shrink-0 text-muted-foreground" />
          {{ t("adminConfig.runtime.title") }}
        </CardTitle>
        <CardDescription>{{ t("adminConfig.runtime.description") }}</CardDescription>
        <CardAction>
          <span
            class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 transition-opacity duration-200 dark:text-amber-400"
            :class="runtimeDirty ? 'opacity-100' : 'pointer-events-none opacity-0'"
            :aria-hidden="!runtimeDirty"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-current" />
            {{ t("adminConfig.unsavedChanges") }}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Skeleton v-if="runtimeLoading" class="h-96 w-full rounded-md" />
        <LoadErrorState
          v-else-if="runtimeLoadError"
          :title="t('adminConfig.loadError')"
          :description="runtimeLoadError.message"
          :detail="runtimeLoadError.detail"
          :retrying="runtimeLoading"
          @retry="loadRuntimeConfig"
        />
        <ConfigJsonEditor
          v-else
          id="system-config-runtime"
          v-model="runtimeJson"
          :options="editorOptions"
          height-class="h-96"
          :validation-error="runtimeValidationError"
          :disabled="runtimeSaving"
        />
      </CardContent>
      <CardFooter v-if="!runtimeLoadError" class="border-t justify-end">
        <Button :disabled="runtimeLoading || runtimeSaving || !runtimeDirty" @click="requestSaveRuntimeConfig">
          <LucideLoader2 v-if="runtimeSaving" class="w-4 h-4 mr-1 animate-spin" />
          <LucideSave v-else class="w-4 h-4 mr-1" />
          {{ t("common.save") }}
        </Button>
      </CardFooter>
    </Card>

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
