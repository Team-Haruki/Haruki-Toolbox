<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Loader2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { cn } from "@/lib/utils"
import type { DeviceDenyReason, DeviceLookupResult } from "@/modules/user-settings/api/oauth2.device"
import OAuthAccountRow from "@/modules/user-settings/components/oauth/OAuthAccountRow.vue"
import OAuthAppRow from "@/modules/user-settings/components/oauth/OAuthAppRow.vue"
import OAuthAttentionNote from "@/modules/user-settings/components/oauth/OAuthAttentionNote.vue"
import OAuthScopeList from "@/modules/user-settings/components/oauth/OAuthScopeList.vue"
import OAuthTag from "@/modules/user-settings/components/oauth/OAuthTag.vue"
import { formatCountdown, formatDeviceUserCode, normalizeDeviceUserCode } from "@/modules/user-settings/lib/device-code"
import { buildDeviceScopeRows } from "@/modules/user-settings/lib/oauth-scope-rows"
import type { DevicePendingAction } from "@/modules/user-settings/composables/useDeviceAuthorization"

// Step 2 of the device panel, as sections of that panel (several roots, split
// by the panel's hairlines): who is asking on which device and who is
// answering; the code to compare with the device and how long the request
// stays open; one row per permission; the optional device name; then the
// decision, with the warning and the confirmation it asks for above the buttons.
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
const LABEL_HINT_ID = "device-label-hint"
const ACK_ID = "device-acknowledge"
const ERROR_ID = "device-review-error"

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
const scopeRows = computed(() => buildDeviceScopeRows(props.review.scopes))
</script>

