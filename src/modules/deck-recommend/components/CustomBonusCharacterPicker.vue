<script setup lang="ts">
import { computed, toRef } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useI18n } from "vue-i18n"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SekaiRegion } from "@/types"
import {
  DECK_RECOMMEND_SUPPORT_UNITS,
  type DeckRecommendSupportUnitType,
} from "../lib/recommend-options"
import { useCharacterOptions } from "../composables/useCharacterOptions"

const props = defineProps<{
  modelValue: readonly number[]
  supportUnits: Readonly<Record<string, DeckRecommendSupportUnitType>>
  region: SekaiRegion
  disabled?: boolean
}>()

const emit = defineEmits<{
  "update:modelValue": [value: number[]]
  "update:supportUnits": [value: Record<string, DeckRecommendSupportUnitType>]
}>()

const { t } = useI18n()
const regionRef = toRef(props, "region")
const { options, loading } = useCharacterOptions(regionRef)

const selectedIds = computed(() => props.modelValue ?? [])
const selectedIdSet = computed(() => new Set(selectedIds.value))
const supportUnitOptions = computed(() =>
  DECK_RECOMMEND_SUPPORT_UNITS.map((value) => ({
    value,
    label: t(`deckRecommend.eventUnits.${value}`),
  })),
)
const supportCharacterOptions = computed(() =>
  options.value.filter((option) => selectedIdSet.value.has(option.id) && isVirtualSingerCharacterId(option.id)),
)

function isSelected(characterId: number) {
  return selectedIdSet.value.has(characterId)
}

function toggleCharacter(characterId: number, checked: boolean) {
  const next = new Set(selectedIds.value)
  if (checked) {
    next.add(characterId)
  } else {
    next.delete(characterId)
  }

  const orderedIds = options.value
    .map((option) => option.id)
    .filter((id) => next.has(id))
  emit("update:modelValue", orderedIds)
  emit("update:supportUnits", filterSupportUnits(props.supportUnits, orderedIds))
}

function updateSupportUnit(characterId: number, value: AcceptableValue) {
  const next = { ...props.supportUnits }
  const key = String(characterId)
  if (value === "none") {
    delete next[key]
  } else if (typeof value === "string" && isSupportUnit(value)) {
    next[key] = value
  }

  emit("update:supportUnits", filterSupportUnits(next, selectedIds.value))
}

function filterSupportUnits(
  value: Readonly<Record<string, DeckRecommendSupportUnitType>>,
  allowedCharacterIds: readonly number[],
) {
  const allowedIds = new Set(allowedCharacterIds)
  const result: Record<string, DeckRecommendSupportUnitType> = {}
  for (const [characterId, unit] of Object.entries(value)) {
    const id = Number(characterId)
    if (allowedIds.has(id) && isVirtualSingerCharacterId(id) && isSupportUnit(unit)) {
      result[String(id)] = unit
    }
  }
  return result
}

function isVirtualSingerCharacterId(characterId: number) {
  return characterId >= 21 && characterId <= 26
}

function isSupportUnit(value: string): value is DeckRecommendSupportUnitType {
  return DECK_RECOMMEND_SUPPORT_UNITS.includes(value as DeckRecommendSupportUnitType)
}
</script>

<template>
  <div class="grid gap-3">
    <div class="grid max-h-72 gap-2 overflow-y-auto rounded-md border bg-background/60 p-2 sm:grid-cols-2 xl:grid-cols-3">
      <label
        v-for="option in options"
        :key="option.id"
        class="flex min-w-0 items-center gap-2 rounded-md border bg-muted/20 px-2 py-1.5 text-sm transition-colors hover:bg-muted/40"
      >
        <Checkbox
          :model-value="isSelected(option.id)"
          :disabled="props.disabled || loading"
          @update:model-value="checked => toggleCharacter(option.id, checked === true)"
        />
        <img :src="option.iconUrl" alt="" aria-hidden="true" class="size-6 rounded-sm object-cover" loading="lazy">
        <span class="min-w-0 truncate">{{ option.label }}</span>
      </label>
    </div>
    <p class="text-xs text-muted-foreground">
      <template v-if="loading">
        {{ t("deckRecommend.select.loading") }}
      </template>
      <template v-else>
        {{ t("deckRecommend.form.customBonusSelectedCount", { count: selectedIds.length }) }}
      </template>
    </p>

    <div class="grid gap-2">
      <Label>{{ t("deckRecommend.form.customBonusSupportUnits") }}</Label>
      <div v-if="supportCharacterOptions.length > 0" class="grid gap-2 sm:grid-cols-2">
        <div
          v-for="option in supportCharacterOptions"
          :key="option.id"
          class="grid gap-2 rounded-md border bg-background/60 p-2"
        >
          <div class="flex min-w-0 items-center gap-2 text-sm">
            <img :src="option.iconUrl" alt="" aria-hidden="true" class="size-6 rounded-sm object-cover" loading="lazy">
            <span class="min-w-0 truncate">{{ option.label }}</span>
          </div>
          <Select
            :model-value="props.supportUnits[String(option.id)] ?? 'none'"
            :disabled="props.disabled || loading"
            @update:model-value="value => updateSupportUnit(option.id, value)"
          >
            <SelectTrigger class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                {{ t("deckRecommend.form.customBonusAttrNone") }}
              </SelectItem>
              <SelectItem v-for="unit in supportUnitOptions" :key="unit.value" :value="unit.value">
                {{ unit.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <p v-else class="text-xs text-muted-foreground">
        {{ t("deckRecommend.form.customBonusSupportUnitsEmpty") }}
      </p>
    </div>
  </div>
</template>
