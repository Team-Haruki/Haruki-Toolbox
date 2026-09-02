<script setup lang="ts">
import { computed, useId } from "vue"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import DateTimePicker24h from "@/components/ui/datetime-picker/DateTimePicker24h.vue"
import CatalogChipsField from "@/shared/components/catalog/CatalogChipsField.vue"
import type { CatalogFieldOption } from "@/shared/components/catalog/types"
import { SEKAI_UNITS, type SekaiUnit } from "@/shared/sekai/catalog"
import { resolveUnitLogoUrl } from "@/shared/sekai/data-sources"
import { resolveSekaiUnitLabel } from "@/shared/sekai/labels"
import { SEKAI_EVENT_TYPES, isSekaiEventType, type SekaiEventType } from "@/modules/events/lib/event-filter"
import { EVENT_RECORD_TIME_MODES, isEventRecordTimeMode, type EventRecordTimeMode } from "@/modules/events/lib/event-records"

export type EventRecordsFilterState = {
  time: EventRecordTimeMode
  from: Date | undefined
  to: Date | undefined
  types: SekaiEventType[]
  units: SekaiUnit[]
}

/** The filter-panel body of the event records page; mutates the page's reactive state. */
const props = defineProps<{
  state: EventRecordsFilterState
  unitColorMap: ReadonlyMap<SekaiUnit, string> | null
}>()

const { t, te } = useI18n()
const labels = { t, te }
const id = useId()

const typeOptions = computed<CatalogFieldOption[]>(() => SEKAI_EVENT_TYPES.map((type) => ({
  value: type,
  label: t(`events.type.${type}`),
})))

const unitOptions = computed<CatalogFieldOption[]>(() => SEKAI_UNITS.map((unit) => ({
  value: unit,
  label: resolveSekaiUnitLabel(labels, unit),
  iconUrl: resolveUnitLogoUrl(unit),
  color: props.unitColorMap?.get(unit) ?? null,
})))

function setTime(value: AcceptableValue | AcceptableValue[] | undefined) {
  if (typeof value === "string" && isEventRecordTimeMode(value)) {
    props.state.time = value
  }
}

function setTypes(values: string[]) {
  props.state.types = values.filter(isSekaiEventType)
}

function setUnits(values: string[]) {
  props.state.units = values.filter((value): value is SekaiUnit => (SEKAI_UNITS as readonly string[]).includes(value))
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-10 gap-y-3">
    <div class="flex flex-wrap items-center gap-1.5">
      <p :id="`${id}-time-label`" class="mr-1 min-w-14 text-xs font-medium text-muted-foreground">
        {{ t("eventRecords.filters.time") }}
      </p>
      <ToggleGroup
        type="single"
        variant="chip"
        size="sm"
        :model-value="state.time"
        :aria-labelledby="`${id}-time-label`"
        @update:model-value="setTime"
      >
        <ToggleGroupItem v-for="mode in EVENT_RECORD_TIME_MODES" :key="mode" :value="mode">
          {{ t(`eventRecords.filters.${mode === 'year' ? 'lastYear' : mode}`) }}
        </ToggleGroupItem>
      </ToggleGroup>
      <div v-if="state.time === 'custom'" class="flex flex-wrap items-center gap-2">
        <div class="w-44">
          <DateTimePicker24h v-model="state.from" :placeholder="t('eventRecords.filters.from')" :aria-label="t('eventRecords.filters.from')" />
        </div>
        <span class="text-xs text-muted-foreground">—</span>
        <div class="w-44">
          <DateTimePicker24h v-model="state.to" :placeholder="t('eventRecords.filters.to')" :aria-label="t('eventRecords.filters.to')" />
        </div>
      </div>
    </div>

    <CatalogChipsField
      :model-value="state.types"
      :label="t('eventRecords.filters.type')"
      :options="typeOptions"
      compact
      @update:model-value="setTypes"
    />
  </div>

  <CatalogChipsField
    :model-value="state.units"
    :label="t('catalog.unit.label')"
    :options="unitOptions"
    compact
    @update:model-value="setUnits"
  />
</template>
