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
import { SEKAI_CARD_ATTRS, SEKAI_CARD_ATTR_COLORS, buildCatalogCardThumbnail, resolveSekaiCharacterColor, type SekaiCardThumbnailView, type SekaiUnit } from "@/shared/sekai/catalog"
import { resolveTrainRankImageUrl } from "@/shared/sekai/data-sources"
import { resolveCardAttrIconUrl, resolveUnitLogoUrl } from "@/shared/sekai/data-sources"
import type { SekaiRegion } from "@/types"
import { CARD_RARITY_TYPES, sortCards, type CardRarityType } from "@/modules/cards/lib/card-filter"
import {
  CARD_BOX_GROUP_MODES,
  CARD_OWNERSHIP_FILTERS,
  applyOwnershipFilter,
  buildAttrDistribution,
  buildCharacterDistribution,
  buildOwnedCardMap,
  buildUnitDistribution,
  filterCardsByRarity,
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
import CardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"
import { suiteUploadTimeToMillis } from "@/shared/sekai/user-snapshot/api"

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
const rarityFilter = ref<CardRarityType[]>([])
const showStats = ref(false)

const now = Date.now()

const userCards = computed(() => normalizeUserCards(suiteData.value?.userCards))
const ownedMap = computed(() => buildOwnedCardMap(userCards.value))
const releasedCards = computed(() => sortCards(filterReleasedCards(cards.value, now), "idAsc"))
const rarityCards = computed(() => filterCardsByRarity(releasedCards.value, rarityFilter.value))
const visibleCards = computed(() => applyOwnershipFilter(rarityCards.value, ownedMap.value, ownership.value))

const overall = computed(() => summarizeCollection(rarityCards.value, ownedMap.value))
const characterDistribution = computed(() => buildCharacterDistribution(rarityCards.value, ownedMap.value))
const attrDistribution = computed(() => buildAttrDistribution(rarityCards.value, ownedMap.value))
const unitDistribution = computed(() => buildUnitDistribution(
  rarityCards.value,
  ownedMap.value,
  (characterId) => characterMap.value.get(characterId)?.unit ?? null,
))

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
    .format(suiteUploadTimeToMillis(uploadTime.value))
})

type CardView = {
  card: CatalogMasterCard
  thumbnail: SekaiCardThumbnailView
  record: UserCardRecord | null
  trained: boolean
}

