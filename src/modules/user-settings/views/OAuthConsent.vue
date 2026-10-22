<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldAlert, ShieldCheck, ShieldX, UserRound } from "lucide-vue-next"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useUserStore } from "@/shared/stores/user"
import { logoutInPlace } from "@/modules/auth/api/logout"
import {
  acceptOAuthConsentChallenge,
  getOAuthConsentChallenge,
  getScopeDescription,
  getScopeLabel,
  groupScopes,
  isKnownScope,
  rejectOAuthConsentChallenge,
  resolveOAuthRedirectUrl,
  submitOAuthConsent,
  type OAuthConsentChallenge,
} from "@/modules/user-settings/api/oauth2"
import { buildSwitchAccountAuthorizeUrl, isConsentSubjectMismatch } from "@/modules/user-settings/lib/oauth-consent"
import { extractErrorMessage, readApiErrorStatus } from "@/lib/error-utils"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

const isSubmitting = ref(false)
const isSwitchingAccount = ref(false)
const isLoadingChallenge = ref(false)
const challengeRequest = ref<OAuthConsentChallenge | null>(null)
const loadError = ref("")
/** The backend refused the challenge (403): it was issued for another account. */
const loadForbidden = ref(false)
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

const scopeGroups = computed(() => groupScopes(scopes.value))
const hasWriteScope = computed(() => scopeGroups.value.some((group) => group.group === "write"))

const clientName = computed(() => {
  if (isChallengeMode.value) {
    const client = challengeRequest.value?.client
    return client?.client_name?.trim() || client?.client_id?.trim() || t("oauth.consent.unknownApp")
  }

  return legacyClientName.value
})

const accountName = computed(() => userStore.name || userStore.userId || "")

// A consent challenge is bound to the subject that passed the login challenge;
// accepting it never re-binds it. After a sign-out and sign-in as someone else
// the same challenge must not be authorized "as" the new person.
const subjectMismatch = computed(
  () =>
    isChallengeMode.value &&
    (loadForbidden.value ||
      isConsentSubjectMismatch(challengeRequest.value?.subject, {
        userId: userStore.userId,
        kratosIdentityId: userStore.kratosIdentityId,
      }))
)

/** Where "switch account" restarts the flow; null when the challenge carries no request URL. */
const switchAccountAuthorizeUrl = computed(() => buildSwitchAccountAuthorizeUrl(challengeRequest.value?.request_url))

const isValid = computed(() => {
  if (isChallengeMode.value) {
    return consentChallenge.value !== "" && challengeRequest.value !== null
  }

  return legacyClientId.value !== "" && legacyRedirectUri.value !== "" && scopes.value.length > 0
})

