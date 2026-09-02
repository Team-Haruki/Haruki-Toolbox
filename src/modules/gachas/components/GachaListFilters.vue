<script setup lang="ts">
import { useI18n } from "vue-i18n"
import type { CatalogCharacter, SekaiUnit } from "@/shared/sekai/catalog"
import CatalogCharacterPicker from "@/shared/components/catalog/CatalogCharacterPicker.vue"
import CatalogChipsField from "@/shared/components/catalog/CatalogChipsField.vue"
import CatalogFilterPanel, { type CatalogActiveChip } from "@/shared/components/catalog/CatalogFilterPanel.vue"
import CatalogSelectField from "@/shared/components/catalog/CatalogSelectField.vue"
import type { CatalogFieldOption, CatalogStatus } from "@/shared/components/catalog/types"
import type { GachaListQuery } from "@/modules/gachas/lib/gachas-query"

/**
 * The `/gachas` filter panel: type chips, status chips, year select and the
 * pickup character picker. Writes straight into the route-query state.
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
  reset: []
  removeChip: [key: string]
}>()

const { t } = useI18n()

function updateStatuses(values: string[]) {
  props.state.status = values.filter((value): value is CatalogStatus => value === "upcoming" || value === "ongoing" || value === "ended")
}

function updateYear(value: string | null) {
  const parsed = value == null ? Number.NaN : Number(value)
  props.state.year = Number.isInteger(parsed) ? parsed : null
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
    <CatalogChipsField
      v-model="state.type"
      :label="t('catalog.type.label')"
      :options="typeOptions"
      compact
    />
    <CatalogChipsField
      :model-value="state.status"
      :label="t('catalog.statusFilter.label')"
      :options="statusOptions"
      compact
      @update:model-value="updateStatuses"
    />
    <CatalogCharacterPicker
      v-model="state.chars"
      :characters="characters"
      :unit-color-map="unitColorMap"
      :label="t('gachaCatalog.list.pickupCharacters')"
    />
    <div class="grid gap-3 sm:max-w-xs">
      <CatalogSelectField
        :model-value="state.year == null ? null : String(state.year)"
        :label="t('catalog.year.label')"
        :all-label="t('catalog.year.all')"
        :options="yearOptions"
        @update:model-value="updateYear"
      />
    </div>
  </CatalogFilterPanel>
</template>
