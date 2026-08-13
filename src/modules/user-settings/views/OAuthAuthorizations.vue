<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { OAuth2Authorizations } from "@/modules/user-settings/components/settings"

const { t } = useI18n()
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center gap-4 px-0 py-4">
    <div class="w-full max-w-2xl space-y-1">
      <h2 class="text-lg font-semibold">{{ t("userSettings.sections.oauthTitle") }}</h2>
      <p class="text-sm text-muted-foreground">{{ t("userSettings.sections.oauthDescription") }}</p>
    </div>

    <div class="w-full max-w-2xl flex flex-col gap-4">
      <OAuth2Authorizations />
    </div>
  </div>
</template>
