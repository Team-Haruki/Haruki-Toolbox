<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
import { KeyRound, ShieldCheck } from "lucide-vue-next"
import { redirectToKratosBrowserFlow } from "@/modules/auth/lib/kratos"
import { resolveSettingsReturnTo } from "@/modules/user-settings/lib/settings-return-to"

const { t } = useI18n()

function openMfaSettings() {
  redirectToKratosBrowserFlow("settings", {
    returnTo: resolveSettingsReturnTo("mfa"),
  })
}
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <KeyRound class="h-6 w-6" />
        {{ t("userSettings.mfa.title") }}
      </CardTitle>
      <CardDescription>{{ t("userSettings.mfa.description") }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <Button class="w-full" @click="openMfaSettings">
        <ShieldCheck class="mr-2 h-4 w-4" />
        {{ t("userSettings.mfa.manageButton") }}
      </Button>
    </CardContent>
  </Card>
</template>
