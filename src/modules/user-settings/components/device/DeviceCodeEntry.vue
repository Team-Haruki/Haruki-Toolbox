<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { Loader2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Step 1 of the device panel: the code is the one large thing on screen.
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
// No maxlength on the input: the browser would cut a pasted code before the
// formatter (useDeviceAuthorization) strips its spaces and separators and
// caps the cleaned value itself.

// The code field is the only thing to do on this step: focus it on mount
// (the Input primitive forwards the element via its own template ref).
const codeInputRef = ref<InstanceType<typeof Input> | null>(null)
onMounted(() => {
  const element: unknown = codeInputRef.value?.$el
  if (element instanceof HTMLInputElement) {
    element.focus()
  }
})
</script>

<template>
  <form class="grid min-w-0 gap-4 p-4" novalidate @submit.prevent="emit('submit')">
    <div class="grid min-w-0 gap-2">
      <Label :for="CODE_INPUT_ID">{{ t("oauth.device.entry.codeLabel") }}</Label>
      <Input
        :id="CODE_INPUT_ID"
        ref="codeInputRef"
        v-model="code"
        class="h-14 px-2 text-center font-mono text-2xl font-semibold tracking-[0.15em] uppercase tabular-nums placeholder:font-normal placeholder:text-muted-foreground/50 md:text-2xl"
        autocomplete="off"
        autocapitalize="characters"
        autocorrect="off"
        spellcheck="false"
        inputmode="text"
        placeholder="XXXX-XXXX"
        :aria-invalid="errorText ? 'true' : undefined"
        :aria-describedby="errorText ? CODE_ERROR_ID : undefined"
      />
      <p v-if="errorText" :id="CODE_ERROR_ID" role="alert" class="text-sm text-destructive [overflow-wrap:anywhere]">
        {{ errorText }}
      </p>
    </div>
    <Button type="submit" size="lg" class="w-full" :disabled="pending || disabled || code === ''">
      <Loader2 v-if="pending" class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      {{ pending ? t("oauth.device.entry.submitting") : t("oauth.device.entry.submit") }}
    </Button>
  </form>
</template>
