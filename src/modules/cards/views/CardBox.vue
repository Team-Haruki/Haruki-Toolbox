<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LucideChartPie, LucideRefreshCw } from "lucide-vue-next"
import GameAccountSelect from "@/shared/components/GameAccountSelect.vue"
import { useGameAccountSelection, useUserSuite } from "@/shared/sekai/user-snapshot/use-user-suite"
import type { CatalogMasterCard } from "@/shared/sekai/catalog"
import { SEKAI_CARD_ATTRS, buildCatalogCardThumbnail } from "@/shared/sekai/catalog"
import { resolveCardAttrIconUrl } from "@/shared/sekai/data-sources"
import type { SekaiRegion } from "@/types"
import { CARD_RARITY_TYPES, sortCards, type CardRarityType } from "@/modules/cards/lib/card-filter"
import {
  CARD_BOX_GROUP_MODES,
  CARD_OWNERSHIP_FILTERS,
  applyOwnershipFilter,
  buildAttrDistribution,
  buildCharacterDistribution,
  buildOwnedCardMap,
  filterReleasedCards,
  groupCardsByAttr,
  groupCardsByCharacter,
  isCardTrained,
  normalizeUserCards,
  summarizeCollection,
  type CardBoxGroupMode,
  type CardOwnershipFilter,
  type UserCardRecord,
} from "@/modules/cards/lib/card-box"
import { useCardBoxCatalog } from "@/modules/cards/composables/useCardBoxCatalog"
import CardThumbnail from "@/modules/cards/components/CardThumbnail.vue"

const { t, locale } = useI18n()

const { selectedAccount } = useGameAccountSelection()
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

const groupMode = ref<CardBoxGroupMode>("character")
const ownership = ref<CardOwnershipFilter>("all")
const flatAttrs = ref<string[]>([])
const flatRarities = ref<CardRarityType[]>([])
const showStats = ref(true)

const now = Date.now()

const userCards = computed(() => normalizeUserCards(suiteData.value?.userCards))
const ownedMap = computed(() => buildOwnedCardMap(userCards.value))
const releasedCards = computed(() => sortCards(filterReleasedCards(cards.value, now), "idAsc"))
const visibleCards = computed(() => applyOwnershipFilter(releasedCards.value, ownedMap.value, ownership.value))

const overall = computed(() => summarizeCollection(releasedCards.value, ownedMap.value))
const characterDistribution = computed(() => buildCharacterDistribution(releasedCards.value, ownedMap.value))
const attrDistribution = computed(() => buildAttrDistribution(releasedCards.value, ownedMap.value))

const isLoading = computed(() => suiteStatus.value === "loading" || catalogLoading.value)
const hasError = computed(() => suiteStatus.value === "error" || catalogError.value != null)
const isReady = computed(() => suiteStatus.value === "ready" && !catalogLoading.value && catalogError.value == null)

const errorDetail = computed(() => {
  if (catalogError.value != null) {
    return catalogError.value
  }

  const raw = suiteError.value
  if (raw == null) {
    return null
  }

  return raw instanceof Error ? raw.message : String(raw)
})

const uploadTimeText = computed(() => {
  if (uploadTime.value == null) {
    return null
  }

  return new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short" })
    .format(uploadTime.value)
})

type CardView = {
  card: CatalogMasterCard
  thumbnail: ReturnType<typeof buildCatalogCardThumbnail>
  record: UserCardRecord | null
  trained: boolean
}

function makeCardView(card: CatalogMasterCard): CardView {
  const record = ownedMap.value.get(card.id) ?? null
  return {
    card,
    thumbnail: buildCatalogCardThumbnail(card, accountRegion.value ?? "jp", assetEndpoint.value),
    record,
    trained: record != null && isCardTrained(record),
  }
}

