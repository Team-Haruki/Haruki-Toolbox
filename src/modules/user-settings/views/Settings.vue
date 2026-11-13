<script setup lang="ts">
import { computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { useUserStore } from "@/shared/stores/user"
import {
  ProfileSettingsCard,
  SecuritySettingsCard,
  KratosSettingsFlow,
} from "@/modules/user-settings/components/settings"
import { getKratosPublicUrl } from "@/modules/auth/lib/kratos"
import { getSettings } from "@/modules/user-settings/api/get-settings"
import AfdianBindingCard from "@/modules/user-settings/components/settings/AfdianBindingCard.vue"
import PageHeader from "@/shared/components/PageHeader.vue"
import { normalizeKratosSettingsSection as normalizeSection } from "@/modules/user-settings/lib/kratos-settings-section"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()
const hasKratosFlow = computed(() => typeof route.query.flow === "string" && route.query.flow.trim() !== "")
const hasIdentitySavedFlag = computed(() => route.query._identity_saved === "1")

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
  <div v-if="hasKratosFlow" class="flex w-full flex-1 flex-col px-0 py-4">
    <KratosSettingsFlow :section="activeSection" />
  </div>
  <div v-else class="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-0 py-4">
    <PageHeader
      size="compact"
      :title="t('userSettings.sections.accountTitle')" :description="t('userSettings.sections.accountDescription')"
    />

    <!-- Who you are, how you sign in, then the sponsor binding. -->
    <div class="flex w-full flex-col gap-5">
      <ProfileSettingsCard />
      <SecuritySettingsCard />
      <AfdianBindingCard />
    </div>
  </div>
</template>
