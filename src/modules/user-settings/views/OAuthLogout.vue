<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-vue-next"
import { extractErrorMessage } from "@/lib/error-utils"
import { logout, logoutInPlace } from "@/modules/auth/api/logout"
import { useUserStore } from "@/shared/stores/user"
import OAuthAccountRow from "@/modules/user-settings/components/oauth/OAuthAccountRow.vue"
import OAuthAppRow from "@/modules/user-settings/components/oauth/OAuthAppRow.vue"
import OAuthFlowShell from "@/modules/user-settings/components/oauth/OAuthFlowShell.vue"
import OAuthFlowState from "@/modules/user-settings/components/oauth/OAuthFlowState.vue"
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
const userStore = useUserStore()

const logoutChallenge = computed(() =>
  typeof route.query.logout_challenge === "string" ? route.query.logout_challenge.trim() : ""
)
// `/logout` typed by hand (no Hydra challenge) is just a sign-out request:
// offer the ordinary confirmation instead of a "missing challenge" error.
const isPlainLogout = computed(() => logoutChallenge.value === "")
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
const accountName = computed(() => (userStore.isLoggedIn ? userStore.name || userStore.userId || "" : ""))
// Which button carries the spinner while a request is in flight. Presentation only.
const pendingChoice = ref<"confirm" | "cancel">("confirm")

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

async function confirmPlainLogout() {
  if (isSubmitting.value) return
  actionError.value = ""
  isSubmitting.value = true
  try {
    await logout()
  } catch (error: unknown) {
    actionError.value = extractErrorMessage(error, t("oauth.logout.toast.retry"))
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
  <OAuthFlowShell :title="t('oauth.logout.title')" :loading="isLoading" :loading-label="t('oauth.common.loading')">
    <!-- An app asked for the sign-out (Hydra logout challenge). -->
    <template v-if="isValid">
      <dl v-if="clientName || accountName" class="divide-y divide-border/60">
        <OAuthAppRow v-if="clientName" :name="clientName" />
        <OAuthAccountRow v-if="accountName" :name="accountName" />
      </dl>
      <div class="grid min-w-0 gap-4 p-4">
        <p class="text-sm text-muted-foreground">{{ t("oauth.logout.confirmHint") }}</p>
        <p v-if="actionError" role="alert" class="text-sm whitespace-pre-line text-destructive [overflow-wrap:anywhere]">
          {{ actionError }}
        </p>
        <div class="flex flex-col gap-2 @min-[22rem]:flex-row-reverse">
          <Button
            size="lg"
            class="w-full @min-[22rem]:flex-1"
            :disabled="isSubmitting"
            @click="pendingChoice = 'confirm'; confirmLogout()"
          >
            <Loader2
              v-if="isSubmitting && pendingChoice === 'confirm'"
              class="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            {{ isSubmitting && pendingChoice === "confirm" ? t("oauth.logout.loggingOut") : t("oauth.logout.confirm") }}
          </Button>
          <Button
            variant="outline"
            size="lg"
            class="w-full @min-[22rem]:w-auto @min-[22rem]:min-w-28"
            :disabled="isSubmitting"
            @click="pendingChoice = 'cancel'; cancelLogout()"
          >
            <Loader2
              v-if="isSubmitting && pendingChoice === 'cancel'"
              class="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            {{ t("oauth.logout.cancel") }}
          </Button>
        </div>
      </div>
    </template>

    <!-- /logout opened by hand: an ordinary sign-out of this site. -->
    <template v-else-if="isPlainLogout">
      <dl v-if="accountName">
        <OAuthAccountRow :name="accountName" />
      </dl>
      <div class="grid min-w-0 gap-4 p-4">
        <p v-if="!userStore.isLoggedIn" class="text-sm text-muted-foreground">
          {{ t("oauth.logout.localSignedOutDescription") }}
        </p>
        <p v-if="actionError" role="alert" class="text-sm whitespace-pre-line text-destructive [overflow-wrap:anywhere]">
          {{ actionError }}
        </p>
        <div class="flex flex-col gap-2 @min-[22rem]:flex-row-reverse">
          <Button
            v-if="userStore.isLoggedIn"
            size="lg"
            class="w-full @min-[22rem]:flex-1"
            :disabled="isSubmitting"
            @click="confirmPlainLogout"
          >
            <Loader2 v-if="isSubmitting" class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            {{ isSubmitting ? t("oauth.logout.loggingOut") : t("oauth.logout.confirm") }}
          </Button>
          <Button
            variant="outline"
            size="lg"
            :class="userStore.isLoggedIn ? 'w-full @min-[22rem]:w-auto @min-[22rem]:min-w-28' : 'w-full'"
            :disabled="isSubmitting"
            @click="router.push({ name: 'home' })"
          >
            {{ userStore.isLoggedIn ? t("oauth.logout.cancel") : t("oauth.common.backHome") }}
          </Button>
        </div>
      </div>
    </template>

    <OAuthFlowState
      v-else
      tone="error"
      :title="t('oauth.logout.invalidTitle')"
      :description="loadError || t('oauth.logout.invalidDescription')"
    >
      <Button variant="outline" @click="router.push({ name: 'home' })">
        {{ t("oauth.common.backHome") }}
      </Button>
    </OAuthFlowState>
  </OAuthFlowShell>
</template>
