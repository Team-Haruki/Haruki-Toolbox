<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import { CircleCheck, DoorClosed, Loader2, TriangleAlert } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import EmptyState from "@/shared/components/EmptyState.vue"
import FieldError from "@/shared/components/FieldError.vue"
import PageHeader from "@/shared/components/PageHeader.vue"
import BotNeoStepStrip from "@/modules/haruki-bot-neo/components/BotNeoStepStrip.vue"
import {
  BOT_NEO_CODE_INPUT_ID,
  BOT_NEO_QQ_INPUT_ID,
  useBotNeoRegistration,
} from "@/modules/haruki-bot-neo/composables/useBotNeoRegistration"
import { BOT_NEO_QQ_GROUP, buildConfigGeneratorLocation } from "@/modules/haruki-bot-neo/lib/registration"

const { t } = useI18n()
const {
  statusLoading,
  registrationEnabled,
  statusCheckFailed,
  step,
  qqNumber,
  verificationCode,
  qqError,
  codeError,
  formError,
  sending,
  registering,
  result,
  isCooldown,
  cooldownSeconds,
  checkStatus,
  clearQQError,
  clearCodeError,
  handleSendCode,
  handleRegister,
  handleCopy,
  handleReset,
  handleBackToInput,
} = useBotNeoRegistration()

const QQ_ERROR_ID = "bot-neo-qq-error"
const QQ_HINT_ID = "bot-neo-qq-hint"
const CODE_ERROR_ID = "bot-neo-code-error"

// The credential is shown once: leaving the result asks first.
const leaveResultOpen = ref(false)

const mailAddress = computed(() => `${qqNumber.value.trim() || t("botNeo.input.hintQqPlaceholder")}@qq.com`)
const configGeneratorRoute = computed(() => buildConfigGeneratorLocation(result.value, qqNumber.value))
const resultFields = computed(() => {
  const data = result.value
  if (!data) return []
  return [
    { key: "bot-id", label: t("botNeo.result.botIdLabel"), value: data.bot_id },
    { key: "credential", label: t("botNeo.result.credentialLabel"), value: data.credential },
  ]
})

