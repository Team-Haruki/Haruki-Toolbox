<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import {
  CircleCheck,
  CircleX,
  Info,
  Loader2,
  LucideAlertTriangle,
  RefreshCw,
  ServerCog,
  Vault,
  Wifi,
  WifiOff,
  X,
} from "lucide-vue-next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toInheritApiError } from "@/modules/tools/api/inherit"
import {
  canCancelJob,
  enteredCodeValidity,
  findJobStep,
  hasJobWarning,
  isNewCodeUnsaved,
  isTerminalJobStatus,
  type InheritJob,
  type InheritNewCode,
} from "@/modules/tools/lib/inherit-job"
import type { InheritConnectionState } from "@/modules/tools/lib/inherit-job-connection"
import type { InheritUnlockInput, InheritVaultKeyStatus } from "@/modules/tools/lib/inherit-vault"
import { describeInheritApiError, describeJobError, describeJobWarning } from "@/modules/tools/lib/inherit-messages"
import InheritJobConfirm from "@/modules/tools/components/inherit/InheritJobConfirm.vue"
import InheritJobSteps from "@/modules/tools/components/inherit/InheritJobSteps.vue"
import InheritNewCodeCard from "@/modules/tools/components/inherit/InheritNewCodeCard.vue"

const props = defineProps<{
  job: InheritJob
  newCode: InheritNewCode | null
  codeAcknowledged: boolean
  connectionState: InheritConnectionState
  commandPending: "confirm" | "cancel" | null
  expired: boolean
  canDismiss: boolean
  /** The live vault key status, for the confirm step's password-or-PIN choice. */
  keyStatus: InheritVaultKeyStatus | null
  onConfirm: (unlock: InheritUnlockInput) => Promise<void>
  onCancel: () => Promise<void>
}>()

const emit = defineEmits<{
  (event: "acknowledge"): void
  (event: "dismiss"): void
  (event: "refresh"): void
  (event: "go-vault"): void
  (event: "reset-vault"): void
}>()

const { t } = useI18n()

const STATUS_VARIANT = {
  running: "sky",
  awaiting_confirm: "amber",
  succeeded: "emerald",
  failed: "destructive",
  cancelled: "muted",
} as const

const terminal = computed(() => isTerminalJobStatus(props.job.status))
const showCancel = computed(() => props.job.status === "running" && canCancelJob(props.job))
const codeUnsaved = computed(() => isNewCodeUnsaved(props.job))
const codeInVault = computed(() => findJobStep(props.job, "vault_store_code")?.status === "done")
const issueFailed = computed(() => hasJobWarning(props.job, "issue_code_failed"))
const otherWarnings = computed(() => props.job.warnings.filter((warning) =>
  warning.code !== "issue_code_failed" && !(warning.code === "vault_store_failed" && props.newCode)))
const validity = computed(() => enteredCodeValidity(props.job))
const connectionLive = computed(() => props.connectionState === "live")

/**
 * How loud a stopped job is: danger only when the entered code may be gone
 * with nothing to show for it (the transfer may have happened unseen), a
 * warning for other failures, plain for a cancellation.
 */
const failureTone = computed<"danger" | "warning" | "info">(() => {
  if (props.job.status !== "failed") return "info"
  return props.job.error?.code === "execute_uncertain" ? "danger" : "warning"
})

const summary = computed(() => t("tools.uploadData.inheritJob.summary", {
  server: t(`tools.uploadData.region.${props.job.server}`),
  dataType: t(`tools.uploadData.dataTypes.${props.job.uploadType}`),
}))

async function cancelRunning() {
  try {
    await props.onCancel()
    toast.success(t("tools.uploadData.inheritJob.toast.cancelled"))
  } catch (error) {
    toast.error(describeInheritApiError(t, toInheritApiError(error)))
  }
}

async function cancelFromConfirm() {
  await props.onCancel()
  toast.success(t("tools.uploadData.inheritJob.toast.cancelled"))
}

function dismiss() {
  if (!props.canDismiss) {
    toast.warning(t("tools.uploadData.inheritJob.ackRequired"))
    return
  }
  emit("dismiss")
}
</script>

