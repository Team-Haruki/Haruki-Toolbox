<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { AppWindow, Ban, Copy, ExternalLink, LogIn } from "lucide-vue-next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useUserStore } from "@/shared/stores/user"
import DeviceCodeEntryCard from "@/modules/user-settings/components/device/DeviceCodeEntryCard.vue"
import DeviceResultCard from "@/modules/user-settings/components/device/DeviceResultCard.vue"
import DeviceReviewCard from "@/modules/user-settings/components/device/DeviceReviewCard.vue"
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

const isResultState = computed(() => DEVICE_RESULT_STATES.includes(pageState.value))
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center gap-4 px-0 py-4">
    <!-- Inside a frame nothing else renders and nothing is requested (anti-clickjacking). -->
    <Card v-if="pageState === 'framed'" class="w-full max-w-md">
      <CardHeader class="text-center">
        <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <AppWindow class="h-6 w-6 text-primary" />
        </div>
        <CardTitle class="text-xl">{{ t("oauth.device.framed.title") }}</CardTitle>
        <CardDescription>{{ t("oauth.device.framed.description") }}</CardDescription>
      </CardHeader>
      <CardFooter class="justify-center">
        <Button as-child>
          <a :href="DEVICE_PAGE_PATH" target="_blank" rel="noopener noreferrer">
            <ExternalLink class="h-4 w-4 mr-2" />
            {{ t("oauth.device.framed.open") }}
          </a>
        </Button>
      </CardFooter>
    </Card>

    <template v-else>
      <Alert v-if="inAppBrowser" class="w-full max-w-md border-amber-500/40 bg-amber-500/5" data-testid="device-in-app-browser">
        <AppWindow />
        <AlertTitle>{{ t("oauth.device.inAppBrowser.title") }}</AlertTitle>
        <AlertDescription class="space-y-2">
          <p>{{ t("oauth.device.inAppBrowser.description") }}</p>
          <Button variant="outline" size="sm" @click="copyDevicePageLink">
            <Copy class="h-4 w-4 mr-2" />
            {{ t("oauth.device.inAppBrowser.copy") }}
          </Button>
        </AlertDescription>
      </Alert>

      <Card v-if="pageState === 'signedOut'" class="w-full max-w-md">
        <CardHeader class="text-center">
          <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <LogIn class="h-6 w-6 text-primary" />
          </div>
          <CardTitle class="text-xl">{{ t("oauth.device.signedOut.title") }}</CardTitle>
          <CardDescription>{{ t("oauth.device.signedOut.description") }}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button class="w-full" @click="goToLogin">
            <LogIn class="h-4 w-4 mr-2" />
            {{ t("oauth.device.signedOut.signIn") }}
          </Button>
        </CardFooter>
      </Card>

      <Card v-else-if="pageState === 'unavailable'" class="w-full max-w-md">
        <CardHeader class="text-center">
          <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Ban class="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle class="text-xl">{{ t("oauth.device.unavailable.title") }}</CardTitle>
          <CardDescription>{{ t("oauth.device.unavailable.description") }}</CardDescription>
        </CardHeader>
      </Card>

      <DeviceReviewCard
        v-else-if="pageState === 'review' && review"
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

      <DeviceResultCard
        v-else-if="isResultState"
        :state="pageState"
        :account-name="approvedAccountName"
        :error-text="errorText"
        @start-over="startOver"
      />

      <DeviceCodeEntryCard
        v-else
        v-model="codeInput"
        :pending="pendingAction === 'lookup'"
        :disabled="isRateLimited"
        :error-text="errorText"
        @submit="submitCode"
      />
    </template>
  </div>
</template>
