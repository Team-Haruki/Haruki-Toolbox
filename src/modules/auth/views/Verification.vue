<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2, MailCheck, Mail, KeyRound, RotateCcw } from "lucide-vue-next"
import { useKratosActionList } from "@/modules/auth/composables/useKratosActionList"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
import { useKratosBrowserFlow } from "@/modules/auth/composables/useKratosBrowserFlow"
import { resolveBrowserOrigin } from "@/modules/auth/lib/return-to"
import { resolveVerificationContinuePath } from "@/modules/auth/lib/verification-flow"
import KratosFlowMessages from "@/modules/auth/components/KratosFlowMessages.vue"
import KratosFieldInput from "@/modules/auth/components/KratosFieldInput.vue"

const {
  loading,
  loadError,
  fieldValues,
  fieldErrors,
  validateVisibleFields,
  generalMessages,
  hiddenFields,
  visibleFields,
  buttonFields,
  submitFields,
  anchorFields,
  submitLabel,
  action,
  flowReturnTo,
  flowState,
  method,
  invokeVisibleFieldAction,
  restartFlow,
} = useKratosBrowserFlow("verification")

const { t } = useI18n()

function iconForField(name: string) {
  if (name.endsWith("email")) {
    return Mail
  }

  return KeyRound
}

const isReady = computed(() => !loading.value && !loadError.value && action.value !== "")

// "提交验证" is the one primary; "重新发送验证码" renders as a link under it.
const orderedActions = useKratosActionList(submitFields, buttonFields)

function actionIcon(role: string) {
  return role === "resend" ? RotateCcw : MailCheck
}

function handleSubmit(event: Event) {
  if (!validateVisibleFields(event)) {
    event.preventDefault()
  }
}

// Once the code is accepted, Kratos turns the flow into a GET form whose action
// is the return URL and adds a "continue" link. Submitting that form would
// replace the return URL's query (dropping ?user_code= or ?login_challenge=),
// so the page shows a plain link to the same-origin target instead. It is a
// full page load: the app was bootstrapped while the address was unverified
// and needs to sync the account again.
const continuePath = computed(() =>
  resolveVerificationContinuePath(
    { state: flowState.value, returnTo: flowReturnTo.value, anchors: anchorFields.value },
    resolveBrowserOrigin()
  )
)
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center gap-6 px-0 py-4">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <MailCheck class="h-6 w-6" />
          {{ t("auth.verification.title") }}
        </CardTitle>
        <CardDescription>{{ t("auth.verification.description") }}</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {{ t("auth.common.loadingFlow") }}
        </div>
        <div v-else-if="loadError" class="space-y-4">
          <p class="text-sm text-destructive">{{ loadError }}</p>
          <Button class="w-full" @click="restartFlow">
            <MailCheck class="mr-2 h-4 w-4" />
            {{ t("auth.common.restartFlow") }}
          </Button>
        </div>
        <div v-else-if="continuePath" class="space-y-4">
          <KratosFlowMessages :messages="generalMessages" />
          <Button as-child class="w-full">
            <a :href="continuePath">
              <ArrowRight class="mr-2 h-4 w-4" />
              {{ t("auth.verification.continue") }}
            </a>
          </Button>
        </div>
        <form v-else :action="action" :method="method" class="space-y-4" novalidate @submit="handleSubmit">
          <input v-for="field in hiddenFields" :key="field.key" type="hidden" :name="field.name" :value="field.value" />

          <KratosFlowMessages :messages="generalMessages" />

          <div v-for="(field, index) in visibleFields" :key="field.key" class="grid gap-2">
            <Label :for="field.key">{{ field.label }}</Label>
            <Button
              v-if="field.type === 'button'"
              type="button"
              variant="outline"
              class="w-full justify-start"
              :name="field.name"
              :value="field.value || undefined"
              :disabled="field.disabled"
              @click="invokeVisibleFieldAction(field)"
            >
              <component :is="iconForField(field.name)" class="size-4 mr-2" />
              {{ field.label }}
            </Button>
            <KratosFieldInput
              v-else
              :id="field.key"
              v-model="fieldValues[field.name]"
              :name="field.name"
              :type="field.type"
              :icon="iconForField(field.name)"
              :autocomplete="field.autocomplete"
              :required="field.required"
              :disabled="field.disabled"
              :placeholder="field.placeholder"
              :error="fieldErrors[field.name]"
              :autofocus="index === 0 && isReady"
            />
            <KratosFlowMessages :messages="field.messages" />
          </div>

          <div v-if="orderedActions.length > 0" class="space-y-2">
            <div v-for="item in orderedActions" :key="item.key" class="space-y-1">
              <Button
                :type="item.kind === 'submit' ? 'submit' : 'button'"
                class="w-full"
                :variant="item.variant"
                :data-kratos-role="item.role"
                :name="item.name || undefined"
                :value="item.value || undefined"
                :data-kratos-submit="item.kind === 'submit' ? item.key : undefined"
                :disabled="!isReady || item.disabled"
                @click="item.kind === 'trigger' ? invokeVisibleFieldAction(item) : undefined"
              >
                <component :is="actionIcon(item.role)" class="size-4" />
                {{ item.label }}
              </Button>
              <KratosFlowMessages :messages="item.messages" />
            </div>
          </div>
          <Button v-else type="submit" class="w-full" :disabled="!isReady">
            <MailCheck class="mr-2 h-4 w-4" />
            {{ submitLabel || t("auth.verification.submit") }}
          </Button>
          <div class="text-center text-sm">
            <router-link to="/user/login" class="underline underline-offset-4">
              {{ t("auth.register.goLogin") }}
            </router-link>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
