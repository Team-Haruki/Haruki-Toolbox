<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { AlertTriangle, Loader2, ShieldAlert, ShieldCheck, ShieldX, UserRound } from "lucide-vue-next"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { cn } from "@/lib/utils"
import { getScopeDescription, getScopeLabel } from "@/modules/user-settings/api/oauth2"
import type { DeviceDenyReason, DeviceLookupResult, DeviceScopeRisk } from "@/modules/user-settings/api/oauth2.device"
import { formatCountdown, formatDeviceUserCode, normalizeDeviceUserCode } from "@/modules/user-settings/lib/device-code"
import type { DevicePendingAction } from "@/modules/user-settings/composables/useDeviceAuthorization"

const props = defineProps<{
  review: DeviceLookupResult
  /** Code the person looked up, shown when the reply carries none. */
  enteredCode: string
  fallbackAccountName: string
  remainingSeconds: number | null
  pendingAction: DevicePendingAction | null
  disabled: boolean
  errorText: string
  ackHighlighted: boolean
  approveOutcomeUnknown: boolean
}>()

const emit = defineEmits<{
  (e: "approve"): void
  (e: "deny", reason: DeviceDenyReason): void
  (e: "switchAccount"): void
}>()

const label = defineModel<string>("label", { required: true })
const acknowledged = defineModel<boolean>("acknowledged", { required: true })

const { t } = useI18n()

const LABEL_INPUT_ID = "device-label"
const ACK_ID = "device-acknowledge"

const client = computed(() => props.review.client)
const clientName = computed(() => client.value.clientName || client.value.clientId)
const accountName = computed(() => props.review.account.name || props.fallbackAccountName)
const userCode = computed(() => {
  const code = normalizeDeviceUserCode(props.review.userCode) ?? normalizeDeviceUserCode(props.enteredCode)
  return code ? formatDeviceUserCode(code) : props.enteredCode
})
const requestedAt = computed(() => formatLocalizedDateTime(props.review.requestedAt))
const remaining = computed(() => (props.remainingSeconds == null ? "—" : formatCountdown(props.remainingSeconds)))
const busy = computed(() => props.pendingAction !== null)

const RISK_BADGE: Record<DeviceScopeRisk, "muted" | "amber" | "sky" | "destructive"> = {
  identity: "muted",
  offline: "amber",
  read: "sky",
  write: "destructive",
}
</script>

