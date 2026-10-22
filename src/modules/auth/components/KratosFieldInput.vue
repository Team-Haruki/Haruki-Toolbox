<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, type Component } from "vue"
import { useI18n } from "vue-i18n"
import { Eye, EyeOff } from "lucide-vue-next"
import { Input } from "@/components/ui/input"

// One Kratos text input: leading icon, optional password visibility toggle,
// inline required error, and programmatic focus for the first field so the
// form is usable from the keyboard right after the flow renders.
const props = defineProps<{
  id: string
  name: string
  type: string
  icon: Component
  autocomplete?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  error?: string
  autofocus?: boolean
}>()

const modelValue = defineModel<string>({ default: "" })
const { t } = useI18n()

const isPassword = computed(() => props.type === "password")
const revealed = ref(false)
const inputType = computed(() => (isPassword.value && revealed.value ? "text" : props.type))
const errorId = computed(() => `${props.id}-error`)
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
  <div class="grid gap-1.5">
    <div class="relative w-full items-center">
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
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? errorId : undefined"
        :class="['pl-10', isPassword ? 'pr-10' : '']"
      />
      <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
        <component :is="icon" class="size-4 text-muted-foreground" />
      </span>
      <button
        v-if="isPassword"
        type="button"
        class="absolute end-0 inset-y-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-md"
        :aria-label="revealed ? t('auth.password.hide') : t('auth.password.show')"
        :aria-pressed="revealed ? 'true' : 'false'"
        :disabled="disabled"
        @click="revealed = !revealed"
      >
        <EyeOff v-if="revealed" class="size-4" />
        <Eye v-else class="size-4" />
      </button>
    </div>
    <p v-if="error" :id="errorId" class="text-xs text-destructive" role="alert">{{ error }}</p>
  </div>
</template>
