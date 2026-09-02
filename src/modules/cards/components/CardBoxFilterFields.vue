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
  type SekaiUnit,
} from "@/shared/sekai/catalog"
import { resolveCardAttrRoundIconUrl, resolveUnitLogoUrl } from "@/shared/sekai/data-sources"
import { resolveSekaiAttrLabel, resolveSekaiRarityLabel, resolveSekaiUnitLabel } from "@/shared/sekai/labels"
import { CARD_RARITY_TYPES, isCardRarityType, type CardRarityType } from "@/modules/cards/lib/card-filter"
import { CARD_OWNERSHIP_FILTERS, type CardBoxFilters, type CardOwnershipFilter } from "@/modules/cards/lib/card-box"

/**
 * The filter-panel body of `/cards/box`, the card catalog's panel minus the
 * catalog-only fields (skill, supply, year) plus the ownership switch. Mutates
 * the page's reactive filter object directly.
 */
const props = defineProps<{
  state: CardBoxFilters
  characters: readonly CatalogCharacter[]
  unitColorMap: ReadonlyMap<SekaiUnit, string> | null
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

function setUnits(values: string[]) {
  props.state.units = values.filter((value): value is SekaiUnit => (SEKAI_UNITS as readonly string[]).includes(value))
}

function setAttrs(values: string[]) {
  props.state.attrs = values.filter((value) => (SEKAI_CARD_ATTRS as readonly string[]).includes(value))
}

function setRarities(value: AcceptableValue | AcceptableValue[] | undefined) {
  const list = Array.isArray(value) ? value : (value == null ? [] : [value])
  props.state.rarities = list.filter((item): item is CardRarityType => typeof item === "string" && isCardRarityType(item))
}

function setOwnership(value: AcceptableValue | AcceptableValue[] | undefined) {
  if (typeof value === "string" && (CARD_OWNERSHIP_FILTERS as readonly string[]).includes(value)) {
    props.state.ownership = value as CardOwnershipFilter
  }
}
</script>

<template>
  <CatalogCharacterPicker
    v-if="characters.length > 0"
    v-model="state.characterIds"
    :characters="characters"
    :unit-color-map="unitColorMap"
    :label="t('catalog.character.label')"
  />

  <CatalogChipsField
    :model-value="state.units"
    :label="t('catalog.unit.label')"
    :options="unitOptions"
    compact
    @update:model-value="setUnits"
  />

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
        :model-value="state.rarities"
        :aria-label="t('catalog.rarity.label')"
        @update:model-value="setRarities"
      >
        <ToggleGroupItem
          v-for="rarity in CARD_RARITY_TYPES"
          :key="rarity"
          :value="rarity"
          :aria-label="resolveSekaiRarityLabel(labels, rarity)"
          :title="resolveSekaiRarityLabel(labels, rarity)"
        >
          <SekaiRarityStars :card-rarity-type="rarity" size="xs" />
          <span v-if="rarity === 'rarity_birthday'">{{ resolveSekaiRarityLabel(labels, rarity) }}</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>

    <div class="flex flex-wrap items-center gap-1.5">
      <p :id="`${id}-ownership-label`" class="mr-1 min-w-14 text-xs font-medium text-muted-foreground">
        {{ t("cardBox.ownership.label") }}
      </p>
      <ToggleGroup
        type="single"
        variant="segment"
        size="sm"
        :model-value="state.ownership"
        :aria-labelledby="`${id}-ownership-label`"
        @update:model-value="setOwnership"
      >
        <ToggleGroupItem v-for="option in CARD_OWNERSHIP_FILTERS" :key="option" :value="option">
          {{ t(`cardBox.ownership.${option}`) }}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  </div>
</template>
