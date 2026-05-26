<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import LazyOverrideCombobox, { type LazyOverrideComboboxOption } from "./LazyOverrideCombobox.vue"
import type { DeckRecommendAreaItemOption } from "../lib/area-item-options"

type AreaItemOverrideAreaGroup = {
  key: string
  label: string
  items: DeckRecommendAreaItemOption[]
}

type AreaItemOverrideSection = {
  kind: string
  label: string
  areas: AreaItemOverrideAreaGroup[]
}

const props = defineProps<{
  modelValue: Record<string, string>
  sections: AreaItemOverrideSection[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: Record<string, string>]
}>()

const { t } = useI18n()
const optionsByMaxLevel = computed(() => {
  const map = new Map<number, LazyOverrideComboboxOption[]>()
  for (const maxLevel of new Set(props.sections.flatMap((section) =>
    section.areas.flatMap((area) => area.items.map((item) => item.maxLevel)),
  ))) {
    map.set(maxLevel, createLevelOptions(maxLevel))
  }
  return map
})

function overrideValue(areaItemId: number) {
  return props.modelValue[String(areaItemId)] ?? "default"
}

function updateOverride(item: DeckRecommendAreaItemOption, value: string) {
  const nextInputs = { ...props.modelValue }
  if (value === "default") {
    delete nextInputs[String(item.id)]
    emit("update:modelValue", nextInputs)
    return
  }

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > item.maxLevel) {
    return
  }

  nextInputs[String(item.id)] = value
  emit("update:modelValue", nextInputs)
}

function optionsForMaxLevel(maxLevel: number) {
  return optionsByMaxLevel.value.get(maxLevel) ?? []
}

function createLevelOptions(maxLevel: number): LazyOverrideComboboxOption[] {
  const options: LazyOverrideComboboxOption[] = [
    {
      value: "default",
      label: t("deckRecommend.options.areaItemOverride.default"),
    },
  ]
  for (let value = 1; value <= maxLevel; value += 1) {
    options.push({
      value: String(value),
      label: t("deckRecommend.options.filters.areaItemLevelOption", { value }),
      keywords: [String(value)],
    })
  }
  return options
}

function targetLabel(item: DeckRecommendAreaItemOption) {
  if (item.kind === "attr" && item.targetAttr) {
    return t(`deckRecommend.cardTags.attrs.${item.targetAttr}`)
  }

  if (item.kind === "unit" && item.targetUnit && item.targetLabel === item.targetUnit) {
    return t(`deckRecommend.eventUnits.${item.targetUnit}`)
  }

  return item.targetLabel ?? t("deckRecommend.options.areaItemOverride.targetFallback", { id: item.id })
}

function detailLabel(item: DeckRecommendAreaItemOption) {
  return item.itemName ?? t("deckRecommend.options.areaItemOverride.itemFallback", { id: item.id })
}
</script>

<template>
  <div v-if="props.sections.length === 0" class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
    {{ t("deckRecommend.options.areaItemOverride.empty") }}
  </div>

  <div v-else class="grid min-w-0 gap-3">
    <section
      v-for="section in props.sections"
      :key="section.kind"
      class="grid min-w-0 gap-2 rounded-md border bg-background/50 p-2.5"
    >
      <h4 class="text-sm font-medium">{{ section.label }}</h4>
      <div
        v-for="areaGroup in section.areas"
        :key="areaGroup.key"
        class="grid min-w-0 gap-2"
      >
        <div class="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
          <span class="h-px flex-1 bg-border" />
          <span class="min-w-0 truncate">{{ areaGroup.label }}</span>
          <span class="h-px flex-1 bg-border" />
        </div>
        <div class="grid min-w-0 gap-2 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="item in areaGroup.items"
            :key="item.id"
            class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_100px] items-center gap-2 rounded-md border bg-background/70 p-2 text-sm"
          >
            <img
              v-if="item.iconUrl"
              :src="item.iconUrl"
              :alt="targetLabel(item)"
              class="size-8 rounded object-contain"
              loading="lazy"
            >
            <span v-else class="size-8 rounded bg-muted" />
            <span class="min-w-0">
              <span class="block truncate font-medium">{{ targetLabel(item) }}</span>
              <span class="block truncate text-xs text-muted-foreground">{{ detailLabel(item) }}</span>
            </span>
            <LazyOverrideCombobox
              :model-value="overrideValue(item.id)"
              :options="optionsForMaxLevel(item.maxLevel)"
              :disabled="props.disabled"
              :placeholder="t('deckRecommend.options.areaItemOverride.default')"
              :search-placeholder="t('deckRecommend.options.areaItemOverride.searchPlaceholder')"
              :empty-text="t('deckRecommend.options.areaItemOverride.emptySearch')"
              trigger-class="h-8 px-2 text-xs"
              content-class="min-w-36 max-w-[calc(100vw-2rem)]"
              @update:model-value="value => updateOverride(item, value)"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
