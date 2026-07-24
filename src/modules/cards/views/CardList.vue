<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LucideChevronDown,
  LucideChevronLeft,
  LucideChevronRight,
  LucidePackageOpen,
  LucideRotateCcw,
  LucideSearch,
} from "lucide-vue-next"
import { SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { SEKAI_CATALOG_REGION_FOLLOW_VALUE } from "@/shared/sekai/catalog-region"
import type { SekaiCardAttr, SekaiUnit } from "@/shared/sekai/catalog"
import {
  buildCatalogCardThumbnail,
  SEKAI_CARD_ATTRS,
  SEKAI_UNITS,
} from "@/shared/sekai/catalog"
import { resolveCardAttrIconUrl, resolveUnitLogoUrl } from "@/shared/sekai/data-sources"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import type { CardRarityType, CardSortKey, CardSupplyType } from "@/modules/cards/lib/card-filter"
import {
  CARD_RARITY_TYPES,
  CARD_SORT_KEYS,
  CARD_SUPPLY_TYPES,
  collectCardReleaseYears,
  countCardPages,
  createDefaultCardFilters,
  excludeUnreleasedCards,
  filterCards,
  isCardUnreleased,
  paginateCards,
  sortCards,
} from "@/modules/cards/lib/card-filter"
import { useCardCatalog } from "@/modules/cards/composables/useCardCatalog"
import CardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"

const PAGE_SIZE = 60
const YEAR_ALL = "all"

const { t, locale } = useI18n()

const {
  loading,
  error,
  region,
  regionSelectorValue,
  updateRegionSelector,
  assetEndpoint,
  cards,
  characterMap,
  unitColorMap,
  supplyTypeMap,
  reload,
} = useCardCatalog()

const filters = reactive(createDefaultCardFilters())
const sortKey = ref<CardSortKey>("releaseDesc")
const page = ref(1)
const showTrained = ref(false)

const selectedYear = computed<string>({
  get: () => (filters.year == null ? YEAR_ALL : String(filters.year)),
  set: (value) => {
    filters.year = value === YEAR_ALL ? null : Number(value)
  },
})

const selectedRegion = computed<string>({
  get: () => regionSelectorValue.value,
  set: (value) => updateRegionSelector(value),
})

const characterOptions = computed(() => [...characterMap.value.values()].sort((a, b) => a.id - b.id))

const { hideUnreleased, blurUnreleased } = useUnreleasedContentDisplay()

const visibleCards = computed(() => excludeUnreleasedCards(cards.value, hideUnreleased.value, Date.now()))

const years = computed(() => collectCardReleaseYears(visibleCards.value))

const filteredCards = computed(() => sortCards(
  filterCards(visibleCards.value, filters, {
    characterMap: characterMap.value,
    supplyTypeMap: supplyTypeMap.value,
  }),
  sortKey.value,
))

const totalPages = computed(() => countCardPages(filteredCards.value.length, PAGE_SIZE))

const pagedCardViews = computed(() => {
  const now = Date.now()
  return paginateCards(filteredCards.value, page.value, PAGE_SIZE)
    .map((card) => ({
      card,
      thumbnail: buildCatalogCardThumbnail(card, region.value, assetEndpoint.value),
      characterName: card.characterId != null
        ? characterMap.value.get(card.characterId)?.name ?? null
        : null,
      unreleased: isCardUnreleased(card.releaseAt, now),
    }))
})

const hasActiveFilters = computed(() => filters.query.trim() !== ""
  || filters.characterIds.length > 0
  || filters.units.length > 0
  || filters.attrs.length > 0
  || filters.rarities.length > 0
  || filters.supplyTypes.length > 0
  || filters.year != null)

watch([filters, sortKey, region, hideUnreleased], () => {
  page.value = 1
})

function toggleValue<T>(values: T[], value: T) {
  const index = values.indexOf(value)
  if (index >= 0) {
    values.splice(index, 1)
  } else {
    values.push(value)
  }
}

function toggleCharacter(characterId: number) {
  toggleValue(filters.characterIds, characterId)
}

function toggleUnit(unit: SekaiUnit) {
  toggleValue(filters.units, unit)
}

function toggleAttr(attr: SekaiCardAttr) {
  toggleValue(filters.attrs, attr)
}

function toggleRarity(rarity: CardRarityType) {
  toggleValue(filters.rarities, rarity)
}

function toggleSupply(supply: CardSupplyType) {
  toggleValue(filters.supplyTypes, supply)
}

function clearFilters() {
  Object.assign(filters, createDefaultCardFilters())
}

function unitDotStyle(unit: SekaiUnit) {
  const color = unitColorMap.value.get(unit)
  return color ? { backgroundColor: color } : undefined
}

// Units whose logo image failed to load fall back to the colored dot.
const failedUnitLogos = ref<Set<SekaiUnit>>(new Set())

function markUnitLogoFailed(unit: SekaiUnit) {
  const next = new Set(failedUnitLogos.value)
  next.add(unit)
  failedUnitLogos.value = next
}

function prevPage() {
  page.value = Math.max(1, page.value - 1)
}

function nextPage() {
  page.value = Math.min(totalPages.value, page.value + 1)
}
</script>

<template>
  <div class="w-full max-w-6xl mx-auto flex flex-col gap-4">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t("cards.list.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("cards.list.description") }}</p>
      </div>
      <div class="flex items-center gap-2">
        <Button as-child variant="outline" size="sm" class="gap-1.5">
          <RouterLink :to="{ name: 'cards.box' }">
            <LucidePackageOpen class="size-4" />
            {{ t("cardBox.entryLink") }}
          </RouterLink>
        </Button>
        <Select :key="locale" v-model="selectedRegion">
          <SelectTrigger class="w-32" :aria-label="t('cards.common.region')">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="SEKAI_CATALOG_REGION_FOLLOW_VALUE">
              {{ t("sekaiRegion.followAccount") }}
            </SelectItem>
            <SelectItem v-for="option in SEKAI_REGION_OPTIONS" :key="option.value" :value="option.value">
              {{ t(option.labelKey) }}
            </SelectItem>
          </SelectContent>
        </Select>
        <div class="relative w-full sm:w-64">
          <LucideSearch class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="filters.query"
            class="pl-8"
            :placeholder="t('cards.list.searchPlaceholder')"
          />
        </div>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="flex flex-col gap-3 py-4">
        <div class="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" size="sm" class="gap-1">
                {{ t("cards.filter.characters") }}
                <span v-if="filters.characterIds.length > 0" class="rounded bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {{ filters.characterIds.length }}
                </span>
                <LucideChevronDown class="size-3.5 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-80 p-2" align="start">
              <div class="grid grid-cols-2 gap-1">
                <button
                  v-for="character in characterOptions"
                  :key="character.id"
                  type="button"
                  :class="[
                    'flex items-center gap-2 rounded-md px-2 py-1 text-left text-sm transition-colors',
                    filters.characterIds.includes(character.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted',
                  ]"
                  @click="toggleCharacter(character.id)"
                >
                  <img :src="character.iconUrl" alt="" class="size-6 shrink-0 rounded-full" loading="lazy">
                  <span class="truncate">{{ character.name }}</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>

          <Select v-model="selectedYear">
            <SelectTrigger class="h-8 w-28 text-sm" :aria-label="t('cards.filter.year')">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="YEAR_ALL">{{ t("cards.filter.yearAll") }}</SelectItem>
              <SelectItem v-for="year in years" :key="year" :value="String(year)">
                {{ year }}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select v-model="sortKey">
            <SelectTrigger class="h-8 w-40 text-sm" :aria-label="t('cards.list.sortLabel')">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="key in CARD_SORT_KEYS" :key="key" :value="key">
                {{ t(`cards.sort.${key}`) }}
              </SelectItem>
            </SelectContent>
          </Select>

          <label class="ml-auto flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Switch v-model="showTrained" />
            {{ t("cards.list.showTrained") }}
          </label>
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <span class="mr-1 text-xs font-medium text-muted-foreground">{{ t("cards.filter.units") }}</span>
          <button
            v-for="unit in SEKAI_UNITS"
            :key="unit"
            type="button"
            :class="[
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
              filters.units.includes(unit)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:bg-muted',
            ]"
            @click="toggleUnit(unit)"
          >
            <img
              v-if="!failedUnitLogos.has(unit)"
              :src="resolveUnitLogoUrl(unit)"
              alt=""
              class="h-4 w-auto max-w-9 object-contain"
              loading="lazy"
              @error="markUnitLogoFailed(unit)"
            >
            <span v-else class="size-2 rounded-full bg-muted-foreground/40" :style="unitDotStyle(unit)" />
            {{ t(`cards.unit.${unit}`) }}
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <span class="mr-1 text-xs font-medium text-muted-foreground">{{ t("cards.filter.attrs") }}</span>
          <button
            v-for="attr in SEKAI_CARD_ATTRS"
            :key="attr"
            type="button"
            :class="[
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
              filters.attrs.includes(attr)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:bg-muted',
            ]"
            @click="toggleAttr(attr)"
          >
            <img :src="resolveCardAttrIconUrl(attr)" alt="" class="size-4" loading="lazy">
            {{ t(`cards.attr.${attr}`) }}
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <span class="mr-1 text-xs font-medium text-muted-foreground">{{ t("cards.filter.rarity") }}</span>
          <button
            v-for="rarity in CARD_RARITY_TYPES"
            :key="rarity"
            type="button"
            :class="[
              'rounded-full border px-2.5 py-1 text-xs transition-colors',
              filters.rarities.includes(rarity)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:bg-muted',
            ]"
            @click="toggleRarity(rarity)"
          >
            {{ t(`cards.rarity.${rarity}`) }}
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <span class="mr-1 text-xs font-medium text-muted-foreground">{{ t("cards.filter.supply") }}</span>
          <button
            v-for="supply in CARD_SUPPLY_TYPES"
            :key="supply"
            type="button"
            :class="[
              'rounded-full border px-2.5 py-1 text-xs transition-colors',
              filters.supplyTypes.includes(supply)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:bg-muted',
            ]"
            @click="toggleSupply(supply)"
          >
            {{ t(`cards.supply.${supply}`) }}
          </button>
          <Button
            v-if="hasActiveFilters"
            variant="ghost"
            size="sm"
            class="ml-auto h-7 gap-1 text-xs text-muted-foreground"
            @click="clearFilters"
          >
            <LucideRotateCcw class="size-3.5" />
            {{ t("cards.filter.clear") }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Error -->
    <Card v-if="error && !loading">
      <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
        <p class="text-sm text-muted-foreground">{{ t("cards.common.loadError") }}</p>
        <p class="max-w-full truncate font-mono text-xs text-muted-foreground">{{ error }}</p>
        <Button variant="outline" size="sm" @click="reload">
          {{ t("cards.common.retry") }}
        </Button>
      </CardContent>
    </Card>

    <!-- Loading skeleton -->
    <div
      v-else-if="loading"
      class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
    >
      <div v-for="index in 18" :key="index" class="flex flex-col gap-1.5">
        <Skeleton class="aspect-square w-full rounded-md" />
        <Skeleton class="h-3 w-4/5" />
        <Skeleton class="h-3 w-1/2" />
      </div>
    </div>

    <template v-else>
      <div class="flex items-center justify-between text-sm text-muted-foreground">
        <span>{{ t("cards.list.total", { total: filteredCards.length }) }}</span>
      </div>

      <!-- Grid -->
      <div
        v-if="pagedCardViews.length > 0"
        class="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
      >
        <RouterLink
          v-for="view in pagedCardViews"
          :key="view.card.id"
          :to="{ name: 'cards.detail', params: { cardId: view.card.id } }"
          class="group flex flex-col gap-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div :class="['relative', view.unreleased && blurUnreleased ? 'overflow-hidden rounded-md' : '']">
            <CardThumbnail
              :thumbnail="view.thumbnail"
              :trained="showTrained"
              :unreleased="view.unreleased && !blurUnreleased"
              :title="view.card.prefix"
              :class="view.unreleased && blurUnreleased
                ? 'blur-md scale-105'
                : 'transition-transform group-hover:scale-[1.02]'"
            />
            <span
              v-if="view.unreleased && blurUnreleased"
              class="absolute right-1 top-1 rounded bg-background/80 px-1.5 py-0.5 text-xs font-semibold"
            >
              {{ t("sekaiUnreleased.badge") }}
            </span>
          </div>
          <span class="line-clamp-2 text-xs leading-tight group-hover:underline">
            {{ view.card.prefix ?? `#${view.card.id}` }}
          </span>
          <span v-if="view.characterName" class="truncate text-[11px] text-muted-foreground">
            {{ view.characterName }}
          </span>
        </RouterLink>
      </div>

      <Card v-else>
        <CardContent class="py-12 text-center text-muted-foreground">
          {{ t("cards.list.empty") }}
        </CardContent>
      </Card>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pb-4">
        <Button variant="outline" size="sm" :disabled="page <= 1" @click="prevPage">
          <LucideChevronLeft class="size-4" />
        </Button>
        <span class="text-sm tabular-nums">{{ page }} / {{ totalPages }}</span>
        <Button variant="outline" size="sm" :disabled="page >= totalPages" @click="nextPage">
          <LucideChevronRight class="size-4" />
        </Button>
      </div>
    </template>
  </div>
</template>
