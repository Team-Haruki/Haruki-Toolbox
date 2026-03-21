<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldCheck, ShieldX } from "lucide-vue-next"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  acceptOAuthConsentChallenge,
  getOAuthConsentChallenge,
  getScopeLabel,
  rejectOAuthConsentChallenge,
  resolveOAuthRedirectUrl,
  submitOAuthConsent,
  type OAuthConsentChallenge,
} from "@/modules/user-settings/api/oauth2"
import { extractErrorMessage } from "@/lib/error-utils"

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const isSubmitting = ref(false)
const isLoadingChallenge = ref(false)
const challengeRequest = ref<OAuthConsentChallenge | null>(null)
const loadError = ref("")
const actionError = ref("")
const autoAcceptedChallenge = ref("")

const consentChallenge = computed(() =>
  typeof route.query.consent_challenge === "string" ? route.query.consent_challenge.trim() : ""
)
const isChallengeMode = computed(() => consentChallenge.value !== "")

const legacyClientId = computed(() => String(route.query.client_id ?? ""))
const legacyClientName = computed(() => String(route.query.client_name ?? t("oauth.consent.unknownApp")))
const legacyScopeStr = computed(() => String(route.query.scope ?? ""))
const legacyRedirectUri = computed(() => String(route.query.redirect_uri ?? ""))
const legacyState = computed(() => String(route.query.state ?? ""))
const legacyCodeChallenge = computed(() => String(route.query.code_challenge ?? ""))
const legacyCodeChallengeMethod = computed(() => String(route.query.code_challenge_method ?? ""))

const scopes = computed(() => {
  if (isChallengeMode.value) {
    return challengeRequest.value?.requested_scope ?? []
  }
  return legacyScopeStr.value ? legacyScopeStr.value.split(" ").filter(Boolean) : []
})

const clientName = computed(() => {
  if (isChallengeMode.value) {
    const client = challengeRequest.value?.client
    return client?.client_name?.trim() || client?.client_id?.trim() || t("oauth.consent.unknownApp")
  }

  return legacyClientName.value
})

const isValid = computed(() => {
  if (isChallengeMode.value) {
    return consentChallenge.value !== "" && challengeRequest.value !== null
  }

  return legacyClientId.value !== "" && legacyRedirectUri.value !== "" && scopes.value.length > 0
})

async function loadConsentChallenge(challenge: string) {
  isLoadingChallenge.value = true
  loadError.value = ""
  actionError.value = ""
  try {
    const response = await getOAuthConsentChallenge(challenge, { skipErrorToast: true })
    challengeRequest.value = response.updatedData ?? null
    if (!challengeRequest.value) {
      loadError.value = t("oauth.consent.invalidDescription")
    }
  } catch (error: unknown) {
    challengeRequest.value = null
    loadError.value = extractErrorMessage(error, t("oauth.consent.invalidDescription"))
  } finally {
    isLoadingChallenge.value = false
  }
}

watch(
  consentChallenge,
  (challenge) => {
    challengeRequest.value = null
    autoAcceptedChallenge.value = ""
    loadError.value = ""
    actionError.value = ""

    if (!isChallengeMode.value || !challenge) {
      return
    }

    void loadConsentChallenge(challenge)
  },
  { immediate: true }
)

async function submitChallengeConsent(approved: boolean) {
  const challenge = challengeRequest.value?.challenge?.trim() || consentChallenge.value
  if (!challenge) return

  if (approved) {
    const response = await acceptOAuthConsentChallenge(
      challenge,
      {
        grantScope: scopes.value,
        grantAccessTokenAudience: challengeRequest.value?.requested_access_token_audience ?? [],
      },
      { skipErrorToast: true }
    )
    const redirectUrl = resolveOAuthRedirectUrl(response.updatedData)
    if (!redirectUrl) {
      throw new Error(t("oauth.consent.toast.missingRedirect"))
    }
    window.location.assign(redirectUrl)
    return
  }

  const response = await rejectOAuthConsentChallenge(
    challenge,
    {
      error: "access_denied",
      errorDescription: t("oauth.consent.rejectDescription"),
      statusCode: 403,
    },
    { skipErrorToast: true }
  )
  const redirectUrl = resolveOAuthRedirectUrl(response.updatedData)
  if (!redirectUrl) {
    throw new Error(t("oauth.consent.toast.missingRedirect"))
  }
  window.location.assign(redirectUrl)
}

