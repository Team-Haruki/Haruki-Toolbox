<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { Eye, EyeOff } from "lucide-vue-next"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import KratosFlowMessages from "@/modules/auth/components/KratosFlowMessages.vue"
import type { KratosFlowMessage } from "@/modules/auth/composables/useKratosBrowserFlow"

// One Kratos text input: its label above it, a password visibility toggle,
// the inline "required" error, the messages Kratos attached to the node, and
// programmatic focus for the first field so the form is usable from the
// keyboard right after the flow renders. The input keeps the node's own id,
// name and autocomplete: password managers and passkey autofill look for them.
const props = withDefaults(defineProps<{
  id: string
  name: string
  type: string
  label: string
  autocomplete?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  error?: string
  messages?: KratosFlowMessage[]
  autofocus?: boolean
  /** `lg` is the sign-in family's 40 px field; `default` the settings one. */
  size?: "default" | "lg"
}>(), {
  autocomplete: undefined,
  required: false,
  disabled: false,
  placeholder: undefined,
  error: undefined,
  messages: () => [],
  autofocus: false,
  size: "default",
})

const modelValue = defineModel<string>({ default: "" })
const { t } = useI18n()

const isPassword = computed(() => props.type === "password")
const revealed = ref(false)
const inputType = computed(() => (isPassword.value && revealed.value ? "text" : props.type))
const errorId = computed(() => `${props.id}-error`)
const messagesId = computed(() => `${props.id}-messages`)
const hasErrorMessage = computed(() => props.messages.some((message) => message.tone === "error"))
const describedBy = computed(() => {
  const ids = [props.error ? errorId.value : "", props.messages.length > 0 ? messagesId.value : ""].filter((id) => id !== "")
  return ids.length > 0 ? ids.join(" ") : undefined
})
const inputRef = ref<InstanceType<typeof Input> | null>(null)

function focusInput() {
  const element = (inputRef.value?.$el ?? null) as HTMLInputElement | null
  element?.focus?.()
}

onMounted(() => {
  if (props.autofocus) {
    void nextTick(focusInput)
  }
})

watch(
  () => props.autofocus,
  (autofocus) => {
    if (autofocus) {
      void nextTick(focusInput)
    }
  },
)
</script>

<template>
  <div class="grid min-w-0 gap-1.5">
    <Label :for="id">{{ label }}</Label>
    <div class="relative w-full">
      <Input
        :id="id"
        ref="inputRef"
        v-model="modelValue"
        :name="name"
        :type="inputType"
        :autocomplete="autocomplete || undefined"
        :required="required"
        :disabled="disabled"
        :placeholder="placeholder || undefined"
        :aria-invalid="error || hasErrorMessage ? 'true' : undefined"
        :aria-describedby="describedBy"
        :class="[size === 'lg' ? 'h-10' : '', isPassword ? 'pr-10' : '']"
      />
      <button
        v-if="isPassword"
        type="button"
        class="absolute inset-y-0 end-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :aria-label="revealed ? t('auth.password.hide') : t('auth.password.show')"
        :aria-pressed="revealed ? 'true' : 'false'"
        :disabled="disabled"
        @click="revealed = !revealed"
      >
        <EyeOff v-if="revealed" class="size-4" />
        <Eye v-else class="size-4" />
      </button>
    </div>
    <p v-if="error" :id="errorId" class="min-w-0 text-xs text-destructive [overflow-wrap:anywhere]" role="alert">{{ error }}</p>
    <KratosFlowMessages :id="messagesId" :messages="messages" variant="field" />
  </div>
</template>
