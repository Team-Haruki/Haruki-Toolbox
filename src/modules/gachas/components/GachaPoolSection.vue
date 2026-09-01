<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideLayers, LucideRotateCcw } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { Button } from "@/components/ui/button"
import { usePagedSlice } from "@/composables/usePagedSlice"
import type { CatalogCharacter, SekaiUnit } from "@/shared/sekai/catalog"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import CatalogCharacterPicker from "@/shared/components/catalog/CatalogCharacterPicker.vue"
import CatalogChipsField from "@/shared/components/catalog/CatalogChipsField.vue"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import CatalogEntityGrid from "@/shared/components/catalog/CatalogEntityGrid.vue"
import CatalogPagination from "@/shared/components/catalog/CatalogPagination.vue"
import CatalogSearchField from "@/shared/components/catalog/CatalogSearchField.vue"
import type { CatalogFieldOption } from "@/shared/components/catalog/types"
import GachaCardTile from "@/modules/gachas/components/GachaCardTile.vue"
import { resolveGachaRarityLabel } from "@/modules/gachas/lib/gacha-labels"
import {
  collectGachaPoolRarities,
  createDefaultGachaPoolFilter,
  filterGachaPoolCards,
  groupGachaPoolByRarity,
  type GachaPoolCard,
} from "@/modules/gachas/lib/gacha-pool"
import { resolveGachaRarityToneClass } from "@/modules/gachas/lib/gacha-rates"

/** Collapsible pool listing: filterable, paged, grouped by rarity with per-card rates. */
const props = defineProps<{
  cards: readonly GachaPoolCard[]
  characters: readonly CatalogCharacter[]
  unitColorMap: ReadonlyMap<SekaiUnit, string> | null
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  blurUnreleased: boolean
  loading: boolean
  wishSelectCount: number
}>()

const POOL_PAGE_SIZE = 60

const { t, te } = useI18n()
const ctx = { t, te }

const filter = reactive(createDefaultGachaPoolFilter())
const page = ref(1)
const pageSize = ref(POOL_PAGE_SIZE)
const anchor = ref<HTMLElement | null>(null)

const filtered = computed(() => filterGachaPoolCards(props.cards, filter))
const { pageItems, totalPages, currentPage } = usePagedSlice(filtered, page, pageSize)
const groups = computed(() => groupGachaPoolByRarity(pageItems.value))

const rarityOptions = computed<CatalogFieldOption[]>(() => collectGachaPoolRarities(props.cards)
  .map((rarity) => ({ value: rarity, label: resolveGachaRarityLabel(ctx, rarity) })))

const hasActiveFilter = computed(() => filter.query.trim() !== "" || filter.characterIds.length > 0 || filter.rarities.length > 0)

watch(filter, () => {
  page.value = 1
})

function resetFilter() {
  Object.assign(filter, createDefaultGachaPoolFilter())
}
</script>

<template>
  <CatalogDetailSection
    :title="t('gachas.detail.poolCards')"
    :icon="LucideLayers"
    collapsible
    :default-open="false"
    :loading="loading"
    :empty="cards.length === 0"
    :empty-message="t('gachaCatalog.pool.empty')"
    content-class="flex flex-col gap-3"
  >
    <template #summary>{{ t("gachaCatalog.pool.summary", { count: cards.length }) }}</template>

    <div ref="anchor" class="flex flex-wrap items-center gap-2">
      <CatalogSearchField
        v-model="filter.query"
        :label="t('catalog.search.label')"
        :placeholder="t('gachaCatalog.pool.search')"
        compact
        class="sm:max-w-xs"
      />
      <Button
        v-if="hasActiveFilter"
        variant="ghost"
        size="sm"
        class="ml-auto h-8 gap-1 text-xs text-muted-foreground"
        @click="resetFilter"
      >
        <LucideRotateCcw class="size-3.5" />
        {{ t("catalog.filters.reset") }}
      </Button>
    </div>
    <CatalogCharacterPicker
      v-if="characters.length > 0"
      v-model="filter.characterIds"
      :characters="characters"
      :unit-color-map="unitColorMap"
      :label="t('catalog.character.label')"
      size="sm"
    />
    <CatalogChipsField
      v-if="rarityOptions.length > 1"
      v-model="filter.rarities"
      :label="t('catalog.rarity.label')"
      :options="rarityOptions"
      compact
    />

    <p class="text-xs text-muted-foreground tabular-nums" aria-live="polite">
      {{ t("gachaCatalog.pool.filtered", { count: filtered.length }) }}
    </p>

    <template v-if="groups.length > 0">
      <section v-for="group in groups" :key="group.rarity" class="flex flex-col gap-2">
        <h3 class="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span :class="['size-2 rounded-full', resolveGachaRarityToneClass(group.rarity)]" aria-hidden="true" />
          {{ resolveGachaRarityLabel(ctx, group.rarity) }}
          <span class="tabular-nums">· {{ group.cards.length }}</span>
        </h3>
        <CatalogEntityGrid columns="cards">
          <GachaCardTile
            v-for="entry in group.cards"
            :key="entry.card.id"
            :card="entry.card"
            :region="region"
            :asset-endpoint="assetEndpoint"
            :character-name="entry.characterName"
            :rate="entry.rate"
            :unreleased="entry.unreleased"
            :blur-unreleased="blurUnreleased"
            :corner-badge="entry.isPickup ? t('gachaCatalog.pool.pickup') : null"
            :wish="entry.isWish && wishSelectCount > 0"
          />
        </CatalogEntityGrid>
      </section>
    </template>
    <p v-else class="py-6 text-center text-sm text-muted-foreground">{{ t("catalog.results.empty") }}</p>

    <CatalogPagination
      v-if="totalPages > 1"
      v-model:page="page"
      v-model:page-size="pageSize"
      :total-pages="totalPages"
      :total="filtered.length"
      :anchor="anchor"
    />
    <span class="sr-only">{{ currentPage }}</span>
  </CatalogDetailSection>
</template>
