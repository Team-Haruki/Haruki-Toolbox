<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { CircleAlert, Loader2 } from "lucide-vue-next"
import { useUserStore } from "@/shared/stores/user"
import { logoutInPlace } from "@/modules/auth/api/logout"
import {
  acceptOAuthConsentChallenge,
  getOAuthConsentChallenge,
  groupScopes,
  rejectOAuthConsentChallenge,
  resolveOAuthRedirectUrl,
  submitOAuthConsent,
  type OAuthConsentChallenge,
} from "@/modules/user-settings/api/oauth2"
import OAuthAccountRow from "@/modules/user-settings/components/oauth/OAuthAccountRow.vue"
import OAuthAppRow from "@/modules/user-settings/components/oauth/OAuthAppRow.vue"
import OAuthFlowShell from "@/modules/user-settings/components/oauth/OAuthFlowShell.vue"
import OAuthFlowState from "@/modules/user-settings/components/oauth/OAuthFlowState.vue"
import OAuthScopeList from "@/modules/user-settings/components/oauth/OAuthScopeList.vue"
import { buildSwitchAccountAuthorizeUrl, isConsentSubjectMismatch } from "@/modules/user-settings/lib/oauth-consent"
import { buildConsentScopeRows } from "@/modules/user-settings/lib/oauth-scope-rows"
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
/** The same scopes as rows of the permission list, in the read → write → other order. */
const scopeRows = computed(() => buildConsentScopeRows(scopes.value))

const clientName = computed(() => {
  if (isChallengeMode.value) {
    const client = challengeRequest.value?.client
    return client?.client_name?.trim() || client?.client_id?.trim() || t("oauth.consent.unknownApp")
  }

  return legacyClientName.value
})

const accountName = computed(() => userStore.name || userStore.userId || "")
// Which button carries the spinner while a request is in flight; an automatic
// accept (a remembered consent) counts as "allow". Presentation only.
const pendingChoice = ref<"allow" | "deny">("allow")

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
  <OAuthFlowShell
    :title="t('oauth.consent.title')"
    :loading="isLoadingChallenge"
    :loading-label="t('oauth.common.loading')"
  >
    <!-- The request was started by another account: nothing can be approved here. -->
    <template v-if="subjectMismatch">
      <OAuthFlowState
        tone="attention"
        :icon="CircleAlert"
        :title="t('oauth.consent.subjectMismatchTitle')"
        :description="t('oauth.consent.subjectMismatchDescription')"
        data-testid="consent-subject-mismatch"
      />
      <dl v-if="accountName">
        <OAuthAccountRow :name="accountName" data-testid="consent-account" />
      </dl>
      <div class="grid min-w-0 gap-4 p-4">
        <p v-if="actionError" role="alert" class="text-sm whitespace-pre-line text-destructive [overflow-wrap:anywhere]">
          {{ actionError }}
        </p>
        <div class="flex flex-col gap-2 @min-[22rem]:flex-row-reverse">
          <Button size="lg" class="w-full @min-[22rem]:flex-1" :disabled="isSwitchingAccount" @click="switchAccount">
            <Loader2 v-if="isSwitchingAccount" class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            {{ t("oauth.common.switchAccount") }}
          </Button>
          <Button
            variant="outline"
            size="lg"
            class="w-full @min-[22rem]:w-auto @min-[22rem]:min-w-28"
            :disabled="isSwitchingAccount"
            @click="router.push({ name: 'home' })"
          >
            {{ t("oauth.common.backHome") }}
          </Button>
        </div>
      </div>
    </template>

    <template v-else-if="isValid">
      <!-- Who is asking, and who is answering. -->
      <dl class="divide-y divide-border/60">
        <OAuthAppRow :name="clientName" />
        <OAuthAccountRow
          v-if="accountName"
          :name="accountName"
          switchable
          :switching="isSwitchingAccount"
          :disabled="isSubmitting"
          data-testid="consent-account"
          @switch="switchAccount"
        />
      </dl>

      <!-- What it asks for, one row per permission. -->
      <OAuthScopeList :rows="scopeRows" :warn-write="hasWriteScope" />

      <!-- The decision. -->
      <div class="grid min-w-0 gap-4 p-4">
        <p v-if="actionError" role="alert" class="text-sm whitespace-pre-line text-destructive [overflow-wrap:anywhere]">
          {{ actionError }}
        </p>
        <div class="flex flex-col gap-2 @min-[22rem]:flex-row-reverse">
          <Button
            size="lg"
            class="w-full @min-[22rem]:flex-1"
            :disabled="isSubmitting || isSwitchingAccount"
            @click="pendingChoice = 'allow'; submitConsent(true)"
          >
            <Loader2
              v-if="isSubmitting && pendingChoice === 'allow'"
              class="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            {{ isSubmitting && pendingChoice === "allow" ? t("oauth.consent.authorizing") : t("oauth.consent.authorize") }}
          </Button>
          <Button
            variant="outline"
            size="lg"
            class="w-full @min-[22rem]:w-auto @min-[22rem]:min-w-28"
            :disabled="isSubmitting || isSwitchingAccount"
            @click="pendingChoice = 'deny'; submitConsent(false)"
          >
            <Loader2
              v-if="isSubmitting && pendingChoice === 'deny'"
              class="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            {{ t("oauth.consent.reject") }}
          </Button>
        </div>
      </div>
    </template>

    <OAuthFlowState
      v-else
      tone="error"
      :title="t('oauth.consent.invalidTitle')"
      :description="loadError || t('oauth.consent.invalidDescription')"
    >
      <Button variant="outline" @click="router.push({ name: 'home' })">
        {{ t("oauth.common.backHome") }}
      </Button>
    </OAuthFlowState>
  </OAuthFlowShell>
</template>
