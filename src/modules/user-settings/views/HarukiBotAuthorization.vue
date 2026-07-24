<script setup lang="ts">
import { useI18n } from "vue-i18n"
import {
  IMAuthorization,
  IMBindingSettings,
} from "@/modules/user-settings/components/settings"

const { t } = useI18n()
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center px-0 py-4">
    <div class="w-full max-w-md space-y-1 py-2">
      <h2 class="text-lg font-semibold">{{ t("userSettings.sections.harukiBotTitle") }}</h2>
      <p class="text-sm text-muted-foreground">{{ t("userSettings.sections.harukiBotDescription") }}</p>
    </div>

    <div class="w-full flex flex-col items-center gap-6">
      <IMBindingSettings />
      <IMAuthorization />
    </div>
  </div>
</template>
