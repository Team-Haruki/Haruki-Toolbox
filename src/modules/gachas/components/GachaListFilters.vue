<script setup lang="ts">
import { computed, useId } from "vue"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { CatalogCharacter, SekaiUnit } from "@/shared/sekai/catalog"
import CatalogCharacterPicker from "@/shared/components/catalog/CatalogCharacterPicker.vue"
import CatalogChipsField from "@/shared/components/catalog/CatalogChipsField.vue"
import CatalogFilterPanel, { type CatalogActiveChip } from "@/shared/components/catalog/CatalogFilterPanel.vue"
import type { CatalogFieldOption, CatalogStatus } from "@/shared/components/catalog/types"
import type { GachaListQuery } from "@/modules/gachas/lib/gachas-query"

/**
 * The `/gachas` filter panel: type chips, status chips, year chips and the
 * pickup character picker. Emits typed patches of the route-query state.
 */
const props = defineProps<{
  state: GachaListQuery
  typeOptions: readonly CatalogFieldOption[]
  statusOptions: readonly CatalogFieldOption[]
  yearOptions: readonly CatalogFieldOption[]
  characters: readonly CatalogCharacter[]
  unitColorMap: ReadonlyMap<SekaiUnit, string> | null
  activeCount: number
  activeChips: readonly CatalogActiveChip[]
  /** Result-count line; null while the list is still loading. */
  countLabel: string | null
}>()

const emit = defineEmits<{
  patch: [next: Partial<GachaListQuery>]
  reset: []
  removeChip: [key: string]
}>()

const { t } = useI18n()
const id = useId()

/** Toggle-group value standing in for "no year filter". */
const ANY_YEAR = "__any__"

const yearModel = computed(() => (props.state.year == null ? ANY_YEAR : String(props.state.year)))

function updateStatuses(values: string[]) {
  emit("patch", { status: values.filter((value): value is CatalogStatus => value === "upcoming" || value === "ongoing" || value === "ended") })
}

function updateYear(value: AcceptableValue | AcceptableValue[] | undefined) {
  // The "all" chip, and deselecting the active year, both clear the filter.
  const parsed = typeof value === "string" ? Number(value) : Number.NaN
  emit("patch", { year: Number.isInteger(parsed) ? parsed : null })
}
</script>

<template>
  <CatalogFilterPanel
    :title="t('catalog.filters.title')"
    :reset-label="t('catalog.filters.reset')"
    :count-label="countLabel"
    page-key="gachas"
    :active-count="activeCount"
    :active-chips="activeChips"
    content-class="flex flex-col gap-3"
    @reset="emit('reset')"
    @remove-chip="emit('removeChip', $event)"
  >
    <!-- The three short rows share wrapping lines (see the other catalog
         panels): each ended well inside the panel's left third, and the year
         was a lone select. A wrapping flow, not a grid, so nothing is left
         hanging when a row is hidden. -->
    <div class="flex flex-wrap items-center gap-x-10 gap-y-3">
      <CatalogChipsField
        :model-value="state.type"
        :label="t('catalog.type.label')"
        :options="typeOptions"
        compact
        @update:model-value="emit('patch', { type: $event })"
      />
      <CatalogChipsField
        :model-value="state.status"
        :label="t('catalog.statusFilter.label')"
        :options="statusOptions"
        compact
        @update:model-value="updateStatuses"
      />
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
          @update:model-value="updateYear"
        >
          <ToggleGroupItem :value="ANY_YEAR">{{ t("catalog.year.all") }}</ToggleGroupItem>
          <ToggleGroupItem v-for="option in yearOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
    <CatalogCharacterPicker
      :model-value="state.chars"
      :characters="characters"
      :unit-color-map="unitColorMap"
      :label="t('gachaCatalog.list.pickupCharacters')"
      @update:model-value="emit('patch', { chars: $event })"
    />
  </CatalogFilterPanel>
</template>
