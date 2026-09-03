<script setup lang="ts">
import { computed, useId } from "vue"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import CatalogCharacterPicker from "@/shared/components/catalog/CatalogCharacterPicker.vue"
import CatalogChipsField from "@/shared/components/catalog/CatalogChipsField.vue"
import type { CatalogFieldOption } from "@/shared/components/catalog/types"
import SekaiRarityStars from "@/shared/components/SekaiRarityStars.vue"
import {
  SEKAI_CARD_ATTRS,
  SEKAI_UNITS,
  type CatalogCharacter,
  type SekaiCardAttr,
  type SekaiUnit,
} from "@/shared/sekai/catalog"
import { resolveCardAttrRoundIconUrl, resolveUnitLogoUrl } from "@/shared/sekai/data-sources"
import {
  resolveSekaiAttrLabel,
  resolveSekaiEnumLabel,
  resolveSekaiRarityLabel,
  resolveSekaiSupplyLabel,
  resolveSekaiUnitLabel,
} from "@/shared/sekai/labels"
import {
  CARD_RARITY_TYPES,
  CARD_SUPPLY_TYPES,
  isCardRarityType,
  isCardSupplyType,
  type CardRarityType,
} from "@/modules/cards/lib/card-filter"
import type { CardsQueryState } from "@/modules/cards/lib/card-query"
import { CARD_SKILL_FILTER_TYPES, isCardSkillFilterType } from "@/modules/cards/lib/card-skill"

/**
 * The filter-panel body of `/cards`. Reads the route-query state and emits
 * typed patches; the page applies them, so a stray value never enters the URL.
 */
const props = defineProps<{
  state: CardsQueryState
  characters: readonly CatalogCharacter[]
  unitColorMap: ReadonlyMap<SekaiUnit, string> | null
  years: readonly number[]
}>()

const emit = defineEmits<{
  patch: [next: Partial<CardsQueryState>]
}>()

const { t, te } = useI18n()
const labels = { t, te }
const id = useId()

const unitOptions = computed<CatalogFieldOption[]>(() => SEKAI_UNITS.map((unit) => ({
  value: unit,
  label: resolveSekaiUnitLabel(labels, unit),
  iconUrl: resolveUnitLogoUrl(unit),
  color: props.unitColorMap?.get(unit) ?? null,
})))

const attrOptions = computed<CatalogFieldOption[]>(() => SEKAI_CARD_ATTRS.map((attr) => ({
  value: attr,
  label: resolveSekaiAttrLabel(labels, attr),
  iconUrl: resolveCardAttrRoundIconUrl(attr),
})))

const supplyOptions = computed<CatalogFieldOption[]>(() => CARD_SUPPLY_TYPES.map((supply) => ({
  value: supply,
  label: resolveSekaiSupplyLabel(labels, supply),
})))

const skillOptions = computed<CatalogFieldOption[]>(() => CARD_SKILL_FILTER_TYPES.map((type) => ({
  value: type,
  label: resolveSekaiEnumLabel(labels, "cardCatalog.skillFilters", type),
})))

const yearOptions = computed<CatalogFieldOption[]>(() => props.years.map((year) => ({
  value: String(year),
  label: String(year),
})))

/** Toggle-group value standing in for "no year filter". */
const ANY_YEAR = "__any__"

const yearModel = computed(() => (props.state.year == null ? ANY_YEAR : String(props.state.year)))

function isSekaiUnit(value: string): value is SekaiUnit {
  return (SEKAI_UNITS as readonly string[]).includes(value)
}

function isSekaiCardAttr(value: string): value is SekaiCardAttr {
  return (SEKAI_CARD_ATTRS as readonly string[]).includes(value)
}

function setUnits(values: string[]) {
  emit("patch", { units: values.filter(isSekaiUnit) })
}

function setAttrs(values: string[]) {
  emit("patch", { attrs: values.filter(isSekaiCardAttr) })
}

