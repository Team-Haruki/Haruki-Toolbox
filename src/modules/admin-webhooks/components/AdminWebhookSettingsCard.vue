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
import AdminWebhookStatusBadge from "./AdminWebhookStatusBadge.vue"
import type { AdminWebhookSettings } from "@/types/admin"

const props = defineProps<{
  canMutate: boolean
  settingsLoading: boolean
  settingsSaving: boolean
  settings: AdminWebhookSettings
  settingsEnabled: boolean
  jwtSecretInput: string
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

        <div class="overflow-hidden rounded-lg border divide-y">
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
            <Label for="admin-webhooks-jwt-secret" class="text-sm font-medium">
              {{ t("adminWebhooks.settings.jwtSecretLabel") }}
            </Label>
            <InputWithToggle
              id="admin-webhooks-jwt-secret"
              :model-value="props.jwtSecretInput"
              type="password"
              :placeholder="t('adminWebhooks.settings.jwtSecretPlaceholder')"
              :disabled="!props.canMutate || props.settingsSaving"
              @update:model-value="emit('update:jwtSecretInput', String($event ?? ''))"
            />
            <p class="text-xs text-muted-foreground">{{ t("adminWebhooks.settings.jwtSecretHelp") }}</p>
          </div>
        </div>

        <div v-if="props.canMutate" class="flex justify-end">
          <Button :disabled="props.settingsSaving" @click="emit('save-settings')">
            <LucideLoader2 v-if="props.settingsSaving" class="w-4 h-4 mr-2 animate-spin" />
            <LucideSave v-else class="w-4 h-4 mr-2" />
            {{ t("common.save") }}
          </Button>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