<template>
  <dl class="divide-y divide-border/60">
    <OAuthAppRow :name="clientName" data-testid="device-client">
      <template #tag>
        <OAuthTag v-if="client.firstParty" tone="primary">{{ t("oauth.device.review.badge.official") }}</OAuthTag>
        <OAuthTag v-else-if="client.clientType === 'public'" tone="attention">{{ t("oauth.device.review.badge.public") }}</OAuthTag>
        <OAuthTag v-else-if="client.initiatorVerified" tone="neutral">{{ t("oauth.device.review.badge.verified") }}</OAuthTag>
      </template>
      <p class="min-w-0">
        {{ t("oauth.device.review.clientId") }}
        <code class="font-mono text-foreground [overflow-wrap:anywhere]">{{ client.clientId }}</code>
      </p>
      <p v-if="client.clientType === 'public'" class="text-amber-700 dark:text-amber-300">
        {{ t("oauth.device.review.publicHint") }}
      </p>
    </OAuthAppRow>
    <div class="min-w-0 px-4 py-3">
      <dt class="text-[11px] text-muted-foreground">
        {{ t("oauth.device.review.deviceLabelTitle") }} · {{ t("oauth.device.review.deviceLabelHint") }}
      </dt>
      <!-- Device-supplied text: always plain text, never HTML. -->
      <dd
        v-if="review.deviceLabel"
        class="mt-0.5 text-sm font-medium whitespace-pre-wrap [overflow-wrap:anywhere]"
        data-testid="device-label"
      >{{ review.deviceLabel }}</dd>
      <dd v-else class="mt-0.5 text-sm text-muted-foreground">{{ t("oauth.device.review.deviceLabelEmpty") }}</dd>
    </div>
    <OAuthAccountRow
      :name="accountName"
      name-testid="device-account"
      switchable
      :switching="pendingAction === 'switchAccount'"
      :disabled="busy"
      @switch="emit('switchAccount')"
    />
  </dl>

  <dl class="flex min-w-0 flex-wrap gap-x-8 gap-y-3 px-4 py-3">
    <div class="min-w-0 basis-full">
      <dt class="text-[11px] text-muted-foreground">{{ t("oauth.device.review.codeLabel") }}</dt>
      <dd
        class="mt-0.5 font-mono text-2xl leading-tight font-semibold tracking-[0.15em] tabular-nums [overflow-wrap:anywhere]"
        data-testid="device-confirm-code"
      >{{ userCode }}</dd>
    </div>
    <div class="min-w-0">
      <dt class="text-[11px] text-muted-foreground">{{ t("oauth.device.review.requestedAt") }}</dt>
      <dd class="mt-0.5 text-sm tabular-nums">{{ requestedAt }}</dd>
    </div>
    <div class="min-w-0">
      <dt class="text-[11px] text-muted-foreground">{{ t("oauth.device.review.remaining") }}</dt>
      <dd class="mt-0.5 text-sm tabular-nums" data-testid="device-remaining">{{ remaining }}</dd>
    </div>
  </dl>

  <OAuthScopeList :rows="scopeRows" :warn-write="review.writeWarning" />

  <div class="grid min-w-0 gap-2 p-4">
    <Label :for="LABEL_INPUT_ID">{{ t("oauth.device.review.labelTitle") }}</Label>
    <Input
      :id="LABEL_INPUT_ID"
      v-model="label"
      autocomplete="off"
      :placeholder="review.deviceLabel || clientName"
      :disabled="busy"
      :aria-describedby="LABEL_HINT_ID"
    />
    <p :id="LABEL_HINT_ID" class="text-xs text-muted-foreground">{{ t("oauth.device.review.labelHint") }}</p>
  </div>

  <div class="grid min-w-0 gap-4 p-4">
    <OAuthAttentionNote>{{ t("oauth.device.review.phishingWarning") }}</OAuthAttentionNote>
    <div
      class="flex min-w-0 items-start gap-3"
      data-testid="device-ack"
      :data-highlighted="ackHighlighted ? 'true' : undefined"
    >
      <!-- The label is the touch target: the whole row toggles the box on phones. -->
      <!-- 20 px box + 10 px invisible ring = the 40 px touch target on coarse pointers. -->
      <Checkbox
        :id="ACK_ID"
        v-model="acknowledged"
        class="mt-0.5 size-5 sm:size-4 pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5 pointer-coarse:after:content-['']"
        :disabled="busy"
        :aria-invalid="ackHighlighted ? 'true' : undefined"
        :aria-describedby="ackHighlighted && errorText ? ERROR_ID : undefined"
      />
      <Label
        :for="ACK_ID"
        :class="cn('min-h-6 min-w-0 flex-1 cursor-pointer py-0.5 leading-snug font-normal', ackHighlighted && 'text-destructive')"
      >
        {{ t("oauth.device.review.acknowledge") }}
      </Label>
    </div>

    <p v-if="errorText" :id="ERROR_ID" role="alert" class="text-sm text-destructive [overflow-wrap:anywhere]">
      {{ errorText }}
    </p>
    <OAuthAttentionNote v-if="approveOutcomeUnknown">{{ t("oauth.device.review.outcomeUnknown") }}</OAuthAttentionNote>

    <div class="grid min-w-0 gap-2">
      <div class="flex flex-col gap-2 @min-[22rem]:flex-row-reverse">
        <Button size="lg" class="w-full @min-[22rem]:flex-1" :disabled="busy || disabled" @click="emit('approve')">
          <Loader2 v-if="pendingAction === 'approve'" class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          {{ pendingAction === "approve" ? t("oauth.device.review.approving") : t("oauth.device.review.approve") }}
        </Button>
        <Button
          variant="outline"
          size="lg"
          class="w-full @min-[22rem]:w-auto @min-[22rem]:min-w-28"
          :disabled="busy || disabled"
          @click="emit('deny', 'user_denied')"
        >
          {{ t("oauth.device.review.deny") }}
        </Button>
      </div>
      <Button
        variant="ghost"
        class="w-full text-muted-foreground"
        :disabled="busy || disabled"
        @click="emit('deny', 'not_initiated_by_me')"
      >
        {{ t("oauth.device.review.notMe") }}
      </Button>
    </div>
  </div>
</template>
