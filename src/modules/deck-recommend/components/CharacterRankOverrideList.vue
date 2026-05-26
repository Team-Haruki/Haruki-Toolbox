<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import LazyOverrideCombobox, { type LazyOverrideComboboxOption } from "./LazyOverrideCombobox.vue"
import type { CharacterRankOption } from "../lib/master-options"

const props = defineProps<{
  modelValue: Record<string, string>
  characters: CharacterRankOption[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: Record<string, string>]
}>()

const { t } = useI18n()
const optionsByMaxRank = computed(() => {
  const map = new Map<number, LazyOverrideComboboxOption[]>()
  for (const maxRank of new Set(props.characters.map((option) => option.maxRank))) {
    map.set(maxRank, createRankOptions(maxRank))
  }
  return map
})

function overrideValue(characterId: number) {
  return props.modelValue[String(characterId)] ?? "default"
}

function updateOverride(character: CharacterRankOption, value: string) {
  const nextInputs = { ...props.modelValue }
  if (value === "default") {
    delete nextInputs[String(character.id)]
    emit("update:modelValue", nextInputs)
    return
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > character.maxRank) {
    return
  }

  nextInputs[String(character.id)] = value
  emit("update:modelValue", nextInputs)
}

function optionsForMaxRank(maxRank: number) {
  return optionsByMaxRank.value.get(maxRank) ?? []
}

function createRankOptions(maxRank: number): LazyOverrideComboboxOption[] {
  const options: LazyOverrideComboboxOption[] = [
    {
      value: "default",
      label: t("deckRecommend.options.characterRankOverride.default"),
    },
  ]
  for (let value = 1; value <= maxRank; value += 1) {
    options.push({
      value: String(value),
      label: t("deckRecommend.options.filters.characterRankOption", { value }),
      keywords: [String(value)],
    })
  }
  return options
}
</script>

<template>
  <div v-if="props.characters.length === 0" class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
    {{ t("deckRecommend.options.characterRankOverride.empty") }}
  </div>

  <div v-else class="grid min-w-0 gap-2 md:grid-cols-2 xl:grid-cols-3">
    <div
      v-for="character in props.characters"
      :key="character.id"
      class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_100px] items-center gap-2 rounded-md border bg-background/70 p-2 text-sm"
    >
      <img
        :src="character.iconUrl"
        :alt="character.label"
        class="size-8 rounded object-cover"
        loading="lazy"
      >
      <span class="min-w-0">
        <span class="block truncate font-medium">{{ character.label }}</span>
        <span class="block truncate text-xs text-muted-foreground">
          {{ t("deckRecommend.options.characterRankOverride.maxRank", { value: character.maxRank }) }}
        </span>
      </span>
      <LazyOverrideCombobox
        :model-value="overrideValue(character.id)"
        :options="optionsForMaxRank(character.maxRank)"
        :disabled="props.disabled"
        :placeholder="t('deckRecommend.options.characterRankOverride.default')"
        :search-placeholder="t('deckRecommend.options.characterRankOverride.searchPlaceholder')"
        :empty-text="t('deckRecommend.options.characterRankOverride.emptySearch')"
        trigger-class="h-8 px-2 text-xs"
        content-class="min-w-36 max-w-[calc(100vw-2rem)]"
        @update:model-value="value => updateOverride(character, value)"
      />
    </div>
  </div>
</template>
