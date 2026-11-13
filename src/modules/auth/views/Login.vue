<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { Button } from "@/components/ui/button"
import { CircleAlert, Loader2 } from "lucide-vue-next"
import {
  isPasskeyAction,
  orderKratosActions,
  type KratosActionRole,
  type KratosActionVariant,
} from "@/modules/auth/lib/action-hierarchy"
import { useKratosBrowserFlow, type KratosFlowMessage } from "@/modules/auth/composables/useKratosBrowserFlow"
import { useFlowReturnToGuard } from "@/modules/auth/composables/useFlowReturnToGuard"
import { markLoginSuccessPending } from "@/modules/auth/lib/login-success"
import {
  LOGIN_SUCCESS_QUERY_PARAM,
  buildAuthPageLink,
  buildFlowReturnTo,
  resolveAuthPageRedirect,
  resolveBrowserOrigin,
  resolveRedirectFromFlowReturnTo,
} from "@/modules/auth/lib/return-to"
import { runDiscoverablePasskeyLogin } from "@/modules/auth/lib/passkey-refresh-login"
import { localizeKratosWebAuthnAlert } from "@/modules/auth/lib/kratos-webauthn-alerts"
import { logoutInPlaceStrict } from "@/modules/auth/api/logout"
import AuthPageShell from "@/modules/auth/components/AuthPageShell.vue"
import KratosAuthForm from "@/modules/auth/components/KratosAuthForm.vue"
import { resolveLoginReason } from "@/modules/auth/lib/login-reason"

const route = useRoute()
const { t } = useI18n()

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
  isRefreshFlow,
  invokeVisibleFieldAction,
  restartFlow,
} = useKratosBrowserFlow("login", {
  getReturnTo: () => buildFlowReturnTo(route.query.redirect, resolveBrowserOrigin(), {
    fallbackPath: "/",
    params: { [LOGIN_SUCCESS_QUERY_PARAM]: "1" },
  }),
})

useFlowReturnToGuard(
  { loading, loadError, flowReturnTo, restartFlow },
  {
    titleKey: "auth.toast.invalidReturnToTitle",
    descriptionKey: "auth.toast.invalidReturnToDescription",
  }
)

// A new account should land where the sign-in was heading (an OAuth login
// challenge, for example), so the register link forwards the redirect.
const registerLink = computed(() =>
  buildAuthPageLink(
    "/user/register",
    resolveAuthPageRedirect(route.query.redirect, flowReturnTo.value, resolveBrowserOrigin())
  )
)

type LoginActionKind = "submit" | "trigger"

interface LoginAction {
  key: string
  group: string
  name: string
  value: string
  label: string
  labelId: number | null
  disabled: boolean
  kind: LoginActionKind
  messages: KratosFlowMessage[]
  onClickTrigger: string
  role: KratosActionRole
  variant: KratosActionVariant
}

// One primary per form: the password/code submit; passkey and social
// providers are outline alternatives below it (same order as registration).
const orderedLoginActions = computed<LoginAction[]>(() => {
  const submitActions = submitFields.value.map((submit) => ({
    key: submit.key,
    group: submit.group,
    name: submit.name,
    value: submit.value,
    label: submit.label,
    labelId: submit.labelId,
    disabled: submit.disabled,
    kind: "submit" as const,
    messages: submit.messages,
    onClickTrigger: "",
  }))

  const triggerActions = buttonFields.value.map((field) => ({
    key: field.key,
    group: field.group,
    name: field.name,
    value: field.value,
    label: field.label,
    labelId: field.labelId,
    disabled: field.disabled,
    kind: "trigger" as const,
    messages: field.messages,
    onClickTrigger: field.onClickTrigger,
  }))

  return orderKratosActions([...submitActions, ...triggerActions])
    .map(({ action, role, variant }) => ({ ...action, role, variant }))
})

