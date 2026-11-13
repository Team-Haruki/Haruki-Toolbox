<script setup lang="ts">
import { computed, type Component } from "vue"
import { useI18n } from "vue-i18n"
import { CircleCheck, CircleQuestionMark, CircleX, Clock } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import OAuthFlowState, { type OAuthFlowStateTone } from "@/modules/user-settings/components/oauth/OAuthFlowState.vue"
import type { DevicePageState } from "@/modules/user-settings/lib/device-flow"

// Step 3 of the device panel: what happened, and what to do next.
const props = defineProps<{
  state: DevicePageState
  accountName: string
  /** Shown on the `error` result: why the flow cannot continue. */
  errorText: string
}>()

const emit = defineEmits<{
  (e: "startOver"): void
}>()

const { t } = useI18n()

type ResultView = {
  tone: OAuthFlowStateTone
  icon?: Component
  title: string
  description: string
}

const view = computed<ResultView>(() => {
  switch (props.state) {
    case "approved":
      return {
        tone: "success",
        icon: CircleCheck,
        title: t("oauth.device.result.approvedTitle"),
        description: t("oauth.device.result.approved", { name: props.accountName }),
      }
    case "unconfirmed":
      return {
        tone: "attention",
        icon: CircleQuestionMark,
        title: t("oauth.device.result.unconfirmedTitle"),
        description: t("oauth.device.result.unconfirmed"),
      }
    case "denied":
      return {
        tone: "neutral",
        icon: CircleX,
        title: t("oauth.device.result.deniedTitle"),
        description: t("oauth.device.result.retryOnDevice"),
      }
    case "expired":
      return {
        tone: "neutral",
        icon: Clock,
        title: t("oauth.device.result.expiredTitle"),
        description: t("oauth.device.result.retryOnDevice"),
      }
    case "failed":
      return {
        tone: "error",
        title: t("oauth.device.result.failedTitle"),
        description: t("oauth.device.result.retryOnDevice"),
      }
    default:
      return {
        tone: "error",
        title: t("oauth.device.result.errorTitle"),
        description: props.errorText || t("oauth.device.error.unknown"),
      }
  }
})
</script>

<template>
  <OAuthFlowState
    :tone="view.tone"
    :icon="view.icon"
    :title="view.title"
    :description="view.description"
    :data-result="state"
  >
    <Button v-if="state === 'approved' || state === 'unconfirmed'" variant="outline" as-child>
      <RouterLink :to="{ name: 'user.oauthAuthorizations' }">{{ t("oauth.device.result.authorizedApps") }}</RouterLink>
    </Button>
    <Button variant="outline" @click="emit('startOver')">
      {{ t("oauth.device.result.newCode") }}
    </Button>
  </OAuthFlowState>
</template>
