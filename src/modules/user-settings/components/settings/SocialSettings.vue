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
import { Link2, ShieldCheck } from "lucide-vue-next"
import { redirectToKratosBrowserFlow } from "@/modules/auth/lib/kratos"
import { resolveSettingsReturnTo } from "@/modules/user-settings/lib/settings-return-to"

const { t } = useI18n()

function openSocialSettings() {
  redirectToKratosBrowserFlow("settings", {
    returnTo: resolveSettingsReturnTo("oidc"),
  })
}
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Link2 class="h-6 w-6" />
        {{ t("userSettings.social.title") }}
      </CardTitle>
      <CardDescription>{{ t("userSettings.social.description") }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <Button class="w-full" @click="openSocialSettings">
        <ShieldCheck class="mr-2 h-4 w-4" />
        {{ t("userSettings.social.manageButton") }}
      </Button>
    </CardContent>
  </Card>
</template>
