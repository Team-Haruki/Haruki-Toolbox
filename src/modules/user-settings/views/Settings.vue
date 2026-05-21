<script setup lang="ts">
import { computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { useUserStore } from "@/shared/stores/user"
import {
  AccountSettings,
  EmailSettings,
  MfaSettings,
  IMAuthorization,
  IMBindingSettings,
  OAuth2Authorizations,
  PasswordSettings,
  SessionSettings,
  SocialSettings,
  KratosSettingsFlow,
} from "@/modules/user-settings/components/settings"
import { getKratosPublicUrl } from "@/modules/auth/lib/kratos"
import { getSettings } from "@/modules/user-settings/api/get-settings"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()
const hasKratosFlow = computed(() => typeof route.query.flow === "string" && route.query.flow.trim() !== "")
const hasIdentitySavedFlag = computed(() => route.query._identity_saved === "1")

function normalizeSection(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  const section = value.trim().toLowerCase()
  if (section === "email" || section === "profile") {
    return "profile"
  }

  if (section === "password") {
    return "password"
  }

  if (section === "mfa" || section === "security") {
    return "mfa"
  }

  if (section === "oidc" || section === "social") {
    return "oidc"
  }

  return section
}

const activeSection = computed(() => normalizeSection(route.query.section) || "profile")

function isSettingsSubmitReferrer(): boolean {
  if (typeof window === "undefined" || hasKratosFlow.value) {
    return false
  }

  const referrer = document.referrer?.trim()
  if (!referrer) {
    return false
  }

  try {
    const parsedReferrer = new URL(referrer)
    const kratosOrigin = new URL(getKratosPublicUrl(), window.location.origin).origin
    return parsedReferrer.origin === kratosOrigin && parsedReferrer.pathname === "/self-service/settings"
  } catch {
    return false
  }
}

async function refreshCurrentUserSettings() {
  const userId = userStore.userId
  if (!userId) {
    return
  }

  try {
    const response = await getSettings(userId, { skipErrorToast: true })
    if (response.status !== 200 || !response.updatedData) {
      return
    }

    userStore.setUser(response.updatedData)
    userStore.setSettingsSyncState("synced")
  } catch {
    // Ignore refresh errors here and keep the save success toast.
  }
}

onMounted(() => {
  if (!hasIdentitySavedFlag.value && !isSettingsSubmitReferrer()) {
    return
  }

  void refreshCurrentUserSettings()

  const section = activeSection.value
  let descriptionKey = "userSettings.kratosFlow.toast.genericSavedDescription"
  if (section === "profile") {
    descriptionKey = "userSettings.kratosFlow.toast.profileSavedDescription"
  } else if (section === "password") {
    descriptionKey = "userSettings.kratosFlow.toast.passwordSavedDescription"
  } else if (section === "mfa") {
    descriptionKey = "userSettings.kratosFlow.toast.mfaSavedDescription"
  } else if (section === "oidc") {
    descriptionKey = "userSettings.kratosFlow.toast.socialSavedDescription"
  }

  toast.success(t("userSettings.kratosFlow.toast.savedTitle"), {
    description: t(descriptionKey),
  })

  if (hasIdentitySavedFlag.value) {
    const nextQuery = { ...route.query }
    delete nextQuery._identity_saved
    void router.replace({
      name: "user.settings",
      query: nextQuery,
    })
  }
})
</script>

<template>
  <div v-if="hasKratosFlow" class="w-full flex-1 flex flex-col items-center px-0 py-4">
    <KratosSettingsFlow :section="activeSection" />
  </div>
  <div v-else class="w-full flex-1 flex flex-col items-center px-0 py-4">
    <div class="w-full max-w-md space-y-1 py-2">
      <h2 class="text-lg font-semibold">{{ t("userSettings.sections.accountTitle") }}</h2>
      <p class="text-sm text-muted-foreground">{{ t("userSettings.sections.accountDescription") }}</p>
    </div>

    <div class="w-full flex flex-col items-center gap-6">
      <AccountSettings />
      <EmailSettings />
      <PasswordSettings />
      <MfaSettings />
      <SocialSettings />
      <SessionSettings />
    </div>

    <div class="w-full max-w-md space-y-1 py-2 mt-6">
      <h2 class="text-lg font-semibold">{{ t("userSettings.sections.toolboxTitle") }}</h2>
      <p class="text-sm text-muted-foreground">{{ t("userSettings.sections.toolboxDescription") }}</p>
    </div>

    <div class="w-full flex flex-col items-center gap-6">
      <IMBindingSettings />
      <IMAuthorization />
      <OAuth2Authorizations />
    </div>
  </div>
</template>
