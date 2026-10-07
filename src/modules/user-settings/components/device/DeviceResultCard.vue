<script setup lang="ts">
import { computed, type Component } from "vue"
import { useI18n } from "vue-i18n"
import { CircleAlert, CircleCheck, CircleQuestionMark, CircleX, Clock } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { DevicePageState } from "@/modules/user-settings/lib/device-flow"

const props = defineProps<{
  state: DevicePageState
  accountName: string
  /** Shown on the `error` card: why the flow cannot continue. */
  errorText: string
}>()

const emit = defineEmits<{
  (e: "startOver"): void
}>()

const { t } = useI18n()

type ResultView = {
  icon: Component
  tone: string
  title: string
  description: string
}

const view = computed<ResultView>(() => {
  switch (props.state) {
    case "approved":
      return {
        icon: CircleCheck,
        tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
        title: t("oauth.device.result.approvedTitle"),
        description: t("oauth.device.result.approved", { name: props.accountName }),
      }
    case "unconfirmed":
      return {
        icon: CircleQuestionMark,
        tone: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
        title: t("oauth.device.result.unconfirmedTitle"),
        description: t("oauth.device.result.unconfirmed"),
      }
    case "denied":
      return {
        icon: CircleX,
        tone: "bg-muted text-muted-foreground",
        title: t("oauth.device.result.deniedTitle"),
        description: t("oauth.device.result.retryOnDevice"),
      }
    case "expired":
      return {
        icon: Clock,
        tone: "bg-muted text-muted-foreground",
        title: t("oauth.device.result.expiredTitle"),
        description: t("oauth.device.result.retryOnDevice"),
      }
    case "failed":
      return {
        icon: CircleAlert,
        tone: "bg-destructive/10 text-destructive",
        title: t("oauth.device.result.failedTitle"),
        description: t("oauth.device.result.retryOnDevice"),
      }
    default:
      return {
        icon: CircleAlert,
        tone: "bg-destructive/10 text-destructive",
        title: t("oauth.device.result.errorTitle"),
        description: props.errorText || t("oauth.device.error.unknown"),
      }
  }
})
</script>

<template>
  <Card class="w-full max-w-md" :data-result="state">
    <CardHeader class="text-center">
      <div :class="cn('mx-auto mb-2 h-12 w-12 rounded-full flex items-center justify-center', view.tone)">
        <component :is="view.icon" class="h-6 w-6" />
      </div>
      <CardTitle class="text-xl">{{ view.title }}</CardTitle>
      <CardDescription class="leading-relaxed">{{ view.description }}</CardDescription>
    </CardHeader>
    <CardFooter class="flex flex-col gap-3 sm:flex-row">
      <Button
        v-if="state === 'approved' || state === 'unconfirmed'"
        variant="outline"
        class="w-full sm:flex-1"
        as-child
      >
        <RouterLink :to="{ name: 'user.oauthAuthorizations' }">{{ t("oauth.device.result.authorizedApps") }}</RouterLink>
      </Button>
      <Button class="w-full sm:flex-1" @click="emit('startOver')">
        {{ t("oauth.device.result.newCode") }}
      </Button>
    </CardFooter>
  </Card>
</template>
