<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { KeyRound, Loader2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

defineProps<{
  pending: boolean
  disabled: boolean
  errorText: string
}>()

const emit = defineEmits<{
  (e: "submit"): void
}>()

const code = defineModel<string>({ required: true })
const { t } = useI18n()

const CODE_INPUT_ID = "device-user-code"
const CODE_ERROR_ID = "device-user-code-error"
</script>

<template>
  <Card class="w-full max-w-md">
    <form class="flex flex-col gap-6" novalidate @submit.prevent="emit('submit')">
      <CardHeader class="text-center">
        <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <KeyRound class="h-6 w-6 text-primary" />
        </div>
        <CardTitle class="text-xl">{{ t("oauth.device.entry.title") }}</CardTitle>
        <CardDescription>{{ t("oauth.device.entry.description") }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-2">
        <Label :for="CODE_INPUT_ID">{{ t("oauth.device.entry.codeLabel") }}</Label>
        <Input
          :id="CODE_INPUT_ID"
          v-model="code"
          class="h-12 text-center font-mono text-xl tracking-[0.3em] uppercase md:text-xl"
          autocomplete="off"
          autocapitalize="characters"
          autocorrect="off"
          spellcheck="false"
          inputmode="text"
          placeholder="XXXX-XXXX"
          :aria-invalid="errorText ? 'true' : undefined"
          :aria-describedby="errorText ? CODE_ERROR_ID : undefined"
        />
        <p v-if="errorText" :id="CODE_ERROR_ID" role="alert" class="text-sm text-destructive">
          {{ errorText }}
        </p>
        <p v-else class="text-xs text-muted-foreground">{{ t("oauth.device.entry.codeHint") }}</p>
      </CardContent>
      <CardFooter>
        <Button type="submit" class="w-full" :disabled="pending || disabled || code === ''">
          <Loader2 v-if="pending" class="h-4 w-4 mr-2 animate-spin" />
          {{ pending ? t("oauth.device.entry.submitting") : t("oauth.device.entry.submit") }}
        </Button>
      </CardFooter>
    </form>
  </Card>
</template>