const characterSections = computed(() => {
  const progressByCharacter = new Map(characterDistribution.value.map((row) => [row.characterId, row]))
  return groupCardsByCharacter(visibleCards.value, ownedMap.value).map((group) => {
    const character = characterMap.value.get(group.key) ?? null
    const progress = progressByCharacter.get(group.key) ?? null
    const unitColor = character?.unit != null ? unitColorMap.value.get(character.unit) ?? null : null
    return {
      key: group.key,
      name: character?.name ?? t("cardBox.unknownCharacter"),
      iconUrl: character?.iconUrl ?? null,
      owned: progress?.owned ?? group.owned,
      total: progress?.total ?? group.total,
      percent: progress?.percent ?? 0,
      unitColor,
      views: group.cards.map(makeCardView),
    }
  })
})

const attrSections = computed(() => {
  const progressByAttr = new Map(attrDistribution.value.map((row) => [row.attr, row]))
  return groupCardsByAttr(visibleCards.value, ownedMap.value).map((group) => {
    const progress = progressByAttr.get(group.key) ?? null
    return {
      key: group.key,
      name: attrLabel(group.key),
      iconUrl: resolveCardAttrIconUrl(group.key),
      owned: progress?.owned ?? group.owned,
      total: progress?.total ?? group.total,
      percent: progress?.percent ?? 0,
      views: group.cards.map(makeCardView),
    }
  })
})

const flatViews = computed(() => {
  let flatCards = visibleCards.value
  if (flatAttrs.value.length > 0) {
    flatCards = flatCards.filter((card) => flatAttrs.value.includes(card.attr))
  }

  if (flatRarities.value.length > 0) {
    flatCards = flatCards.filter((card) => (flatRarities.value as readonly string[]).includes(card.cardRarityType))
  }

  return flatCards.map(makeCardView)
})

const statsCharacterRows = computed(() => characterDistribution.value.map((row) => {
  const character = characterMap.value.get(row.characterId) ?? null
  return {
    characterId: row.characterId,
    name: character?.name ?? t("cardBox.unknownCharacter"),
    iconUrl: character?.iconUrl ?? null,
    owned: row.owned,
    total: row.total,
    percent: row.percent,
    buckets: CARD_RARITY_TYPES
      .map((rarity) => ({ rarity, ...row.rarityBuckets[rarity] }))
      .filter((bucket) => bucket.total > 0),
  }
}))

const statsAttrRows = computed(() => attrDistribution.value.map((row) => ({
  ...row,
  name: attrLabel(row.attr),
  iconUrl: resolveCardAttrIconUrl(row.attr),
})))

const visibleEmpty = computed(() => {
  if (groupMode.value === "character") {
    return characterSections.value.length === 0
  }

  if (groupMode.value === "attr") {
    return attrSections.value.length === 0
  }

  return flatViews.value.length === 0
})

function attrLabel(attr: string): string {
  return (SEKAI_CARD_ATTRS as readonly string[]).includes(attr) ? t(`cards.attr.${attr}`) : attr
}

function handleGroupModeChange(value: unknown) {
  if (typeof value === "string" && (CARD_BOX_GROUP_MODES as readonly string[]).includes(value)) {
    groupMode.value = value as CardBoxGroupMode
  }
}

function toggleFlatAttr(attr: string) {
  const index = flatAttrs.value.indexOf(attr)
  if (index >= 0) {
    flatAttrs.value.splice(index, 1)
  } else {
    flatAttrs.value.push(attr)
  }
}

function toggleFlatRarity(rarity: CardRarityType) {
  const index = flatRarities.value.indexOf(rarity)
  if (index >= 0) {
    flatRarities.value.splice(index, 1)
  } else {
    flatRarities.value.push(rarity)
  }
}

function refresh() {
  void reloadSuite("check-remote")
  reloadCatalog()
}

function retry() {
  if (catalogError.value != null) {
    reloadCatalog()
  }

  if (suiteStatus.value === "error") {
    void reloadSuite("check-remote")
  }
}
</script>