// The heading names the step: email + password, the second factor, or a
// re-authentication. Kratos flags the latter on the flow itself; a passkey-only
// account gets no password field there, so the fields alone cannot tell.
const loginStep = computed<"password" | "mfa" | "refresh">(() => {
  const names = visibleFields.value.map((field) => field.name.toLowerCase())
  if (names.some((name) => name === "totp_code" || name === "lookup_secret")) {
    return "mfa"
  }
  if (isRefreshFlow.value) {
    return "refresh"
  }
  const hasIdentifier = names.some((name) => name === "identifier" || name.endsWith("email"))
  const hasPassword = names.some((name) => name.includes("password"))
  return hasPassword && !hasIdentifier ? "refresh" : "password"
})
const loginTitle = computed(() => {
  switch (loginStep.value) {
    case "mfa":
      return t("auth.login.titleMfa")
    case "refresh":
      return t("auth.login.titleRefresh")
    default:
      return t("auth.login.title")
  }
})
const alternativesLabel = computed(() =>
  loginStep.value === "mfa" ? t("auth.login.otherFactors") : t("auth.login.otherMethods")
)
const hasPasswordField = computed(() => visibleFields.value.some((field) => field.name.toLowerCase().includes("password")))

const authForm = useTemplateRef<{ form: HTMLFormElement | null }>("authForm")
const passkeyChallenge = computed(
  () => hiddenFields.value.find((field) => field.name === "passkey_challenge")?.value ?? ""
)
const passkeyBusy = ref(false)

// A refresh flow pins the passkey request to the account's credentials, and
// some phone authenticators then leave the user handle out, which Kratos
// needs to find the account (see passkey-refresh-login.ts). The refresh
// passkey button therefore sends a discoverable request of our own instead
// of calling Kratos' webauthn.js.
async function runRefreshPasskeyLogin() {
  const form = authForm.value?.form
  if (!form) {
    return
  }

  passkeyBusy.value = true
  try {
    const result = await runDiscoverablePasskeyLogin(passkeyChallenge.value, form)
    if (result === "submitted") {
      // The form is posting; keep the buttons disabled until the page unloads.
      return
    }
    passkeyBusy.value = false
    toast.error(result === "unsupported" ? t("auth.kratos.webauthn.unsupported") : t("auth.common.triggerUnavailable"))
  } catch (error: unknown) {
    passkeyBusy.value = false
    toast.error(localizeKratosWebAuthnAlert(error))
  }
}

function handleActionClick(action: LoginAction) {
  if (action.kind !== "trigger") {
    return
  }

  markLoginSuccessPending()
  if (isRefreshFlow.value && isPasskeyAction(action) && passkeyChallenge.value !== "") {
    void runRefreshPasskeyLogin()
    return
  }
  invokeVisibleFieldAction({ onClickTrigger: action.onClickTrigger })
}

// Kratos text id of "This account does not exist or has no security key set
// up" (text/message_login.go). In a refresh flow it means the authenticator
// did not hand back the user handle, not that the account is missing.
const NO_WEBAUTHN_CREDENTIALS_ID = 4000015

function isRefreshPasskeyMismatch(message: KratosFlowMessage): boolean {
  return isRefreshFlow.value && message.id === NO_WEBAUTHN_CREDENTIALS_ID
}

const hasRefreshPasskeyMismatch = computed(() =>
  [
    ...generalMessages.value,
    ...visibleFields.value.flatMap((field) => field.messages),
    ...buttonFields.value.flatMap((field) => field.messages),
    ...submitFields.value.flatMap((field) => field.messages),
  ].some(isRefreshPasskeyMismatch)
)

function withoutRefreshPasskeyMismatch(messages: KratosFlowMessage[]): KratosFlowMessage[] {
  return hasRefreshPasskeyMismatch.value ? messages.filter((message) => !isRefreshPasskeyMismatch(message)) : messages
}

const reloginBusy = ref(false)

// A fresh sign-in sends a discoverable passkey request (which does carry the
// user handle) and leaves the new session privileged for a while, so the
// settings change that needed the refresh can be made right after it.
async function signOutAndSignInAgain() {
  reloginBusy.value = true
  try {
    await logoutInPlaceStrict()
  } catch {
    reloginBusy.value = false
    toast.error(t("auth.login.refreshPasskey.reloginFailed"))
    return
  }

  // Back to the page that asked for the refresh, minus its now-dead flow id.
  const redirect = resolveRedirectFromFlowReturnTo(flowReturnTo.value, resolveBrowserOrigin(), [
    "flow",
    LOGIN_SUCCESS_QUERY_PARAM,
  ])
  const link = buildAuthPageLink("/user/login", redirect === "/" ? null : redirect)
  const query = new URLSearchParams(link.query).toString()
  window.location.assign(query ? `${link.path}?${query}` : link.path)
}

