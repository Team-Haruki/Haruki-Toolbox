<script setup lang="ts">
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import MissingGameDataNotice from "@/shared/components/MissingGameDataNotice.vue"
import { useUserDataPageState } from "@/shared/sekai/user-snapshot/use-user-data-page-state"
import { useSuiteRefresh } from "@/shared/sekai/user-snapshot/use-suite-refresh"
import { useUploadTimeText } from "@/shared/sekai/user-snapshot/upload-time"

import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useMediaQuery } from "@vueuse/core"
import { LucideChevronsDownUp, LucideChevronsUpDown, LucideRefreshCw } from "lucide-vue-next"
import type { AcceptableValue } from "reka-ui"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import GameAccountSelect from "@/shared/components/GameAccountSelect.vue"
import CatalogFilterPanel from "@/shared/components/catalog/CatalogFilterPanel.vue"
import type { CatalogActiveChip } from "@/shared/components/catalog/CatalogFilterPanel.vue"
import CatalogPagination from "@/shared/components/catalog/CatalogPagination.vue"
import { useCatalogViewPreference } from "@/composables/useCatalogViewPreference"
import { useRouteQueryState } from "@/composables/useRouteQueryState"
import { useGameAccountSelection, useUserSuite } from "@/shared/sekai/user-snapshot/use-user-suite"
import {
  SEKAI_CARD_ATTR_COLORS,
  buildCatalogCardThumbnail,
  resolveSekaiCharacterColor,
  type CatalogMasterCard,
  type SekaiUnit,
} from "@/shared/sekai/catalog"
import {
  resolveCardAttrRoundIconUrl,
  resolveTrainRankImageUrl,
  resolveUnitLogoUrl,
} from "@/shared/sekai/data-sources"
import { resolveSekaiAttrLabel, resolveSekaiRarityLabel, resolveSekaiUnitLabel } from "@/shared/sekai/labels"
import type { SekaiRegion } from "@/types"
import type { CardRarityType } from "@/modules/cards/lib/card-filter"
import {
  CARD_BOX_GROUP_MODES,
  CARD_BOX_SORTS,
  applyCardBoxFilters,
  buildAttrDistribution,
  buildCharacterDistribution,
  buildOwnedCardMap,
  buildRarityDistribution,
  buildUnitDistribution,
  countActiveCardBoxFilters,
  type CardBoxFilters,
  filterReleasedCards,
  groupCardsByAttr,
  groupCardsByCharacter,
  isCardBoxGroupMode,
  isCardBoxSort,
  isCardTrained,
  normalizeUserCards,
  sortCardBoxCards,
  summarizeCollection,
  type CardBoxCardView,
  type CardBoxGroupMode,
  type CardBoxSort,
} from "@/modules/cards/lib/card-box"
import { CARD_BOX_PAGE_SIZES, CARD_BOX_QUERY_CODEC } from "@/modules/cards/lib/card-box-query"
import { useCardBoxCatalog } from "@/modules/cards/composables/useCardBoxCatalog"
import CardBoxCardGrid from "@/modules/cards/components/CardBoxCardGrid.vue"
import CardBoxCharacterStrip, { type CardBoxCharacterNavRow } from "@/modules/cards/components/CardBoxCharacterStrip.vue"
import CardBoxFilterFields from "@/modules/cards/components/CardBoxFilterFields.vue"
import CardBoxOverview, { type CardBoxOverviewGroup } from "@/modules/cards/components/CardBoxOverview.vue"
import CardBoxSection from "@/modules/cards/components/CardBoxSection.vue"

const { t, te } = useI18n()
const labels = { t, te }

const { selectedAccount } = useGameAccountSelection({ capability: "suite" })
const accountRegion = computed<SekaiRegion | null>(() => selectedAccount.value?.server ?? null)

const {
  status: suiteStatus,
  data: suiteData,
  uploadTime,
  error: suiteError,
  reload: reloadSuite,
} = useUserSuite(["userCards"], selectedAccount)

const {
  loading: catalogLoading,
  error: catalogError,
  assetEndpoint,
  cards,
  characterMap,
  unitColorMap,
  reload: reloadCatalog,
} = useCardBoxCatalog(accountRegion)