<template>
  <div class="w-full max-w-6xl mx-auto flex flex-col gap-4">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t("cardBox.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("cardBox.description") }}</p>
      </div>
      <div class="flex flex-col items-start gap-1 sm:items-end">
        <GameAccountSelect />
        <p v-if="uploadTimeText" class="text-xs text-muted-foreground">
          {{ t("cardBox.dataAsOf", { time: uploadTimeText }) }}
        </p>
      </div>
    </div>

    <!-- No account selected -->
    <Card v-if="suiteStatus === 'idle'">
      <CardContent class="py-12 text-center text-sm text-muted-foreground">
        {{ t("cardBox.noAccountHint") }}
      </CardContent>
    </Card>

    <!-- Error -->
    <Card v-else-if="hasError && !isLoading">
      <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
        <p class="text-sm text-muted-foreground">{{ t("cardBox.loadError") }}</p>
        <p v-if="errorDetail" class="max-w-full truncate font-mono text-xs text-muted-foreground">
          {{ errorDetail }}
        </p>
        <Button variant="outline" size="sm" @click="retry">
          {{ t("cardBox.retry") }}
        </Button>
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
      <!-- Controls -->
      <Card>
        <CardContent class="flex flex-col gap-3 py-4">
          <div class="flex flex-wrap items-center gap-3">
            <Tabs :model-value="groupMode" class="w-full sm:w-auto" @update:model-value="handleGroupModeChange">
              <TabsList class="grid w-full grid-cols-3 sm:w-auto">
                <TabsTrigger v-for="mode in CARD_BOX_GROUP_MODES" :key="mode" :value="mode">
                  {{ t(`cardBox.group.${mode}`) }}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div class="flex flex-wrap items-center gap-1.5">
              <span class="mr-1 text-xs font-medium text-muted-foreground">{{ t("cardBox.ownership.label") }}</span>
              <button
                v-for="filterOption in CARD_OWNERSHIP_FILTERS"
                :key="filterOption"
                type="button"
                :class="[
                  'rounded-full border px-2.5 py-1 text-xs transition-colors',
                  ownership === filterOption
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-muted',
                ]"
                @click="ownership = filterOption"
              >
                {{ t(`cardBox.ownership.${filterOption}`) }}
              </button>
            </div>

            <div class="ml-auto flex items-center gap-1.5">
              <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs text-muted-foreground" @click="showStats = !showStats">
                <LucideChartPie class="size-3.5" />
                {{ t("cardBox.stats.toggle") }}
              </Button>
              <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs text-muted-foreground" @click="refresh">
                <LucideRefreshCw class="size-3.5" />
                {{ t("cardBox.refresh") }}
              </Button>
            </div>
          </div>

          <!-- Flat-mode filters -->
          <template v-if="groupMode === 'all'">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="mr-1 text-xs font-medium text-muted-foreground">{{ t("cardBox.filter.attrs") }}</span>
              <button
                v-for="attr in SEKAI_CARD_ATTRS"
                :key="attr"
                type="button"
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                  flatAttrs.includes(attr)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-muted',
                ]"
                @click="toggleFlatAttr(attr)"
              >
                <img :src="resolveCardAttrIconUrl(attr)" alt="" class="size-4" loading="lazy">
                {{ t(`cards.attr.${attr}`) }}
              </button>
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="mr-1 text-xs font-medium text-muted-foreground">{{ t("cardBox.filter.rarity") }}</span>
              <button
                v-for="rarity in CARD_RARITY_TYPES"
                :key="rarity"
                type="button"
                :class="[
                  'rounded-full border px-2.5 py-1 text-xs transition-colors',
                  flatRarities.includes(rarity)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-muted',
                ]"
                @click="toggleFlatRarity(rarity)"
              >
                {{ t(`cards.rarity.${rarity}`) }}
              </button>
            </div>
          </template>
        </CardContent>
      </Card>

      <!-- Collection stats -->
      <Card v-if="showStats">
        <CardHeader class="pb-2">
          <CardTitle class="flex flex-wrap items-baseline justify-between gap-2 text-base">
            <span>{{ t("cardBox.stats.title") }}</span>
            <span class="text-sm font-normal tabular-nums text-muted-foreground">
              {{ t("cardBox.stats.ownedOfTotal", { owned: overall.owned, total: overall.total }) }}
              · {{ t("cardBox.stats.percent", { percent: overall.percent }) }}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent class="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div class="flex flex-col gap-1">
            <h3 class="mb-1 text-xs font-medium text-muted-foreground">{{ t("cardBox.stats.byCharacter") }}</h3>
            <div
              v-for="row in statsCharacterRows"
              :key="row.characterId"
              class="flex flex-wrap items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/50"
            >
              <img v-if="row.iconUrl" :src="row.iconUrl" alt="" class="size-6 shrink-0 rounded-full" loading="lazy">
              <span class="w-24 truncate text-xs">{{ row.name }}</span>
              <span class="text-xs tabular-nums text-muted-foreground">
                {{ t("cardBox.stats.ownedOfTotal", { owned: row.owned, total: row.total }) }}
                ({{ t("cardBox.stats.percent", { percent: row.percent }) }})
              </span>
              <div class="ml-auto flex flex-wrap justify-end gap-1">
                <span
                  v-for="bucket in row.buckets"
                  :key="bucket.rarity"
                  class="rounded bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground"
                >
                  {{ t(`cards.rarity.${bucket.rarity}`) }} {{ bucket.owned }}/{{ bucket.total }}
                </span>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <h3 class="mb-1 text-xs font-medium text-muted-foreground">{{ t("cardBox.stats.byAttr") }}</h3>
            <div
              v-for="row in statsAttrRows"
              :key="row.attr"
              class="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/50"
            >
              <img :src="row.iconUrl" alt="" class="size-5 shrink-0" loading="lazy">
              <span class="w-20 truncate text-xs">{{ row.name }}</span>
              <span class="text-xs tabular-nums text-muted-foreground">
                {{ t("cardBox.stats.ownedOfTotal", { owned: row.owned, total: row.total }) }}
                ({{ t("cardBox.stats.percent", { percent: row.percent }) }})
              </span>
              <Progress :model-value="row.percent" class="ml-auto h-1.5 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Empty -->
      <Card v-if="visibleEmpty">
        <CardContent class="py-12 text-center text-muted-foreground">
          {{ t("cardBox.empty") }}
        </CardContent>
      </Card>

      <!-- Grouped by character -->
      <template v-else-if="groupMode === 'character'">
        <section v-for="section in characterSections" :key="section.key" class="flex flex-col gap-2">
          <div class="flex items-center gap-3">
            <img v-if="section.iconUrl" :src="section.iconUrl" alt="" class="size-8 shrink-0 rounded-full" loading="lazy">
            <div class="min-w-0 flex-1">
              <div class="flex items-baseline justify-between gap-2">
                <h2 class="truncate text-sm font-semibold">{{ section.name }}</h2>
                <span class="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {{ t("cardBox.stats.ownedOfTotal", { owned: section.owned, total: section.total }) }}
                  · {{ t("cardBox.stats.percent", { percent: section.percent }) }}
                </span>
              </div>
              <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full bg-primary transition-all"
                  :style="{ width: `${section.percent}%`, ...(section.unitColor ? { backgroundColor: section.unitColor } : {}) }"
                />
              </div>
            </div>
          </div>
          <div class="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            <RouterLink
              v-for="view in section.views"
              :key="view.card.id"
              :to="{ name: 'cards.detail', params: { cardId: view.card.id } }"
              class="group relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :title="view.card.prefix ?? `#${view.card.id}`"
            >
              <CardThumbnail
                :thumbnail="view.thumbnail"
                :trained="view.trained"
                :title="view.card.prefix"
                :class="[
                  'transition-transform group-hover:scale-[1.02]',
                  view.record == null ? 'opacity-40 grayscale' : '',
                ]"
              />
              <template v-if="view.record">
                <span class="absolute right-1 top-1 rounded bg-black/70 px-1 py-0.5 text-[10px] font-semibold leading-none text-white">
                  {{ t("cardBox.badge.level", { level: view.record.level }) }}
                </span>
                <span
                  v-if="view.record.masterRank > 0"
                  class="absolute bottom-1 right-1 rounded-full bg-fuchsia-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm"
                  :aria-label="t('cardBox.badge.masterRankLabel', { rank: view.record.masterRank })"
                >
                  {{ view.record.masterRank }}
                </span>
              </template>
            </RouterLink>
          </div>
        </section>
      </template>

      <!-- Grouped by attribute -->
      <template v-else-if="groupMode === 'attr'">
        <section v-for="section in attrSections" :key="section.key" class="flex flex-col gap-2">
          <div class="flex items-center gap-3">
            <img :src="section.iconUrl" alt="" class="size-7 shrink-0" loading="lazy">
            <div class="min-w-0 flex-1">
              <div class="flex items-baseline justify-between gap-2">
                <h2 class="truncate text-sm font-semibold">{{ section.name }}</h2>
                <span class="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {{ t("cardBox.stats.ownedOfTotal", { owned: section.owned, total: section.total }) }}
                  · {{ t("cardBox.stats.percent", { percent: section.percent }) }}
                </span>
              </div>
              <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${section.percent}%` }" />
              </div>
            </div>
          </div>
          <div class="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            <RouterLink
              v-for="view in section.views"
              :key="view.card.id"
              :to="{ name: 'cards.detail', params: { cardId: view.card.id } }"
              class="group relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
              :title="view.card.prefix ?? `#${view.card.id}`"
            >
              <CardThumbnail
                :thumbnail="view.thumbnail"
                :trained="view.trained"
                :title="view.card.prefix"
                :class="[
                  'transition-transform group-hover:scale-[1.02]',
                  view.record == null ? 'opacity-40 grayscale' : '',
                ]"
              />
              <template v-if="view.record">
                <span class="absolute right-1 top-1 rounded bg-black/70 px-1 py-0.5 text-[10px] font-semibold leading-none text-white">
                  {{ t("cardBox.badge.level", { level: view.record.level }) }}
                </span>
                <span
                  v-if="view.record.masterRank > 0"
                  class="absolute bottom-1 right-1 rounded-full bg-fuchsia-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm"
                  :aria-label="t('cardBox.badge.masterRankLabel', { rank: view.record.masterRank })"
                >
                  {{ view.record.masterRank }}
                </span>
              </template>
            </RouterLink>
          </div>
        </section>
      </template>

      <!-- Flat grid -->
      <template v-else>
        <div class="text-sm text-muted-foreground">
          {{ t("cardBox.total", { total: flatViews.length }) }}
        </div>
        <div class="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
          <RouterLink
            v-for="view in flatViews"
            :key="view.card.id"
            :to="{ name: 'cards.detail', params: { cardId: view.card.id } }"
            class="group relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :title="view.card.prefix ?? `#${view.card.id}`"
          >
            <CardThumbnail
              :thumbnail="view.thumbnail"
              :trained="view.trained"
              :title="view.card.prefix"
              :class="[
                'transition-transform group-hover:scale-[1.02]',
                view.record == null ? 'opacity-40 grayscale' : '',
              ]"
            />
            <template v-if="view.record">
              <span class="absolute right-1 top-1 rounded bg-black/70 px-1 py-0.5 text-[10px] font-semibold leading-none text-white">
                {{ t("cardBox.badge.level", { level: view.record.level }) }}
              </span>
              <span
                v-if="view.record.masterRank > 0"
                class="absolute bottom-1 right-1 rounded-full bg-fuchsia-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm"
                :aria-label="t('cardBox.badge.masterRankLabel', { rank: view.record.masterRank })"
              >
                {{ view.record.masterRank }}
              </span>
            </template>
          </RouterLink>
        </div>
      </template>
    </template>
  </div>
</template>