function handleSubmit(event: Event) {
  if (!validateVisibleFields(event)) {
    event.preventDefault()
    return
  }
  markLoginSuccessPending()
}

const isReady = computed(() => !loading.value && !loadError.value && action.value !== "")

// Why the user landed here (route guard, expired session). The guard's toast
// would be lost behind the Kratos redirect, so the page says it inline.
const loginReason = computed(() => resolveLoginReason(route.query.reason))
const loginReasonText = computed(() => {
  switch (loginReason.value) {
    case "auth-required":
      return t("auth.login.reasons.authRequired")
    case "admin-required":
      return t("auth.login.reasons.adminRequired")
    case "session-expired":
      return t("auth.login.reasons.sessionExpired")
    default:
      return ""
  }
})

// What the form draws: the reason line first, then what Kratos said, with the
// refresh passkey failure taken out wherever it is replaced by the notice.
const formMessages = computed<KratosFlowMessage[]>(() => {
  const messages = withoutRefreshPasskeyMismatch(generalMessages.value)
  if (!loginReasonText.value) {
    return messages
  }
  return [{ key: "login-reason", id: null, text: loginReasonText.value, tone: "info" }, ...messages]
})
const formFields = computed(() =>
  hasRefreshPasskeyMismatch.value
    ? visibleFields.value.map((field) => ({ ...field, messages: withoutRefreshPasskeyMismatch(field.messages) }))
    : visibleFields.value
)
const formActions = computed(() =>
  hasRefreshPasskeyMismatch.value
    ? orderedLoginActions.value.map((item) => ({ ...item, messages: withoutRefreshPasskeyMismatch(item.messages) }))
    : orderedLoginActions.value
)

function setFieldValue(name: string, value: string) {
  fieldValues[name] = value
}
</script>

<template>
  <AuthPageShell
    :title="loginTitle"
    :loading="loading"
    :load-error="loadError"
    @restart="restartFlow"
  >
    <KratosAuthForm
      ref="authForm"
      :action="action"
      :method="method"
      :hidden-fields="hiddenFields"
      :messages="formMessages"
      :fields="formFields"
      :actions="formActions"
      :values="fieldValues"
      :errors="fieldErrors"
      :ready="isReady"
      :busy="passkeyBusy"
      :promote-shortcut="!hasRefreshPasskeyMismatch"
      :alternatives-label="alternativesLabel"
      :fallback-submit-label="submitLabel || t('auth.login.submit')"
      @submit="handleSubmit"
      @trigger="handleActionClick"
      @update:value="setFieldValue"
    >
      <template v-if="hasRefreshPasskeyMismatch" #notice>
        <!-- The passkey could not confirm the account: say what happened and offer the way that works. -->
        <div class="grid min-w-0 gap-3" role="alert" data-testid="login-refresh-passkey-mismatch">
          <div class="flex min-w-0 items-start gap-2 text-sm">
            <CircleAlert class="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
            <div class="grid min-w-0 gap-1">
              <p class="font-medium text-amber-800 dark:text-amber-300">{{ t("auth.login.refreshPasskey.mismatchTitle") }}</p>
              <p class="text-muted-foreground [overflow-wrap:anywhere]">{{ t("auth.login.refreshPasskey.mismatchDescription") }}</p>
            </div>
          </div>
          <Button type="button" size="lg" class="w-full" :disabled="reloginBusy" @click="signOutAndSignInAgain">
            <Loader2 v-if="reloginBusy" class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            {{ t("auth.login.refreshPasskey.relogin") }}
          </Button>
        </div>
      </template>
    </KratosAuthForm>

    <template v-if="!loading && (loginStep === 'password' || hasPasswordField)" #footer>
      <p v-if="loginStep === 'password'">
        {{ t("auth.login.noAccount") }}
        <router-link :to="registerLink" class="font-medium text-foreground underline-offset-4 hover:underline">
          {{ t("auth.login.registerLink") }}
        </router-link>
      </p>
      <router-link v-if="hasPasswordField" to="/user/recovery" class="underline-offset-4 hover:text-foreground hover:underline">
        {{ t("auth.login.forgotPassword") }}
      </router-link>
    </template>
  </AuthPageShell>
</template>
