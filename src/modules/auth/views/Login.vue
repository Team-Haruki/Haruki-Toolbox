<script setup lang="ts">
import { computed, ref } from "vue"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, LogIn, LogOut, Mail, Lock, KeyRound, Info, CircleAlert } from "lucide-vue-next"
import {
  isPasskeyAction,
  orderKratosActions,
  type KratosActionRole,
  type KratosActionVariant,
} from "@/modules/auth/lib/action-hierarchy"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
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
import KratosFlowMessages from "@/modules/auth/components/KratosFlowMessages.vue"
import KratosFieldInput from "@/modules/auth/components/KratosFieldInput.vue"
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

function actionIcon(action: LoginAction) {
  if (isPasskeyAction(action)) {
    return KeyRound
  }
  return LogIn
}

// The subtitle names the step: email + password, the second factor, or a
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
const loginDescription = computed(() => {
  switch (loginStep.value) {
    case "mfa":
      return t("auth.login.descriptionMfa")
    case "refresh":
      return t("auth.login.descriptionRefresh")
    default:
      return t("auth.login.description")
  }
})

const formElement = ref<HTMLFormElement | null>(null)
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
  const form = formElement.value
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

function iconForField(name: string) {
  if (name === "identifier" || name.endsWith("email")) {
    return Mail
  }

  if (name.toLowerCase().includes("password")) {
    return Lock
  }

  return KeyRound
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
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center gap-4 px-0 py-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-xl flex items-center justify-center gap-2">
          <LogIn class="h-6 w-6" />
          {{ t("auth.login.title") }}
        </CardTitle>
        <CardDescription>
          {{ loginDescription }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          v-if="loginReasonText"
          class="mb-4 flex items-start gap-2 rounded-md border border-blue-300 border-l-4 border-l-blue-500 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-900/40 dark:border-l-blue-400 dark:bg-blue-900/20 dark:text-blue-300"
          role="status"
        >
          <Info class="mt-0.5 h-4 w-4 shrink-0" />
          <span>{{ loginReasonText }}</span>
        </div>
        <div v-if="loading" class="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {{ t("auth.common.loadingFlow") }}
        </div>
        <div v-else-if="loadError" class="space-y-4">
          <p class="text-sm text-destructive">{{ loadError }}</p>
          <Button class="w-full" @click="restartFlow">
            <LogIn class="mr-2 h-4 w-4" />
            {{ t("auth.common.restartFlow") }}
          </Button>
        </div>
        <form v-else ref="formElement" :action="action" :method="method" novalidate @submit="handleSubmit">
          <div class="grid gap-6">
            <input v-for="field in hiddenFields" :key="field.key" type="hidden" :name="field.name" :value="field.value" />

            <KratosFlowMessages :messages="withoutRefreshPasskeyMismatch(generalMessages)" />

            <div
              v-if="hasRefreshPasskeyMismatch"
              class="space-y-3 rounded-md border border-amber-300 border-l-4 border-l-amber-500 bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:border-l-amber-400 dark:bg-amber-900/20 dark:text-amber-200"
              role="alert"
              data-testid="login-refresh-passkey-mismatch"
            >
              <div class="flex items-start gap-2">
                <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" />
                <div class="space-y-1">
                  <p class="font-medium">{{ t("auth.login.refreshPasskey.mismatchTitle") }}</p>
                  <p>{{ t("auth.login.refreshPasskey.mismatchDescription") }}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                class="w-full bg-background"
                :disabled="reloginBusy"
                @click="signOutAndSignInAgain"
              >
                <Loader2 v-if="reloginBusy" class="mr-2 h-4 w-4 animate-spin" />
                <LogOut v-else class="mr-2 h-4 w-4" />
                {{ t("auth.login.refreshPasskey.relogin") }}
              </Button>
            </div>

            <div v-for="(field, index) in visibleFields" :key="field.key" class="grid gap-2">
              <div class="flex items-center">
                <Label :for="field.key">{{ field.label }}</Label>
                <router-link
                  v-if="field.name.toLowerCase().includes('password')"
                  to="/user/recovery"
                  class="ml-auto text-sm underline-offset-4 hover:underline"
                >
                  {{ t("auth.login.forgotPassword") }}
                </router-link>
              </div>
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
              <KratosFlowMessages :messages="withoutRefreshPasskeyMismatch(field.messages)" />
            </div>

            <div v-if="orderedLoginActions.length > 0" class="space-y-2">
              <div v-for="actionItem in orderedLoginActions" :key="actionItem.key" class="space-y-1">
                <Button
                  :type="actionItem.kind === 'submit' ? 'submit' : 'button'"
                  class="w-full"
                  :variant="actionItem.variant"
                  :data-kratos-role="actionItem.role"
                  :name="actionItem.name || undefined"
                  :value="actionItem.value || undefined"
                  :data-kratos-submit="actionItem.kind === 'submit' ? actionItem.key : undefined"
                  :disabled="!isReady || actionItem.disabled || passkeyBusy"
                  @click="handleActionClick(actionItem)"
                >
                  <component :is="actionIcon(actionItem)" class="h-4 w-4 mr-2" />
                  {{ actionItem.label }}
                </Button>
                <KratosFlowMessages :messages="withoutRefreshPasskeyMismatch(actionItem.messages)" />
              </div>
            </div>
            <Button v-else type="submit" class="w-full" :disabled="!isReady">
              <LogIn class="h-4 w-4 mr-2" />
              {{ submitLabel || t("auth.login.submit") }}
            </Button>
            <div class="text-center text-sm">
              {{ t("auth.login.noAccount") }}
              <router-link :to="registerLink" class="underline underline-offset-4">
                {{ t("auth.login.registerLink") }}
              </router-link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
