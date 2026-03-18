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

const { t } = useI18n()

function resolveSettingsReturnTo(section: string): string {
  if (typeof window === "undefined") {
    return `/user/settings?section=${encodeURIComponent(section)}&_identity_saved=1`
  }

  return new URL(
    `/user/settings?section=${encodeURIComponent(section)}&_identity_saved=1`,
    window.location.origin
  ).toString()
}

function openSecuritySettings() {
  redirectToKratosBrowserFlow("settings", {
    returnTo: resolveSettingsReturnTo("password"),
  })
}
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <KeyRound class="h-6 w-6" />
        {{ t("userSettings.password.title") }}
      </CardTitle>
      <CardDescription>{{ t("userSettings.password.kratosManagedDescription") }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        {{ t("userSettings.password.kratosManagedHint") }}
      </div>

      <Button class="w-full" @click="openSecuritySettings">
        <ShieldCheck class="mr-2 h-4 w-4" />
        {{ t("userSettings.password.changeButton") }}
      </Button>
    </CardContent>
  </Card>
</template>
