<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import LazyOverrideCombobox, { type LazyOverrideComboboxOption } from "./LazyOverrideCombobox.vue"
import type { CharacterOption } from "../lib/master-options"

const props = defineProps<{
  modelValue: Record<string, string>
  characters: CharacterOption[]
  options: readonly LazyOverrideComboboxOption[]
  maxRateLabel: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: Record<string, string>]
}>()

const { t } = useI18n()
const validValues = computed(() => new Set(props.options.map((option) => option.value).filter((value) => value !== "default")))

function overrideValue(characterId: number) {
  return props.modelValue[String(characterId)] ?? "default"
}

function updateOverride(characterId: number, value: string) {
  const nextInputs = { ...props.modelValue }
  if (value === "default") {
    delete nextInputs[String(characterId)]
    emit("update:modelValue", nextInputs)
    return
  }

  if (!validValues.value.has(value)) {
    return
  }

  nextInputs[String(characterId)] = value
  emit("update:modelValue", nextInputs)
}
</script>

<template>
  <div v-if="props.characters.length === 0" class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
    {{ t("deckRecommend.options.mysekaiFixtureBonusOverride.empty") }}
  </div>

  <div v-else class="grid min-w-0 gap-2 md:grid-cols-2 xl:grid-cols-3">
    <div
      v-for="character in props.characters"
      :key="character.id"
      class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_110px] items-center gap-2 rounded-md border bg-background/70 p-2 text-sm"
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
          {{ t("deckRecommend.options.mysekaiFixtureBonusOverride.maxRate", { value: props.maxRateLabel }) }}
        </span>
      </span>
      <LazyOverrideCombobox
        :model-value="overrideValue(character.id)"
        :options="props.options"
        :disabled="props.disabled"
        :placeholder="t('deckRecommend.options.mysekaiFixtureBonusOverride.default')"
        :search-placeholder="t('deckRecommend.options.mysekaiFixtureBonusOverride.searchPlaceholder')"
        :empty-text="t('deckRecommend.options.mysekaiFixtureBonusOverride.emptySearch')"
        trigger-class="h-8 px-2 text-xs"
        content-class="min-w-40 max-w-[calc(100vw-2rem)]"
        @update:model-value="value => updateOverride(character.id, value)"
      />
    </div>
  </div>
</template>
