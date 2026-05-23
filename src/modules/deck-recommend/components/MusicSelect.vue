<script setup lang="ts">
import { computed, toRef } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useI18n } from "vue-i18n"
import type { SekaiRegion } from "@/types"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMusicOptions } from "../composables/useMusicOptions"

const props = defineProps<{
  modelValue: string | null
  difficultyValue: string | null
  region: SekaiRegion
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string | null]
  "update:difficultyValue": [value: string | null]
}>()

const { t } = useI18n()
const regionRef = toRef(props, "region")
const selectedMusicId = computed(() => props.modelValue)
const { options, difficultyOptions, loading } = useMusicOptions(regionRef, selectedMusicId)
const selectedValue = computed(() => props.modelValue ?? "")
const selectedDifficulty = computed(() => props.difficultyValue ?? "")
const comboboxOptions = computed<ComboboxOption[]>(() =>
  options.value.map((option) => ({
    value: option.value,
    label: option.label,
    tags: [
      {
        label: `#${option.id}`,
        class: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-200",
      },
    ],
    keywords: [
      String(option.id),
      `#${option.id}`,
      option.seq ? String(option.seq) : "",
      option.pronunciation ?? "",
      option.assetbundleName ?? "",
    ],
  })),
)

function handleMusicUpdate(value: string | null) {
  emit("update:modelValue", value || null)
  emit("update:difficultyValue", null)
}

function handleDifficultyUpdate(value: AcceptableValue) {
  emit("update:difficultyValue", typeof value === "string" && value ? value : null)
}
</script>

<template>
  <div class="grid gap-3 md:grid-cols-2">
    <Combobox
      :model-value="selectedValue"
      :options="comboboxOptions"
      :disabled="props.disabled || loading"
      :clearable="false"
      :placeholder="loading ? t('deckRecommend.select.loading') : t('deckRecommend.form.musicPlaceholder')"
      :search-placeholder="t('deckRecommend.form.musicSearchPlaceholder')"
      :empty-text="t('deckRecommend.form.musicEmpty')"
      @update:model-value="handleMusicUpdate"
    />

    <Select
      :model-value="selectedDifficulty"
      :disabled="props.disabled || !props.modelValue || difficultyOptions.length === 0"
      @update:model-value="handleDifficultyUpdate"
    >
      <SelectTrigger class="w-full">
        <SelectValue :placeholder="t('deckRecommend.form.difficultyPlaceholder')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="option in difficultyOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
