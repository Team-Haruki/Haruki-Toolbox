<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucidePercent } from "lucide-vue-next"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import {
  resolveGachaLotteryTypeLabel,
  resolveGachaRarityLabel,
} from "@/modules/gachas/lib/gacha-labels"
import {
  formatGachaPercent,
  resolveGachaRarityToneClass,
  type GachaRateSegment,
  type GachaRateTable,
} from "@/modules/gachas/lib/gacha-rates"
import type { GachaGuaranteeRarity } from "@/modules/gachas/lib/gacha-simulator"

/**
 * Stacked 100 % bar for the normal lottery plus one table column per
 * lottery type the record actually carries (no synthesized guarantee column).
 */
const props = defineProps<{
  table: GachaRateTable | null
  segments: readonly GachaRateSegment[]
  guaranteeRarity: GachaGuaranteeRarity | null
  wishSelectCount: number
  loading: boolean
}>()

const { t, te } = useI18n()
const ctx = { t, te }

const empty = computed(() => props.table == null || props.table.rows.length === 0)
const lotteryTypes = computed(() => props.table?.lotteryTypes ?? [])
const showPerCard = computed(() => (props.table?.rows ?? []).some((row) => row.perCard != null))

function rarityLabel(rarity: string): string {
  return resolveGachaRarityLabel(ctx, rarity)
}

function lotteryLabel(lotteryType: string): string {
  return resolveGachaLotteryTypeLabel(ctx, lotteryType)
}
</script>

<template>
  <CatalogDetailSection
    :title="t('gachas.detail.rates')"
    :icon="LucidePercent"
    :description="t('gachaCatalog.rates.description')"
    :loading="loading"
    :empty="empty"
    :empty-message="t('gachaCatalog.rates.empty')"
    content-class="flex flex-col gap-4"
  >
    <div v-if="segments.length > 0" class="flex flex-col gap-2">
      <div
        class="flex h-3 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        :aria-label="t('gachaCatalog.rates.bar')"
      >
        <div
          v-for="segment in segments"
          :key="segment.rarity"
          :class="['h-full', resolveGachaRarityToneClass(segment.rarity)]"
          :style="{ width: `${segment.fraction * 100}%` }"
          :title="`${rarityLabel(segment.rarity)} ${formatGachaPercent(segment.fraction)}`"
        />
      </div>
      <ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <li v-for="segment in segments" :key="segment.rarity" class="inline-flex items-center gap-1.5">
          <span :class="['size-2.5 rounded-full', resolveGachaRarityToneClass(segment.rarity)]" aria-hidden="true" />
          <span>{{ rarityLabel(segment.rarity) }}</span>
          <span class="font-medium text-foreground tabular-nums">{{ formatGachaPercent(segment.fraction) }}</span>
        </li>
      </ul>
    </div>

    <div v-if="table" class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b text-muted-foreground">
            <th class="py-1.5 pr-3 font-medium">{{ t("gachas.detail.rarity") }}</th>
            <th class="py-1.5 pr-3 font-medium tabular-nums">{{ t("gachas.detail.cardCount") }}</th>
            <th v-for="lotteryType in lotteryTypes" :key="lotteryType" class="py-1.5 pr-3 font-medium">
              {{ lotteryLabel(lotteryType) }}
            </th>
            <th v-if="showPerCard" class="py-1.5 font-medium">{{ t("gachaCatalog.rates.perCard") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in table.rows" :key="row.rarity" class="border-b last:border-b-0">
            <td class="py-1.5 pr-3">
              <span class="inline-flex items-center gap-1.5">
                <span :class="['size-2 rounded-full', resolveGachaRarityToneClass(row.rarity)]" aria-hidden="true" />
                {{ rarityLabel(row.rarity) }}
              </span>
            </td>
            <td class="py-1.5 pr-3 tabular-nums">{{ row.cardCount }}</td>
            <td v-for="lotteryType in lotteryTypes" :key="lotteryType" class="py-1.5 pr-3 tabular-nums">
              {{ formatGachaPercent(row.rates[lotteryType]) }}
            </td>
            <td v-if="showPerCard" class="py-1.5 tabular-nums">{{ formatGachaPercent(row.perCard, 3) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex flex-col gap-1 text-xs text-muted-foreground">
      <p v-if="guaranteeRarity">{{ t("gachas.detail.guaranteedNote", { rarity: rarityLabel(guaranteeRarity) }) }}</p>
      <p v-if="wishSelectCount > 0">{{ t("gachaCatalog.rates.wishNote", { count: wishSelectCount }) }}</p>
    </div>
  </CatalogDetailSection>
</template>