function setSupply(values: string[]) {
  emit("patch", { supply: values.filter(isCardSupplyType) })
}

function setSkill(values: string[]) {
  emit("patch", { skill: values.filter(isCardSkillFilterType) })
}

function setRarities(value: AcceptableValue | AcceptableValue[] | undefined) {
  const list = Array.isArray(value) ? value : (value == null ? [] : [value])
  emit("patch", { rar: list.filter((item): item is CardRarityType => typeof item === "string" && isCardRarityType(item)) })
}

function setYear(value: AcceptableValue | AcceptableValue[] | undefined) {
  // The "all" chip, and deselecting the active year, both clear the filter.
  const parsed = typeof value === "string" ? Number(value) : Number.NaN
  emit("patch", { year: Number.isInteger(parsed) ? parsed : null })
}

function rarityLabel(rarity: CardRarityType): string {
  return resolveSekaiRarityLabel(labels, rarity)
}
</script>

<template>
  <CatalogCharacterPicker
    v-if="characters.length > 0"
    :model-value="state.chars"
    :characters="characters"
    :unit-color-map="unitColorMap"
    :label="t('catalog.character.label')"
    @update:model-value="emit('patch', { chars: $event })"
  />

  <CatalogChipsField
    :model-value="state.units"
    :label="t('catalog.unit.label')"
    :options="unitOptions"
    compact
    @update:model-value="setUnits"
  />

  <!-- Short rows share wrapping lines (see the music panel): one row each
       left most of the panel empty. A wrapping flow, not a grid, so nothing
       is left hanging when a row is hidden. -->
  <div class="flex flex-wrap items-center gap-x-10 gap-y-3">
    <CatalogChipsField
      :model-value="state.attrs"
      :label="t('catalog.attr.label')"
      :options="attrOptions"
      compact
      @update:model-value="setAttrs"
    />

    <div class="flex flex-wrap items-center gap-1.5">
      <p class="mr-1 min-w-14 text-xs font-medium text-muted-foreground">{{ t("catalog.rarity.label") }}</p>
    <ToggleGroup
      type="multiple"
      variant="chip"
      size="sm"
      :model-value="state.rar"
      :aria-label="t('catalog.rarity.label')"
      @update:model-value="setRarities"
    >
      <ToggleGroupItem
        v-for="rarity in CARD_RARITY_TYPES"
        :key="rarity"
        :value="rarity"
        :aria-label="rarityLabel(rarity)"
        :title="rarityLabel(rarity)"
      >
        <SekaiRarityStars :card-rarity-type="rarity" size="xs" />
        <span v-if="rarity === 'rarity_birthday'">{{ rarityLabel(rarity) }}</span>
      </ToggleGroupItem>
    </ToggleGroup>
    </div>
  </div>

  <CatalogChipsField
    :model-value="state.supply"
    :label="t('cardCatalog.filters.supply')"
    :options="supplyOptions"
    compact
    @update:model-value="setSupply"
  />

  <div class="flex flex-wrap items-center gap-x-10 gap-y-3">
    <CatalogChipsField
      :model-value="state.skill"
      :label="t('cardCatalog.filters.skillType')"
      :options="skillOptions"
      compact
      @update:model-value="setSkill"
    />

    <!-- Chips, not a select, like every other option here and the music panel. -->
    <div class="flex flex-wrap items-center gap-1.5">
      <p :id="`${id}-year-label`" class="mr-1 min-w-14 text-xs font-medium text-muted-foreground">
        {{ t("catalog.year.label") }}
      </p>
      <ToggleGroup
        type="single"
        variant="chip"
        size="sm"
        :model-value="yearModel"
        :aria-labelledby="`${id}-year-label`"
        @update:model-value="setYear"
      >
        <ToggleGroupItem :value="ANY_YEAR">{{ t("catalog.year.all") }}</ToggleGroupItem>
        <ToggleGroupItem v-for="option in yearOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  </div>
</template>
