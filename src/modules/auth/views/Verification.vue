<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { useKratosActionList } from "@/modules/auth/composables/useKratosActionList"
import { useKratosBrowserFlow } from "@/modules/auth/composables/useKratosBrowserFlow"
import { resolveBrowserOrigin } from "@/modules/auth/lib/return-to"
import { resolveVerificationContinuePath } from "@/modules/auth/lib/verification-flow"
import AuthPageShell from "@/modules/auth/components/AuthPageShell.vue"
import KratosAuthForm from "@/modules/auth/components/KratosAuthForm.vue"
import KratosFlowMessages from "@/modules/auth/components/KratosFlowMessages.vue"

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

const isReady = computed(() => !loading.value && !loadError.value && action.value !== "")

// "提交验证" is the one primary; "重新发送验证码" renders as a link under it.
const orderedActions = useKratosActionList(submitFields, buttonFields)

function handleSubmit(event: Event) {
  if (!validateVisibleFields(event)) {
    event.preventDefault()
  }
}

function setFieldValue(name: string, value: string) {
  fieldValues[name] = value
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
  <AuthPageShell
    :title="t('auth.verification.title')" :description="t('auth.verification.description')"
    :loading="loading"
    :load-error="loadError"
    @restart="restartFlow"
  >
    <div v-if="continuePath" class="grid min-w-0 gap-4 p-4">
      <KratosFlowMessages :messages="generalMessages" />
      <Button as-child size="lg" class="w-full">
        <a :href="continuePath">{{ t("auth.verification.continue") }}</a>
      </Button>
    </div>
    <KratosAuthForm
      v-else
      :action="action"
      :method="method"
      :hidden-fields="hiddenFields"
      :messages="generalMessages"
      :fields="visibleFields"
      :actions="orderedActions"
      :values="fieldValues"
      :errors="fieldErrors"
      :ready="isReady"
      :alternatives-label="t('auth.common.otherMethods')"
      :fallback-submit-label="submitLabel || t('auth.verification.submit')"
      @submit="handleSubmit"
      @trigger="invokeVisibleFieldAction"
      @update:value="setFieldValue"
    />

    <template v-if="!loading && !continuePath" #footer>
      <router-link to="/user/login" class="font-medium text-foreground underline-offset-4 hover:underline">
        {{ t("auth.register.goLogin") }}
      </router-link>
    </template>
  </AuthPageShell>
</template>
