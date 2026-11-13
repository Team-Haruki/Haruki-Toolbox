<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import { Button } from "@/components/ui/button"
import VerificationStatusBadge from "@/modules/user-settings/components/VerificationStatusBadge.vue"
import { useAccountSettings } from "@/modules/user-settings/composables/useAccountSettings"
import { redirectToKratosBrowserFlow } from "@/modules/auth/lib/kratos"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsLinkRow from "@/shared/components/settings/SettingsLinkRow.vue"
import SettingsRow from "@/shared/components/settings/SettingsRow.vue"
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from "@/components/ui/avatar"
import { AtSign, Loader2, MailWarning, Upload } from "lucide-vue-next"

const {
  userStore,
  previewAvatar,
  isSaving,
  triggerFileInput,
  onAvatarChange,
} = useAccountSettings()
const { t } = useI18n()
const router = useRouter()

const currentEmail = computed(() => userStore.emailInfo?.email ?? t("userSettings.email.unbound"))
const currentNickname = computed(() => userStore.name?.trim() || t("userSettings.email.unsetNickname"))
const emailVerified = computed(() => userStore.emailInfo?.verified === true)

// The profile page shows an interstitial and probes the identity host before
// leaving the toolbox, so the card navigates there instead of assigning location.
function openIdentitySettings() {
  void router.push({ name: "user.identityProfileSettings" })
}

function openVerification() {
  redirectToKratosBrowserFlow("verification")
}
</script>

<template>
  <SettingsGroup :title="t('userSettings.profileCard.title')" surface="card" data-testid="account-profile">
    <!-- Who is signed in: avatar, name and email, with the avatar upload beside them. -->
    <div class="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4">
      <Avatar class="size-14 shrink-0">
        <AvatarImage :src="previewAvatar || `${userStore.avatarPath}`" />
        <AvatarFallback>{{ userStore.name.charAt(0) }}</AvatarFallback>
      </Avatar>
      <div class="min-w-0 flex-1 basis-40">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span class="text-base font-semibold break-words">{{ currentNickname }}</span>
          <VerificationStatusBadge
            class="whitespace-nowrap"
            :verified="emailVerified"
            :verified-label="t('userSettings.imBinding.status.verified')"
            :unverified-label="t('userSettings.imBinding.status.unverified')"
          />
        </div>
        <p class="mt-0.5 text-sm text-muted-foreground break-words">{{ currentEmail }}</p>
      </div>
      <input ref="fileInputRef" type="file" accept="image/*" class="hidden" :aria-label="t('userSettings.account.changeAvatar')" @change="onAvatarChange" />
      <Button variant="outline" size="sm" class="shrink-0" :disabled="isSaving" @click="triggerFileInput">
        <Loader2 v-if="isSaving" class="size-4 animate-spin" />
        <Upload v-else class="size-4" />
        {{ isSaving ? t("userSettings.account.uploading") : t("userSettings.account.changeAvatar") }}
      </Button>
    </div>

    <SettingsRow
      v-if="!emailVerified"
      :icon="MailWarning"
      tone="warning"
      :label="t('userSettings.email.unverifiedTitle')"
      :help="t('userSettings.email.unverifiedHelp')"
    >
      <Button size="sm" @click="openVerification">{{ t("userSettings.email.verifyButton") }}</Button>
    </SettingsRow>

    <SettingsLinkRow
      :icon="AtSign"
      :label="t('userSettings.email.changeButton')"
      @click="openIdentitySettings"
    />
  </SettingsGroup>
</template>