async function loadConsentChallenge(challenge: string) {
  isLoadingChallenge.value = true
  loadError.value = ""
  loadForbidden.value = false
  actionError.value = ""
  try {
    const response = await getOAuthConsentChallenge(challenge, { skipErrorToast: true })
    challengeRequest.value = response.updatedData ?? null
    if (!challengeRequest.value) {
      loadError.value = t("oauth.consent.invalidDescription")
    }
  } catch (error: unknown) {
    challengeRequest.value = null
    loadForbidden.value = readApiErrorStatus(error) === 403
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
    loadForbidden.value = false
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

// Failures stay on the card as an inline line: the page is the only thing on
// screen, so a toast would just say the same thing twice.
async function submitConsent(approved: boolean) {
  if (isSubmitting.value) return
  if (approved && subjectMismatch.value) {
    actionError.value = t("oauth.consent.subjectMismatchDescription")
    return
  }
  isSubmitting.value = true
  actionError.value = ""
  try {
    if (isChallengeMode.value) {
      await submitChallengeConsent(approved)
    } else {
      await submitLegacyConsent(approved)
    }
  } catch (error: unknown) {
    actionError.value = extractErrorMessage(error, t("oauth.consent.toast.retry"))
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Signs out in place and restarts the authorization for the next account.
 *
 * Challenge mode never returns to this consent URL: the challenge stays bound
 * to the account that signed out. With the challenge's `request_url` the
 * client's original authorize request is replayed with `prompt=login`, so
 * Hydra issues a fresh login challenge for whoever signs in next. Without it
 * the challenge is rejected (the app sees `access_denied` and can restart)
 * before signing out. The legacy flow binds the account on submit, so there
 * the same URL is the right place to come back to.
 */
async function switchAccount() {
  if (isSubmitting.value || isSwitchingAccount.value) return
  isSwitchingAccount.value = true
  actionError.value = ""
  try {
    if (!isChallengeMode.value) {
      await logoutInPlace()
      await router.push({ name: "user.login", query: { redirect: route.fullPath } })
      return
    }

    const authorizeUrl = switchAccountAuthorizeUrl.value
    if (authorizeUrl) {
      await logoutInPlace()
      window.location.assign(authorizeUrl)
      return
    }

    let redirectUrl = ""
    const challenge = challengeRequest.value?.challenge?.trim() || consentChallenge.value
    // A challenge for another account cannot be rejected by this session either.
    if (challenge && !subjectMismatch.value) {
      const response = await rejectOAuthConsentChallenge(
        challenge,
        {
          error: "access_denied",
          errorDescription: t("oauth.consent.switchAccountRejectDescription"),
          statusCode: 403,
        },
        { skipErrorToast: true }
      )
      redirectUrl = resolveOAuthRedirectUrl(response.updatedData) ?? ""
    }
    await logoutInPlace()
    if (redirectUrl) {
      window.location.assign(redirectUrl)
      return
    }
    await router.push({ name: "user.login" })
  } catch (error: unknown) {
    actionError.value = extractErrorMessage(error, t("oauth.consent.toast.retry"))
  } finally {
    isSwitchingAccount.value = false
  }
}

watch(
  [() => challengeRequest.value?.challenge ?? "", () => challengeRequest.value?.skip === true, isLoadingChallenge],
  ([challenge, shouldSkip, loading]) => {
    if (!challenge || !shouldSkip || loading || isSubmitting.value || subjectMismatch.value) {
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

    <Card class="w-full max-w-md" v-else-if="subjectMismatch" data-testid="consent-subject-mismatch">
      <CardHeader class="text-center">
        <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
          <ShieldAlert class="h-6 w-6 text-amber-600 dark:text-amber-300" />
        </div>
        <CardTitle class="text-xl">{{ t("oauth.consent.subjectMismatchTitle") }}</CardTitle>
        <CardDescription>{{ t("oauth.consent.subjectMismatchDescription") }}</CardDescription>
      </CardHeader>
      <CardContent v-if="accountName || actionError" class="space-y-3">
        <div
          v-if="accountName"
          class="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"
          data-testid="consent-account"
        >
          <UserRound class="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <i18n-t keypath="oauth.consent.accountLine" scope="global" tag="span" class="min-w-0 truncate">
            <template #name><strong class="text-foreground">{{ accountName }}</strong></template>
          </i18n-t>
        </div>
        <div
          v-if="actionError"
          role="alert"
          class="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {{ actionError }}
        </div>
      </CardContent>
      <CardFooter class="flex gap-3">
        <Button variant="outline" class="flex-1" :disabled="isSwitchingAccount" @click="router.push({ name: 'home' })">
          {{ t("oauth.consent.backHome") }}
        </Button>
        <Button class="flex-1" :disabled="isSwitchingAccount" @click="switchAccount">
          <Loader2 v-if="isSwitchingAccount" class="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
          <UserRound v-else class="h-4 w-4 mr-2" aria-hidden="true" />
          {{ t("oauth.consent.switchAccount") }}
        </Button>
      </CardFooter>
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
          <div
            v-if="accountName"
            class="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm"
            data-testid="consent-account"
          >
            <span class="flex min-w-0 items-center gap-2">
              <UserRound class="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <i18n-t keypath="oauth.consent.accountLine" scope="global" tag="span" class="min-w-0 truncate">
                <template #name><strong class="text-foreground">{{ accountName }}</strong></template>
              </i18n-t>
            </span>
            <Button
              variant="link"
              size="sm"
              class="h-auto min-h-9 shrink-0 px-2 py-1 sm:min-h-0 sm:p-0"
              :disabled="isSubmitting || isSwitchingAccount"
              @click="switchAccount"
            >
              <Loader2 v-if="isSwitchingAccount" class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              {{ t("oauth.consent.switchAccount") }}
            </Button>
          </div>

          <div>
            <p class="text-sm font-medium text-muted-foreground mb-2">{{ t("oauth.consent.scopeIntro") }}</p>
            <div v-if="scopeGroups.length > 0" class="space-y-3">
              <section v-for="bucket in scopeGroups" :key="bucket.group" :data-scope-group="bucket.group">
                <p
                  :class="cn(
                    'mb-1 text-xs font-medium uppercase tracking-wide',
                    bucket.group === 'write' ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground',
                  )"
                >
                  {{ t(`oauth.consent.groups.${bucket.group}`) }}
                </p>
                <ul class="space-y-1.5">
                  <li
                    v-for="scope in bucket.scopes"
                    :key="scope"
                    :class="cn(
                      'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
                      bucket.group === 'write' && 'border-amber-500/40 bg-amber-500/5 text-amber-900 dark:text-amber-100',
                      !isKnownScope(scope) && 'border-dashed text-muted-foreground',
                    )"
                  >
                    <span class="min-w-0 flex-1">
                      <span class="block font-medium">{{ getScopeLabel(scope) }}</span>
                      <span
                        v-if="getScopeDescription(scope)"
                        :class="cn('block text-xs', bucket.group === 'write' ? 'text-amber-800/80 dark:text-amber-200/80' : 'text-muted-foreground')"
                      >
                        {{ getScopeDescription(scope) }}
                      </span>
                    </span>
                  </li>
                </ul>
              </section>
            </div>
            <p v-else class="text-sm text-muted-foreground">
              {{ t("oauth.consent.noScopesRequested") }}
            </p>
          </div>

          <Alert v-if="hasWriteScope" class="border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-200">
            <ShieldAlert />
            <AlertDescription class="text-current">{{ t("oauth.consent.writeWarning") }}</AlertDescription>
          </Alert>

          <div class="space-y-1 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <p>{{ t("oauth.consent.returnHint", { app: clientName }) }}</p>
            <p>{{ t("oauth.consent.revokeHint") }}</p>
            <p v-if="isChallengeMode && accountName">{{ t("oauth.consent.switchAccountHint") }}</p>
          </div>
          <div
            v-if="actionError"
            role="alert"
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
          :disabled="isSubmitting || isSwitchingAccount"
          @click="submitConsent(false)"
        >
          <ShieldX class="h-4 w-4 mr-2" />
          {{ t("oauth.consent.reject") }}
        </Button>
        <Button
          class="flex-1"
          :disabled="isSubmitting || isSwitchingAccount"
          @click="submitConsent(true)"
        >
          <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
          <ShieldCheck v-else class="h-4 w-4 mr-2" />
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
