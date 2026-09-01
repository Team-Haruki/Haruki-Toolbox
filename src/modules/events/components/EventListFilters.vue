<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import CatalogCharacterPicker from "@/shared/components/catalog/CatalogCharacterPicker.vue"
import CatalogChipsField from "@/shared/components/catalog/CatalogChipsField.vue"
import CatalogSelectField from "@/shared/components/catalog/CatalogSelectField.vue"
import { CATALOG_STATUSES, isCatalogStatus, type CatalogFieldOption } from "@/shared/components/catalog/types"
import {
  SEKAI_CARD_ATTRS,
  SEKAI_UNITS,
  type CatalogCharacter,
  type SekaiCardAttr,
  type SekaiUnit,
} from "@/shared/sekai/catalog"
import { resolveCardAttrRoundIconUrl, resolveUnitLogoUrl } from "@/shared/sekai/data-sources"
import { resolveSekaiAttrLabel, resolveSekaiEventTypeLabel, resolveSekaiUnitLabel } from "@/shared/sekai/labels"
import { isSekaiEventType, SEKAI_EVENT_TYPES } from "@/modules/events/lib/event-filter"
import type { EventsQueryState } from "@/modules/events/lib/event-query"

/**
 * The `/events` filter fields, bound straight to the route query state.
 * Each chip row writes back through a typed setter so a stray value can
 * never enter the URL.
 */
const props = withDefaults(defineProps<{
  state: EventsQueryState
  characters: readonly CatalogCharacter[]
  unitColorMap?: ReadonlyMap<SekaiUnit, string> | null
  years: readonly number[]
}>(), {
  unitColorMap: null,
})

const { t, te } = useI18n()

function isUnit(value: string): value is SekaiUnit {
  return (SEKAI_UNITS as readonly string[]).includes(value)
}

function isAttr(value: string): value is SekaiCardAttr {
  return (SEKAI_CARD_ATTRS as readonly string[]).includes(value)
}

const typeModel = computed<string[]>({
  get: () => props.state.type,
  set: (value) => {
    props.state.type = value.filter(isSekaiEventType)
  },
})

const statusModel = computed<string[]>({
  get: () => props.state.status,
  set: (value) => {
    props.state.status = value.filter(isCatalogStatus)
  },
})

const unitModel = computed<string[]>({
  get: () => props.state.units,
  set: (value) => {
    props.state.units = value.filter(isUnit)
  },
})

const attrModel = computed<string[]>({
  get: () => props.state.attrs,
  set: (value) => {
    props.state.attrs = value.filter(isAttr)
  },
})

const charsModel = computed<number[]>({
  get: () => props.state.chars,
  set: (value) => {
    props.state.chars = value
  },
})

const yearModel = computed<string | null>({
  get: () => (props.state.year != null ? String(props.state.year) : null),
  set: (value) => {
    const parsed = value != null ? Number(value) : Number.NaN
    props.state.year = Number.isInteger(parsed) ? parsed : null
  },
})

const typeOptions = computed<CatalogFieldOption[]>(() =>
  SEKAI_EVENT_TYPES.map((eventType) => ({ value: eventType, label: resolveSekaiEventTypeLabel({ t, te }, eventType) })),
)

const statusOptions = computed<CatalogFieldOption[]>(() =>
  CATALOG_STATUSES.map((status) => ({ value: status, label: t(`catalog.status.${status}`) })),
)

const unitOptions = computed<CatalogFieldOption[]>(() =>
  SEKAI_UNITS.map((unit) => ({
    value: unit,
    label: resolveSekaiUnitLabel({ t, te }, unit),
    iconUrl: resolveUnitLogoUrl(unit),
    color: props.unitColorMap?.get(unit) ?? null,
  })),
)

const attrOptions = computed<CatalogFieldOption[]>(() =>
  SEKAI_CARD_ATTRS.map((attr) => ({
    value: attr,
    label: resolveSekaiAttrLabel({ t, te }, attr),
    iconUrl: resolveCardAttrRoundIconUrl(attr),
  })),
)

const yearOptions = computed<CatalogFieldOption[]>(() =>
  props.years.map((year) => ({ value: String(year), label: String(year) })),
)
</script>

<template>
  <CatalogChipsField v-model="typeModel" :label="t('events.list.typeLabel')" :options="typeOptions" compact />
  <CatalogChipsField v-model="statusModel" :label="t('catalog.statusFilter.label')" :options="statusOptions" compact />
  <CatalogChipsField v-model="unitModel" :label="t('catalog.unit.label')" :options="unitOptions" compact />
  <CatalogChipsField v-model="attrModel" :label="t('events.list.attrLabel')" :options="attrOptions" compact />
  <CatalogCharacterPicker
    v-model="charsModel"
    :characters="characters"
    :unit-color-map="unitColorMap"
    :label="t('eventCatalog.filters.bonusCharacters')"
  />
  <div class="grid gap-4 sm:max-w-xs">
    <CatalogSelectField
      v-model="yearModel"
      :label="t('events.list.yearLabel')"
      :all-label="t('catalog.year.all')"
      :options="yearOptions"
    />
  </div>
</template>
