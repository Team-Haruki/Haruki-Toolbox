<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { RouterLink, useRoute, useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-vue-next"
import { extractErrorMessage } from "@/lib/error-utils"
import { useUserStore } from "@/shared/stores/user"
import OAuthAccountRow from "@/modules/user-settings/components/oauth/OAuthAccountRow.vue"
import OAuthAppRow from "@/modules/user-settings/components/oauth/OAuthAppRow.vue"
import OAuthFlowShell from "@/modules/user-settings/components/oauth/OAuthFlowShell.vue"
import OAuthFlowState from "@/modules/user-settings/components/oauth/OAuthFlowState.vue"
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
const accountName = computed(() => userStore.name || userStore.userId || "")
// Which button carries the spinner while a request is in flight; the page's
// own automatic attempt counts as "continue". Presentation only.
const pendingChoice = ref<"continue" | "cancel">("continue")

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

/**
 * Accepts the login challenge. The automatic attempt on page load reports a
 * failure only inline (the card with Continue / Cancel is what the person
 * sees next); a failure of an explicit click gets a toast as well.
 */
async function continueAuthorization(options: { automatic?: boolean } = {}) {
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
    if (!options.automatic) {
      toast.error(t("oauth.login.toast.failedTitle"), { description })
    }
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
    void continueAuthorization({ automatic: true })
  },
  { immediate: true }
)

// A plain router link, not a click handler: the signed-out card is swapped
// out while the challenge (re)loads, and a handler on a button that is being
// replaced mid-click was dropped. The link target is computed once per route.
const loginRoute = computed(() => ({
  name: "user.login",
  query: { redirect: route.fullPath },
}))

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
  <OAuthFlowShell :title="t('oauth.login.title')" :loading="isLoading" :loading-label="t('oauth.common.loading')">
    <!-- Signed out: one decision, sign in to go on. -->
    <template v-if="isValid && !isLoggedIn">
      <dl>
        <OAuthAppRow :name="clientName" />
      </dl>
      <div class="grid min-w-0 gap-2 p-4">
        <Button as-child size="lg" class="w-full">
          <RouterLink :to="loginRoute" data-testid="oauth-login-sign-in">
            {{ t("oauth.login.signInButton") }}
          </RouterLink>
        </Button>
        <Button variant="outline" size="lg" class="w-full" @click="router.push({ name: 'home' })">
          {{ t("oauth.common.backHome") }}
        </Button>
      </div>
    </template>

    <!-- Signed in: the page continues by itself; this is what stays when that failed. -->
    <template v-else-if="isValid">
      <dl class="divide-y divide-border/60">
        <OAuthAppRow :name="clientName" />
        <OAuthAccountRow v-if="accountName" :name="accountName" />
      </dl>
      <div class="grid min-w-0 gap-4 p-4">
        <p v-if="actionError" role="alert" class="text-sm whitespace-pre-line text-destructive [overflow-wrap:anywhere]">
          {{ actionError }}
        </p>
        <div class="flex flex-col gap-2 @min-[22rem]:flex-row-reverse">
          <Button
            size="lg"
            class="w-full @min-[22rem]:flex-1"
            :disabled="isSubmitting"
            @click="pendingChoice = 'continue'; continueAuthorization()"
          >
            <Loader2
              v-if="isSubmitting && pendingChoice === 'continue'"
              class="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            {{ t("oauth.login.continueButton") }}
          </Button>
          <Button
            variant="outline"
            size="lg"
            class="w-full @min-[22rem]:w-auto @min-[22rem]:min-w-28"
            :disabled="isSubmitting"
            @click="pendingChoice = 'cancel'; rejectAuthorization()"
          >
            <Loader2
              v-if="isSubmitting && pendingChoice === 'cancel'"
              class="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            {{ t("oauth.login.cancel") }}
          </Button>
        </div>
      </div>
    </template>

    <OAuthFlowState
      v-else
      tone="error"
      :title="t('oauth.login.invalidTitle')"
      :description="loadError || t('oauth.login.invalidDescription')"
    >
      <Button variant="outline" @click="router.push({ name: 'home' })">
        {{ t("oauth.common.backHome") }}
      </Button>
    </OAuthFlowState>
  </OAuthFlowShell>
</template>
