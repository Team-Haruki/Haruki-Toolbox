<script setup lang="ts">
import { computed, onMounted, ref, toRef } from "vue"
import { useI18n } from "vue-i18n"
import { LayoutGrid, List } from "lucide-vue-next"
import { Progress } from "@/components/ui/progress"
import { useCatalogScrollMemory } from "@/composables/useCatalogScrollMemory"
import { useCatalogViewPreference } from "@/composables/useCatalogViewPreference"
import { useNowTick } from "@/composables/useNowTick"
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
import type { CatalogFieldOption, CatalogSortOption, CatalogViewOption } from "@/shared/components/catalog/types"
import { useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import {
  resolveSekaiDifficultyLabel,
  resolveSekaiMusicCategoryLabel,
  resolveSekaiMusicTagLabel,
} from "@/shared/sekai/labels"
import { useMusicAliasMatches } from "@/shared/sekai/music-alias"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import { useSettingsStore } from "@/shared/stores/settings"
import MusicFilterFields from "@/modules/music-library/components/MusicFilterFields.vue"
import MusicResults from "@/modules/music-library/components/MusicResults.vue"
import { useMusicCatalogList } from "@/modules/music-library/composables/useMusicCatalogList"
import { useMusicDateFormatter } from "@/modules/music-library/composables/useMusicDateFormatter"
import { resolveMusicJacketUrl } from "@/modules/music-library/lib/music-assets"
import { MUSIC_DIFFICULTIES, MUSIC_DIFFICULTY_COLORS } from "@/modules/music-library/lib/music-difficulties"
import {
  excludeUnreleasedMusicEntries,
  filterMusicEntries,
  isMusicEntryUnreleased,
  sortMusicEntries,
} from "@/modules/music-library/lib/music-filter"
import {
  MUSIC_QUERY_SORTS,
  buildMusicActiveChips,
  musicQueryCodec,
  removeMusicChip,
  resolveMusicSortKey,
  toMusicLibraryFilter,
  type MusicQuerySort,
} from "@/modules/music-library/lib/music-query"
import {
  formatMusicDate,
  listMusicDifficultyPills,
  resolveMusicEventBoxView,
  type MusicListRow,
} from "@/modules/music-library/lib/music-view"

const MUSIC_VIEWS = ["grid", "list"] as const
type MusicView = (typeof MUSIC_VIEWS)[number]

const { t, te } = useI18n()
const labels = { t, te }
const settingsStore = useSettingsStore()
const { region } = useEffectiveCatalogRegion()
const { hideUnreleased, blurUnreleased } = useUnreleasedContentDisplay()
const {
  entries,
  characters,
  characterMap,
  unitColorMap,
  musicEventBoxes,
  musicVocalCharacters,
  tagOptions: tagValues,
  categoryOptions: categoryValues,
  yearOptions: yearValues,
  levelBounds,
  hasCategories,
  loading,
  refreshing,
  error,
  ready: listReady,
  regionState,
  reload,
} = useMusicCatalogList(region)

// The URL is the state; layout preferences stay on the device.
const { state, reset, activeFilterCount } = useRouteQueryState(musicQueryCodec, {
  debounceKeys: ["q"],
  pageKey: "page",
  pageNeutralKeys: ["size"],
})
const view = useCatalogViewPreference<MusicView>("music", "view", () => "grid", MUSIC_VIEWS)
const now = useNowTick(30_000)
const dateFormatter = useMusicDateFormatter()
const { matchedIds: aliasMatchedIds, pending: aliasPending } = useMusicAliasMatches(toRef(state, "q"))

const difficultyOptions = computed<CatalogFieldOption[]>(() => MUSIC_DIFFICULTIES.map((difficulty) => ({
  value: difficulty,
  label: resolveSekaiDifficultyLabel(labels, difficulty),
  color: MUSIC_DIFFICULTY_COLORS[difficulty],
})))
const tagOptions = computed<CatalogFieldOption[]>(() => tagValues.value.map((tag) => ({
  value: tag,
  label: resolveSekaiMusicTagLabel(labels, tag),
})))
const categoryOptions = computed<CatalogFieldOption[]>(() => categoryValues.value.map((category) => ({
  value: category,
  label: resolveSekaiMusicCategoryLabel(labels, category),
})))
const yearOptions = computed<CatalogFieldOption[]>(() => yearValues.value.map((year) => ({
  value: String(year),
  label: String(year),
})))
const sortOptions = computed<CatalogSortOption[]>(() => MUSIC_QUERY_SORTS.map((sort) => ({
  value: sort,
  label: t(`musicLibrary.list.sort.${resolveMusicSortKey(sort)}`),
})))
const viewOptions = computed<CatalogViewOption[]>(() => [
  { value: "grid", label: t("catalog.view.grid"), icon: LayoutGrid },
  { value: "list", label: t("catalog.view.list"), icon: List },
])

const filter = computed(() => toMusicLibraryFilter(state, { hasCategories: hasCategories.value }))

const visibleEntries = computed(() => {
  const filtered = filterMusicEntries(entries.value, filter.value, {
    eventBoxes: musicEventBoxes.value,
    vocalCharacters: musicVocalCharacters.value,
    aliasMatchedIds: aliasMatchedIds.value,
  })
  const released = hideUnreleased.value ? excludeUnreleasedMusicEntries(filtered, now.value) : filtered
  return sortMusicEntries(released, resolveMusicSortKey(state.sort), state.dir, state.diff)
})

const { pageItems, totalPages } = usePagedSlice(visibleEntries, toRef(state, "page"), toRef(state, "size"))

const rows = computed<MusicListRow[]>(() => pageItems.value.map((entry) => ({
  entry,
  jacketUrl: resolveMusicJacketUrl(region.value, entry.assetbundleName, settingsStore.currentAssetEndpoint),
  dateLabel: formatMusicDate(entry.publishedAt, dateFormatter.value),
  unreleased: isMusicEntryUnreleased(entry, now.value),
  eventBox: resolveMusicEventBoxView(musicEventBoxes.value.get(entry.id), characterMap.value),
  pills: listMusicDifficultyPills(entry),
})))

const activeChips = computed(() => buildMusicActiveChips(state, {
  difficultyLabel: (difficulty) => resolveSekaiDifficultyLabel(labels, difficulty),
  tagLabel: (tag) => resolveSekaiMusicTagLabel(labels, tag),
  categoryLabel: (category) => resolveSekaiMusicCategoryLabel(labels, category),
  characterName: (characterId) => characterMap.value.get(characterId)?.name ?? null,
  scopeLabel: (scope) => t(`musicLibrary.list.filters.characterScope.${scope}`),
  hasCategories: hasCategories.value,
}, (key, params) => t(key, params ?? {})))

const countLabel = computed(() => t("musicLibrary.list.results.count", { count: visibleEntries.value.length }))
const showSkeleton = computed(() => loading.value && entries.value.length === 0)
const showError = computed(() => error.value != null && entries.value.length === 0)
const showDownloadProgress = computed(() => regionState.value.refreshing && entries.value.length === 0)
const emptyMessage = computed(() => (
  aliasPending.value ? t("musicLibrary.list.results.aliasSearching") : t("musicLibrary.list.results.empty")
))

const resultsEl = ref<HTMLElement | null>(null)
const ready = computed(() => !showSkeleton.value && !showError.value && (rows.value.length > 0 || listReady.value))
useCatalogScrollMemory(ready)

onMounted(() => {
  void preloadSearchPinyin()
})

function handleSortUpdate(value: string) {
  if ((MUSIC_QUERY_SORTS as readonly string[]).includes(value)) {
    state.sort = value as MusicQuerySort
  }
}

function handleViewUpdate(value: string) {
  if ((MUSIC_VIEWS as readonly string[]).includes(value)) {
    view.value = value as MusicView
  }
}
</script>

<template>
  <CatalogPageShell :title="t('musicLibrary.list.title')" :description="t('musicLibrary.list.description')" class="py-4">
    <template #toolbar>
      <CatalogSearchField
        v-model="state.q"
        compact
        :label="t('musicLibrary.list.filters.search')"
        :placeholder="t('musicLibrary.list.filters.searchPlaceholder')"
      />
      <CatalogRegionSelect />
    </template>

    <template #filters>
      <CatalogFilterPanel
        :title="t('musicLibrary.list.filters.title')"
        :count-label="ready ? countLabel : null"
        :reset-label="t('musicLibrary.list.filters.reset')"
        page-key="music"
        :active-count="activeFilterCount"
        :active-chips="activeChips"
        @reset="reset()"
        @remove-chip="removeMusicChip(state, $event)"
      >
        <MusicFilterFields
          :state="state"
          :difficulty-options="difficultyOptions"
          :tag-options="tagOptions"
          :category-options="categoryOptions"
          :year-options="yearOptions"
          :characters="characters"
          :unit-color-map="unitColorMap"
          :level-bounds="levelBounds"
          :has-categories="hasCategories"
        />
      </CatalogFilterPanel>
    </template>

    <div v-if="showDownloadProgress" class="grid gap-2 rounded-md border bg-muted/20 p-3">
      <p class="text-xs text-muted-foreground">
        {{ t("catalog.results.downloading", { progress: Math.round(regionState.progress) }) }}
      </p>
      <Progress :model-value="regionState.progress" />
    </div>

    <CatalogErrorState
      v-if="showError"
      :message="t('catalog.results.loadError')"
      :detail="error"
      :retrying="refreshing"
      @retry="reload"
    />
    <template v-else>
      <CatalogResultsBar
        v-model:direction="state.dir"
        :sort="state.sort"
        :view="view"
        :count-label="ready ? countLabel : null"
        :sort-options="sortOptions"
        :view-options="viewOptions"
        @update:sort="handleSortUpdate"
        @update:view="handleViewUpdate"
      />

      <div ref="resultsEl">
        <MusicResults
          v-if="showSkeleton || rows.length > 0"
          :rows="rows"
          :view="view"
          :skeleton="showSkeleton"
          :blur="blurUnreleased"
        />
        <CatalogEmptyState v-else :message="emptyMessage" :hint="t('catalog.results.emptyHint')" />
      </div>
    </template>

    <template #footer>
      <CatalogPagination
        v-if="!showError && rows.length > 0"
        v-model:page="state.page"
        v-model:page-size="state.size"
        :total="visibleEntries.length"
        :total-pages="totalPages"
        :anchor="resultsEl"
        hide-when-single-page
      />
    </template>
  </CatalogPageShell>
</template>
