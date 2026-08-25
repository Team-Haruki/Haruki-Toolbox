<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Loader2, LogOut } from "lucide-vue-next"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { extractErrorMessage } from "@/lib/error-utils"
import { logoutInPlace } from "@/modules/auth/api/logout"
import {
  acceptOAuthLogoutChallenge,
  getOAuthLogoutChallenge,
  rejectOAuthLogoutChallenge,
  resolveOAuthRedirectUrl,
  type OAuthLogoutChallenge,
} from "@/modules/user-settings/api/oauth2"

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const logoutChallenge = computed(() =>
  typeof route.query.logout_challenge === "string" ? route.query.logout_challenge.trim() : ""
)
const logoutRequest = ref<OAuthLogoutChallenge | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const loadError = ref("")
const actionError = ref("")

const isValid = computed(() => logoutChallenge.value !== "" && logoutRequest.value !== null)
const clientName = computed(() => {
  const client = logoutRequest.value?.client
  return client?.client_name?.trim() || client?.client_id?.trim() || ""
})

async function loadLogoutChallenge(challenge: string) {
  isLoading.value = true
  loadError.value = ""
  actionError.value = ""
  try {
    const response = await getOAuthLogoutChallenge(challenge, { skipErrorToast: true })
    logoutRequest.value = response.updatedData ?? null
    if (!logoutRequest.value) {
      loadError.value = t("oauth.logout.invalidDescription")
    }
  } catch (error: unknown) {
    logoutRequest.value = null
    loadError.value = extractErrorMessage(error, t("oauth.logout.invalidDescription"))
  } finally {
    isLoading.value = false
  }
}

watch(
  logoutChallenge,
  (challenge) => {
    logoutRequest.value = null
    if (!challenge) {
      loadError.value = ""
      actionError.value = ""
      return
    }

    void loadLogoutChallenge(challenge)
  },
  { immediate: true }
)

async function confirmLogout() {
  if (isSubmitting.value) return
  const challenge = logoutRequest.value?.challenge?.trim() || logoutChallenge.value
  if (!challenge) return

  actionError.value = ""
  isSubmitting.value = true
  try {
    const response = await acceptOAuthLogoutChallenge(challenge, { skipErrorToast: true })
    const redirectUrl = resolveOAuthRedirectUrl(response.updatedData)
    if (!redirectUrl) {
      throw new Error(t("oauth.logout.toast.missingRedirect"))
    }

    // The Hydra session is gone either way; end the Kratos/browser session
    // too so the OP-side logout matches what the RP asked for.
    await logoutInPlace()
    window.location.assign(redirectUrl)
  } catch (error: unknown) {
    const description = extractErrorMessage(error, t("oauth.logout.toast.retry"))
    actionError.value = description
    toast.error(t("oauth.logout.toast.failedTitle"), { description })
    isSubmitting.value = false
  }
}

async function cancelLogout() {
  if (isSubmitting.value) return
  const challenge = logoutRequest.value?.challenge?.trim() || logoutChallenge.value

  isSubmitting.value = true
  try {
    if (challenge) {
      await rejectOAuthLogoutChallenge(challenge, { skipErrorToast: true }).catch(() => undefined)
    }
  } finally {
    await router.push({ name: "home" })
  }
}
</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <Card class="w-full max-w-md" v-if="isLoading">
      <CardHeader class="text-center">
        <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 class="h-6 w-6 text-primary animate-spin" />
        </div>
        <CardTitle class="text-xl">{{ t("oauth.logout.loadingTitle") }}</CardTitle>
      </CardHeader>
    </Card>

    <Card class="w-full max-w-md" v-else-if="isValid">
      <CardHeader class="text-center">
        <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <LogOut class="h-6 w-6 text-primary" />
        </div>
        <CardTitle class="text-xl">{{ t("oauth.logout.title") }}</CardTitle>
        <CardDescription v-if="clientName">
          {{ t("oauth.logout.descriptionPrefix") }}
          <strong class="text-foreground">{{ clientName }}</strong>
          {{ t("oauth.logout.descriptionSuffix") }}
        </CardDescription>
        <CardDescription v-else>
          {{ t("oauth.logout.genericDescription") }}
        </CardDescription>
      </CardHeader>
      <CardContent class="pt-0 space-y-3">
        <p class="text-center text-sm text-muted-foreground">{{ t("oauth.logout.confirmHint") }}</p>
        <div v-if="actionError" class="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {{ actionError }}
        </div>
      </CardContent>
      <CardFooter class="flex gap-3">
        <Button variant="outline" class="flex-1" :disabled="isSubmitting" @click="cancelLogout">
          {{ t("oauth.logout.cancel") }}
        </Button>
        <Button class="flex-1" :disabled="isSubmitting" @click="confirmLogout">
          <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
          <LogOut v-else class="h-4 w-4 mr-2" />
          {{ isSubmitting ? t("oauth.logout.loggingOut") : t("oauth.logout.confirm") }}
        </Button>
      </CardFooter>
    </Card>

    <Card class="w-full max-w-md" v-else>
      <CardHeader class="text-center">
        <CardTitle class="text-xl text-destructive">{{ t("oauth.logout.invalidTitle") }}</CardTitle>
        <CardDescription>
          {{ loadError || t("oauth.logout.invalidDescription") }}
        </CardDescription>
      </CardHeader>
      <CardFooter class="justify-center">
        <Button variant="outline" @click="router.push({ name: 'home' })">
          {{ t("oauth.logout.backHome") }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
