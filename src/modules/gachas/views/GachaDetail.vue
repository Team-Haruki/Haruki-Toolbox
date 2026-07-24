<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import {
  LucideArrowLeft,
  LucideCalendarDays,
  LucideRefreshCcw,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { buildCatalogCardThumbnail } from "@/shared/sekai/catalog"
import { isUnreleasedContent, useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import {
  buildGachaBannerCandidates,
  buildGachaCeilItemIconCandidates,
  buildGachaLogoCandidates,
  buildGachaRateSummary,
  collectGachaRarities,
  dedupGachaPickupCardIds,
  formatGachaRatePercent,
  isGachaType,
  isGachaUnreleased,
  resolveGachaCardRate,
  resolveGachaStatus,
  stripGachaMarkup,
} from "@/modules/gachas/lib/gacha-catalog"
import { useGachaCatalog } from "@/modules/gachas/composables/useGachaCatalog"
import GachaAssetImage from "@/modules/gachas/components/GachaAssetImage.vue"
import SekaiCardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"
import GachaStatusBadge from "@/modules/gachas/components/GachaStatusBadge.vue"

const KNOWN_BEHAVIOR_TYPES = [
  "normal",
  "over_rarity_3_once",
  "over_rarity_4_once",
  "once_a_day",
  "once_a_week",
] as const

const KNOWN_COST_RESOURCES = ["jewel", "paid_jewel", "gacha_ticket"] as const

const props = defineProps<{
  gachaId: string
}>()

const { t } = useI18n()
const router = useRouter()

const {
  loading,
  error,
  region,
  assetEndpoint,
  gachas,
  cardsById,
  cardRarityByCardId,
  characterMap,
  ceilItemMap,
  reload,
} = useGachaCatalog()

const nowMs = ref(Date.now())
const nowTimer = setInterval(() => {
  nowMs.value = Date.now()
}, 30_000)

onBeforeUnmount(() => {
  clearInterval(nowTimer)
})

const gachaIdNumber = computed(() => Number(props.gachaId))

const gacha = computed(() => gachas.value.find((candidate) => candidate.id === gachaIdNumber.value) ?? null)

const notFound = computed(() => !loading.value && !error.value && gachas.value.length > 0 && gacha.value == null)

const status = computed(() => (gacha.value ? resolveGachaStatus(gacha.value, nowMs.value) : null))

const { hideUnreleased, blurUnreleased } = useUnreleasedContentDisplay()

const unreleased = computed(() => gacha.value != null && isGachaUnreleased(gacha.value, nowMs.value))

const blurArt = computed(() => unreleased.value && blurUnreleased.value)

const bannerSources = computed(() => (gacha.value
  ? [
    ...buildGachaBannerCandidates(gacha.value, region.value, assetEndpoint.value),
    ...buildGachaLogoCandidates(gacha.value, region.value, assetEndpoint.value),
  ]
  : []))

const summaryText = computed(() => (gacha.value ? stripGachaMarkup(gacha.value.information.summary) : ""))

const descriptionText = computed(() => (gacha.value ? stripGachaMarkup(gacha.value.information.description) : ""))

const rateSummary = computed(() => (gacha.value
  ? buildGachaRateSummary(gacha.value, cardRarityByCardId.value)
  : null))

const rateRows = computed(() => {
  const summary = rateSummary.value
  if (!summary) {
    return []
  }

  return collectGachaRarities(summary).map((rarity) => ({
    rarity,
    baseRate: summary.baseRates.get(rarity) ?? null,
    guaranteedRate: summary.guaranteedRates?.get(rarity) ?? null,
    cardCount: summary.rarityCardCounts.get(rarity) ?? 0,
  }))
})

const pickupViews = computed(() => {
  const currentGacha = gacha.value
  const summary = rateSummary.value
  if (!currentGacha || !summary) {
    return []
  }

  return dedupGachaPickupCardIds(currentGacha.pickups)
    .map((cardId) => {
      const card = cardsById.value.get(cardId) ?? null
      return {
        cardId,
        card,
        unreleased: card != null && isUnreleasedContent(card.releaseAt, nowMs.value),
        thumbnail: card ? buildCatalogCardThumbnail(card, region.value, assetEndpoint.value) : null,
        characterName: card?.characterId != null
          ? characterMap.value.get(card.characterId)?.name ?? null
          : null,
        rate: resolveGachaCardRate(summary, cardId),
      }
    })
    .filter((view) => !(hideUnreleased.value && view.unreleased))
})

const ceilItem = computed(() => (gacha.value?.gachaCeilItemId != null
  ? ceilItemMap.value.get(gacha.value.gachaCeilItemId) ?? null
  : null))

const ceilItemIconSources = computed(() => (ceilItem.value
  ? buildGachaCeilItemIconCandidates(ceilItem.value.assetbundleName, region.value, assetEndpoint.value)
  : []))

function gachaTypeLabel(gachaType: string): string {
  return isGachaType(gachaType) ? t(`gachas.type.${gachaType}`) : gachaType || t("gachas.type.unknown")
}

function rarityLabel(rarity: string): string {
  return (["rarity_1", "rarity_2", "rarity_3", "rarity_4", "rarity_birthday"] as readonly string[]).includes(rarity)
    ? t(`gachas.rarity.${rarity}`)
    : rarity
}

function behaviorTypeLabel(behaviorType: string): string {
  return (KNOWN_BEHAVIOR_TYPES as readonly string[]).includes(behaviorType)
    ? t(`gachas.behaviorType.${behaviorType}`)
    : behaviorType
}

function behaviorCostLabel(costResourceType: string | null, costResourceQuantity: number | null): string {
  if (!costResourceType) {
    return "—"
  }

  const resource = (KNOWN_COST_RESOURCES as readonly string[]).includes(costResourceType)
    ? t(`gachas.costResource.${costResourceType}`)
    : costResourceType
  return costResourceQuantity != null ? `${costResourceQuantity} ${resource}` : resource
}

function goBack() {
  router.push({ name: "gachas.list" })
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-5xl flex-col gap-4">
    <div>
      <Button variant="ghost" size="sm" class="-ml-2 gap-1" @click="goBack">
        <LucideArrowLeft class="size-4" />
        {{ t("gachas.detail.back") }}
      </Button>
    </div>

    <!-- Error -->
    <Card v-if="error && !loading">
      <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
        <p class="text-sm text-muted-foreground">{{ t("gachas.common.loadError") }}</p>
        <p class="max-w-full truncate font-mono text-xs text-muted-foreground">{{ error }}</p>
        <Button variant="outline" size="sm" @click="reload">
          <LucideRefreshCcw class="mr-1 size-4" /> {{ t("gachas.common.retry") }}
        </Button>
      </CardContent>
    </Card>

    <!-- Loading -->
    <template v-else-if="loading">
      <Skeleton class="aspect-[5/2] w-full rounded-lg" />
      <div class="flex flex-col gap-2">
        <Skeleton class="h-6 w-2/3" />
        <Skeleton class="h-4 w-1/3" />
        <Skeleton class="h-24 w-full" />
      </div>
    </template>

    <!-- Not found -->
    <Card v-else-if="notFound">
      <CardContent class="py-12 text-center text-muted-foreground">
        {{ t("gachas.detail.notFound", { gachaId: props.gachaId }) }}
      </CardContent>
    </Card>

    <template v-else-if="gacha">
      <!-- Header -->
      <div class="aspect-[5/2] w-full overflow-hidden rounded-lg bg-muted ring-1 ring-border">
        <GachaAssetImage
          :sources="bannerSources"
          :alt="gacha.name"
          :class="blurArt ? 'blur-md scale-105' : ''"
        />
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-2xl font-bold">{{ gacha.name }}</h1>
          <span
            v-if="unreleased"
            class="rounded bg-red-600 px-1.5 py-0.5 text-xs font-semibold text-white"
          >
            {{ t("sekaiUnreleased.badge") }}
          </span>
          <span class="font-mono text-sm text-muted-foreground">#{{ gacha.id }}</span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {{ gachaTypeLabel(gacha.gachaType) }}
          </span>
          <GachaStatusBadge v-if="status" :status="status" />
        </div>
        <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
          <LucideCalendarDays class="size-4" />
          {{ formatLocalizedDateTime(gacha.startAt, undefined, t("gachas.common.dateFallback")) }}
          –
          {{ formatLocalizedDateTime(gacha.endAt, undefined, t("gachas.common.dateFallback")) }}
        </div>
      </div>

      <!-- Pickup cards -->
      <Card v-if="pickupViews.length > 0">
        <CardHeader>
          <CardTitle class="text-base">{{ t("gachas.detail.pickups") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex gap-3 overflow-x-auto pb-2">
            <RouterLink
              v-for="view in pickupViews"
              :key="view.cardId"
              :to="{ name: 'cards.detail', params: { cardId: view.cardId } }"
              class="flex w-28 shrink-0 flex-col gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div :class="['relative', view.unreleased && blurUnreleased ? 'overflow-hidden rounded-md' : '']">
                <SekaiCardThumbnail
                  v-if="view.thumbnail"
                  :thumbnail="view.thumbnail"
                  :unreleased="view.unreleased && !blurUnreleased"
                  :title="view.card?.prefix ?? `#${view.cardId}`"
                  :class="view.unreleased && blurUnreleased ? 'blur-md scale-105' : ''"
                />
                <div
                  v-else
                  class="flex aspect-square w-full items-center justify-center rounded-md bg-muted font-mono text-xs text-muted-foreground ring-1 ring-border"
                >
                  #{{ view.cardId }}
                </div>
                <span
                  v-if="view.unreleased && blurUnreleased"
                  class="absolute right-1 top-1 rounded bg-background/80 px-1 py-0.5 text-[10px] font-semibold"
                >
                  {{ t("sekaiUnreleased.badge") }}
                </span>
              </div>
              <span class="line-clamp-2 text-[11px] leading-tight">
                {{ view.card?.prefix ?? `#${view.cardId}` }}
              </span>
              <span v-if="view.characterName" class="truncate text-[11px] text-muted-foreground">
                {{ view.characterName }}
              </span>
              <span v-if="view.rate != null" class="text-[11px] font-medium tabular-nums text-primary">
                {{ formatGachaRatePercent(view.rate) }}
              </span>
            </RouterLink>
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-4 lg:grid-cols-2">
        <!-- Rates -->
        <Card v-if="rateRows.length > 0">
          <CardHeader>
            <CardTitle class="text-base">{{ t("gachas.detail.rates") }}</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col gap-3">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b text-muted-foreground">
                    <th class="py-1.5 pr-3 font-medium">{{ t("gachas.detail.rarity") }}</th>
                    <th class="py-1.5 pr-3 font-medium">{{ t("gachas.detail.cardCount") }}</th>
                    <th class="py-1.5 pr-3 font-medium">{{ t("gachas.detail.baseRate") }}</th>
                    <th v-if="rateSummary?.guaranteedRarity" class="py-1.5 font-medium">
                      {{ t("gachas.detail.guaranteedRate") }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in rateRows" :key="row.rarity" class="border-b last:border-b-0">
                    <td class="py-1.5 pr-3">{{ rarityLabel(row.rarity) }}</td>
                    <td class="py-1.5 pr-3 tabular-nums">{{ row.cardCount }}</td>
                    <td class="py-1.5 pr-3 tabular-nums">
                      {{ row.baseRate != null ? formatGachaRatePercent(row.baseRate, 1) : "—" }}
                    </td>
                    <td v-if="rateSummary?.guaranteedRarity" class="py-1.5 tabular-nums">
                      {{ row.guaranteedRate != null ? formatGachaRatePercent(row.guaranteedRate, 1) : "—" }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="rateSummary?.guaranteedRarity" class="text-xs text-muted-foreground">
              {{ t("gachas.detail.guaranteedNote", { rarity: rarityLabel(rateSummary.guaranteedRarity) }) }}
            </p>
          </CardContent>
        </Card>

        <!-- Behaviors -->
        <Card v-if="gacha.behaviors.length > 0">
          <CardHeader>
            <CardTitle class="text-base">{{ t("gachas.detail.behaviors") }}</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="border-b text-muted-foreground">
                    <th class="py-1.5 pr-3 font-medium">{{ t("gachas.detail.behaviorType") }}</th>
                    <th class="py-1.5 pr-3 font-medium">{{ t("gachas.detail.spinCount") }}</th>
                    <th class="py-1.5 pr-3 font-medium">{{ t("gachas.detail.cost") }}</th>
                    <th class="py-1.5 font-medium">{{ t("gachas.detail.executeLimit") }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(behavior, index) in gacha.behaviors"
                    :key="behavior.id ?? `behavior-${index}`"
                    class="border-b last:border-b-0"
                  >
                    <td class="py-1.5 pr-3">
                      <span class="inline-flex flex-wrap items-center gap-1.5">
                        {{ behaviorTypeLabel(behavior.gachaBehaviorType) }}
                        <span
                          v-if="behavior.gachaSpinnableType === 'colorful_pass'"
                          class="inline-flex items-center whitespace-nowrap rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-medium text-fuchsia-700 dark:text-fuchsia-300"
                        >
                          {{ t("gachas.detail.colorfulPass") }}
                        </span>
                      </span>
                    </td>
                    <td class="py-1.5 pr-3 tabular-nums">{{ behavior.spinCount ?? "—" }}</td>
                    <td class="py-1.5 pr-3 tabular-nums">
                      {{ behaviorCostLabel(behavior.costResourceType, behavior.costResourceQuantity) }}
                    </td>
                    <td class="py-1.5 tabular-nums">{{ behavior.executeLimit ?? "—" }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Ceil item -->
      <Card v-if="ceilItem">
        <CardHeader>
          <CardTitle class="text-base">{{ t("gachas.detail.ceilItem") }}</CardTitle>
        </CardHeader>
        <CardContent class="flex items-center gap-3">
          <div class="size-14 shrink-0 overflow-hidden rounded-md bg-muted">
            <GachaAssetImage :sources="ceilItemIconSources" :alt="ceilItem.name" />
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">{{ ceilItem.name || `#${ceilItem.id}` }}</p>
            <p class="text-xs text-muted-foreground">#{{ ceilItem.id }}</p>
          </div>
        </CardContent>
      </Card>

      <!-- Summary -->
      <Card v-if="summaryText">
        <CardHeader>
          <CardTitle class="text-base">{{ t("gachas.detail.summary") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{{ summaryText }}</p>
        </CardContent>
      </Card>

      <!-- Description -->
      <Card v-if="descriptionText">
        <CardHeader>
          <CardTitle class="text-base">{{ t("gachas.detail.description") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{{ descriptionText }}</p>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
