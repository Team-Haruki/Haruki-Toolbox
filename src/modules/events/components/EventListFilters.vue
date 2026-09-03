<script setup lang="ts">
import { computed, useId } from "vue"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import CatalogCharacterPicker from "@/shared/components/catalog/CatalogCharacterPicker.vue"
import CatalogChipsField from "@/shared/components/catalog/CatalogChipsField.vue"
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
 * The `/events` filter fields. Each chip row emits a typed patch of the
 * route query state so a stray value can never enter the URL; the page
 * applies the patch.
 */
const props = withDefaults(defineProps<{
  state: EventsQueryState
  characters: readonly CatalogCharacter[]
  unitColorMap?: ReadonlyMap<SekaiUnit, string> | null
  years: readonly number[]
}>(), {
  unitColorMap: null,
})

const emit = defineEmits<{
  patch: [next: Partial<EventsQueryState>]
}>()

const { t, te } = useI18n()
const id = useId()

/** Toggle-group value standing in for "no year filter". */
const ANY_YEAR = "__any__"

function isUnit(value: string): value is SekaiUnit {
  return (SEKAI_UNITS as readonly string[]).includes(value)
}

function isAttr(value: string): value is SekaiCardAttr {
  return (SEKAI_CARD_ATTRS as readonly string[]).includes(value)
}

const typeModel = computed<string[]>({
  get: () => props.state.type,
  set: (value) => {
    emit("patch", { type: value.filter(isSekaiEventType) })
  },
})

const statusModel = computed<string[]>({
  get: () => props.state.status,
  set: (value) => {
    emit("patch", { status: value.filter(isCatalogStatus) })
  },
})

const unitModel = computed<string[]>({
  get: () => props.state.units,
  set: (value) => {
    emit("patch", { units: value.filter(isUnit) })
  },
})

const attrModel = computed<string[]>({
  get: () => props.state.attrs,
  set: (value) => {
    emit("patch", { attrs: value.filter(isAttr) })
  },
})

const charsModel = computed<number[]>({
  get: () => props.state.chars,
  set: (value) => {
    emit("patch", { chars: value })
  },
})

const yearModel = computed(() => (props.state.year == null ? ANY_YEAR : String(props.state.year)))

function setYear(value: AcceptableValue | AcceptableValue[] | undefined) {
  // The "all" chip, and deselecting the active year, both clear the filter.
  const parsed = typeof value === "string" ? Number(value) : Number.NaN
  emit("patch", { year: Number.isInteger(parsed) ? parsed : null })
}

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
  <!-- Short rows share wrapping lines (see the music and card panels): type,
       status, attribute and year each ended well inside the panel's left
       third. A wrapping flow, not a grid, so hiding a row never leaves a hole. -->
  <div class="flex flex-wrap items-center gap-x-10 gap-y-3">
    <CatalogChipsField v-model="typeModel" :label="t('events.list.typeLabel')" :options="typeOptions" compact />
    <CatalogChipsField v-model="statusModel" :label="t('catalog.statusFilter.label')" :options="statusOptions" compact />
  </div>

  <CatalogChipsField v-model="unitModel" :label="t('catalog.unit.label')" :options="unitOptions" compact />

  <div class="flex flex-wrap items-center gap-x-10 gap-y-3">
    <CatalogChipsField v-model="attrModel" :label="t('events.list.attrLabel')" :options="attrOptions" compact />

    <!-- Chips, not a select, like every other option here and on the other panels. -->
    <div class="flex flex-wrap items-center gap-1.5">
      <p :id="`${id}-year-label`" class="mr-1 min-w-14 text-xs font-medium text-muted-foreground">
        {{ t("events.list.yearLabel") }}
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

  <CatalogCharacterPicker
    v-model="charsModel"
    :characters="characters"
    :unit-color-map="unitColorMap"
    :label="t('eventCatalog.filters.bonusCharacters')"
  />
</template>