async function submitLegacyConsent(approved: boolean) {
  const data = await submitOAuthConsent(
    {
      clientId: legacyClientId.value,
      redirectUri: legacyRedirectUri.value,
      scope: legacyScopeStr.value,
      state: legacyState.value || undefined,
      codeChallenge: legacyCodeChallenge.value || undefined,
      codeChallengeMethod: legacyCodeChallengeMethod.value || undefined,
      approved,
    },
    { skipErrorToast: true }
  )
  const redirectUrl = resolveOAuthRedirectUrl(data)
  if (!redirectUrl) {
    throw new Error(
      data.message ||
      data.error_description ||
      data.errorDescription ||
      t("oauth.consent.toast.missingRedirect")
    )
  }
  window.location.assign(redirectUrl)
}

async function submitConsent(approved: boolean) {
  if (isSubmitting.value) return
  isSubmitting.value = true
  actionError.value = ""
  try {
    if (isChallengeMode.value) {
      await submitChallengeConsent(approved)
    } else {
      await submitLegacyConsent(approved)
    }
  } catch (error: unknown) {
    const description = extractErrorMessage(error, t("oauth.consent.toast.retry"))
    actionError.value = description
    toast.error(t("oauth.consent.toast.failedTitle"), {
      description,
    })
  } finally {
    isSubmitting.value = false
  }
}

watch(
  [() => challengeRequest.value?.challenge ?? "", () => challengeRequest.value?.skip === true, isLoadingChallenge],
  ([challenge, shouldSkip, loading]) => {
    if (!challenge || !shouldSkip || loading || isSubmitting.value) {
      return
    }

    if (autoAcceptedChallenge.value === challenge) {
      return
    }

    autoAcceptedChallenge.value = challenge
    void submitConsent(true)
  },
  { immediate: true }
)
</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <Card class="w-full max-w-md" v-if="isLoadingChallenge">
      <CardHeader class="text-center">
        <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 class="h-6 w-6 text-primary animate-spin" />
        </div>
        <CardTitle class="text-xl">{{ t("oauth.consent.authorizing") }}</CardTitle>
        <CardDescription>
          {{ t("oauth.consent.continuingDescriptionPrefix") }}
          <strong class="text-foreground">{{ clientName }}</strong>
          {{ t("oauth.consent.continuingDescriptionSuffix") }}
        </CardDescription>
      </CardHeader>
    </Card>

    <Card class="w-full max-w-md" v-else-if="isValid">
      <CardHeader class="text-center">
        <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldCheck class="h-6 w-6 text-primary" />
        </div>
        <CardTitle class="text-xl">{{ t("oauth.consent.title") }}</CardTitle>
        <CardDescription>
          {{ t("oauth.consent.descriptionPrefix") }}
          <strong class="text-foreground">{{ clientName }}</strong>
          {{ t("oauth.consent.descriptionSuffix") }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div>
            <p class="text-sm font-medium text-muted-foreground mb-2">{{ t("oauth.consent.scopeIntro") }}</p>
            <ul v-if="scopes.length > 0" class="space-y-2">
              <li
                v-for="scope in scopes"
                :key="scope"
                class="flex items-center gap-2 text-sm"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {{ getScopeLabel(scope) }}
              </li>
            </ul>
            <p v-else class="text-sm text-muted-foreground">
              {{ t("oauth.consent.noScopesRequested") }}
            </p>
          </div>
          <div class="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            {{ t("oauth.consent.revokeHint") }}
          </div>
          <div
            v-if="actionError"
            class="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {{ actionError }}
          </div>
        </div>
      </CardContent>
      <CardFooter class="flex gap-3">
        <Button
          variant="outline"
          class="flex-1"
          :disabled="isSubmitting"
          @click="submitConsent(false)"
        >
          <ShieldX class="h-4 w-4 mr-2" />
          {{ t("oauth.consent.reject") }}
        </Button>
        <Button
          class="flex-1"
          :disabled="isSubmitting"
          @click="submitConsent(true)"
        >
          <ShieldCheck class="h-4 w-4 mr-2" />
          {{ isSubmitting ? t("oauth.consent.authorizing") : t("oauth.consent.authorize") }}
        </Button>
      </CardFooter>
    </Card>

    <Card class="w-full max-w-md" v-else>
      <CardHeader class="text-center">
        <CardTitle class="text-xl text-destructive">{{ t("oauth.consent.invalidTitle") }}</CardTitle>
        <CardDescription>
          {{ loadError || t("oauth.consent.invalidDescription") }}
        </CardDescription>
      </CardHeader>
      <CardFooter class="justify-center">
        <Button variant="outline" @click="router.push({ name: 'home' })">
          {{ t("oauth.consent.backHome") }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
