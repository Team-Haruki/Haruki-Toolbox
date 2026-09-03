<script setup lang="ts">
import { computed, onMounted, ref, toRef } from "vue"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { LucidePackageOpen } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useCatalogScrollMemory } from "@/composables/useCatalogScrollMemory"
import { isNarrowViewport, useCatalogViewPreference } from "@/composables/useCatalogViewPreference"
import { useNowTick } from "@/composables/useNowTick"
import { usePagedSlice } from "@/composables/usePagedSlice"
import { useRouteQueryState } from "@/composables/useRouteQueryState"
import { preloadSearchPinyin } from "@/lib/search-match"
import CatalogEmptyState from "@/shared/components/catalog/CatalogEmptyState.vue"
import CatalogEntityGrid from "@/shared/components/catalog/CatalogEntityGrid.vue"
import CatalogErrorState from "@/shared/components/catalog/CatalogErrorState.vue"
import CatalogFilterPanel from "@/shared/components/catalog/CatalogFilterPanel.vue"
import CatalogPageShell from "@/shared/components/catalog/CatalogPageShell.vue"
import CatalogPagination from "@/shared/components/catalog/CatalogPagination.vue"
import CatalogRegionSelect from "@/shared/components/catalog/CatalogRegionSelect.vue"
import CatalogResultsBar from "@/shared/components/catalog/CatalogResultsBar.vue"
import CatalogSearchField from "@/shared/components/catalog/CatalogSearchField.vue"
import type { CatalogSortOption } from "@/shared/components/catalog/types"
import { buildCatalogCardThumbnail } from "@/shared/sekai/catalog"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import CardListFilters from "@/modules/cards/components/CardListFilters.vue"
import CardTile from "@/modules/cards/components/CardTile.vue"
import { useCardsList } from "@/modules/cards/composables/useCardsList"
import {
  CARD_SORTS,
  collectCardReleaseYears,
  excludeUnreleasedCards,
  filterCards,
  isCardSort,
  isCardUnreleased,
  resolveCardSupplyType,
  sortCardsBy,
} from "@/modules/cards/lib/card-filter"
import {
  CARD_ART_MODES,
  buildCardsActiveChips,
  cardsQueryCodec,
  removeCardsQueryChip,
  toCardListFilters,
  type CardArtMode,
} from "@/modules/cards/lib/card-query"

const { t, te } = useI18n()
const list = useCardsList()
const { hideUnreleased, blurUnreleased } = useUnreleasedContentDisplay()
const now = useNowTick(60_000)

const { state, patch, reset, activeFilterCount } = useRouteQueryState(cardsQueryCodec, {
  debounceKeys: ["q"],
  pageKey: "page",
  pageNeutralKeys: ["size"],
})

const artMode = useCatalogViewPreference<CardArtMode>(
  "cards",
  "art",
  () => (isNarrowViewport() ? "normal" : "both"),
  CARD_ART_MODES,
)

const visibleCards = computed(() => excludeUnreleasedCards(list.cards.value, hideUnreleased.value, now.value))
const years = computed(() => collectCardReleaseYears(visibleCards.value))

const sortedCards = computed(() => sortCardsBy(
  filterCards(visibleCards.value, toCardListFilters(state), {
    characterMap: list.characterMap.value,
    supplyTypeMap: list.supplyTypeMap.value,
    worldBloomCardIds: list.worldBloomCardIds.value,
    skillTypeBySkillId: list.skillTypeBySkillId.value,
  }),
  state.sort,
  state.dir,
  list.maxPowerById.value,
))

const { pageItems, totalPages } = usePagedSlice(sortedCards, toRef(state, "page"), toRef(state, "size"))

const tiles = computed(() => pageItems.value.map((card) => ({
  card,
  thumbnail: buildCatalogCardThumbnail(card, list.region.value, list.assetEndpoint.value),
  characterName: card.characterId != null ? list.characterMap.value.get(card.characterId)?.name ?? null : null,
  supplyType: resolveCardSupplyType(card, list.supplyTypeMap.value, list.worldBloomCardIds.value),
  unreleased: isCardUnreleased(card.releaseAt, now.value),
})))

const characterNames = computed(() => new Map(
  [...list.characterMap.value.values()].map((character) => [character.id, character.name] as const),
))
const activeChips = computed(() => buildCardsActiveChips(state, { characterNames: characterNames.value, labels: { t, te } }))
const countLabel = computed(() => t("cards.list.total", { total: sortedCards.value.length }))
const sortOptions = computed<CatalogSortOption[]>(() => CARD_SORTS.map((sort) => ({
  value: sort,
  label: t(`cardCatalog.sort.${sort}`),
})))

/** `both` shows two thumbnails per tile, so the grid gets one column less. */
const gridClass = computed(() => (artMode.value === "both"
  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
  : undefined))

