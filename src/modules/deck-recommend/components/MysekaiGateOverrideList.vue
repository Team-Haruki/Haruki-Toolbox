<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import LazyOverrideCombobox, { type LazyOverrideComboboxOption } from "./LazyOverrideCombobox.vue"
import { resolveUnitIconUrl } from "../lib/area-item-options"
import type { MysekaiGateOption } from "../lib/master-options"
import type { DeckRecommendUnitType } from "../lib/recommend-options"

const props = defineProps<{
  modelValue: Record<string, string>
  gates: MysekaiGateOption[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: Record<string, string>]
}>()

const { t } = useI18n()
const optionsByMaxLevel = computed(() => {
  const map = new Map<number, LazyOverrideComboboxOption[]>()
  for (const maxLevel of new Set(props.gates.map((option) => option.maxLevel))) {
    map.set(maxLevel, createLevelOptions(maxLevel))
  }
  return map
})

function overrideValue(gateId: number) {
  return props.modelValue[String(gateId)] ?? "default"
}

function updateOverride(gate: MysekaiGateOption, value: string) {
  const nextInputs = { ...props.modelValue }
  if (value === "default") {
    delete nextInputs[String(gate.id)]
    emit("update:modelValue", nextInputs)
    return
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > gate.maxLevel) {
    return
  }

  nextInputs[String(gate.id)] = value
  emit("update:modelValue", nextInputs)
}

function optionsForMaxLevel(maxLevel: number) {
  return optionsByMaxLevel.value.get(maxLevel) ?? []
}

function createLevelOptions(maxLevel: number): LazyOverrideComboboxOption[] {
  const options: LazyOverrideComboboxOption[] = [
    {
      value: "default",
      label: t("deckRecommend.options.mysekaiGateOverride.default"),
    },
  ]
  for (let value = 1; value <= maxLevel; value += 1) {
    options.push({
      value: String(value),
      label: t("deckRecommend.options.filters.mysekaiGateLevelOption", { value }),
      keywords: [String(value)],
    })
  }
  return options
}

function gateIconUrl(gate: MysekaiGateOption) {
  return gate.unit && isDeckRecommendUnit(gate.unit) ? resolveUnitIconUrl(gate.unit) : null
}

function isDeckRecommendUnit(value: string): value is DeckRecommendUnitType {
  return ["light_sound", "idol", "street", "theme_park", "school_refusal", "piapro"].includes(value)
}
</script>

<template>
  <div v-if="props.gates.length === 0" class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
    {{ t("deckRecommend.options.mysekaiGateOverride.empty") }}
  </div>

  <div v-else class="grid min-w-0 gap-2 md:grid-cols-2 xl:grid-cols-3">
    <div
      v-for="gate in props.gates"
      :key="gate.id"
      class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_100px] items-center gap-2 rounded-md border bg-background/70 p-2 text-sm"
    >
      <img
        v-if="gateIconUrl(gate)"
        :src="gateIconUrl(gate) ?? ''"
        :alt="gate.unit ? t(`deckRecommend.eventUnits.${gate.unit}`) : gate.label"
        class="size-8 rounded object-contain"
        loading="lazy"
      >
      <span v-else class="size-8 rounded bg-muted" />
      <span class="min-w-0">
        <span class="block truncate font-medium">{{ gate.label }}</span>
        <span class="block truncate text-xs text-muted-foreground">
          {{ t("deckRecommend.options.mysekaiGateOverride.maxLevel", { value: gate.maxLevel }) }}
        </span>
      </span>
      <LazyOverrideCombobox
        :model-value="overrideValue(gate.id)"
        :options="optionsForMaxLevel(gate.maxLevel)"
        :disabled="props.disabled"
        :placeholder="t('deckRecommend.options.mysekaiGateOverride.default')"
        :search-placeholder="t('deckRecommend.options.mysekaiGateOverride.searchPlaceholder')"
        :empty-text="t('deckRecommend.options.mysekaiGateOverride.emptySearch')"
        trigger-class="h-8 px-2 text-xs"
        content-class="min-w-36 max-w-[calc(100vw-2rem)]"
        @update:model-value="value => updateOverride(gate, value)"
      />
    </div>
  </div>
</template>
