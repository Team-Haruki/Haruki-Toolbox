<script setup lang="ts">
import { computed, toRef } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useI18n } from "vue-i18n"
import type { SekaiRegion } from "@/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCharacterOptions } from "../composables/useCharacterOptions"

const props = defineProps<{
  modelValue: string | null
  region: SekaiRegion
  disabled?: boolean
  allowedCharacterIds?: readonly number[] | null
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string | null]
}>()

const { t } = useI18n()
const regionRef = toRef(props, "region")
const { options, loading } = useCharacterOptions(regionRef)
const selectedValue = computed(() => props.modelValue ?? "")
const filteredOptions = computed(() => {
  if (!props.allowedCharacterIds) {
    return options.value
  }

  const allowedIds = new Set(props.allowedCharacterIds)
  return options.value.filter((option) => allowedIds.has(option.id))
})

function handleUpdate(value: AcceptableValue) {
  emit("update:modelValue", typeof value === "string" && value ? value : null)
}
</script>

<template>
  <Select :model-value="selectedValue" :disabled="props.disabled || loading" @update:model-value="handleUpdate">
    <SelectTrigger class="w-full">
      <SelectValue :placeholder="loading ? t('deckRecommend.select.loading') : t('deckRecommend.form.characterPlaceholder')" />
    </SelectTrigger>
    <SelectContent class="max-h-72">
      <SelectItem v-for="option in filteredOptions" :key="option.id" :value="option.value">
        <img :src="option.iconUrl" :alt="option.label" class="size-6 rounded-sm object-cover" loading="lazy">
        <span class="truncate">{{ option.label }}</span>
      </SelectItem>
    </SelectContent>
  </Select>
</template>
