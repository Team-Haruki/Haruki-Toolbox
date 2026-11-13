<script setup lang="ts">
import { computed } from "vue"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { useKratosActionList } from "@/modules/auth/composables/useKratosActionList"
import { useKratosBrowserFlow } from "@/modules/auth/composables/useKratosBrowserFlow"
import { useFlowReturnToGuard } from "@/modules/auth/composables/useFlowReturnToGuard"
import {
  buildAuthPageLink,
  buildFlowReturnTo,
  resolveAuthPageRedirect,
  resolveBrowserOrigin,
} from "@/modules/auth/lib/return-to"
import AuthPageShell from "@/modules/auth/components/AuthPageShell.vue"
import KratosAuthForm from "@/modules/auth/components/KratosAuthForm.vue"

const route = useRoute()

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
  flowReturnTo,
  method,
  invokeVisibleFieldAction,
  restartFlow,
} = useKratosBrowserFlow("registration", {
  // Only a safe ?redirect (forwarded by the sign-in page) becomes return_to;
  // without one the flow keeps the Kratos default return URL.
  getReturnTo: () => buildFlowReturnTo(route.query.redirect, resolveBrowserOrigin()),
})
const { t } = useI18n()

useFlowReturnToGuard(
  { loading, loadError, flowReturnTo, restartFlow },
  {
    titleKey: "auth.toast.invalidRegistrationReturnToTitle",
    descriptionKey: "auth.toast.invalidRegistrationReturnToDescription",
  }
)

const loginLink = computed(() =>
  buildAuthPageLink(
    "/user/login",
    resolveAuthPageRedirect(route.query.redirect, flowReturnTo.value, resolveBrowserOrigin())
  )
)

const isReady = computed(() => !loading.value && !loadError.value && action.value !== "")

// One primary ("下一步" / "注册"); passkey and social are outline, Back is ghost.
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
    :title="t('auth.register.title')" :description="t('auth.register.description')"
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
      :alternatives-label="t('auth.register.otherMethods')"
      :fallback-submit-label="submitLabel || t('auth.register.submit')"
      @submit="handleSubmit"
      @trigger="invokeVisibleFieldAction"
      @update:value="setFieldValue"
    />

    <template v-if="!loading" #footer>
      <p>
        {{ t("auth.register.hasAccount") }}
        <router-link :to="loginLink" class="font-medium text-foreground underline-offset-4 hover:underline">
          {{ t("auth.register.goLogin") }}
        </router-link>
      </p>
    </template>
  </AuthPageShell>
</template>
