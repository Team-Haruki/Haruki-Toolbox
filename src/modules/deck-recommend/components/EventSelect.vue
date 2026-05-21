<script setup lang="ts">
import { computed, toRef, watch } from "vue"
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
import { useEventOptions } from "../composables/useEventOptions"
import { resolveDefaultEventOption } from "../lib/master-options"

const props = defineProps<{
  modelValue: string | null
  region: SekaiRegion
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string | null]
}>()

const { t } = useI18n()
const regionRef = toRef(props, "region")
const { options, loading } = useEventOptions(regionRef)
const selectedValue = computed(() => props.modelValue ?? "")

watch(
  options,
  (nextOptions) => {
    if (props.modelValue || nextOptions.length === 0) {
      return
    }

    emit("update:modelValue", resolveDefaultEventOption(nextOptions)?.value ?? null)
  },
  { immediate: true },
)

function handleUpdate(value: AcceptableValue) {
  emit("update:modelValue", typeof value === "string" && value ? value : null)
}

function resolveEventTypeLabel(eventType: string) {
  switch (eventType) {
    case "marathon":
      return t("deckRecommend.eventTypes.marathon")
    case "cheerful_carnival":
      return t("deckRecommend.eventTypes.cheerfulCarnival")
    case "world_bloom":
      return t("deckRecommend.eventTypes.worldBloom")
    default:
      return eventType
  }
}
</script>

<template>
  <Select :model-value="selectedValue" :disabled="props.disabled || loading" @update:model-value="handleUpdate">
    <SelectTrigger class="w-full">
      <SelectValue :placeholder="loading ? t('deckRecommend.select.loading') : t('deckRecommend.form.eventPlaceholder')" />
    </SelectTrigger>
    <SelectContent class="max-h-72">
      <SelectItem v-for="option in options" :key="option.id" :value="option.value">
        <span class="truncate">{{ option.label }}</span>
        <span v-if="option.eventType" class="text-xs text-muted-foreground">{{ resolveEventTypeLabel(option.eventType) }}</span>
      </SelectItem>
    </SelectContent>
  </Select>
</template>
