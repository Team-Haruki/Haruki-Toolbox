<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideUsers } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import CatalogDetailShell from "@/shared/components/catalog/CatalogDetailShell.vue"
import CatalogStatusBadge from "@/shared/components/catalog/CatalogStatusBadge.vue"
import GachaBehaviorsSection from "@/modules/gachas/components/GachaBehaviorsSection.vue"
import GachaCeilSection from "@/modules/gachas/components/GachaCeilSection.vue"
import GachaHero from "@/modules/gachas/components/GachaHero.vue"
import GachaInformationSection from "@/modules/gachas/components/GachaInformationSection.vue"
import GachaPickupsSection from "@/modules/gachas/components/GachaPickupsSection.vue"
import GachaPoolSection from "@/modules/gachas/components/GachaPoolSection.vue"
import GachaRatesSection from "@/modules/gachas/components/GachaRatesSection.vue"
import GachaRelatedEventsSection from "@/modules/gachas/components/GachaRelatedEventsSection.vue"
import GachaSimulatorSection from "@/modules/gachas/components/GachaSimulatorSection.vue"
import GachaTypeBadge from "@/modules/gachas/components/GachaTypeBadge.vue"
import { useGachaDetail } from "@/modules/gachas/composables/useGachaDetail"

const props = defineProps<{
  gachaId: string
}>()

const { t } = useI18n()

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
  eventsLoading,
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
    :retrying="retrying"
    :unreleased="unreleased"
    @retry="reload"
  >
    <template #badges>
      <GachaTypeBadge v-if="summary" :gacha-type="summary.gachaType" />
      <CatalogStatusBadge v-if="status" :status="status" />
    </template>

    <template #actions>
      <Button v-if="pickupCardsRoute" as-child variant="outline" size="sm">
        <RouterLink :to="pickupCardsRoute">
          <LucideUsers class="size-4" />
          {{ t("gachaCatalog.detail.pickupCards") }}
        </RouterLink>
      </Button>
    </template>

    <template #skeleton>
      <div class="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
        <div class="flex flex-col gap-4">
          <Skeleton class="aspect-[2/1] w-full rounded-lg" />
          <Skeleton class="h-40 w-full rounded-xl" />
        </div>
        <div class="flex flex-col gap-4">
          <Skeleton class="h-64 w-full rounded-xl" />
          <Skeleton class="h-48 w-full rounded-xl" />
        </div>
      </div>
    </template>

    <template v-if="summary">
      <!-- Sidebar + main, like the event and music pages: no two sections
           ever have to line up. The sidebar is what the gacha *is* — its
           banner, dates and PICK UP members — with the on-demand references
           (behaviors, ceil exchange, information) directly beneath. The main
           column is what it *does*: rates, the simulator, the full pool and
           the related events. It spans both grid rows; `auto 1fr` keeps the
           references hugging the sidebar instead of floating mid-column. -->
      <div class="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:items-start">
        <div class="flex min-w-0 flex-col gap-4">
          <GachaHero
            :name="summary.name"
            :hero-sources="heroSources"
            :banner-sources="bannerSources"
            :logo-sources="logoSources"
            :start-at="summary.startAt"
            :end-at="summary.endAt"
            :status="status"
            :blur="blurArt"
            stacked
          />

          <GachaPickupsSection
            :cards="pickupCards"
            :region="region"
            :asset-endpoint="assetEndpoint"
            :blur-unreleased="blurUnreleased"
            :loading="sectionsLoading"
            :wish-select-count="wishSelectCount"
            compact
          />
        </div>

        <div class="flex min-w-0 flex-col gap-4 lg:row-span-2">
          <GachaRatesSection
            :table="rateTable"
            :segments="rateSegments"
            :guarantee-rarity="simulatorModel?.ten?.guaranteeRarity ?? null"
            :wish-select-count="wishSelectCount"
            :loading="sectionsLoading"
          />

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

          <GachaRelatedEventsSection
            :events="relatedEvents"
            :region="region"
            :asset-endpoint="assetEndpoint"
            :loading="eventsLoading"
            :now-ms="nowMs"
          />
        </div>

        <div class="flex min-w-0 flex-col gap-4 lg:col-start-1">
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
      </div>
    </template>
  </CatalogDetailShell>
</template>