// --- View state ---------------------------------------------------------------
// Filters (and the phone pagination) live in the URL so a reload keeps them;
// grouping and sort are remembered like the catalog's view preferences.
const query = useRouteQueryState(CARD_BOX_QUERY_CODEC, { pageKey: "page" })
const filters = query.state

function patchFilters(next: Partial<CardBoxFilters>) {
  query.patch(next)
}
const groupMode = useCatalogViewPreference<CardBoxGroupMode>("card-box", "group", () => "character", CARD_BOX_GROUP_MODES)
const sort = useCatalogViewPreference<CardBoxSort>("card-box", "sort", () => "id", CARD_BOX_SORTS)
const collapsedKeys = ref<Set<string>>(new Set())

const now = Date.now()

// --- Data pipeline -----------------------------------------------------------------
const userCards = computed(() => normalizeUserCards(suiteData.value?.userCards))
const ownedMap = computed(() => buildOwnedCardMap(userCards.value))
const releasedCards = computed(() => filterReleasedCards(cards.value, now))
const characters = computed(() => [...characterMap.value.values()])

function unitOf(characterId: number): SekaiUnit | null {
  return characterMap.value.get(characterId)?.unit ?? null
}

const filtered = computed(() => applyCardBoxFilters(releasedCards.value, ownedMap.value, filters, unitOf))
/** Every card the filters admit, owned or not: the denominator of all progress figures. */
const scopedCards = computed(() => filtered.value.scoped)
const visibleCards = computed(() => sortCardBoxCards(filtered.value.visible, ownedMap.value, sort.value))

// Phones page the (up to ~1,500) tiles instead of rendering a 24,000px
// document; wide screens keep the single page and rely on content-visibility.
const isNarrow = useMediaQuery("(max-width: 767px)")
const totalPages = computed(() => isNarrow.value ? Math.max(1, Math.ceil(visibleCards.value.length / filters.size)) : 1)
const currentPage = computed(() => Math.min(Math.max(1, filters.page), totalPages.value))
const pagedCards = computed(() => {
  if (!isNarrow.value) {
    return visibleCards.value
  }
  const start = (currentPage.value - 1) * filters.size
  return visibleCards.value.slice(start, start + filters.size)
})
const showPagination = computed(() => isNarrow.value && visibleCards.value.length > filters.size)

const overall = computed(() => summarizeCollection(scopedCards.value, ownedMap.value))
const characterDistribution = computed(() => buildCharacterDistribution(scopedCards.value, ownedMap.value))
const attrDistribution = computed(() => buildAttrDistribution(scopedCards.value, ownedMap.value))

// The roster strip ignores the character filter so it always shows the
// whole cast; everything else the filters say still applies to its rings.
const rosterScope = computed(() =>
  applyCardBoxFilters(releasedCards.value, ownedMap.value, { ...filters, characterIds: [] }, unitOf).scoped,
)
const rosterRows = computed<CardBoxCharacterNavRow[]>(() =>
  buildCharacterDistribution(rosterScope.value, ownedMap.value)
    .filter((row) => row.characterId > 0)
    .map((row) => {
      const character = characterMap.value.get(row.characterId) ?? null
      return {
        characterId: row.characterId,
        name: character?.name ?? t("cardBox.unknownCharacter"),
        iconUrl: character?.iconUrl ?? null,
        color: resolveSekaiCharacterColor(row.characterId)
          ?? (character?.unit != null ? unitColorMap.value.get(character.unit) : undefined)
          ?? "#94a3b8",
        owned: row.owned,
        total: row.total,
        percent: row.percent,
      }
    }),
)

const { isLoading, hasError, isReady, suiteDataMissing, errorMessage, errorDetail } = useUserDataPageState({
  status: suiteStatus,
  error: suiteError,
  masterLoading: catalogLoading,
  masterError: catalogError,
  account: selectedAccount,
  fallback: () => t("cardBox.loadError"),
})

const uploadTimeText = useUploadTimeText(uploadTime)

// --- Tiles ---------------------------------------------------------------------------
function makeCardView(card: CatalogMasterCard): CardBoxCardView {
  const record = ownedMap.value.get(card.id) ?? null
  return {
    card,
    thumbnail: {
      ...buildCatalogCardThumbnail(card, accountRegion.value ?? "jp", assetEndpoint.value),
      trainRankUrl: record != null && record.masterRank > 0 ? resolveTrainRankImageUrl(record.masterRank) : null,
    },
    record,
    trained: record != null && isCardTrained(record),
  }
}