<template>
  <Card class="w-full max-w-lg">
    <CardHeader class="text-center">
      <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <ShieldCheck class="h-6 w-6 text-primary" />
      </div>
      <CardTitle class="text-xl">{{ t("oauth.device.review.title") }}</CardTitle>
      <CardDescription>
        <i18n-t keypath="oauth.device.review.description" scope="global">
          <template #client><strong class="text-foreground">{{ clientName }}</strong></template>
        </i18n-t>
      </CardDescription>
    </CardHeader>

    <CardContent class="space-y-5">
      <section class="space-y-2 rounded-lg border p-3" data-testid="device-client">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-semibold">{{ clientName }}</span>
          <Badge v-if="client.firstParty" variant="emerald">{{ t("oauth.device.review.badge.official") }}</Badge>
          <Badge v-else-if="client.clientType === 'public'" variant="amber">{{ t("oauth.device.review.badge.public") }}</Badge>
          <Badge v-else-if="client.initiatorVerified" variant="sky">{{ t("oauth.device.review.badge.verified") }}</Badge>
        </div>
        <p class="text-xs text-muted-foreground">
          {{ t("oauth.device.review.clientId") }}:
          <code class="font-mono text-foreground break-all">{{ client.clientId }}</code>
        </p>
        <p v-if="client.clientType === 'public'" class="text-xs text-amber-700 dark:text-amber-300">
          {{ t("oauth.device.review.publicHint") }}
        </p>
      </section>

      <section class="space-y-2">
        <p class="text-sm font-medium text-muted-foreground">{{ t("oauth.device.review.scopesTitle") }}</p>
        <ul v-if="review.scopes.length > 0" class="space-y-2">
          <li
            v-for="item in review.scopes"
            :key="item.scope"
            :data-risk="item.risk"
            :class="cn(
              'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
              item.risk === 'write' && 'border-destructive/40 bg-destructive/5 text-destructive',
            )"
          >
            <span class="min-w-0 flex-1">
              <span class="block font-medium">{{ getScopeLabel(item.scope) }}</span>
              <span
                v-if="getScopeDescription(item.scope)"
                :class="cn('block text-xs', item.risk === 'write' ? 'text-destructive' : 'text-muted-foreground')"
              >
                {{ getScopeDescription(item.scope) }}
              </span>
            </span>
            <Badge size="sm" :variant="RISK_BADGE[item.risk]">{{ t(`oauth.device.review.risk.${item.risk}`) }}</Badge>
          </li>
        </ul>
        <p v-else class="text-sm text-muted-foreground">{{ t("oauth.device.review.noScopes") }}</p>
        <Alert v-if="review.writeWarning" variant="destructive" class="border-destructive/40 bg-destructive/5">
          <ShieldAlert />
          <AlertDescription>{{ t("oauth.device.review.writeWarning") }}</AlertDescription>
        </Alert>
      </section>

      <section class="space-y-1 rounded-lg border p-3">
        <p class="text-xs font-medium text-muted-foreground">
          {{ t("oauth.device.review.deviceLabelTitle") }}
          <span class="font-normal">· {{ t("oauth.device.review.deviceLabelHint") }}</span>
        </p>
        <!-- Device-supplied text: always plain text, never HTML. -->
        <p v-if="review.deviceLabel" class="text-sm break-words whitespace-pre-wrap" data-testid="device-label">{{ review.deviceLabel }}</p>
        <p v-else class="text-sm text-muted-foreground">{{ t("oauth.device.review.deviceLabelEmpty") }}</p>
      </section>

      <dl class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt class="text-xs text-muted-foreground">{{ t("oauth.device.review.requestedAt") }}</dt>
          <dd>{{ requestedAt }}</dd>
        </div>
        <div>
          <dt class="text-xs text-muted-foreground">{{ t("oauth.device.review.remaining") }}</dt>
          <dd class="font-mono tabular-nums" data-testid="device-remaining">{{ remaining }}</dd>
        </div>
      </dl>

      <div class="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
        <span class="flex min-w-0 items-center gap-2">
          <UserRound class="h-4 w-4 shrink-0 text-muted-foreground" />
          <span class="text-muted-foreground">{{ t("oauth.device.review.account") }}</span>
          <strong class="truncate" data-testid="device-account">{{ accountName }}</strong>
        </span>
        <Button variant="link" size="sm" class="h-auto p-0" :disabled="busy" @click="emit('switchAccount')">
          {{ t("oauth.device.review.switchAccount") }}
        </Button>
      </div>

      <Alert class="border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-200">
        <AlertTriangle />
        <AlertDescription class="text-current">{{ t("oauth.device.review.phishingWarning") }}</AlertDescription>
      </Alert>

      <p class="text-center text-sm">
        <i18n-t keypath="oauth.device.review.confirmCode" scope="global">
          <template #code>
            <code class="ml-1 rounded bg-muted px-2 py-1 font-mono text-lg font-semibold tracking-widest" data-testid="device-confirm-code">{{ userCode }}</code>
          </template>
        </i18n-t>
      </p>

      <div class="space-y-2">
        <Label :for="LABEL_INPUT_ID">{{ t("oauth.device.review.labelTitle") }}</Label>
        <Input
          :id="LABEL_INPUT_ID"
          v-model="label"
          autocomplete="off"
          :placeholder="review.deviceLabel || clientName"
          :disabled="busy"
        />
        <p class="text-xs text-muted-foreground">{{ t("oauth.device.review.labelHint") }}</p>
      </div>

      <div
        :class="cn(
          'flex items-start gap-3 rounded-md border p-3 transition-colors',
          ackHighlighted && 'border-destructive ring-2 ring-destructive/30',
        )"
        data-testid="device-ack"
        :data-highlighted="ackHighlighted ? 'true' : undefined"
      >
        <Checkbox :id="ACK_ID" v-model="acknowledged" class="mt-0.5" :disabled="busy" />
        <Label :for="ACK_ID" class="leading-snug font-normal">{{ t("oauth.device.review.acknowledge") }}</Label>
      </div>

      <p v-if="errorText" role="alert" class="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {{ errorText }}
      </p>
      <p v-if="approveOutcomeUnknown" class="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        {{ t("oauth.device.review.outcomeUnknown") }}
      </p>
    </CardContent>

    <CardFooter class="flex flex-col gap-3 sm:flex-row-reverse">
      <Button class="w-full sm:flex-1" :disabled="busy || disabled" @click="emit('approve')">
        <Loader2 v-if="pendingAction === 'approve'" class="h-4 w-4 mr-2 animate-spin" />
        <ShieldCheck v-else class="h-4 w-4 mr-2" />
        {{ pendingAction === "approve" ? t("oauth.device.review.approving") : t("oauth.device.review.approve") }}
      </Button>
      <Button variant="outline" class="w-full sm:flex-1" :disabled="busy || disabled" @click="emit('deny', 'user_denied')">
        <ShieldX class="h-4 w-4 mr-2" />
        {{ t("oauth.device.review.deny") }}
      </Button>
      <Button
        variant="ghost"
        class="w-full text-destructive hover:text-destructive sm:flex-1"
        :disabled="busy || disabled"
        @click="emit('deny', 'not_initiated_by_me')"
      >
        {{ t("oauth.device.review.notMe") }}
      </Button>
    </CardFooter>
  </Card>
</template>
