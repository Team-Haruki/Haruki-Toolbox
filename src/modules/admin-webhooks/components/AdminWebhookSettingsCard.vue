<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { InputWithToggle } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  LucideInfo,
  LucideKeyRound,
  LucideLoader2,
  LucideSave,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import FieldError from "@/shared/components/FieldError.vue"
import AdminWebhookStatusBadge from "./AdminWebhookStatusBadge.vue"
import { WEBHOOK_JWT_SECRET_FIELD_ID } from "@/modules/admin-webhooks/composables/useAdminWebhookManagement"
import type { AdminWebhookSettings } from "@/types/admin"

const props = defineProps<{
  canMutate: boolean
  settingsLoading: boolean
  settingsSaving: boolean
  settings: AdminWebhookSettings
  settingsEnabled: boolean
  /** False when nothing differs from the saved settings; the save button is then disabled. */
  settingsDirty: boolean
  jwtSecretInput: string
  jwtSecretError: string
}>()

const emit = defineEmits<{
  (event: "save-settings"): void
  (event: "update:settingsEnabled", value: boolean): void
  (event: "update:jwtSecretInput", value: string): void
}>()

const { t } = useI18n()
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">{{ t("adminWebhooks.settings.title") }}</CardTitle>
      <CardDescription>{{ t("adminWebhooks.settings.description") }}</CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-4">
      <template v-if="settingsLoading">
        <div class="grid gap-4 md:grid-cols-2">
          <Skeleton class="h-24 w-full rounded-lg" />
          <Skeleton class="h-24 w-full rounded-lg" />
        </div>
        <Skeleton class="h-36 w-full rounded-lg" />
      </template>
      <template v-else>
        <Alert v-if="!props.canMutate" variant="default">
          <LucideInfo />
          <AlertTitle>{{ t("adminWebhooks.settings.readOnlyNoticeTitle") }}</AlertTitle>
          <AlertDescription>{{ t("adminWebhooks.settings.readOnlyNoticeDescription") }}</AlertDescription>
        </Alert>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="rounded-lg border bg-muted/20 p-4 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm text-muted-foreground">{{ t("adminWebhooks.settings.globalStatus") }}</span>
              <AdminWebhookStatusBadge
                class="shrink-0"
                :active="settings.enabled"
                :label="settings.enabled ? t('adminWebhooks.status.enabled') : t('adminWebhooks.status.disabled')"
              />
            </div>
            <p class="text-sm text-muted-foreground">{{ t("adminWebhooks.settings.globalStatusHint") }}</p>
          </div>

          <div class="rounded-lg border bg-muted/20 p-4 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm text-muted-foreground">{{ t("adminWebhooks.settings.jwtSecretStatus") }}</span>
              <AdminWebhookStatusBadge
                class="shrink-0"
                :active="props.settings.jwtSecretConfigured"
                :label="props.settings.jwtSecretConfigured ? t('adminWebhooks.status.configured') : t('adminWebhooks.status.notConfigured')"
              />
            </div>
            <p class="text-sm text-muted-foreground">{{ t("adminWebhooks.settings.jwtSecretStatusHint") }}</p>
          </div>
        </div>

        <Alert v-if="!props.settings.jwtSecretConfigured" variant="default">
          <LucideKeyRound />
          <AlertTitle>{{ t("adminWebhooks.settings.secretAlertTitle") }}</AlertTitle>
          <AlertDescription>{{ t("adminWebhooks.settings.secretAlertDescription") }}</AlertDescription>
        </Alert>

        <form class="overflow-hidden rounded-lg border divide-y" novalidate @submit.prevent="emit('save-settings')">
          <div class="flex items-center justify-between gap-4 p-4">
            <Label for="admin-webhooks-enabled" class="text-sm font-medium cursor-pointer">
              {{ t("adminWebhooks.settings.enableSwitchLabel") }}
            </Label>
            <Switch
              id="admin-webhooks-enabled"
              :model-value="props.settingsEnabled"
              :disabled="!props.canMutate || props.settingsSaving"
              @update:model-value="emit('update:settingsEnabled', !!$event)"
            />
          </div>

          <div class="space-y-2 p-4">
            <Label :for="WEBHOOK_JWT_SECRET_FIELD_ID" class="text-sm font-medium">
              {{ t("adminWebhooks.settings.jwtSecretLabel") }}
            </Label>
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

          <div v-if="props.canMutate" class="flex items-center justify-end gap-3 p-4">
            <span v-if="!props.settingsDirty" class="text-xs text-muted-foreground">
              {{ t("adminWebhooks.settings.noChanges") }}
            </span>
            <Button type="submit" :disabled="props.settingsSaving || !props.settingsDirty">
              <LucideLoader2 v-if="props.settingsSaving" class="w-4 h-4 mr-2 animate-spin" />
              <LucideSave v-else class="w-4 h-4 mr-2" />
              {{ t("common.save") }}
            </Button>
          </div>
        </form>
      </template>
    </CardContent>
  </Card>
</template>
