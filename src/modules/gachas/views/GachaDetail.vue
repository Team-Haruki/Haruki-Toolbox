<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideUsers } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import CatalogDetailShell from "@/shared/components/catalog/CatalogDetailShell.vue"
import { applyCatalogRegionQuery } from "@/shared/sekai/catalog-region"
import GachaBehaviorsSection from "@/modules/gachas/components/GachaBehaviorsSection.vue"
import GachaCeilSection from "@/modules/gachas/components/GachaCeilSection.vue"
import GachaHero from "@/modules/gachas/components/GachaHero.vue"
import GachaInformationSection from "@/modules/gachas/components/GachaInformationSection.vue"
import GachaPickupsSection from "@/modules/gachas/components/GachaPickupsSection.vue"
import GachaPoolSection from "@/modules/gachas/components/GachaPoolSection.vue"
import GachaRatesSection from "@/modules/gachas/components/GachaRatesSection.vue"
import GachaRelatedEventsSection from "@/modules/gachas/components/GachaRelatedEventsSection.vue"
import GachaSimulatorSection from "@/modules/gachas/components/GachaSimulatorSection.vue"
import { useGachaDetail } from "@/modules/gachas/composables/useGachaDetail"

const props = defineProps<{
  gachaId: string
}>()

const { t } = useI18n()
// A shared link names its server (`?region=`): apply it before the detail reads the region.
applyCatalogRegionQuery()

const gachaId = computed(() => {
  const parsed = Number(props.gachaId)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
})

const {
  region,
  assetEndpoint,
  summary,
  gacha,
  sectionsLoading,
  loading,
  error,
  notFound,
  retrying,
  reload,
  status,
  unreleased,
  blurArt,
  blurUnreleased,
  nowMs,
  heroSources,
  bannerSources,
  logoSources,
  cardsById,
  characterMap,
  unitColorMap,
  simulatorModel,
  rateTable,
  rateSegments,
  pickupCards,
  pickupCharacterIds,
  poolCards,
  poolCharacters,
  ceilItem,
  ceilItemSources,
  ceilItemsLoading,
  ceilExchangeSummary,
  ceilExchangeRows,
  ceilBoxesAvailable,
  ceilExchangeLoading,
  ceilExchangeError,
  openCeilExchange,
  relatedEvents,
  summaryText,
  descriptionText,
} = useGachaDetail(gachaId)

const wishSelectCount = computed(() => gacha.value?.wishSelectCount ?? summary.value?.wishSelectCount ?? 0)
const behaviors = computed(() => gacha.value?.behaviors ?? summary.value?.behaviors ?? [])
const showCeil = computed(() => ceilItem.value != null || summary.value?.gachaType === "ceil")
const showInformation = computed(() => gacha.value == null || summaryText.value !== "" || descriptionText.value !== "")

const pickupCardsRoute = computed(() => (pickupCharacterIds.value.length > 0
  ? { name: "cards.list", query: { chars: pickupCharacterIds.value.join(",") } }
  : null))
</script>

<template>
  <CatalogDetailShell
    :title="summary?.name ?? null"
    :entity-id="summary?.id ?? gachaId"
    :list-title="t('gachas.list.title')"
    :list-route="{ name: 'gachas.list' }"
    :loading="loading"
    :error="error"
    :not-found="notFound"
    :not-found-message="t('gachas.detail.notFound', { gachaId: props.gachaId })"
    :retrying="retrying"
    :unreleased="unreleased"
    @retry="reload"
  >
    <template #actions>
      <Button v-if="pickupCardsRoute" as-child variant="outline" size="sm">
        <RouterLink :to="pickupCardsRoute">
          <LucideUsers class="size-4" />
          {{ t("gachaCatalog.detail.pickupCards") }}
        </RouterLink>
      </Button>
    </template>

    <template #skeleton>
      <Skeleton class="h-72 w-full rounded-2xl" />
      <div class="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Skeleton class="h-64 w-full rounded-xl" />
        <Skeleton class="h-64 w-full rounded-xl" />
      </div>
    </template>

    <!-- The header block carries the title, so the shell's own heading is replaced. -->
    <template v-if="summary" #heading>
      <GachaHero
        :name="summary.name"
        :gacha-id="summary.id"
        :gacha-type="summary.gachaType"
        :unreleased="unreleased"
        :hero-sources="heroSources"
        :banner-sources="bannerSources"
        :logo-sources="logoSources"
        :start-at="summary.startAt"
        :end-at="summary.endAt"
        :status="status"
        :region="region"
        :blur="blurArt"
      >
        <template v-if="pickupCards.length > 0 || relatedEvents.length > 0" #footer>
          <GachaPickupsSection
            :cards="pickupCards"
            :region="region"
            :asset-endpoint="assetEndpoint"
            :blur-unreleased="blurUnreleased"
            :wish-select-count="wishSelectCount"
          />
          <GachaRelatedEventsSection
            :events="relatedEvents"
            :region="region"
            :asset-endpoint="assetEndpoint"
            :now-ms="nowMs"
          />
        </template>
      </GachaHero>
    </template>

    <template v-if="summary">
      <!-- Under the header, two stacks whose heights are the data's: the
           odds and the fine print that goes with them on the left, pulling
           (the simulator, the full pool) on the right. -->
      <div class="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div class="flex min-w-0 flex-col gap-4">
          <GachaRatesSection
            :table="rateTable"
            :segments="rateSegments"
            :guarantee-rarity="simulatorModel?.ten?.guaranteeRarity ?? null"
            :wish-select-count="wishSelectCount"
            :loading="sectionsLoading"
          />

          <GachaBehaviorsSection :behaviors="behaviors" :loading="false" />

          <GachaCeilSection
            v-if="showCeil"
            :ceil-item="ceilItem"
            :ceil-item-sources="ceilItemSources"
            :items-loading="ceilItemsLoading"
            :exchange-summary="ceilExchangeSummary"
            :rows="ceilExchangeRows"
            :boxes-available="ceilBoxesAvailable"
            :exchange-loading="ceilExchangeLoading"
            :exchange-error="ceilExchangeError"
            :cards-by-id="cardsById"
            :region="region"
            :asset-endpoint="assetEndpoint"
            @open="openCeilExchange"
            @retry="reload"
          />

          <GachaInformationSection
            v-if="showInformation"
            :summary="summaryText"
            :description="descriptionText"
            :loading="sectionsLoading"
          />
        </div>

        <div class="flex min-w-0 flex-col gap-4">
          <GachaSimulatorSection
            :model="simulatorModel"
            :cards-by-id="cardsById"
            :character-map="characterMap"
            :region="region"
            :asset-endpoint="assetEndpoint"
            :blur-unreleased="blurUnreleased"
            :now-ms="nowMs"
            :loading="sectionsLoading"
          />

          <GachaPoolSection
            :cards="poolCards"
            :characters="poolCharacters"
            :unit-color-map="unitColorMap"
            :region="region"
            :asset-endpoint="assetEndpoint"
            :blur-unreleased="blurUnreleased"
            :loading="sectionsLoading"
            :wish-select-count="wishSelectCount"
          />
        </div>
      </div>
    </template>
  </CatalogDetailShell>
</template>
