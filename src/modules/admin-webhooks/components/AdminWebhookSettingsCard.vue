<script setup lang="ts">
/**
 * The global webhook settings as one grouped list: the delivery switch, the
 * JWT secret, and a save line. Each row carries the saved state as a chip
 * next to its label, so the switch and the input read as pending changes.
 */
import { Button } from "@/components/ui/button"
import { InputWithToggle } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LucideInfo,
  LucideKeyRound,
  LucideLoader2,
  LucidePower,
  LucideSave,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import FieldError from "@/shared/components/FieldError.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsRow from "@/shared/components/settings/SettingsRow.vue"
import AdminWebhookStatusBadge from "./AdminWebhookStatusBadge.vue"
import { WEBHOOK_JWT_SECRET_FIELD_ID } from "@/modules/admin-webhooks/composables/useAdminWebhookManagement"
import type { ErrorDescription } from "@/lib/error-utils"
import type { AdminWebhookSettings } from "@/types/admin"

const props = defineProps<{
  canMutate: boolean
  settingsLoading: boolean
  settingsSaving: boolean
  /** A failed load; shown in place of the values, which would otherwise be defaults. */
  error?: ErrorDescription | null
  settings: AdminWebhookSettings
  settingsEnabled: boolean
  /** False when nothing differs from the saved settings; the save button is then disabled. */
  settingsDirty: boolean
  jwtSecretInput: string
  jwtSecretError: string
}>()

const emit = defineEmits<{
  (event: "save-settings"): void
  (event: "retry"): void
  (event: "update:settingsEnabled", value: boolean): void
  (event: "update:jwtSecretInput", value: string): void
}>()

const { t } = useI18n()
</script>

<template>
  <form class="@container min-w-0" novalidate data-testid="admin-webhook-settings" @submit.prevent="emit('save-settings')">
    <SettingsGroup :title="t('adminWebhooks.settings.title')" surface="card">
      <template v-if="props.settingsLoading">
        <div v-for="i in 2" :key="i" class="flex items-start gap-3 px-4 py-3" data-testid="admin-webhook-settings-loading">
          <Skeleton class="size-8 shrink-0 rounded-lg" />
          <div class="min-w-0 flex-1 space-y-2">
            <Skeleton class="h-4 w-40 max-w-full" />
            <Skeleton class="h-3 w-64 max-w-full" />
          </div>
        </div>
      </template>
      <LoadErrorState
        v-else-if="props.error"
        :title="t('adminWebhooks.toast.loadSettingsFailedTitle')"
        :description="props.error.message"
        :detail="props.error.detail"
        :retrying="props.settingsLoading"
        @retry="emit('retry')"
      />
      <template v-else>
        <p v-if="!props.canMutate" class="flex items-start gap-2 px-4 py-2.5 text-xs text-muted-foreground" role="note">
          <LucideInfo class="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>
            <span class="font-medium text-foreground">{{ t("adminWebhooks.settings.readOnlyNoticeTitle") }}</span>
            {{ t("adminWebhooks.settings.readOnlyNoticeDescription") }}
          </span>
        </p>

        <SettingsRow
          :icon="LucidePower"
          :tone="props.settings.enabled ? 'success' : 'default'"
          :label="t('adminWebhooks.settings.enableSwitchLabel')"
          :help="t('adminWebhooks.settings.globalStatusHint')"
          label-for="admin-webhooks-enabled"
        >
          <template #label>
            <AdminWebhookStatusBadge
              :active="props.settings.enabled"
              :label="props.settings.enabled ? t('adminWebhooks.status.enabled') : t('adminWebhooks.status.disabled')"
            />
          </template>
          <Switch
            id="admin-webhooks-enabled"
            :model-value="props.settingsEnabled"
            :disabled="!props.canMutate || props.settingsSaving"
            @update:model-value="emit('update:settingsEnabled', !!$event)"
          />
        </SettingsRow>

        <SettingsRow
          :icon="LucideKeyRound"
          :tone="props.settings.jwtSecretConfigured ? 'success' : 'warning'"
          :label="t('adminWebhooks.settings.jwtSecretLabel')"
          :label-for="WEBHOOK_JWT_SECRET_FIELD_ID"
        >
          <template #label>
            <AdminWebhookStatusBadge
              :active="props.settings.jwtSecretConfigured"
              inactive-tone="warning"
              :label="props.settings.jwtSecretConfigured ? t('adminWebhooks.status.configured') : t('adminWebhooks.status.notConfigured')"
            />
          </template>
          <template #help>
            <span v-if="props.settings.jwtSecretConfigured">{{ t("adminWebhooks.settings.jwtSecretStatusHint") }}</span>
            <span v-else class="text-amber-800 dark:text-amber-300">{{ t("adminWebhooks.settings.secretAlertDescription") }}</span>
          </template>
          <template #below>
            <!-- Under the label on every width: a secret needs the room. -->
            <div class="-ml-11 flex flex-col gap-1.5 @min-[28rem]:ml-0">
              <InputWithToggle
                :id="WEBHOOK_JWT_SECRET_FIELD_ID"
                :model-value="props.jwtSecretInput"
                type="password"
                :placeholder="t('adminWebhooks.settings.jwtSecretPlaceholder')"
                :disabled="!props.canMutate || props.settingsSaving"
                :aria-invalid="!!props.jwtSecretError || undefined"
                :aria-describedby="props.jwtSecretError ? `${WEBHOOK_JWT_SECRET_FIELD_ID}-error` : undefined"
                @update:model-value="emit('update:jwtSecretInput', String($event ?? ''))"
              />
              <FieldError :id="`${WEBHOOK_JWT_SECRET_FIELD_ID}-error`" :message="props.jwtSecretError" />
              <p class="text-xs text-muted-foreground">{{ t("adminWebhooks.settings.jwtSecretHelp") }}</p>
            </div>
          </template>
        </SettingsRow>
      </template>

      <template v-if="props.canMutate && !props.settingsLoading && !props.error" #footer>
        <span v-if="!props.settingsDirty" class="self-center text-xs text-muted-foreground">
          {{ t("adminWebhooks.settings.noChanges") }}
        </span>
        <Button type="submit" size="sm" :disabled="props.settingsSaving || !props.settingsDirty">
          <LucideLoader2 v-if="props.settingsSaving" class="size-4 animate-spin" />
          <LucideSave v-else class="size-4" />
          {{ t("common.save") }}
        </Button>
      </template>
    </SettingsGroup>
  </form>
</template>
