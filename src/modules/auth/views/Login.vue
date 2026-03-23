<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, LogIn, Mail, Lock, KeyRound, LucideAlertTriangle } from "lucide-vue-next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
import { useKratosBrowserFlow } from "@/modules/auth/composables/useKratosBrowserFlow"
import { getKratosPublicUrl } from "@/modules/auth/lib/kratos"
import KratosFlowMessages from "@/modules/auth/components/KratosFlowMessages.vue"
import { resolveSafeRedirectTarget } from "@/core/router/navigation"

const route = useRoute()
const { t } = useI18n()

function resolveKratosOrigin(): string {
  if (typeof window === "undefined") {
    return ""
  }

  try {
    return new URL(getKratosPublicUrl(), window.location.origin).origin
  } catch {
    return ""
  }
}

function resolveLoginRedirectPath(): string {
  return resolveSafeRedirectTarget(route.query.redirect) ?? "/"
}

function resolveLoginReturnTo(): string {
  const redirectPath = resolveLoginRedirectPath()
  if (typeof window === "undefined") {
    return redirectPath
  }

  const url = new URL(redirectPath, window.location.origin)
  url.searchParams.set("_login_success", "1")
  return url.toString()
}

function parseReturnToUrl(value: string): URL | null {
  if (typeof window === "undefined") {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  try {
    return new URL(trimmed, window.location.origin)
  } catch {
    return null
  }
}

function isAllowedFlowReturnTo(value: string, depth = 0): boolean {
  if (typeof window === "undefined" || depth > 4) {
    return false
  }

  const parsed = parseReturnToUrl(value)
  if (!parsed) {
    return false
  }

  if (parsed.origin === window.location.origin) {
    return true
  }

  const kratosOrigin = resolveKratosOrigin()
  if (
    kratosOrigin !== ""
    && parsed.origin === kratosOrigin
    && parsed.pathname.startsWith("/self-service/")
  ) {
    const nested = parsed.searchParams.get("return_to")
    return nested ? isAllowedFlowReturnTo(nested, depth + 1) : true
  }

  return false
}

const {
  loading,
  loadError,
  fieldValues,
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
} = useKratosBrowserFlow("login", {
  getReturnTo: () => resolveLoginReturnTo(),
})

const hasForcedSafeReturnTo = ref(false)

watch(
  [loading, loadError, flowReturnTo],
  ([isLoading, error, returnTo]) => {
    if (isLoading || error || hasForcedSafeReturnTo.value) {
      return
    }

    const normalizedReturnTo = returnTo.trim()
    if (!normalizedReturnTo) {
      return
    }

    if (isAllowedFlowReturnTo(normalizedReturnTo)) {
      return
    }

    hasForcedSafeReturnTo.value = true
    toast.warning(t("auth.toast.invalidReturnToTitle"), {
      description: t("auth.toast.invalidReturnToDescription"),
    })
    restartFlow()
  },
  { immediate: true }
)

type LoginActionKind = "submit" | "trigger"

interface LoginAction {
  key: string
  group: string
  name: string
  value: string
  label: string
  disabled: boolean
  kind: LoginActionKind
  messages: {
    key: string
    text: string
    tone: "info" | "success" | "error" | "warning"
  }[]
  onClickTrigger: string
}

function isSocialAction(action: { group: string; name: string }): boolean {
  const group = action.group.trim().toLowerCase()
  const name = action.name.trim().toLowerCase()
  return group === "oidc" || group === "saml" || name === "provider"
}

function isPasskeyAction(action: { group: string; name: string; value: string }): boolean {
  const signature = `${action.group} ${action.name} ${action.value}`.trim().toLowerCase()
  return signature.includes("passkey") || signature.includes("webauthn")
}

function actionPriority(action: { group: string; name: string; value: string }): number {
  if (isSocialAction(action)) {
    return 30
  }

  if (isPasskeyAction(action)) {
    return 8
  }

  const value = action.value.trim().toLowerCase()
  if (
    value === "password"
    || value === "code"
    || value === "totp"
    || value === "lookup_secret"
    || value === "passkey"
    || value === "webauthn"
  ) {
    return 10
  }

  return 20
}

const orderedSubmitFields = computed(() =>
  submitFields.value
    .map((submit, index) => ({ submit, index }))
    .sort((left, right) => {
      const priorityDiff = actionPriority(left.submit) - actionPriority(right.submit)
      if (priorityDiff !== 0) {
        return priorityDiff
      }

      return left.index - right.index
    })
    .map((entry) => entry.submit)
)

const orderedLoginActions = computed<LoginAction[]>(() => {
  const submitActions = orderedSubmitFields.value.map((submit) => ({
    key: submit.key,
    group: submit.group,
    name: submit.name,
    value: submit.value,
    label: submit.label,
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
    disabled: field.disabled,
    kind: "trigger" as const,
    messages: field.messages,
    onClickTrigger: field.onClickTrigger,
  }))

  return [...submitActions, ...triggerActions]
    .map((action, index) => ({ action, index }))
    .sort((left, right) => {
      const priorityDiff = actionPriority(left.action) - actionPriority(right.action)
      if (priorityDiff !== 0) {
        return priorityDiff
      }
      return left.index - right.index
    })
    .map((entry) => entry.action)
})

function actionVariant(action: LoginAction): "default" | "outline" {
  return isSocialAction(action) ? "outline" : "default"
}

function actionIcon(action: LoginAction) {
  if (isPasskeyAction(action)) {
    return KeyRound
  }
  return LogIn
}

function handleActionClick(action: LoginAction) {
  if (action.kind !== "trigger") {
    return
  }

  invokeVisibleFieldAction({ onClickTrigger: action.onClickTrigger })
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
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center gap-4 px-0 py-4">
    <Alert variant="destructive" class="w-full max-w-md bg-destructive/10 text-destructive border-destructive/20">
      <LucideAlertTriangle class="h-4 w-4 shrink-0 mt-0.5" />
      <div class="space-y-1 w-full">
        <AlertTitle>{{ t("auth.login.incidentAlert.title") }}</AlertTitle>
        <AlertDescription class="space-y-1.5 leading-relaxed mt-2">
          <p>{{ t("auth.login.incidentAlert.description1") }}</p>
          <p>{{ t("auth.login.incidentAlert.description2") }}</p>
        </AlertDescription>
      </div>
    </Alert>

    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-xl flex items-center justify-center gap-2">
          <LogIn class="h-6 w-6" />
          {{ t("auth.login.title") }}
        </CardTitle>
        <CardDescription>
          {{ t("auth.login.description") }}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
        <form v-else :action="action" :method="method" novalidate>
          <div class="grid gap-6">
            <input v-for="field in hiddenFields" :key="field.key" type="hidden" :name="field.name" :value="field.value" />

            <KratosFlowMessages :messages="generalMessages" />

            <div v-for="field in visibleFields" :key="field.key" class="grid gap-2">
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
              <div class="relative w-full items-center">
                <template v-if="field.type === 'button'">
                <Button
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
                </template>
                <template v-else>
                  <Input
                    :id="field.key"
                  :name="field.name"
                  :type="field.type"
                  :autocomplete="field.autocomplete || undefined"
                  :required="field.required"
                  :disabled="field.disabled"
                    class="pl-10"
                    v-model="fieldValues[field.name]"
                  />
                  <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                    <component :is="iconForField(field.name)" class="size-4 text-muted-foreground" />
                  </span>
                </template>
              </div>
              <KratosFlowMessages :messages="field.messages" />
            </div>

            <div v-if="orderedLoginActions.length > 0" class="space-y-2">
              <div v-for="actionItem in orderedLoginActions" :key="actionItem.key" class="space-y-1">
                <Button
                  :type="actionItem.kind === 'submit' ? 'submit' : 'button'"
                  class="w-full"
                  :variant="actionVariant(actionItem)"
                  :name="actionItem.name || undefined"
                  :value="actionItem.value || undefined"
                  :disabled="!isReady || actionItem.disabled"
                  @click="handleActionClick(actionItem)"
                >
                  <component :is="actionIcon(actionItem)" class="h-4 w-4 mr-2" />
                  {{ actionItem.label }}
                </Button>
                <KratosFlowMessages :messages="actionItem.messages" />
              </div>
            </div>
            <Button v-else type="submit" class="w-full" :disabled="!isReady">
              <LogIn class="h-4 w-4 mr-2" />
              {{ submitLabel || t("auth.login.submit") }}
            </Button>
            <div class="text-center text-sm">
              {{ t("auth.login.noAccount") }}
              <router-link to="/user/register" class="underline underline-offset-4">
                {{ t("auth.login.registerLink") }}
              </router-link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
