<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import VerificationStatusBadge from "@/modules/user-settings/components/VerificationStatusBadge.vue"
import { useAccountSettings } from "@/modules/user-settings/composables/useAccountSettings"
import { redirectToKratosBrowserFlow } from "@/modules/auth/lib/kratos"
import { resolveSettingsReturnTo } from "@/modules/user-settings/lib/settings-return"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from "@/components/ui/avatar"
import { ArrowRightLeft, Loader2, ShieldCheck, Upload, UserCog } from "lucide-vue-next"

const {
  userStore,
  previewAvatar,
  fileInputRef,
  isSaving,
  triggerFileInput,
  onAvatarChange,
} = useAccountSettings()
const { t } = useI18n()

const currentEmail = computed(() => userStore.emailInfo?.email ?? t("userSettings.email.unbound"))
const currentNickname = computed(() => userStore.name?.trim() || t("userSettings.email.unsetNickname"))
const emailVerified = computed(() => userStore.emailInfo?.verified === true)

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
  <Card class="w-full">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <UserCog class="h-5 w-5" />
        {{ t("userSettings.profileCard.title") }}
      </CardTitle>
      <CardDescription>{{ t("userSettings.profileCard.description") }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Identity summary tile -->
      <div class="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/20 p-4">
        <Avatar class="h-16 w-16 shrink-0">
          <AvatarImage :src="previewAvatar || `${userStore.avatarPath}`" />
          <AvatarFallback>{{ userStore.name.charAt(0) }}</AvatarFallback>
        </Avatar>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-base font-semibold break-all">{{ currentNickname }}</span>
            <VerificationStatusBadge
              :verified="emailVerified"
              :verified-label="t('userSettings.imBinding.status.verified')"
              :unverified-label="t('userSettings.imBinding.status.unverified')"
            />
          </div>
          <p class="mt-0.5 text-sm text-muted-foreground break-all">{{ currentEmail }}</p>
        </div>
        <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="onAvatarChange" />
        <Button variant="outline" size="sm" class="shrink-0" :disabled="isSaving" @click="triggerFileInput">
          <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
          <Upload v-else class="mr-2 h-4 w-4" />
          {{ isSaving ? t("userSettings.account.uploading") : t("userSettings.account.changeAvatar") }}
        </Button>
      </div>

      <div class="grid gap-2" :class="emailVerified ? '' : 'sm:grid-cols-2'">
        <Button @click="openIdentitySettings">
          <ArrowRightLeft class="mr-2 h-4 w-4" />
          {{ t("userSettings.email.changeButton") }}
        </Button>
        <Button v-if="!emailVerified" variant="outline" @click="openVerification">
          <ShieldCheck class="mr-2 h-4 w-4" />
          {{ t("userSettings.email.verifyButton") }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
