<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

const { t, locale } = useI18n()
const localeKey = computed(() => locale.value)

defineProps<{
  title: string
  description: string
  options: SelectOption[]
  placeholder?: string
  modelValue: string
}>()

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void
}>()

function onValueChange(value: string) {
  emit("update:modelValue", value)
}
</script>

<template>
  <Card>
    <CardHeader class="pb-1">
      <CardTitle class="text-base flex items-center gap-2">
        <slot name="icon" />
        {{ title }}
      </CardTitle>
      <CardDescription class="whitespace-pre-line">{{ description }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <Select :key="`ios-select-${localeKey}`" :model-value="modelValue" @update:model-value="onValueChange">
        <SelectTrigger class="w-full">
          <SelectValue
            :key="`ios-select-value-${localeKey}`"
            :placeholder="placeholder || t('tools.iosModules.common.selectPlaceholder')"
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="opt in options"
            :key="opt.value"
            :value="opt.value"
            :disabled="opt.disabled"
          >
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <slot />
    </CardContent>
  </Card>
</template>
