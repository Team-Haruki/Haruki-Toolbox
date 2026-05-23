<script setup lang="ts">
import { computed, toRef, watch } from "vue"
import { useI18n } from "vue-i18n"
import type { SekaiRegion } from "@/types"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { useEventOptions } from "../composables/useEventOptions"
import { resolveDefaultEventOption } from "../lib/master-options"

const props = defineProps<{
  modelValue: string | null
  eventType?: string | null
  region: SekaiRegion
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string | null]
  "update:eventType": [value: string | null]
}>()

const { t } = useI18n()
const regionRef = toRef(props, "region")
const { options, loading } = useEventOptions(regionRef)
const selectedValue = computed(() => props.modelValue ?? "")
const selectedOption = computed(() =>
  options.value.find((option) => option.value === props.modelValue) ?? null,
)
const comboboxOptions = computed<ComboboxOption[]>(() =>
  options.value.map((option) => ({
    value: option.value,
    label: option.label,
    tags: [
      {
        label: `#${option.id}`,
        class: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-200",
      },
      {
        label: resolveEventTypeLabel(option.eventType),
        class: resolveEventTypeTagClass(option.eventType),
      },
    ],
    keywords: [
      String(option.id),
      `#${option.id}`,
      option.eventType ?? "",
      resolveEventTypeLabel(option.eventType),
      option.startAt ? formatSearchDate(option.startAt) : "",
      option.assetbundleName ?? "",
    ],
  })),
)

watch(
  options,
  (nextOptions) => {
    if (props.modelValue || nextOptions.length === 0) {
      return
    }

    const defaultOption = resolveDefaultEventOption(nextOptions)
    emit("update:modelValue", defaultOption?.value ?? null)
    emit("update:eventType", defaultOption?.eventType ?? null)
  },
  { immediate: true },
)

watch(
  selectedOption,
  (option) => {
    emit("update:eventType", option?.eventType ?? null)
  },
  { immediate: true },
)

function handleUpdate(value: string | null) {
  emit("update:modelValue", value || null)
}

function resolveEventTypeLabel(eventType: string | null | undefined) {
  switch (eventType) {
    case "marathon":
      return t("deckRecommend.eventTypes.marathon")
    case "cheerful_carnival":
      return t("deckRecommend.eventTypes.cheerfulCarnival")
    case "world_bloom":
      return t("deckRecommend.eventTypes.worldBloom")
    default:
      return eventType || t("deckRecommend.eventTypes.unknown")
  }
}

function resolveEventTypeTagClass(eventType: string | null) {
  switch (eventType) {
    case "marathon":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-200"
    case "cheerful_carnival":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200"
    case "world_bloom":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200"
    default:
      return "border-muted bg-muted/70 text-muted-foreground"
  }
}

function formatSearchDate(value: number) {
  return new Date(value).toISOString().slice(0, 10)
}
</script>

<template>
  <Combobox
    :model-value="selectedValue"
    :options="comboboxOptions"
    :disabled="props.disabled || loading"
    :clearable="false"
    :placeholder="loading ? t('deckRecommend.select.loading') : t('deckRecommend.form.eventPlaceholder')"
    :search-placeholder="t('deckRecommend.form.eventSearchPlaceholder')"
    :empty-text="t('deckRecommend.form.eventEmpty')"
    @update:model-value="handleUpdate"
  />
</template>