<template>
  <Card data-testid="inherit-job" :data-job-status="job.status">
    <CardHeader class="gap-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <CardTitle class="flex items-center gap-2">
          <ServerCog class="size-5" />
          {{ t("tools.uploadData.inheritJob.title") }}
        </CardTitle>
        <div class="flex items-center gap-1.5">
          <Badge :variant="STATUS_VARIANT[job.status]" data-testid="inherit-job-status">
            {{ t(`tools.uploadData.inheritJob.status.${job.status}`) }}
          </Badge>
          <Badge
            v-if="!terminal && !expired"
            :variant="connectionLive ? 'emerald' : 'muted'"
            size="sm"
            data-testid="inherit-job-connection"
            :data-state="connectionState"
          >
            <Wifi v-if="connectionLive" />
            <WifiOff v-else-if="connectionState === 'polling'" />
            <Loader2 v-else class="animate-spin" />
            {{ t(`tools.uploadData.inheritJob.connection.${connectionState}`) }}
          </Badge>
        </div>
      </div>
      <CardDescription>{{ summary }}</CardDescription>
    </CardHeader>

    <CardContent class="space-y-4">
      <InheritNewCodeCard
        v-if="newCode"
        :inherit-id="newCode.inheritId"
        :password="newCode.password"
        :expires-at="newCode.expiresAt"
        :unsaved="codeUnsaved"
        :saved-to-vault="codeInVault"
        :acknowledged="codeAcknowledged"
        next-steps
        id-prefix="inherit-job-code"
        @acknowledge="emit('acknowledge')"
      />

      <Alert v-if="issueFailed" variant="destructive" class="border-destructive/50 bg-destructive/5" data-testid="inherit-issue-failed">
        <LucideAlertTriangle />
        <AlertTitle>{{ t("tools.uploadData.inheritJob.issueFailedTitle") }}</AlertTitle>
        <AlertDescription class="space-y-2">
          <p>{{ describeJobWarning(t, { code: "issue_code_failed", message: "" }) }}</p>
          <Button type="button" size="sm" variant="destructive" @click="emit('go-vault')">
            <Vault class="size-4" />
            {{ t("tools.uploadData.inheritJob.actions.goVault") }}
          </Button>
        </AlertDescription>
      </Alert>

      <Alert
        v-for="warning in otherWarnings"
        :key="warning.code"
        :variant="warning.code === 'vault_store_failed' ? 'destructive' : 'default'"
        data-testid="inherit-job-warning"
        :data-code="warning.code"
      >
        <LucideAlertTriangle v-if="warning.code === 'vault_store_failed'" />
        <Info v-else />
        <AlertDescription>{{ describeJobWarning(t, warning) }}</AlertDescription>
      </Alert>

      <InheritJobConfirm
        v-if="job.status === 'awaiting_confirm' && !expired"
        :job="job"
        :key-status="keyStatus"
        :pending="commandPending"
        :on-confirm="onConfirm"
        :on-cancel="cancelFromConfirm"
        @reset-vault="emit('reset-vault')"
      />

      <Alert v-if="job.status === 'succeeded'" class="border-emerald-500/40 bg-emerald-500/5 text-emerald-900 dark:text-emerald-100">
        <CircleCheck />
        <AlertTitle>{{ t("tools.uploadData.inheritJob.succeededTitle") }}</AlertTitle>
        <AlertDescription class="text-current">{{ t("tools.uploadData.inheritJob.succeededDescription") }}</AlertDescription>
      </Alert>

      <Alert
        v-else-if="(job.status === 'failed' || job.status === 'cancelled') && job.error"
        :variant="failureTone === 'danger' ? 'destructive' : 'default'"
        :class="failureTone === 'danger' ? 'border-destructive/50 bg-destructive/5' : failureTone === 'warning' ? 'border-amber-500/40 bg-amber-500/5 text-amber-900 dark:text-amber-100' : ''"
        :data-tone="failureTone"
        data-testid="inherit-job-error"
        :data-code="job.error.code"
      >
        <CircleX v-if="failureTone === 'danger'" />
        <LucideAlertTriangle v-else-if="failureTone === 'warning'" />
        <Info v-else />
        <AlertTitle>
          {{ job.status === "failed" ? t("tools.uploadData.inheritJob.errorTitle") : t("tools.uploadData.inheritJob.cancelledTitle") }}
        </AlertTitle>
        <AlertDescription :class="['space-y-1', failureTone === 'warning' ? 'text-current' : '']">
          <p>{{ describeJobError(t, job.error) }}</p>
          <p v-if="validity" class="font-medium" data-testid="inherit-code-validity" :data-validity="validity">
            {{ t(`tools.uploadData.inheritJob.codeValidity.${validity}`) }}
          </p>
          <Button v-if="job.error.code === 'execute_uncertain' || job.error.code === 'login_failed'" type="button" size="sm" variant="outline" class="mt-1" @click="emit('go-vault')">
            <Vault class="size-4" />
            {{ t("tools.uploadData.inheritJob.actions.goVault") }}
          </Button>
        </AlertDescription>
      </Alert>

      <Alert v-if="expired">
        <Info />
        <AlertDescription>{{ t("tools.uploadData.inheritJob.expired") }}</AlertDescription>
      </Alert>

      <InheritJobSteps :job="job" />
    </CardContent>

    <CardFooter class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button v-if="!terminal && !expired && !connectionLive" type="button" variant="ghost" size="sm" @click="emit('refresh')">
        <RefreshCw class="size-4" />
        {{ t("tools.uploadData.inheritJob.actions.refresh") }}
      </Button>
      <Button v-if="showCancel" type="button" variant="outline" :disabled="commandPending !== null" @click="cancelRunning">
        <Loader2 v-if="commandPending === 'cancel'" class="size-4 animate-spin" />
        <X v-else class="size-4" />
        {{ t("tools.uploadData.inheritJob.confirm.cancel") }}
      </Button>
      <Button v-if="terminal || expired" type="button" :variant="canDismiss ? 'default' : 'outline'" :aria-disabled="!canDismiss || undefined" @click="dismiss">
        {{ t("tools.uploadData.inheritJob.actions.startNew") }}
      </Button>
    </CardFooter>
  </Card>
</template>
