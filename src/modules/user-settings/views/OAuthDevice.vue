<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { AppWindow, Ban, CircleAlert, Copy, ExternalLink } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { useUserStore } from "@/shared/stores/user"
import DeviceCodeEntry from "@/modules/user-settings/components/device/DeviceCodeEntry.vue"
import DeviceResult from "@/modules/user-settings/components/device/DeviceResult.vue"
import DeviceReview from "@/modules/user-settings/components/device/DeviceReview.vue"
import OAuthFlowShell from "@/modules/user-settings/components/oauth/OAuthFlowShell.vue"
import OAuthFlowState from "@/modules/user-settings/components/oauth/OAuthFlowState.vue"
import { useDeviceAuthorization } from "@/modules/user-settings/composables/useDeviceAuthorization"
import { DEVICE_PAGE_PATH } from "@/modules/user-settings/lib/device-code"
import { DEVICE_RESULT_STATES } from "@/modules/user-settings/lib/device-flow"

const { t } = useI18n()
const userStore = useUserStore()

const {
  pageState,
  inAppBrowser,
  codeInput,
  review,
  labelInput,
  acknowledged,
  ackHighlighted,
  pendingAction,
  errorText,
  approveOutcomeUnknown,
  approvedAccountName,
  isRateLimited,
  remainingSeconds,
  submitCode,
  approve,
  deny,
  startOver,
  goToLogin,
  switchAccount,
  copyDevicePageLink,
} = useDeviceAuthorization()

/**
 * Which step the one panel shows. A `review` state without its data falls
 * back to the code entry, like every state the page has no screen of its own for.
 */
type DeviceView = "framed" | "signedOut" | "unavailable" | "review" | "result" | "entry"

const view = computed<DeviceView>(() => {
  const state = pageState.value
  if (state === "framed" || state === "signedOut" || state === "unavailable") {
    return state
  }
  if (state === "review" && review.value) {
    return "review"
  }
  return DEVICE_RESULT_STATES.includes(state) ? "result" : "entry"
})

const pageTitle = computed(() => {
  if (view.value === "signedOut") {
    return t("oauth.device.signedOut.title")
  }
  return view.value === "review" ? t("oauth.device.review.title") : t("oauth.device.entry.title")
})
const pageDescription = computed(() => (view.value === "entry" ? t("oauth.device.entry.description") : null))
</script>

<template>
  <OAuthFlowShell :title="pageTitle" :description="pageDescription">
    <!-- In-app browsers keep their own cookies: steer people to the system browser. -->
    <template v-if="inAppBrowser && view !== 'framed'" #notice>
      <section class="grid min-w-0 gap-3 rounded-xl border bg-card p-4" data-testid="device-in-app-browser">
        <div class="flex min-w-0 items-start gap-2 text-sm">
          <CircleAlert class="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
          <div class="grid min-w-0 gap-1">
            <p class="font-medium text-amber-800 dark:text-amber-300">{{ t("oauth.device.inAppBrowser.title") }}</p>
            <p class="text-muted-foreground">{{ t("oauth.device.inAppBrowser.description") }}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" class="justify-self-start" @click="copyDevicePageLink">
          <Copy class="size-4" aria-hidden="true" />
          {{ t("oauth.device.inAppBrowser.copy") }}
        </Button>
      </section>
    </template>

    <!-- Inside a frame nothing else renders and nothing is requested (anti-clickjacking). -->
    <OAuthFlowState
      v-if="view === 'framed'"
      :icon="AppWindow"
      :title="t('oauth.device.framed.title')"
    >
      <Button as-child>
        <a :href="DEVICE_PAGE_PATH" target="_blank" rel="noopener noreferrer">
          {{ t("oauth.device.framed.open") }}
          <ExternalLink class="size-4" aria-hidden="true" />
        </a>
      </Button>
    </OAuthFlowState>

    <div v-else-if="view === 'signedOut'" class="p-4">
      <Button size="lg" class="w-full" @click="goToLogin">
        {{ t("oauth.device.signedOut.signIn") }}
      </Button>
    </div>

    <OAuthFlowState
      v-else-if="view === 'unavailable'"
      :icon="Ban"
      :title="t('oauth.device.unavailable.title')"
      :description="t('oauth.device.unavailable.description')"
    />

    <DeviceReview
      v-else-if="view === 'review' && review"
      v-model:label="labelInput"
      v-model:acknowledged="acknowledged"
      :review="review"
      :entered-code="codeInput"
      :fallback-account-name="userStore.name"
      :remaining-seconds="remainingSeconds"
      :pending-action="pendingAction"
      :disabled="isRateLimited"
      :error-text="errorText"
      :ack-highlighted="ackHighlighted"
      :approve-outcome-unknown="approveOutcomeUnknown"
      @approve="approve"
      @deny="deny"
      @switch-account="switchAccount"
    />

    <DeviceResult
      v-else-if="view === 'result'"
      :state="pageState"
      :account-name="approvedAccountName"
      :error-text="errorText"
      @start-over="startOver"
    />

    <DeviceCodeEntry
      v-else
      v-model="codeInput"
      :pending="pendingAction === 'lookup'"
      :disabled="isRateLimited"
      :error-text="errorText"
      @submit="submitCode"
    />
  </OAuthFlowShell>
</template>
