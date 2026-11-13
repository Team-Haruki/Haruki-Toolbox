<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { useKratosActionList } from "@/modules/auth/composables/useKratosActionList"
import { useKratosBrowserFlow } from "@/modules/auth/composables/useKratosBrowserFlow"
import AuthPageShell from "@/modules/auth/components/AuthPageShell.vue"
import KratosAuthForm from "@/modules/auth/components/KratosAuthForm.vue"

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
  submitLabel,
  action,
  method,
  invokeVisibleFieldAction,
  restartFlow,
} = useKratosBrowserFlow("recovery")
const { t } = useI18n()

const isReady = computed(() => !loading.value && !loadError.value && action.value !== "")

// "验证" is the one primary; "重新发送验证码" renders as a link under it.
const orderedActions = useKratosActionList(submitFields, buttonFields)

function handleSubmit(event: Event) {
  if (!validateVisibleFields(event)) {
    event.preventDefault()
  }
}

function setFieldValue(name: string, value: string) {
  fieldValues[name] = value
}
</script>

<template>
  <AuthPageShell
    :title="t('auth.resetPassword.title')" :description="t('auth.resetPassword.description')"
    :loading="loading"
    :load-error="loadError"
    @restart="restartFlow"
  >
    <KratosAuthForm
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
      :fallback-submit-label="submitLabel || t('auth.resetPassword.submit')"
      @submit="handleSubmit"
      @trigger="invokeVisibleFieldAction"
      @update:value="setFieldValue"
    />

    <template v-if="!loading" #footer>
      <router-link to="/user/login" class="font-medium text-foreground underline-offset-4 hover:underline">
        {{ t("auth.register.goLogin") }}
      </router-link>
    </template>
  </AuthPageShell>
</template>