/** Matches a tile's art box: one square in the single-art modes, two side by side in `both`. */
const skeletonArtClass = computed(() => (artMode.value === "both" ? "aspect-[2/1] w-full" : "aspect-square w-full"))

const ready = computed(() => list.ready.value && !list.error.value)
const resultsRef = ref<HTMLElement | null>(null)

useCatalogScrollMemory(ready)

onMounted(() => {
  void preloadSearchPinyin()
})

function setSort(value: string) {
  if (isCardSort(value)) {
    state.sort = value
  }
}

function setArtMode(value: AcceptableValue | AcceptableValue[] | undefined) {
  if (typeof value === "string" && (CARD_ART_MODES as readonly string[]).includes(value)) {
    artMode.value = value as CardArtMode
  }
}
</script>

<template>
  <CatalogPageShell :title="t('cards.list.title')" :description="t('cards.list.description')">
    <template #actions>
      <Button as-child variant="outline" size="sm" class="gap-1.5">
        <RouterLink :to="{ name: 'cards.box' }">
          <LucidePackageOpen class="size-4" />
          {{ t("cardBox.entryLink") }}
        </RouterLink>
      </Button>
    </template>

    <template #toolbar>
      <CatalogSearchField
        v-model="state.q"
        :label="t('catalog.search.label')"
        :placeholder="t('cards.list.searchPlaceholder')"
        compact
      />
      <CatalogRegionSelect />
    </template>

    <template #filters>
      <CatalogFilterPanel
        :title="t('catalog.filters.title')"
        :reset-label="t('catalog.filters.reset')"
        :count-label="ready ? countLabel : null"
        page-key="cards"
        :active-count="activeFilterCount"
        :active-chips="activeChips"
        content-class="flex flex-col gap-3"
        @reset="reset()"
        @remove-chip="removeCardsQueryChip(state, $event)"
      >
        <CardListFilters
          :state="state"
          @patch="patch"
          :characters="list.characters.value"
          :unit-color-map="list.unitColorMap.value"
          :years="years"
        />
      </CatalogFilterPanel>
    </template>

    <div ref="resultsRef" class="flex flex-col gap-3">
      <CatalogResultsBar
        :count-label="ready ? countLabel : null"
        :sort-options="sortOptions"
        :sort="state.sort"
        v-model:direction="state.dir"
        sticky
        @update:sort="setSort"
      >
        <template #extra>
          <!-- Items go compact below `sm` so sort + direction + art mode share one row on phones. -->
          <ToggleGroup
            type="single"
            variant="segment"
            size="sm"
            :model-value="artMode"
            :aria-label="t('cardCatalog.artMode.label')"
            @update:model-value="setArtMode"
          >
            <ToggleGroupItem
              v-for="mode in CARD_ART_MODES"
              :key="mode"
              :value="mode"
              class="px-1.5 text-[11px] sm:px-2 sm:text-xs"
            >
              {{ t(`cardCatalog.artMode.${mode}`) }}
            </ToggleGroupItem>
          </ToggleGroup>
        </template>
      </CatalogResultsBar>

      <CatalogErrorState
        v-if="list.error.value && !list.loading.value"
        :message="t('cards.common.loadError')"
        :detail="list.error.value"
        :retrying="list.refreshing.value"
        @retry="list.reload"
      />

      <CatalogEntityGrid v-else-if="list.loading.value" columns="cards" :class="gridClass">
        <div v-for="index in 18" :key="index" class="flex flex-col gap-1.5">
          <Skeleton :class="[skeletonArtClass, 'rounded-md']" />
          <Skeleton class="h-3 w-4/5" />
          <Skeleton class="h-3 w-1/2" />
        </div>
      </CatalogEntityGrid>

      <CatalogEmptyState
        v-else-if="tiles.length === 0"
        :message="t('cards.list.empty')"
        :hint="t('catalog.results.emptyHint')"
      >
        <template v-if="activeFilterCount > 0" #action>
          <Button variant="outline" size="sm" @click="reset()">{{ t("catalog.filters.clearAll") }}</Button>
        </template>
      </CatalogEmptyState>

      <CatalogEntityGrid v-else columns="cards" :class="gridClass">
        <CardTile
          v-for="tile in tiles"
          :key="tile.card.id"
          :card="tile.card"
          :thumbnail="tile.thumbnail"
          :character-name="tile.characterName"
          :supply-type="tile.supplyType"
          :unreleased="tile.unreleased"
          :blur="tile.unreleased && blurUnreleased"
          :art-mode="artMode"
        />
      </CatalogEntityGrid>
    </div>

    <template #footer>
      <CatalogPagination
        v-if="ready && tiles.length > 0"
        v-model:page="state.page"
        v-model:page-size="state.size"
        :total="sortedCards.length"
        :total-pages="totalPages"
        :anchor="resultsRef"
        hide-when-single-page
      />
    </template>
  </CatalogPageShell>
</template>
