<script setup lang="ts">
import type {HTMLAttributes} from "vue"
import {ref} from "vue"
import {useVModel} from "@vueuse/core"
import {cn} from "@/lib/utils"
import {Eye, EyeOff} from "lucide-vue-next"

const props = defineProps<{
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes["class"]
  type?: string
  placeholder?: string
}>()

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void
}>()

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
})

const showPassword = ref(false)
</script>

<template>
  <div class="relative w-full">
    <input
        v-model="modelValue"
        :type="showPassword ? 'text' : (props.type || 'text')"
        :placeholder="props.placeholder"
        data-slot="input"
        :class="cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        props.class,
      )"
    />

    <!-- 眼睛按钮 -->
    <button
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        @click="showPassword = !showPassword"
    >
      <Eye v-if="!showPassword" class="h-4 w-4"/>
      <EyeOff v-else class="h-4 w-4"/>
    </button>
  </div>
</template>