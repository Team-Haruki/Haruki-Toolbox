<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, MailCheck, Mail, KeyRound } from "lucide-vue-next"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
import { useKratosBrowserFlow } from "@/modules/auth/composables/useKratosBrowserFlow"
import KratosFlowMessages from "@/modules/auth/components/KratosFlowMessages.vue"

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
        <form v-else :action="action" :method="method" class="space-y-4" novalidate>
          <input v-for="field in hiddenFields" :key="field.key" type="hidden" :name="field.name" :value="field.value" />

          <KratosFlowMessages :messages="generalMessages" />

          <div v-for="field in visibleFields" :key="field.key" class="grid gap-2">
            <Label :for="field.key">{{ field.label }}</Label>
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

          <div v-if="buttonFields.length > 0" class="space-y-2">
            <div v-for="field in buttonFields" :key="field.key" class="space-y-1">
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
              <KratosFlowMessages :messages="field.messages" />
            </div>
          </div>

          <div v-if="submitFields.length > 0" class="space-y-2">
            <div v-for="submit in submitFields" :key="submit.key" class="space-y-1">
              <Button
                type="submit"
                class="w-full"
                :name="submit.name || undefined"
                :value="submit.value || undefined"
                :disabled="!isReady || submit.disabled"
              >
                <MailCheck class="mr-2 h-4 w-4" />
                {{ submit.label }}
              </Button>
              <KratosFlowMessages :messages="submit.messages" />
            </div>
          </div>
          <Button v-else type="submit" class="w-full" :disabled="!isReady">
            <MailCheck class="mr-2 h-4 w-4" />
            {{ submitLabel || t("auth.verification.submit") }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