function makeCardView(card: CatalogMasterCard): CardView {
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

const characterSections = computed(() => {
  const progressByCharacter = new Map(characterDistribution.value.map((row) => [row.characterId, row]))
  return groupCardsByCharacter(visibleCards.value, ownedMap.value).map((group) => {
    const character = characterMap.value.get(group.key) ?? null
    const progress = progressByCharacter.get(group.key) ?? null
    const unitColor = character?.unit != null ? unitColorMap.value.get(character.unit) ?? null : null
    const stripeColor = resolveSekaiCharacterColor(group.key) ?? unitColor
    return {
      key: group.key,
      name: character?.name ?? t("cardBox.unknownCharacter"),
      iconUrl: character?.iconUrl ?? null,
      owned: progress?.owned ?? group.owned,
      total: progress?.total ?? group.total,
      percent: progress?.percent ?? 0,
      stripeColor,
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
  const flatCards = flatAttrs.value.length > 0
    ? visibleCards.value.filter((card) => flatAttrs.value.includes(card.attr))
    : visibleCards.value
  return flatCards.map(makeCardView)
})

const statsRarityColumns = computed(() => CARD_RARITY_TYPES.filter((rarity) =>
  characterDistribution.value.some((row) => row.rarityBuckets[rarity].total > 0),
))

const statsCharacterRows = computed(() => characterDistribution.value.map((row) => {
  const character = characterMap.value.get(row.characterId) ?? null
  return {
    characterId: row.characterId,
    name: character?.name ?? t("cardBox.unknownCharacter"),
    iconUrl: character?.iconUrl ?? null,
    owned: row.owned,
    total: row.total,
    percent: row.percent,
    color: resolveSekaiCharacterColor(row.characterId),
    buckets: statsRarityColumns.value.map((rarity) => ({ rarity, ...row.rarityBuckets[rarity] })),
  }
}))

const statsUnitRows = computed(() => unitDistribution.value.map((row) => ({
  ...row,
  name: t(`cards.unit.${row.unit}`),
  logoUrl: resolveUnitLogoUrl(row.unit),
  color: unitColorMap.value.get(row.unit) ?? null,
})))

const statsAttrRows = computed(() => attrDistribution.value.map((row) => ({
  ...row,
  name: attrLabel(row.attr),
  iconUrl: resolveCardAttrIconUrl(row.attr),
  color: SEKAI_CARD_ATTR_COLORS[row.attr] ?? null,
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

function handleOwnershipChange(value: unknown) {
  if (typeof value === "string" && (CARD_OWNERSHIP_FILTERS as readonly string[]).includes(value)) {
    ownership.value = value as CardOwnershipFilter
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

function toggleRarity(rarity: CardRarityType) {
  const index = rarityFilter.value.indexOf(rarity)
  if (index >= 0) {
    rarityFilter.value.splice(index, 1)
  } else {
    rarityFilter.value.push(rarity)
  }
}

const failedUnitLogos = ref<Set<SekaiUnit>>(new Set())

function markUnitLogoFailed(unit: SekaiUnit) {
  const next = new Set(failedUnitLogos.value)
  next.add(unit)
  failedUnitLogos.value = next
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
  <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-4">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t("cardBox.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("cardBox.description") }}</p>
      </div>
      <div class="flex flex-col items-start gap-1 sm:items-end">
        <div class="flex flex-wrap items-center gap-2">
          <GameAccountSelect />
          <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs text-muted-foreground" @click="refresh">
            <LucideRefreshCw class="size-3.5" />
            {{ t("cardBox.refresh") }}
          </Button>
        </div>
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
              <Tabs :model-value="ownership" @update:model-value="handleOwnershipChange">
                <TabsList class="h-8">
                  <TabsTrigger
                    v-for="filterOption in CARD_OWNERSHIP_FILTERS"
                    :key="filterOption"
                    :value="filterOption"
                    class="text-xs"
                  >
                    {{ t(`cardBox.ownership.${filterOption}`) }}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div class="ml-auto flex items-center gap-1.5">
              <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs text-muted-foreground" @click="showStats = !showStats">
                <LucideChartPie class="size-3.5" />
                {{ t("cardBox.stats.toggle") }}
              </Button>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <span class="mr-1 text-xs font-medium text-muted-foreground">{{ t("cardBox.filter.rarity") }}</span>
            <button
              v-for="rarity in CARD_RARITY_TYPES"
              :key="rarity"
              type="button"
              :class="[
                'rounded-full border px-2.5 py-1 text-xs transition-colors',
                rarityFilter.includes(rarity)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted',
              ]"
              @click="toggleRarity(rarity)"
            >
              {{ t(`cards.rarity.${rarity}`) }}
            </button>
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
        <CardContent class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <h3 class="text-xs font-medium text-muted-foreground">{{ t("cardBox.stats.byCharacter") }}</h3>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <div
                v-for="row in statsCharacterRows"
                :key="row.characterId"
                class="flex flex-col gap-1.5 rounded-md border border-l-4 p-2"
                :style="row.color ? { borderLeftColor: row.color } : {}"
              >
                <div class="flex items-center gap-2">
                  <img v-if="row.iconUrl" :src="row.iconUrl" alt="" class="size-7 shrink-0 rounded-full" loading="lazy">
                  <span class="min-w-0 flex-1 truncate text-xs font-medium" :title="row.name">{{ row.name }}</span>
                  <span class="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {{ t("cardBox.stats.ownedOfTotal", { owned: row.owned, total: row.total }) }}
                    · {{ t("cardBox.stats.percent", { percent: row.percent }) }}
                  </span>
                </div>
                <Progress :model-value="row.percent" :color="row.color ?? undefined" class="h-1.5" />
                <p class="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] tabular-nums text-muted-foreground">
                  <span v-for="bucket in row.buckets" :key="bucket.rarity">
                    {{ t(`cards.rarity.${bucket.rarity}`) }}
                    {{ bucket.total > 0 ? `${bucket.owned}/${bucket.total}` : "—" }}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <h3 class="text-xs font-medium text-muted-foreground">{{ t("cardBox.stats.byUnit") }}</h3>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <div
                v-for="row in statsUnitRows"
                :key="row.unit"
                class="flex flex-col gap-1.5 rounded-md border border-l-4 p-2"
                :style="row.color ? { borderLeftColor: row.color } : {}"
              >
                <div class="flex items-center gap-2">
                  <span class="flex w-9 shrink-0 justify-center">
                    <img
                      v-if="!failedUnitLogos.has(row.unit)"
                      :src="row.logoUrl"
                      alt=""
                      class="h-4 w-auto max-w-9 object-contain"
                      loading="lazy"
                      @error="markUnitLogoFailed(row.unit)"
                    >
                    <span
                      v-else
                      class="size-2.5 rounded-full"
                      :style="{ backgroundColor: row.color ?? 'var(--muted-foreground)' }"
                    />
                  </span>
                  <span class="min-w-0 flex-1 truncate text-xs font-medium" :title="row.name">{{ row.name }}</span>
                  <span class="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {{ t("cardBox.stats.ownedOfTotal", { owned: row.owned, total: row.total }) }}
                    · {{ t("cardBox.stats.percent", { percent: row.percent }) }}
                  </span>
                </div>
                <Progress :model-value="row.percent" :color="row.color ?? undefined" class="h-1.5" />
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <h3 class="text-xs font-medium text-muted-foreground">{{ t("cardBox.stats.byAttr") }}</h3>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <div
                v-for="row in statsAttrRows"
                :key="row.attr"
                class="flex flex-col gap-1.5 rounded-md border border-l-4 p-2"
                :style="row.color ? { borderLeftColor: row.color } : {}"
              >
                <div class="flex items-center gap-2">
                  <img :src="row.iconUrl" alt="" class="size-5 shrink-0" loading="lazy">
                  <span class="min-w-0 flex-1 truncate text-xs font-medium">{{ row.name }}</span>
                  <span class="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {{ t("cardBox.stats.ownedOfTotal", { owned: row.owned, total: row.total }) }}
                    · {{ t("cardBox.stats.percent", { percent: row.percent }) }}
                  </span>
                </div>
                <Progress :model-value="row.percent" :color="row.color ?? undefined" class="h-1.5" />
              </div>
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
                  :style="{ width: `${section.percent}%`, ...(section.stripeColor ? { backgroundColor: section.stripeColor } : {}) }"
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
                :level-label="view.record ? t('cardBox.badge.level', { level: view.record.level }) : null"
                :class="[
                  'transition-transform group-hover:scale-[1.02]',
                  view.record == null ? 'opacity-40 grayscale' : '',
                ]"
              />
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
                :level-label="view.record ? t('cardBox.badge.level', { level: view.record.level }) : null"
                :class="[
                  'transition-transform group-hover:scale-[1.02]',
                  view.record == null ? 'opacity-40 grayscale' : '',
                ]"
              />
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
              :level-label="view.record ? t('cardBox.badge.level', { level: view.record.level }) : null"
              :class="[
                'transition-transform group-hover:scale-[1.02]',
                view.record == null ? 'opacity-40 grayscale' : '',
              ]"
            />
          </RouterLink>
        </div>
      </template>
    </template>
  </div>
</template>