onMounted(() => {
  checkStatus()
})
</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center px-1 py-2 sm:px-0 sm:py-4">
    <div class="mx-auto grid w-full max-w-2xl gap-4">
      <PageHeader :title="t('botNeo.title')" :description="t('botNeo.lead')" />

      <div v-if="statusLoading" class="grid gap-3 rounded-xl border bg-card p-4" aria-busy="true" data-testid="bot-neo-loading">
        <Skeleton class="h-5 w-2/3" />
        <Skeleton class="h-11" />
        <Skeleton class="h-9 w-32 justify-self-end" />
      </div>

      <div v-else-if="registrationEnabled === false" class="rounded-xl border bg-card px-4" data-testid="bot-neo-closed">
        <EmptyState :icon="DoorClosed" :title="t('botNeo.disabled.title')">
          <template #action>
            <Button variant="outline" size="sm" @click="checkStatus">{{ t("botNeo.disabled.recheck") }}</Button>
          </template>
        </EmptyState>
      </div>

      <section
        v-else
        class="@container overflow-hidden rounded-xl border bg-card"
        :aria-label="t('botNeo.title')"
        :data-step="step"
        data-testid="bot-neo-panel"
      >
        <BotNeoStepStrip :current="step" class="border-b border-border/60" />

        <!-- The status check failed: the form still works, so it stays; this only says what is unknown. -->
        <div
          v-if="statusCheckFailed"
          class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/60 px-4 py-2.5"
          role="status"
          data-testid="bot-neo-status-unknown"
        >
          <p class="flex min-w-0 flex-1 basis-56 items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
            <TriangleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />
            {{ t("botNeo.status.unknown") }}
          </p>
          <Button variant="outline" size="sm" @click="checkStatus">{{ t("botNeo.status.recheck") }}</Button>
        </div>

        <!-- Step 1: whose bot this is -->
        <form v-if="step === 'input'" class="grid gap-4 p-4" novalidate data-testid="bot-neo-input-form" @submit.prevent="handleSendCode">
          <div class="grid gap-1.5">
            <Label :for="BOT_NEO_QQ_INPUT_ID">{{ t("botNeo.input.ownerLabel") }}</Label>
            <Input
              :id="BOT_NEO_QQ_INPUT_ID"
              v-model="qqNumber"
              class="h-11 text-base font-medium tabular-nums md:text-base"
              inputmode="numeric"
              autocomplete="off"
              :placeholder="t('botNeo.input.ownerPlaceholder')"
              :aria-invalid="qqError ? 'true' : undefined"
              :aria-describedby="qqError ? QQ_ERROR_ID : QQ_HINT_ID"
              @input="clearQQError"
            />
            <FieldError v-if="qqError" :id="QQ_ERROR_ID" :message="qqError" />
            <p v-else :id="QQ_HINT_ID" class="text-xs text-muted-foreground [overflow-wrap:anywhere]">
              {{ t("botNeo.input.mailHint", { mail: mailAddress }) }}
            </p>
          </div>

          <p class="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
            <TriangleAlert class="mt-px size-4 shrink-0" aria-hidden="true" />
            {{ t("botNeo.input.ownerNote") }}
          </p>

          <FieldError :message="formError" />

          <div class="flex justify-end">
            <Button type="submit" class="w-full @min-[24rem]:w-auto" :disabled="sending || isCooldown">
              <Loader2 v-if="sending" class="size-4 animate-spin" aria-hidden="true" />
              <template v-if="isCooldown">{{ t("botNeo.input.cooldownButton", { seconds: cooldownSeconds }) }}</template>
              <template v-else>{{ t("botNeo.input.sendButton") }}</template>
            </Button>
          </div>
        </form>

        <!-- Step 2: the mailed code -->
        <form v-else-if="step === 'verify'" class="grid gap-4 p-4" novalidate data-testid="bot-neo-verify-form" @submit.prevent="handleRegister">
          <p class="text-sm text-muted-foreground [overflow-wrap:anywhere]" data-testid="bot-neo-code-sent">
            {{ t("botNeo.verify.sentTo", { mail: mailAddress }) }}
          </p>

          <div class="grid gap-1.5">
            <Label :for="BOT_NEO_CODE_INPUT_ID">{{ t("botNeo.verify.codeFieldLabel") }}</Label>
            <Input
              :id="BOT_NEO_CODE_INPUT_ID"
              v-model="verificationCode"
              class="h-11 text-base font-medium tracking-[0.3em] tabular-nums placeholder:tracking-normal md:text-base"
              maxlength="6"
              inputmode="numeric"
              autocomplete="one-time-code"
              :placeholder="t('botNeo.verify.codeFieldPlaceholder')"
              :aria-invalid="codeError ? 'true' : undefined"
              :aria-describedby="codeError ? CODE_ERROR_ID : undefined"
              @input="clearCodeError"
            />
            <FieldError :id="CODE_ERROR_ID" :message="codeError" />
          </div>

          <FieldError :message="formError" />

          <div class="flex flex-col-reverse gap-2 @min-[30rem]:flex-row @min-[30rem]:items-center @min-[30rem]:justify-between">
            <div class="flex flex-wrap gap-1 @min-[30rem]:-ml-3">
              <Button type="button" variant="ghost" class="flex-1 @min-[30rem]:flex-none" @click="handleBackToInput">
                {{ t("botNeo.verify.changeNumber") }}
              </Button>
              <Button
                type="button"
                variant="ghost"
                class="flex-1 @min-[30rem]:flex-none"
                :disabled="sending || isCooldown"
                data-testid="bot-neo-resend"
                @click="handleSendCode"
              >
                <Loader2 v-if="sending" class="size-4 animate-spin" aria-hidden="true" />
                <span v-if="isCooldown" class="tabular-nums">{{ t("botNeo.verify.resendCooldown", { seconds: cooldownSeconds }) }}</span>
                <template v-else>{{ t("botNeo.verify.resend") }}</template>
              </Button>
            </div>
            <Button type="submit" :disabled="registering || isCooldown">
              <Loader2 v-if="registering" class="size-4 animate-spin" aria-hidden="true" />
              {{ t("botNeo.verify.submit") }}
            </Button>
          </div>
        </form>

        <!-- Step 3: the bot's id and its shown-once credential -->
        <div v-else-if="step === 'result' && result" data-testid="bot-neo-result">
          <div class="flex items-center gap-2 p-4">
            <CircleCheck class="size-5 shrink-0 text-primary" aria-hidden="true" />
            <h2 class="min-w-0 text-sm font-semibold">{{ t("botNeo.result.successTitle") }}</h2>
          </div>

          <dl class="divide-y divide-border/60 border-t border-border/60">
            <div v-for="field in resultFields" :key="field.key" class="flex items-start gap-3 px-4 py-3">
              <div class="min-w-0 flex-1">
                <dt class="text-[11px] text-muted-foreground">{{ field.label }}</dt>
                <dd
                  class="mt-0.5 max-h-40 overflow-y-auto font-mono text-sm leading-relaxed break-all select-all [overflow-wrap:anywhere]"
                  :data-testid="`bot-neo-${field.key}`"
                >
                  {{ field.value }}
                </dd>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                class="shrink-0"
                :aria-label="t('botNeo.result.copyAction', { label: field.label })"
                @click="handleCopy(field.value, field.label)"
              >
                {{ t("botNeo.result.copyButton") }}
              </Button>
            </div>
          </dl>

          <div class="grid gap-3 border-t border-border/60 p-4">
            <p class="flex items-start gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
              <TriangleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {{ t("botNeo.result.shownOnce") }}
            </p>
            <div class="flex flex-col-reverse gap-2 @min-[30rem]:flex-row @min-[30rem]:justify-end">
              <Button type="button" variant="outline" @click="leaveResultOpen = true">
                {{ t("botNeo.result.registerAnotherButton") }}
              </Button>
              <Button as-child>
                <RouterLink :to="configGeneratorRoute" data-testid="bot-neo-open-generator">
                  {{ t("botNeo.result.openGenerator") }}
                </RouterLink>
              </Button>
            </div>
          </div>
        </div>

        <!-- Where a registered owner goes next, whichever step is showing. -->
        <div class="flex items-center gap-3 border-t border-border/60 px-4 py-3">
          <dl class="min-w-0 flex-1">
            <dt class="text-[11px] text-muted-foreground">{{ t("botNeo.group.label") }}</dt>
            <dd class="text-sm font-medium tabular-nums" data-testid="bot-neo-group">{{ BOT_NEO_QQ_GROUP }}</dd>
          </dl>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            class="shrink-0"
            :aria-label="t('botNeo.result.copyAction', { label: t('botNeo.group.number') })"
            @click="handleCopy(BOT_NEO_QQ_GROUP, t('botNeo.group.number'))"
          >
            {{ t("botNeo.result.copyButton") }}
          </Button>
        </div>
      </section>
    </div>

    <ConfirmDialog
      v-model:open="leaveResultOpen"
      :title="t('botNeo.result.leave.title')"
      :description="t('botNeo.result.leave.description')"
      :confirm-label="t('botNeo.result.leave.confirm')"
      :on-confirm="handleReset"
    />
  </div>
</template>
