<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideLayoutGrid, LucideList } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCatalogScrollMemory } from "@/composables/useCatalogScrollMemory"
import { useCatalogViewPreference } from "@/composables/useCatalogViewPreference"
import { useRouteQueryState } from "@/composables/useRouteQueryState"
import { preloadSearchPinyin } from "@/lib/search-match"
import CatalogEmptyState from "@/shared/components/catalog/CatalogEmptyState.vue"
import CatalogErrorState from "@/shared/components/catalog/CatalogErrorState.vue"
import CatalogPageShell from "@/shared/components/catalog/CatalogPageShell.vue"
import CatalogPagination from "@/shared/components/catalog/CatalogPagination.vue"
import CatalogRegionSelect from "@/shared/components/catalog/CatalogRegionSelect.vue"
import CatalogResultsBar from "@/shared/components/catalog/CatalogResultsBar.vue"
import CatalogSearchField from "@/shared/components/catalog/CatalogSearchField.vue"
import {
  CATALOG_STATUSES,
  type CatalogFieldOption,
  type CatalogSortOption,
  type CatalogViewOption,
} from "@/shared/components/catalog/types"
import { useSettingsStore } from "@/shared/stores/settings"
import GachaListFilters from "@/modules/gachas/components/GachaListFilters.vue"
import GachaListRow from "@/modules/gachas/components/GachaListRow.vue"
import GachaTile from "@/modules/gachas/components/GachaTile.vue"
import { useGachaList } from "@/modules/gachas/composables/useGachaList"
import { resolveGachaTypeLabel } from "@/modules/gachas/lib/gacha-labels"
import {
  GACHA_LIST_SORT_KEYS,
  buildGachaActiveChips,
  gachasQueryCodec,
  removeGachaActiveChip,
  type GachaListSortKey,
} from "@/modules/gachas/lib/gachas-query"

type GachaListView = "grid" | "list"

const { t, te } = useI18n()
const ctx = { t, te }
const settingsStore = useSettingsStore()

const { state, patch, reset, activeFilterCount } = useRouteQueryState(gachasQueryCodec, {
  debounceKeys: ["q"],
  pageKey: "page",
  pageNeutralKeys: ["size"],
})

const {
  loading,
  error,
  refreshing,
  ready,
  reload,
  characters,
  characterMap,
  unitColorMap,
  cardNames,
  types,
  years,
  total,
  tiles,
  totalPages,
  upcomingHidden,
  blurUnreleased,
} = useGachaList(state)

const view = useCatalogViewPreference<GachaListView>("gachas", "view", () => "grid", ["grid", "list"])
const resultsAnchor = ref<HTMLElement | null>(null)

onMounted(() => {
  void preloadSearchPinyin()
})

useCatalogScrollMemory(computed(() => ready.value && !loading.value && !error.value))

const typeOptions = computed<CatalogFieldOption[]>(() => types.value
  .map((type) => ({ value: type, label: resolveGachaTypeLabel(ctx, type) })))
const statusOptions = computed<CatalogFieldOption[]>(() => CATALOG_STATUSES
  .map((status) => ({ value: status, label: t(`catalog.status.${status}`) })))
const yearOptions = computed<CatalogFieldOption[]>(() => years.value
  .map((year) => ({ value: String(year), label: String(year) })))
const sortOptions = computed<CatalogSortOption[]>(() => [
  { value: "start", label: t("gachaCatalog.list.sort.start") },
  { value: "id", label: t("gachaCatalog.list.sort.id") },
])
const viewOptions = computed<CatalogViewOption[]>(() => [
  { value: "grid", label: t("catalog.view.grid"), icon: LucideLayoutGrid },
  { value: "list", label: t("catalog.view.list"), icon: LucideList },
])

const characterNames = computed(() => new Map([...characterMap.value.values()].map((character) => [character.id, character.name])))
const activeChips = computed(() => buildGachaActiveChips(state, {
  characterNames: characterNames.value,
  cardNames: cardNames.value,
  typeLabel: (type) => resolveGachaTypeLabel(ctx, type),
  statusLabel: (status) => t(`catalog.status.${status}`),
}, (key, params) => t(key, params ?? {})))