function sectionKey(kind: "character" | "attr", key: number | string): string {
  return `card-box-${kind}-${key}`
}

const characterSections = computed(() => {
  const progressByCharacter = new Map(characterDistribution.value.map((row) => [row.characterId, row]))
  return groupCardsByCharacter(pagedCards.value, ownedMap.value).map((group) => {
    const character = characterMap.value.get(group.key) ?? null
    const progress = progressByCharacter.get(group.key) ?? null
    const unitColor = character?.unit != null ? unitColorMap.value.get(character.unit) ?? null : null
    return {
      key: sectionKey("character", group.key),
      characterId: group.key,
      name: character?.name ?? t("cardBox.unknownCharacter"),
      iconUrl: character?.iconUrl ?? null,
      color: resolveSekaiCharacterColor(group.key) ?? unitColor,
      owned: progress?.owned ?? group.owned,
      total: progress?.total ?? group.total,
      percent: progress?.percent ?? 0,
      views: group.cards.map(makeCardView),
    }
  })
})

const attrSections = computed(() => {
  const progressByAttr = new Map(attrDistribution.value.map((row) => [row.attr, row]))
  return groupCardsByAttr(pagedCards.value, ownedMap.value).map((group) => {
    const progress = progressByAttr.get(group.key) ?? null
    return {
      key: sectionKey("attr", group.key),
      name: resolveSekaiAttrLabel(labels, group.key),
      iconUrl: resolveCardAttrRoundIconUrl(group.key),
      color: SEKAI_CARD_ATTR_COLORS[group.key] ?? null,
      owned: progress?.owned ?? group.owned,
      total: progress?.total ?? group.total,
      percent: progress?.percent ?? 0,
      views: group.cards.map(makeCardView),
    }
  })
})

const flatViews = computed(() => pagedCards.value.map(makeCardView))

const visibleEmpty = computed(() => visibleCards.value.length === 0)

// --- Overview -------------------------------------------------------------------------
const RARITY_COLORS: Record<CardRarityType, string> = {
  rarity_1: "#9ca3af",
  rarity_2: "#60a5fa",
  rarity_3: "#a78bfa",
  rarity_4: "#f59e0b",
  rarity_birthday: "#f472b6",
}

const overviewGroups = computed<CardBoxOverviewGroup[]>(() => [
  {
    key: "rarity",
    title: t("cardBox.stats.byRarity"),
    rows: buildRarityDistribution(scopedCards.value, ownedMap.value).map((row) => ({
      key: row.rarity,
      label: resolveSekaiRarityLabel(labels, row.rarity),
      rarity: row.rarity,
      iconUrls: [],
      color: RARITY_COLORS[row.rarity],
      owned: row.owned,
      total: row.total,
      percent: row.percent,
    })),
  },
  {
    key: "attr",
    title: t("cardBox.stats.byAttr"),
    rows: attrDistribution.value.map((row) => ({
      key: row.attr,
      label: resolveSekaiAttrLabel(labels, row.attr),
      iconUrls: [resolveCardAttrRoundIconUrl(row.attr)],
      color: SEKAI_CARD_ATTR_COLORS[row.attr] ?? null,
      owned: row.owned,
      total: row.total,
      percent: row.percent,
    })),
  },
  {
    key: "unit",
    title: t("cardBox.stats.byUnit"),
    wide: true,
    rows: buildUnitDistribution(scopedCards.value, ownedMap.value, unitOf).map((row) => ({
      key: row.unit,
      label: resolveSekaiUnitLabel(labels, row.unit),
      iconUrls: [resolveUnitLogoUrl(row.unit)],
      color: unitColorMap.value.get(row.unit) ?? null,
      owned: row.owned,
      total: row.total,
      percent: row.percent,
    })),
  },
])

// --- Filter panel chrome -------------------------------------------------------------
const activeFilterCount = computed(() => countActiveCardBoxFilters(filters))

