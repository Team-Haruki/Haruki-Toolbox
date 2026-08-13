<script setup lang="ts">
import { computed } from "vue"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type SimpleSelectOption = {
  value: string
  label: string
  /** Optional leading icon (e.g. a character avatar) shown in the option and trigger. */
  iconUrl?: string | null
}

const props = withDefaults(defineProps<{
  modelValue: string
  options: readonly SimpleSelectOption[]
  placeholder?: string
  disabled?: boolean
  ariaLabel?: string
  size?: "sm" | "default"
  /** Extra classes for the trigger button (e.g. width constraints). */
  triggerClass?: string
}>(), {
  placeholder: "",
  disabled: false,
  ariaLabel: undefined,
  size: "default",
  triggerClass: undefined,
})

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void
}>()

// reka-ui reserves the empty string for clearing a selection, so a "" option
// value (the common "all" filter) is tunneled through a sentinel instead.
const EMPTY_SENTINEL = "__simple-select-empty__"

function toInternal(value: string): string {
  return value === "" ? EMPTY_SENTINEL : value
}

const internalValue = computed(() => toInternal(props.modelValue))

const selectedOption = computed(() =>
  props.options.find((option) => option.value === props.modelValue) ?? null,
)

function handleUpdate(value: unknown) {
  if (typeof value !== "string") {
    return
  }

  emit("update:modelValue", value === EMPTY_SENTINEL ? "" : value)
}
</script>

<template>
  <Select :model-value="internalValue" :disabled="disabled" @update:model-value="handleUpdate">
    <SelectTrigger :class="triggerClass" :size="size" :aria-label="ariaLabel">
      <SelectValue :placeholder="placeholder">
        <template v-if="selectedOption">
          <img
            v-if="selectedOption.iconUrl"
            :src="selectedOption.iconUrl"
            alt=""
            class="size-5 rounded-sm object-cover"
            loading="lazy"
          >
          <span class="truncate">{{ selectedOption.label }}</span>
        </template>
      </SelectValue>
    </SelectTrigger>
    <SelectContent class="max-h-72">
      <SelectItem
        v-for="option in options"
        :key="option.value"
        :value="toInternal(option.value)"
      >
        <img
          v-if="option.iconUrl"
          :src="option.iconUrl"
          alt=""
          class="size-6 rounded-sm object-cover"
          loading="lazy"
        >
        <span class="truncate">{{ option.label }}</span>
      </SelectItem>
    </SelectContent>
  </Select>
</template>
