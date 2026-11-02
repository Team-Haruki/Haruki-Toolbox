<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell, Loader2, Smartphone } from "lucide-vue-next"
import { useModuleNotificationSettings } from "@/modules/user-settings/composables/useModuleNotificationSettings"

const { t } = useI18n()
const { enabled, isSaving, setEnabled } = useModuleNotificationSettings()
</script>

<template>
  <Card class="w-full">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Bell class="h-5 w-5" />
        {{ t("userSettings.moduleNotifications.cardTitle") }}
      </CardTitle>
      <CardDescription>{{ t("userSettings.moduleNotifications.cardDescription") }}</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="flex items-start gap-3 rounded-lg border bg-muted/20 p-4">
        <Smartphone class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div class="min-w-0 flex-1 space-y-1">
          <Label for="ios-module-notifications" class="text-sm font-medium">
            {{ t("userSettings.moduleNotifications.label") }}
          </Label>
          <p class="text-xs text-muted-foreground">{{ t("userSettings.moduleNotifications.description") }}</p>
          <p class="text-xs text-muted-foreground">{{ t("userSettings.moduleNotifications.scope") }}</p>
        </div>
        <Loader2 v-if="isSaving" class="mt-0.5 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        <Switch
          id="ios-module-notifications"
          class="shrink-0"
          :model-value="enabled"
          :disabled="isSaving"
          @update:model-value="setEnabled"
        />
      </div>
    </CardContent>
  </Card>
</template>