const activeChips = computed<CatalogActiveChip[]>(() => [
  ...filters.characterIds.map((characterId) => ({
    key: `char:${characterId}`,
    label: characterMap.value.get(characterId)?.name ?? `#${characterId}`,
  })),
  ...filters.units.map((unit) => ({ key: `unit:${unit}`, label: resolveSekaiUnitLabel(labels, unit) })),
  ...filters.attrs.map((attr) => ({ key: `attr:${attr}`, label: resolveSekaiAttrLabel(labels, attr) })),
  ...filters.rarities.map((rarity) => ({ key: `rar:${rarity}`, label: resolveSekaiRarityLabel(labels, rarity) })),
  ...(filters.ownership === "all" ? [] : [{ key: "own", label: t(`cardBox.ownership.${filters.ownership}`) }]),
])

function removeChip(key: string) {
  const [kind, value] = key.split(":")
  if (kind === "char") {
    query.patch({ characterIds: filters.characterIds.filter((id) => String(id) !== value) })
  } else if (kind === "unit") {
    query.patch({ units: filters.units.filter((unit) => unit !== value) })
  } else if (kind === "attr") {
    query.patch({ attrs: filters.attrs.filter((attr) => attr !== value) })
  } else if (kind === "rar") {
    query.patch({ rarities: filters.rarities.filter((rarity) => rarity !== value) })
  } else if (kind === "own") {
    query.patch({ ownership: "all" })
  }
}

function resetFilters() {
  query.reset()
}

const countLabel = computed(() => t("cardBox.total", { total: visibleCards.value.length }))

function setGroupMode(value: AcceptableValue | AcceptableValue[] | undefined) {
  if (typeof value === "string" && isCardBoxGroupMode(value)) {
    groupMode.value = value
  }
}

function setSort(value: AcceptableValue | AcceptableValue[] | undefined) {
  if (typeof value === "string" && isCardBoxSort(value)) {
    sort.value = value
  }
}

// --- Sections: collapse + roster navigation --------------------------------------------
const currentSectionKeys = computed(() =>
  groupMode.value === "character"
    ? characterSections.value.map((section) => section.key)
    : groupMode.value === "attr" ? attrSections.value.map((section) => section.key) : [],
)

const allCollapsed = computed(() =>
  currentSectionKeys.value.length > 0 && currentSectionKeys.value.every((key) => collapsedKeys.value.has(key)),
)

function toggleSection(key: string) {
  const next = new Set(collapsedKeys.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  collapsedKeys.value = next
}

function toggleAllSections() {
  collapsedKeys.value = allCollapsed.value ? new Set() : new Set(currentSectionKeys.value)
}

/** Character whose section is in view (character grouping) or is the sole character filter. */
const activeCharacterId = ref<number | null>(null)

const rosterActiveId = computed(() => {
  if (groupMode.value === "character") {
    return activeCharacterId.value
  }

  return filters.characterIds.length === 1 ? filters.characterIds[0] ?? null : null
})

function handleRosterSelect(characterId: number) {
  if (groupMode.value !== "character") {
    query.patch({
      characterIds: filters.characterIds.length === 1 && filters.characterIds[0] === characterId ? [] : [characterId],
    })
    return
  }

  const key = sectionKey("character", characterId)
  if (collapsedKeys.value.has(key)) {
    toggleSection(key)
  }
  // The section is filtered away: widen the filter rather than scrolling
  // nowhere. The page jump below goes into the same patch, because a
  // filter change on its own resets the page to 1 (`pageKey` rule).
  const widen = filters.characterIds.length > 0 && !filters.characterIds.includes(characterId)
  const patch: Parameters<typeof query.patch>[0] = widen ? { characterIds: [] } : {}
  if (isNarrow.value) {
    // On a paged phone view the character may sit on another page. Look it
    // up in the list the widened filter will show.
    const cards = widen
      ? sortCardBoxCards(
        applyCardBoxFilters(releasedCards.value, ownedMap.value, { ...filters, characterIds: [] }, unitOf).visible,
        ownedMap.value,
        sort.value,
      )
      : visibleCards.value
    const index = cards.findIndex((card) => card.characterId === characterId)
    if (index >= 0) {
      const targetPage = Math.floor(index / filters.size) + 1
      if (targetPage !== currentPage.value) {
        patch.page = targetPage
      }
    }
  }
  if (Object.keys(patch).length > 0) {
    query.patch(patch)
  }
  void nextTick(() => scrollToSection(key))
}

/** Sticky app header + roster strip; matches the sections' `scroll-mt-28`. */
const SECTION_SCROLL_OFFSET = 112

/**
 * Sections above the target are `content-visibility: auto` placeholders
 * until they render, so one scroll lands short. Re-align for a few frames
 * while their real heights settle.
 */
function scrollToSection(key: string) {
  const element = document.getElementById(key)
  if (element == null) {
    return
  }

  let attempts = 0
  const align = () => {
    const delta = element.getBoundingClientRect().top - SECTION_SCROLL_OFFSET
    if (Math.abs(delta) > 1) {
      window.scrollBy(0, delta)
    }
    attempts += 1
    if (attempts < 12) {
      requestAnimationFrame(align)
    }
  }
  align()
}

let sectionObserver: IntersectionObserver | null = null

function observeSections() {
  sectionObserver?.disconnect()
  sectionObserver = null
  if (groupMode.value !== "character" || typeof IntersectionObserver === "undefined") {
    activeCharacterId.value = null
    return
  }

  const inView = new Map<number, number>()
  sectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const characterId = Number((entry.target as HTMLElement).dataset.characterId)
      if (entry.isIntersecting) {
        inView.set(characterId, entry.boundingClientRect.top)
      } else {
        inView.delete(characterId)
      }
    }
    // Topmost visible section wins.
    const first = [...inView.entries()].sort((a, b) => a[1] - b[1])[0]
    if (first) {
      activeCharacterId.value = first[0]
    }
  }, { rootMargin: "-112px 0px -55% 0px" })

  for (const section of characterSections.value) {
    const element = document.getElementById(section.key)
    if (element) {
      element.dataset.characterId = String(section.characterId)
      sectionObserver.observe(element)
    }
  }
}

