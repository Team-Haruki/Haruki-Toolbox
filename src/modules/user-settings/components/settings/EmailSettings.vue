<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { Button } from "@/components/ui/button"
import VerificationStatusBadge from "@/modules/user-settings/components/VerificationStatusBadge.vue"
import {
  Card,
  CardTitle,
  CardContent,
  CardHeader,
  CardDescription
} from "@/components/ui/card"
import { ArrowRightLeft, Mail, ShieldCheck } from "lucide-vue-next"
import { redirectToKratosBrowserFlow } from "@/modules/auth/lib/kratos"

const userStore = useUserStore()
const { t } = useI18n()

const currentEmail = computed(() => userStore.emailInfo?.email ?? t("userSettings.email.unbound"))
const currentNickname = computed(() => userStore.name?.trim() || t("userSettings.email.unsetNickname"))
const emailVerified = computed(() => userStore.emailInfo?.verified === true)

function resolveSettingsReturnTo(section: string): string {
  if (typeof window === "undefined") {
    return `/user/settings?section=${encodeURIComponent(section)}&_identity_saved=1`
  }

  return new URL(
    `/user/settings?section=${encodeURIComponent(section)}&_identity_saved=1`,
    window.location.origin
  ).toString()
}

function openIdentitySettings() {
  redirectToKratosBrowserFlow("settings", {
    returnTo: resolveSettingsReturnTo("profile"),
  })
}

function openVerification() {
  redirectToKratosBrowserFlow("verification")
}
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Mail class="h-6 w-6" />
        {{ t("userSettings.email.title") }}
      </CardTitle>
      <CardDescription>{{ t("userSettings.email.kratosManagedDescription") }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="text-sm text-muted-foreground">{{ t("userSettings.email.currentEmailLabel") }}</div>
          <div class="text-base font-medium break-all">{{ currentEmail }}</div>
        </div>
        <VerificationStatusBadge
          :verified="emailVerified"
          :verified-label="t('userSettings.imBinding.status.verified')"
          :unverified-label="t('userSettings.imBinding.status.unverified')"
        />
      </div>

      <div class="flex items-center justify-between gap-4">
        <div>
          <div class="text-sm text-muted-foreground">{{ t("userSettings.email.currentNicknameLabel") }}</div>
          <div class="text-base font-medium break-all">{{ currentNickname }}</div>
        </div>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row">
        <Button class="flex-1" @click="openIdentitySettings">
          <ArrowRightLeft class="mr-2 h-4 w-4" />
          {{ t("userSettings.email.changeButton") }}
        </Button>
        <Button v-if="!emailVerified" variant="outline" class="flex-1" @click="openVerification">
          <ShieldCheck class="mr-2 h-4 w-4" />
          {{ t("userSettings.email.verifyButton") }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
