<script setup lang="ts">
import type {HTMLAttributes} from "vue"
import {ref} from "vue"
import {useVModel} from "@vueuse/core"
import {cn} from "@/lib/utils"
import {Eye, EyeOff} from "lucide-vue-next"
import {useI18n} from "vue-i18n"

const props = defineProps<{
  id?: string
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes["class"]
  type?: string
  placeholder?: string
  disabled?: boolean
}>()

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void
}>()

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

const showPassword = ref(false)
const { t } = useI18n()
</script>

<template>
  <div class="relative w-full">
    <input
        v-model="modelValue"
        :id="props.id"
        :type="showPassword ? 'text' : (props.type || 'text')"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        data-slot="input"
        :class="cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 pr-9 text-base shadow-xs transition-[color,box-shadow] outline-none pointer-coarse:min-h-10 pointer-coarse:pr-10 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        props.class,
      )"
    />

    <!-- Eye toggle: fills the field's full height and a 36 px (40 px on touch)
         column on its right, so the hit box is the whole corner, not the 16 px icon. -->
    <button
        type="button"
        :disabled="props.disabled"
        :aria-pressed="showPassword"
        :aria-label="showPassword ? t('common.hidePassword') : t('common.showPassword')"
        class="absolute inset-y-0 right-0 inline-flex w-9 items-center justify-center rounded-r-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset disabled:pointer-events-none disabled:opacity-50 pointer-coarse:w-10"
        @click="showPassword = !showPassword"
    >
      <Eye v-if="!showPassword" class="h-4 w-4" aria-hidden="true"/>
      <EyeOff v-else class="h-4 w-4" aria-hidden="true"/>
    </button>
  </div>
</template>
