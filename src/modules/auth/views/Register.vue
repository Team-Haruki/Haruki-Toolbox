<script setup lang="ts">
import { computed } from "vue"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, UserPlus, Mail, User, Lock, KeyRound } from "lucide-vue-next"
import { useKratosActionList } from "@/modules/auth/composables/useKratosActionList"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
import { useKratosBrowserFlow } from "@/modules/auth/composables/useKratosBrowserFlow"
import { useFlowReturnToGuard } from "@/modules/auth/composables/useFlowReturnToGuard"
import {
  buildAuthPageLink,
  buildFlowReturnTo,
  resolveAuthPageRedirect,
  resolveBrowserOrigin,
} from "@/modules/auth/lib/return-to"
import KratosFlowMessages from "@/modules/auth/components/KratosFlowMessages.vue"
import KratosFieldInput from "@/modules/auth/components/KratosFieldInput.vue"

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

function iconForField(name: string) {
  if (name.endsWith("email")) {
    return Mail
  }

  if (name.toLowerCase().includes("name")) {
    return User
  }

  if (name.toLowerCase().includes("password")) {
    return Lock
  }

  return KeyRound
}

const isReady = computed(() => !loading.value && !loadError.value && action.value !== "")

// One primary ("下一步" / "注册"); passkey and social are outline, Back is ghost.
const orderedActions = useKratosActionList(submitFields, buttonFields)

function actionIcon(role: string) {
  switch (role) {
    case "passkey":
      return KeyRound
    case "back":
      return ArrowLeft
    case "social":
      return null
    default:
      return UserPlus
  }
}

function handleSubmit(event: Event) {
  if (!validateVisibleFields(event)) {
    event.preventDefault()
  }
}
</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-xl flex items-center justify-center gap-2">
          <UserPlus class="h-6 w-6" />
          {{ t("auth.register.title") }}
        </CardTitle>
        <CardDescription>{{ t("auth.register.description") }}</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {{ t("auth.common.loadingFlow") }}
        </div>
        <div v-else-if="loadError" class="space-y-4">
          <p class="text-sm text-destructive">{{ loadError }}</p>
          <Button class="w-full" @click="restartFlow">
            <UserPlus class="mr-2 h-4 w-4" />
            {{ t("auth.common.restartFlow") }}
          </Button>
        </div>
        <form v-else class="grid gap-6" :action="action" :method="method" novalidate @submit="handleSubmit">
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
                <component :is="actionIcon(item.role)" v-if="actionIcon(item.role)" class="size-4" />
                {{ item.label }}
              </Button>
              <KratosFlowMessages :messages="item.messages" />
            </div>
          </div>
          <Button v-else type="submit" class="w-full" :disabled="!isReady">
            <UserPlus class="h-4 w-4 mr-2" />
            {{ submitLabel || t("auth.register.submit") }}
          </Button>
          <div class="text-center text-sm">
            {{ t("auth.register.hasAccount") }}
            <router-link :to="loginLink" class="underline underline-offset-4">
              {{ t("auth.register.goLogin") }}
            </router-link>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
