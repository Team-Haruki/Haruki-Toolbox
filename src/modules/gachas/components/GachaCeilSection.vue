<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideSticker } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatLocalizedDate, formatLocalizedDateTime } from "@/lib/date-time"
import type { CatalogMasterCard } from "@/shared/sekai/catalog"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import CatalogErrorState from "@/shared/components/catalog/CatalogErrorState.vue"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import type { CatalogGachaCeilItem } from "@/modules/gachas/lib/gacha-catalog"
import type {
  GachaCeilExchangeCost,
  GachaCeilExchangeRow,
  GachaCeilExchangeSummary,
  GachaResourceBoxReward,
} from "@/modules/gachas/lib/gacha-ceil"
import {
  resolveGachaExchangeLabelType,
  resolveGachaResourceTypeLabel,
} from "@/modules/gachas/lib/gacha-labels"

/**
 * Sticker (ceil item) plus the exchange table. The exchange resource is
 * region-conditional and heavy, so it loads on the section's first open.
 */
const props = defineProps<{
  ceilItem: CatalogGachaCeilItem | null
  ceilItemSources: readonly string[]
  itemsLoading: boolean
  exchangeSummary: GachaCeilExchangeSummary | null
  rows: readonly GachaCeilExchangeRow[]
  boxesAvailable: boolean
  exchangeLoading: boolean
  exchangeError: string | null
  cardsById: ReadonlyMap<number, CatalogMasterCard>
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
}>()

const emit = defineEmits<{
  open: []
  retry: []
}>()

const { t, te } = useI18n()
const ctx = { t, te }

const ceilItemName = computed(() => (props.ceilItem ? props.ceilItem.name || `#${props.ceilItem.id}` : null))

function costLabel(cost: GachaCeilExchangeCost | null): string {
  if (!cost) {
    return "—"
  }
  return `${cost.quantity} ${resolveGachaResourceTypeLabel(ctx, cost.resourceType)}`
}

function substituteLabel(costs: readonly GachaCeilExchangeCost[]): string {
  return costs.map((cost) => costLabel(cost)).join(" / ")
}

function rewardCard(reward: GachaResourceBoxReward): CatalogMasterCard | null {
  return reward.resourceType === "card" && reward.resourceId != null ? props.cardsById.get(reward.resourceId) ?? null : null
}

function rewardLabel(reward: GachaResourceBoxReward): string {
  const type = resolveGachaResourceTypeLabel(ctx, reward.resourceType)
  const id = reward.resourceId != null ? ` #${reward.resourceId}` : ""
  const quantity = reward.quantity > 1 ? ` ×${reward.quantity}` : ""
  return `${type}${id}${quantity}`
}

function formatPeriod(startAt: number | null, endAt: number | null): string | null {
  if (startAt == null && endAt == null) {
    return null
  }
  const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" }
  return `${formatLocalizedDate(startAt, options, t("gachas.common.dateFallback"))} – ${formatLocalizedDate(endAt, options, t("gachas.common.dateFallback"))}`
}
</script>

<template>
  <CatalogDetailSection
    :title="t('gachaCatalog.ceil.title')"
    :icon="LucideSticker"
    collapsible
    :default-open="false"
    :loading="itemsLoading"
    :empty="ceilItem == null"
    :empty-message="t('gachaCatalog.ceil.empty')"
    content-class="flex flex-col gap-4"
    @open="emit('open')"
  >
    <template #summary>
      <span class="block max-w-40 truncate sm:max-w-72">{{ ceilItemName ?? "" }}</span>
    </template>

    <div v-if="ceilItem" class="flex items-center gap-3">
      <div class="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
        <SekaiAssetImage :sources="ceilItemSources" :alt="ceilItemName ?? ''" fit="contain" />
      </div>
      <div class="min-w-0 text-sm">
        <p class="truncate font-medium">{{ ceilItemName }}</p>
        <p class="text-xs text-muted-foreground">
          <span class="font-mono">#{{ ceilItem.id }}</span>
          <span v-if="ceilItem.convertStartAt != null">
            · {{ t("gachaCatalog.ceil.convertAt", { time: formatLocalizedDateTime(ceilItem.convertStartAt, undefined, t("gachas.common.dateFallback")) }) }}
          </span>
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <h3 class="text-sm font-medium">{{ t("gachaCatalog.ceil.exchange") }}</h3>
      <div v-if="exchangeLoading" class="flex flex-col gap-2">
        <Skeleton class="h-4 w-2/3" />
        <Skeleton class="h-4 w-1/2" />
        <Skeleton class="h-16 w-full" />
      </div>
      <CatalogErrorState
        v-else-if="exchangeError"
        :message="t('catalog.detail.loadError')"
        :detail="exchangeError"
        @retry="emit('retry')"
      />
      <p v-else-if="rows.length === 0" class="text-sm text-muted-foreground">{{ t("gachaCatalog.ceil.exchangeEmpty") }}</p>
      <div v-else class="flex flex-col gap-2">
        <p v-if="exchangeSummary && formatPeriod(exchangeSummary.startAt, exchangeSummary.endAt)" class="text-xs text-muted-foreground tabular-nums">
          {{ t("catalog.detail.period") }} · {{ formatPeriod(exchangeSummary.startAt, exchangeSummary.endAt) }}
        </p>
        <p v-if="!boxesAvailable" class="text-xs text-muted-foreground">{{ t("gachaCatalog.ceil.rewardsUnavailable") }}</p>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b text-muted-foreground">
                <th class="py-1.5 pr-3 font-medium">{{ t("gachaCatalog.ceil.reward") }}</th>
                <th class="py-1.5 pr-3 font-medium">{{ t("gachaCatalog.ceil.cost") }}</th>
                <th class="py-1.5 font-medium">{{ t("gachaCatalog.ceil.limit") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.exchange.id" class="border-b align-top last:border-b-0">
                <td class="py-1.5 pr-3">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <Badge v-if="row.exchange.labelType" variant="rose" size="sm">
                      {{ resolveGachaExchangeLabelType(ctx, row.exchange.labelType) }}
                    </Badge>
                    <template v-if="row.rewards">
                      <template v-for="(reward, index) in row.rewards" :key="index">
                        <RouterLink
                          v-if="rewardCard(reward)"
                          :to="{ name: 'cards.detail', params: { cardId: reward.resourceId } }"
                          class="font-medium hover:underline"
                        >
                          {{ rewardCard(reward)?.prefix ?? `#${reward.resourceId}` }}
                        </RouterLink>
                        <span v-else>{{ rewardLabel(reward) }}</span>
                      </template>
                      <span v-if="row.rewards.length === 0" class="text-muted-foreground">—</span>
                    </template>
                    <span v-else class="text-muted-foreground">
                      {{ row.exchange.resourceBoxId != null ? t("gachaCatalog.ceil.rewardBox", { id: row.exchange.resourceBoxId }) : "—" }}
                    </span>
                  </div>
                </td>
                <td class="py-1.5 pr-3 tabular-nums">
                  <div>{{ costLabel(row.exchange.cost) }}</div>
                  <div v-if="row.exchange.substituteCosts.length > 0" class="text-muted-foreground">
                    {{ t("gachaCatalog.ceil.substitute", { cost: substituteLabel(row.exchange.substituteCosts) }) }}
                  </div>
                </td>
                <td class="py-1.5 tabular-nums">
                  {{ row.exchange.exchangeLimit ?? row.exchange.substituteLimit ?? t("gachaCatalog.ceil.unlimited") }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </CatalogDetailSection>
</template>
