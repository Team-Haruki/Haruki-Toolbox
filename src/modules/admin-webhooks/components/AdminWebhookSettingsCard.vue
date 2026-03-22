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
  LucideBan,
  LucideCheckCircle2,
  LucideKeyRound,
  LucideLoader2,
  LucideRefreshCw,
  LucideSave,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import type { AdminWebhookSettings } from "@/types/admin"

const props = defineProps<{
  canMutate: boolean
  settingsLoading: boolean
  endpointsLoading: boolean
  settingsSaving: boolean
  settings: AdminWebhookSettings
  settingsEnabled: boolean
  jwtSecretInput: string
}>()

const emit = defineEmits<{
  (event: "refresh"): void
  (event: "save-settings"): void
  (event: "update:settingsEnabled", value: boolean): void
  (event: "update:jwtSecretInput", value: string): void
}>()

const { t } = useI18n()

function endpointStatusClass(enabled: boolean) {
  return enabled
    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
}
</script>

<template>
  <Card>
    <CardHeader class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="space-y-1">
        <CardTitle class="text-lg">{{ t("adminWebhooks.settings.title") }}</CardTitle>
        <CardDescription>{{ t("adminWebhooks.settings.description") }}</CardDescription>
      </div>
      <Button variant="outline" :disabled="settingsLoading || endpointsLoading" @click="emit('refresh')">
        <LucideRefreshCw class="w-4 h-4 mr-2" />
        {{ t("adminWebhooks.actions.refresh") }}
      </Button>
    </CardHeader>
    <CardContent class="flex flex-col gap-4">
      <template v-if="settingsLoading">
        <Skeleton class="h-28 w-full" />
      </template>
      <template v-else>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="rounded-xl border bg-muted/20 p-4 space-y-2">
            <div class="text-sm text-muted-foreground">{{ t("adminWebhooks.settings.globalStatus") }}</div>
            <div class="flex items-center gap-3">
              <span
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  endpointStatusClass(settings.enabled),
                ]"
              >
                <LucideCheckCircle2 v-if="settings.enabled" class="w-3.5 h-3.5" />
                <LucideBan v-else class="w-3.5 h-3.5" />
                {{ settings.enabled ? t("adminWebhooks.status.enabled") : t("adminWebhooks.status.disabled") }}
              </span>
              <span class="text-sm text-muted-foreground">
                {{ t("adminWebhooks.settings.globalStatusHint") }}
              </span>
            </div>
          </div>

          <div class="rounded-xl border bg-muted/20 p-4 space-y-2">
            <div class="text-sm text-muted-foreground">{{ t("adminWebhooks.settings.jwtSecretStatus") }}</div>
            <div class="flex items-center gap-3">
              <span
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  props.settings.jwtSecretConfigured
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
                ]"
              >
                <LucideCheckCircle2 v-if="props.settings.jwtSecretConfigured" class="w-3.5 h-3.5" />
                <LucideBan v-else class="w-3.5 h-3.5" />
                {{ props.settings.jwtSecretConfigured ? t("adminWebhooks.status.configured") : t("adminWebhooks.status.notConfigured") }}
              </span>
              <span class="text-sm text-muted-foreground">
                {{ t("adminWebhooks.settings.jwtSecretStatusHint") }}
              </span>
            </div>
          </div>
        </div>

        <Alert v-if="!props.settings.jwtSecretConfigured" variant="default">
          <LucideKeyRound />
          <AlertTitle>{{ t("adminWebhooks.settings.secretAlertTitle") }}</AlertTitle>
          <AlertDescription>{{ t("adminWebhooks.settings.secretAlertDescription") }}</AlertDescription>
        </Alert>

        <div class="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-start">
          <div class="flex items-center gap-3">
            <Switch
              id="admin-webhooks-enabled"
              :model-value="props.settingsEnabled"
              :disabled="!props.canMutate || props.settingsSaving"
              @update:model-value="emit('update:settingsEnabled', !!$event)"
            />
            <Label for="admin-webhooks-enabled">{{ t("adminWebhooks.settings.enableSwitchLabel") }}</Label>
          </div>

          <div class="space-y-3">
            <div class="space-y-2">
              <Label for="admin-webhooks-jwt-secret">{{ t("adminWebhooks.settings.jwtSecretLabel") }}</Label>
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
            <div v-if="props.canMutate" class="flex justify-end">
              <Button :disabled="props.settingsSaving" @click="emit('save-settings')">
                <LucideLoader2 v-if="props.settingsSaving" class="w-4 h-4 mr-2 animate-spin" />
                <LucideSave v-else class="w-4 h-4 mr-2" />
                {{ t("common.save") }}
              </Button>
            </div>
          </div>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