// Null until the index resolves so the panel header and the live-region
// results bar never announce "0 results" next to a skeleton grid.
const countLabel = computed(() => (ready.value ? t("catalog.results.count", { count: total.value }) : null))

function updateSort(value: string) {
  if ((GACHA_LIST_SORT_KEYS as readonly string[]).includes(value)) {
    state.sort = value as GachaListSortKey
  }
}

function updateView(value: string) {
  if (value === "grid" || value === "list") {
    view.value = value
  }
}

function showUnreleased() {
  settingsStore.setShowUnreleasedContent(true)
}
</script>

<template>
  <CatalogPageShell :title="t('gachas.list.title')" :description="t('gachas.list.description')">
    <template #toolbar>
      <CatalogSearchField
        v-model="state.q"
        :label="t('catalog.search.label')"
        :placeholder="t('gachas.list.searchPlaceholder')"
        compact
      />
      <CatalogRegionSelect />
    </template>

    <template #filters>
      <GachaListFilters
        :state="state"
        @patch="patch"
        :type-options="typeOptions"
        :status-options="statusOptions"
        :year-options="yearOptions"
        :characters="characters"
        :unit-color-map="unitColorMap"
        :active-count="activeFilterCount"
        :active-chips="activeChips"
        :count-label="countLabel"
        @reset="reset()"
        @remove-chip="removeGachaActiveChip(state, $event)"
      />
    </template>

    <CatalogErrorState
      v-if="error && !loading"
      :message="t('catalog.results.loadError')"
      :detail="error"
      :retrying="refreshing"
      @retry="reload"
    />

    <template v-else>
      <CatalogResultsBar
        v-model:direction="state.dir"
        :count-label="countLabel"
        :sort-options="sortOptions"
        :view-options="viewOptions"
        :sort="state.sort"
        :view="view"
        @update:sort="updateSort"
        @update:view="updateView"
      />

      <div ref="resultsAnchor" class="flex flex-col gap-3">
        <template v-if="loading">
          <div v-if="view === 'grid'" class="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div v-for="index in 6" :key="index" class="flex flex-col gap-1.5">
              <Skeleton class="aspect-[2/1] w-full rounded-md" />
              <Skeleton class="h-4 w-4/5" />
              <Skeleton class="h-3 w-1/2" />
            </div>
          </div>
          <div v-else class="flex flex-col gap-2">
            <Skeleton v-for="index in 6" :key="index" class="h-20 w-full rounded-md" />
          </div>
        </template>

        <template v-else-if="tiles.length > 0">
          <div v-if="view === 'grid'" class="grid grid-cols-2 gap-3 md:grid-cols-3">
            <GachaTile v-for="tile in tiles" :key="tile.gacha.id" :tile="tile" :blur-unreleased="blurUnreleased" />
          </div>
          <div v-else class="flex flex-col gap-2">
            <GachaListRow v-for="tile in tiles" :key="tile.gacha.id" :tile="tile" :blur-unreleased="blurUnreleased" />
          </div>
        </template>

        <CatalogEmptyState v-else-if="upcomingHidden" :message="t('catalog.status.upcomingHidden')">
          <template #action>
            <Button variant="outline" size="sm" @click="showUnreleased">
              {{ t("catalog.status.showUnreleased") }}
            </Button>
          </template>
        </CatalogEmptyState>

        <CatalogEmptyState v-else :message="t('catalog.results.empty')" :hint="t('catalog.results.emptyHint')" />
      </div>
    </template>

    <template #footer>
      <CatalogPagination
        v-if="!loading && !error && total > 0"
        v-model:page="state.page"
        v-model:page-size="state.size"
        :total-pages="totalPages"
        :total="total"
        :anchor="resultsAnchor"
        hide-when-single-page
      />
    </template>
  </CatalogPageShell>
</template>
