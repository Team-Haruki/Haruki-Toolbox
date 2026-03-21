<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Loader2, LogIn, ShieldCheck, ShieldX } from "lucide-vue-next"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { extractErrorMessage } from "@/lib/error-utils"
import { useUserStore } from "@/shared/stores/user"
import {
  acceptOAuthLoginChallenge,
  getOAuthLoginChallenge,
  rejectOAuthLoginChallenge,
  resolveOAuthRedirectUrl,
  type OAuthLoginChallenge,
} from "@/modules/user-settings/api/oauth2"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

const loginChallenge = computed(() =>
  typeof route.query.login_challenge === "string" ? route.query.login_challenge.trim() : ""
)
const loginRequest = ref<OAuthLoginChallenge | null>(null)
const isLoading = ref(false)
const isSubmitting = ref(false)
const loadError = ref("")
const actionError = ref("")
const autoAcceptedChallenge = ref("")

const isLoggedIn = computed(() => userStore.isLoggedIn)
const isValid = computed(() => loginChallenge.value !== "" && loginRequest.value !== null)
const clientName = computed(() => {
  const client = loginRequest.value?.client
  return client?.client_name?.trim() || client?.client_id?.trim() || t("oauth.login.unknownApp")
})

async function loadLoginChallenge(challenge: string) {
  isLoading.value = true
  loadError.value = ""
  actionError.value = ""
  try {
    const response = await getOAuthLoginChallenge(challenge, { skipErrorToast: true })
    loginRequest.value = response.updatedData ?? null
    if (!loginRequest.value) {
      loadError.value = t("oauth.login.invalidDescription")
    }
  } catch (error: unknown) {
    loginRequest.value = null
    loadError.value = extractErrorMessage(error, t("oauth.login.invalidDescription"))
  } finally {
    isLoading.value = false
  }
}

watch(
  loginChallenge,
  (challenge) => {
    loginRequest.value = null
    autoAcceptedChallenge.value = ""
    if (!challenge) {
      loadError.value = ""
      actionError.value = ""
      return
    }

    void loadLoginChallenge(challenge)
  },
  { immediate: true }
)

async function continueAuthorization() {
  if (isSubmitting.value) return
  const challenge = loginRequest.value?.challenge?.trim() || loginChallenge.value
  if (!challenge) return

  actionError.value = ""
  isSubmitting.value = true
  try {
    const response = await acceptOAuthLoginChallenge(challenge, undefined, { skipErrorToast: true })
    const redirectUrl = resolveOAuthRedirectUrl(response.updatedData)
    if (!redirectUrl) {
      throw new Error(t("oauth.login.toast.missingRedirect"))
    }

    window.location.assign(redirectUrl)
  } catch (error: unknown) {
    const description = extractErrorMessage(error, t("oauth.login.toast.retry"))
    actionError.value = description
    toast.error(t("oauth.login.toast.failedTitle"), { description })
  } finally {
    isSubmitting.value = false
  }
}

watch(
  [() => loginRequest.value?.challenge ?? "", isLoggedIn, isLoading],
  ([challenge, loggedIn, loading]) => {
    if (!challenge || !loggedIn || loading || isSubmitting.value) {
      return
    }

    if (autoAcceptedChallenge.value === challenge) {
      return
    }

    autoAcceptedChallenge.value = challenge
    void continueAuthorization()
  },
  { immediate: true }
)

function goToLogin() {
  if (isSubmitting.value) return
  void router.push({
    name: "user.login",
    query: { redirect: route.fullPath },
  })
}

async function rejectAuthorization() {
  if (isSubmitting.value) return
  const challenge = loginRequest.value?.challenge?.trim() || loginChallenge.value
  if (!challenge) return

  actionError.value = ""
  isSubmitting.value = true
  try {
    const response = await rejectOAuthLoginChallenge(
      challenge,
      {
        error: "access_denied",
        errorDescription: t("oauth.login.rejectDescription"),
        statusCode: 403,
      },
      { skipErrorToast: true }
    )
    const redirectUrl = resolveOAuthRedirectUrl(response.updatedData)
    if (!redirectUrl) {
      throw new Error(t("oauth.login.toast.missingRedirect"))
    }

    window.location.assign(redirectUrl)
  } catch (error: unknown) {
    const description = extractErrorMessage(error, t("oauth.login.toast.retry"))
    actionError.value = description
    toast.error(t("oauth.login.toast.failedTitle"), { description })
  } finally {
    isSubmitting.value = false
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
        <CardTitle class="text-xl">{{ t("oauth.login.continuingTitle") }}</CardTitle>
        <CardDescription>
          {{ t("oauth.login.continuingDescriptionPrefix") }}
          <strong class="text-foreground">{{ clientName }}</strong>
          {{ t("oauth.login.continuingDescriptionSuffix") }}
        </CardDescription>
      </CardHeader>
    </Card>

    <Card class="w-full max-w-md" v-else-if="isValid && !isLoggedIn">
      <CardHeader class="text-center">
        <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <LogIn class="h-6 w-6 text-primary" />
        </div>
        <CardTitle class="text-xl">{{ t("oauth.login.title") }}</CardTitle>
        <CardDescription>
          {{ t("oauth.login.signInDescriptionPrefix") }}
          <strong class="text-foreground">{{ clientName }}</strong>
          {{ t("oauth.login.signInDescriptionSuffix") }}
        </CardDescription>
      </CardHeader>
      <CardFooter class="flex gap-3">
        <Button class="flex-1" @click="goToLogin">
          <LogIn class="h-4 w-4 mr-2" />
          {{ t("oauth.login.signInButton") }}
        </Button>
        <Button variant="outline" class="flex-1" @click="router.push({ name: 'home' })">
          {{ t("oauth.login.backHome") }}
        </Button>
      </CardFooter>
    </Card>

    <Card class="w-full max-w-md" v-else-if="isValid">
      <CardHeader class="text-center">
        <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldCheck class="h-6 w-6 text-primary" />
        </div>
        <CardTitle class="text-xl">{{ t("oauth.login.title") }}</CardTitle>
        <CardDescription>
          {{ t("oauth.login.readyDescriptionPrefix") }}
          <strong class="text-foreground">{{ clientName }}</strong>
          {{ t("oauth.login.readyDescriptionSuffix") }}
        </CardDescription>
      </CardHeader>
      <CardContent v-if="actionError" class="pt-0">
        <div class="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {{ actionError }}
        </div>
      </CardContent>
      <CardFooter class="flex gap-3">
        <Button
          variant="outline"
          class="flex-1"
          :disabled="isSubmitting"
          @click="rejectAuthorization"
        >
          <ShieldX class="h-4 w-4 mr-2" />
          {{ t("oauth.login.cancel") }}
        </Button>
        <Button
          class="flex-1"
          :disabled="isSubmitting"
          @click="continueAuthorization"
        >
          <ShieldCheck class="h-4 w-4 mr-2" />
          {{ t("oauth.login.continueButton") }}
        </Button>
      </CardFooter>
    </Card>

    <Card class="w-full max-w-md" v-else>
      <CardHeader class="text-center">
        <CardTitle class="text-xl text-destructive">{{ t("oauth.login.invalidTitle") }}</CardTitle>
        <CardDescription>
          {{ loadError || t("oauth.login.invalidDescription") }}
        </CardDescription>
      </CardHeader>
      <CardFooter class="justify-center">
        <Button variant="outline" @click="router.push({ name: 'home' })">
          {{ t("oauth.login.backHome") }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
