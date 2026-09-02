<script setup lang="ts">
import { computed, onMounted, ref, toRef } from "vue"
import { useI18n } from "vue-i18n"
import { LucideLayoutGrid, LucideList } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCatalogScrollMemory } from "@/composables/useCatalogScrollMemory"
import { useCatalogViewPreference } from "@/composables/useCatalogViewPreference"
import { usePagedSlice } from "@/composables/usePagedSlice"
import { useRouteQueryState } from "@/composables/useRouteQueryState"
import { preloadSearchPinyin } from "@/lib/search-match"
import CatalogEmptyState from "@/shared/components/catalog/CatalogEmptyState.vue"
import CatalogErrorState from "@/shared/components/catalog/CatalogErrorState.vue"
import CatalogFilterPanel from "@/shared/components/catalog/CatalogFilterPanel.vue"
import CatalogPageShell from "@/shared/components/catalog/CatalogPageShell.vue"
import CatalogPagination from "@/shared/components/catalog/CatalogPagination.vue"
import CatalogRegionSelect from "@/shared/components/catalog/CatalogRegionSelect.vue"
import CatalogResultsBar from "@/shared/components/catalog/CatalogResultsBar.vue"
import CatalogSearchField from "@/shared/components/catalog/CatalogSearchField.vue"
import {
  isCatalogSortDirection,
  type CatalogSortOption,
  type CatalogViewOption,
} from "@/shared/components/catalog/types"
import { SEKAI_CARD_ATTRS, type CatalogCharacter } from "@/shared/sekai/catalog"
import { useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { resolveSekaiAttrLabel, resolveSekaiEventTypeLabel, resolveSekaiUnitLabel } from "@/shared/sekai/labels"
import { useSettingsStore } from "@/shared/stores/settings"
import EventCatalogTile from "@/modules/events/components/EventCatalogTile.vue"
import EventListFilters from "@/modules/events/components/EventListFilters.vue"
import { useEventList } from "@/modules/events/composables/useEventList"
import { isEventUnreleased, type SekaiEventItem } from "@/modules/events/lib/event-filter"
import { buildEventsActiveChips, EVENT_SORT_KEYS, eventsQueryCodec, type EventSortKey } from "@/modules/events/lib/event-query"

const NO_CHARACTERS: readonly CatalogCharacter[] = []

const { t, te } = useI18n()
const settingsStore = useSettingsStore()
const { region } = useEffectiveCatalogRegion()
const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

const { state, reset, activeFilterCount } = useRouteQueryState(eventsQueryCodec, {
  debounceKeys: ["q"],
  pageKey: "page",
  pageNeutralKeys: ["size"],
})

const list = useEventList(region, state)
const view = useCatalogViewPreference<"grid" | "list">("events", "view", () => "grid", ["grid", "list"])

const { pageItems, totalPages } = usePagedSlice(list.events, toRef(state, "page"), toRef(state, "size"))

const resultsEl = ref<HTMLElement | null>(null)
useCatalogScrollMemory(list.eventsIndex.ready)

onMounted(() => {
  void preloadSearchPinyin()
})

const characters = computed(() => list.charactersIndex.data.value?.characters ?? NO_CHARACTERS)
const unitColorMap = computed(() => list.charactersIndex.data.value?.unitColorMap ?? null)

const sortOptions = computed<CatalogSortOption[]>(() =>
  EVENT_SORT_KEYS.map((key) => ({ value: key, label: t(`eventCatalog.sort.${key}`) })),
)

const viewOptions = computed<CatalogViewOption[]>(() => [
  { value: "grid", label: t("catalog.view.grid"), icon: LucideLayoutGrid },
  { value: "list", label: t("catalog.view.list"), icon: LucideList },
])

const sortModel = computed<string>({
  get: () => state.sort,
  set: (value) => {
    if ((EVENT_SORT_KEYS as readonly string[]).includes(value)) {
      state.sort = value as EventSortKey
    }
  },
})

const directionModel = computed({
  get: () => state.dir,
  set: (value: string) => {
    if (isCatalogSortDirection(value)) {
      state.dir = value
    }
  },
})

const viewModel = computed<string>({
  get: () => view.value,
  set: (value) => {
    if (value === "grid" || value === "list") {
      view.value = value
    }
  },
})

// Null until the index resolves so the panel header and results bar never
// announce "0 results" next to the loading skeleton.
const countLabel = computed(() => (
  list.eventsIndex.ready.value ? t("events.list.resultsCount", { count: list.events.value.length }) : null
))

const activeChips = computed(() => buildEventsActiveChips(state, {
  typeLabel: (value) => resolveSekaiEventTypeLabel({ t, te }, value),
  statusLabel: (value) => t(`catalog.status.${value}`),
  unitLabel: (value) => resolveSekaiUnitLabel({ t, te }, value),
  attrLabel: (value) => resolveSekaiAttrLabel({ t, te }, value),
  characterName: (id) => list.charactersIndex.data.value?.characterMap.get(id)?.name ?? `#${id}`,
}, t))

function removeChip(key: string) {
  reset([key])
}

function bonusAttrs(event: SekaiEventItem): string[] {
  const attrs = list.eventsIndex.data.value?.bonusAttrMap.get(event.id)
  return attrs ? SEKAI_CARD_ATTRS.filter((attr) => attrs.has(attr)) : []
}

function showUnreleased() {
  settingsStore.setShowUnreleasedContent(true)
}

const showSkeleton = computed(() => list.eventsIndex.loading.value && list.eventsIndex.data.value == null)
</script>

<template>
  <CatalogPageShell :title="t('events.list.title')" :description="t('events.list.description')">
    <template #toolbar>
      <div class="flex w-full items-center gap-2">
        <CatalogSearchField
          v-model="state.q"
          :label="t('events.list.searchLabel')"
          :placeholder="t('events.list.searchPlaceholder')"
          compact
          class="min-w-0 flex-1"
        />
        <CatalogRegionSelect class="w-32 shrink-0 sm:w-36" />
      </div>
    </template>

    <template #filters>
      <CatalogFilterPanel
        :title="t('catalog.filters.title')"
        :count-label="countLabel"
        :reset-label="t('catalog.filters.reset')"
        page-key="events"
        :active-count="activeFilterCount"
        :active-chips="activeChips"
        content-class="flex flex-col gap-4"
        @reset="reset()"
        @remove-chip="removeChip"
      >
        <EventListFilters
          :state="state"
          :characters="characters"
          :unit-color-map="unitColorMap"
          :years="list.years.value"
        />
      </CatalogFilterPanel>
    </template>

    <CatalogResultsBar
      v-model:sort="sortModel"
      v-model:direction="directionModel"
      v-model:view="viewModel"
      :count-label="countLabel"
      :sort-options="sortOptions"
      :view-options="viewOptions"
    />

    <div ref="resultsEl" class="flex flex-col gap-3">
      <template v-if="showSkeleton">
        <div v-if="view === 'grid'" class="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div v-for="index in 6" :key="index" class="flex flex-col gap-2 overflow-hidden rounded-lg border">
            <Skeleton class="aspect-[2/1] w-full rounded-none" />
            <div class="flex flex-col gap-2 p-2.5">
              <Skeleton class="h-4 w-3/4" />
              <Skeleton class="h-3 w-1/2" />
            </div>
          </div>
        </div>
        <div v-else class="flex flex-col gap-2">
          <div v-for="index in 8" :key="index" class="flex items-center gap-3 rounded-lg border p-2">
            <Skeleton class="aspect-[2/1] w-24 shrink-0" />
            <div class="flex flex-1 flex-col gap-2">
              <Skeleton class="h-4 w-1/2" />
              <Skeleton class="h-3 w-1/3" />
            </div>
          </div>
        </div>
      </template>

      <CatalogErrorState
        v-else-if="list.eventsIndex.error.value && list.eventsIndex.data.value == null"
        :message="t('events.list.loadFailed')"
        :detail="list.eventsIndex.error.value"
        :retrying="list.eventsIndex.refreshing.value"
        @retry="list.eventsIndex.reload"
      />

      <CatalogEmptyState
        v-else-if="list.upcomingHidden.value"
        :message="t('catalog.status.upcomingHidden')"
      >
        <template #action>
          <Button variant="outline" size="sm" @click="showUnreleased">
            {{ t("catalog.status.showUnreleased") }}
          </Button>
        </template>
      </CatalogEmptyState>

      <CatalogEmptyState
        v-else-if="pageItems.length === 0"
        :message="t('events.list.empty')"
        :hint="t('catalog.results.emptyHint')"
      />

      <div v-else-if="view === 'grid'" class="grid grid-cols-2 gap-3 md:grid-cols-3">
        <EventCatalogTile
          v-for="event in pageItems"
          :key="event.id"
          :event="event"
          :region="region"
          :asset-endpoint="assetEndpoint"
          :now-ms="list.now.value"
          view="grid"
          :unreleased="isEventUnreleased(event, list.now.value)"
          :blur="list.blurUnreleased.value"
          :bonus-attrs="bonusAttrs(event)"
        />
      </div>

      <div v-else class="flex flex-col gap-2">
        <EventCatalogTile
          v-for="event in pageItems"
          :key="event.id"
          :event="event"
          :region="region"
          :asset-endpoint="assetEndpoint"
          :now-ms="list.now.value"
          view="list"
          :unreleased="isEventUnreleased(event, list.now.value)"
          :blur="list.blurUnreleased.value"
          :bonus-attrs="bonusAttrs(event)"
        />
      </div>
    </div>

    <template #footer>
      <CatalogPagination
        v-if="list.events.value.length > 0"
        v-model:page="state.page"
        v-model:page-size="state.size"
        :total-pages="totalPages"
        :total="list.events.value.length"
        :anchor="resultsEl"
        hide-when-single-page
      />
    </template>
  </CatalogPageShell>
</template>