watch([groupMode, () => characterSections.value.map((section) => section.key).join(","), isReady], () => {
  void nextTick(observeSections)
}, { immediate: true })

onBeforeUnmount(() => {
  sectionObserver?.disconnect()
})

const { refreshing, refresh } = useSuiteRefresh([
  () => reloadSuite("check-remote"),
  () => reloadCatalog(),
])

function retry() {
  if (catalogError.value != null) {
    reloadCatalog()
  }

  if (suiteStatus.value === "error") {
    void reloadSuite("check-remote")
  }
}

const paginationAnchor = ref<HTMLElement | null>(null)
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-4">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t("cardBox.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("cardBox.description") }}</p>
      </div>
      <div class="flex flex-col items-start gap-1.5 sm:items-end">
        <GameAccountSelect capability="suite" />
        <!-- Same placement as the profile page: the data time and its refresh sit together. -->
        <div v-if="suiteStatus !== 'idle'" class="flex items-center gap-1 text-xs text-muted-foreground">
          <span v-if="uploadTimeText">{{ t("uploadedGameData.uploadedAt", { time: uploadTimeText }) }}</span>
          <Button variant="ghost" size="sm" class="h-6 gap-1 px-1.5 text-xs text-muted-foreground" :disabled="isLoading || refreshing" @click="refresh">
            <LucideRefreshCw :class="['size-3.5', refreshing ? 'animate-spin' : '']" />
            {{ t("cardBox.refresh") }}
          </Button>
        </div>
      </div>
    </div>

    <!-- No account selected -->
    <Card v-if="suiteStatus === 'idle'">
      <CardContent class="py-12 text-center text-sm text-muted-foreground">
        {{ t("cardBox.noAccountHint") }}
      </CardContent>
    </Card>

    <!-- Missing upload: guidance, not an error -->
    <Card v-else-if="suiteDataMissing">
      <CardContent class="py-10">
        <MissingGameDataNotice :granted="selectedAccount?.ownership === 'granted'" />
      </CardContent>
    </Card>

    <!-- Backend / masterdata failure -->
    <Card v-else-if="hasError && !isLoading">
      <CardContent>
        <LoadErrorState
          :description="errorMessage"
          :detail="errorDetail"
          :retry-label="t('cardBox.retry')"
          :retrying="isLoading"
          @retry="retry"
        />
      </CardContent>
    </Card>

    <!-- Loading skeleton -->
    <template v-else-if="isLoading">
      <Skeleton class="h-9 w-full max-w-md" />
      <div class="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        <Skeleton v-for="index in 30" :key="index" class="aspect-square w-full rounded-md" />
      </div>
    </template>

    <template v-else-if="isReady">
      <!-- Roster: sticky navigation with a progress ring per character -->
      <CardBoxCharacterStrip :rows="rosterRows" :active-id="rosterActiveId" @select="handleRosterSelect" />

      <CatalogFilterPanel
        :title="t('catalog.filters.title')"
        :reset-label="t('catalog.filters.reset')"
        :count-label="countLabel"
        page-key="card-box"
        :active-count="activeFilterCount"
        :active-chips="activeChips"
        content-class="flex flex-col gap-3"
        @reset="resetFilters"
        @remove-chip="removeChip"
      >
        <CardBoxFilterFields :state="filters" :characters="characters" :unit-color-map="unitColorMap" @patch="patchFilters" />
      </CatalogFilterPanel>

      <CardBoxOverview :summary="overall" :groups="overviewGroups" />

      <!-- View toolbar: grouping, sort, collapse -->
      <div ref="paginationAnchor" class="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="mr-1 text-xs font-medium text-muted-foreground">{{ t("cardBox.group.label") }}</span>
          <ToggleGroup type="single" variant="segment" size="sm" :model-value="groupMode" :aria-label="t('cardBox.group.label')" @update:model-value="setGroupMode">
            <ToggleGroupItem v-for="mode in CARD_BOX_GROUP_MODES" :key="mode" :value="mode">
              {{ t(`cardBox.group.${mode}`) }}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="mr-1 text-xs font-medium text-muted-foreground">{{ t("catalog.sort.label") }}</span>
          <ToggleGroup type="single" variant="segment" size="sm" :model-value="sort" :aria-label="t('catalog.sort.label')" @update:model-value="setSort">
            <ToggleGroupItem v-for="option in CARD_BOX_SORTS" :key="option" :value="option">
              {{ t(`cardBox.sort.${option}`) }}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <span class="text-xs tabular-nums text-muted-foreground">{{ countLabel }}</span>
        <Button
          v-if="currentSectionKeys.length > 1"
          variant="ghost"
          size="sm"
          class="ml-auto h-7 gap-1 text-xs text-muted-foreground"
          @click="toggleAllSections"
        >
          <LucideChevronsUpDown v-if="allCollapsed" class="size-3.5" />
          <LucideChevronsDownUp v-else class="size-3.5" />
          {{ allCollapsed ? t("cardBox.sections.expandAll") : t("cardBox.sections.collapseAll") }}
        </Button>
      </div>

      <!-- Empty -->
      <Card v-if="visibleEmpty">
        <CardContent class="py-12 text-center text-muted-foreground">
          {{ t("cardBox.empty") }}
        </CardContent>
      </Card>

      <template v-else>
        <CatalogPagination
          v-if="showPagination"
          v-model:page="filters.page"
          v-model:page-size="filters.size"
          :total-pages="totalPages"
          :total="visibleCards.length"
          :page-size-options="CARD_BOX_PAGE_SIZES"
          :anchor="paginationAnchor"
        />

        <!-- Grouped by character -->
        <template v-if="groupMode === 'character'">
          <CardBoxSection
            v-for="section in characterSections"
            :id="section.key"
            :key="section.key"
            :name="section.name"
            :icon-url="section.iconUrl"
            :color="section.color"
            :owned="section.owned"
            :total="section.total"
            :percent="section.percent"
            :views="section.views"
            :collapsed="collapsedKeys.has(section.key)"
            @toggle="toggleSection(section.key)"
          />
        </template>

        <!-- Grouped by attribute -->
        <template v-else-if="groupMode === 'attr'">
          <CardBoxSection
            v-for="section in attrSections"
            :id="section.key"
            :key="section.key"
            :name="section.name"
            :icon-url="section.iconUrl"
            :color="section.color"
            :owned="section.owned"
            :total="section.total"
            :percent="section.percent"
            :views="section.views"
            :collapsed="collapsedKeys.has(section.key)"
            @toggle="toggleSection(section.key)"
          />
        </template>

        <!-- Flat grid -->
        <CardBoxCardGrid v-else :views="flatViews" />

        <CatalogPagination
          v-if="showPagination"
          v-model:page="filters.page"
          v-model:page-size="filters.size"
          :total-pages="totalPages"
          :total="visibleCards.length"
          :page-size-options="CARD_BOX_PAGE_SIZES"
          :anchor="paginationAnchor"
        />
      </template>
    </template>
  </div>
</template>
