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

function handleMusicUpdate(value: AcceptableValue) {
  emit("update:modelValue", typeof value === "string" && value ? value : null)
  emit("update:difficultyValue", null)
}

function handleDifficultyUpdate(value: AcceptableValue) {
  emit("update:difficultyValue", typeof value === "string" && value ? value : null)
}
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
    <Select :model-value="selectedValue" :disabled="props.disabled || loading" @update:model-value="handleMusicUpdate">
      <SelectTrigger class="w-full">
        <SelectValue :placeholder="loading ? t('deckRecommend.select.loading') : t('deckRecommend.form.musicPlaceholder')" />
      </SelectTrigger>
      <SelectContent class="max-h-72">
        <SelectItem v-for="option in options" :key="option.id" :value="option.value">
          <span class="truncate">{{ option.label }}</span>
        </SelectItem>
      </SelectContent>
    </Select>

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
