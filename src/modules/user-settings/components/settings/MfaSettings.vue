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
      <div class="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        {{ t("userSettings.mfa.hint") }}
      </div>

      <Button class="w-full" @click="openMfaSettings">
        <ShieldCheck class="mr-2 h-4 w-4" />
        {{ t("userSettings.mfa.manageButton") }}
      </Button>
    </CardContent>
  </Card>
</template>
