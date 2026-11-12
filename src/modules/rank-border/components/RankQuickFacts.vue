<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { ChartLine } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { useRankBorderContext } from "../composables/rank-border-context"
import { resolveQuickFactsDetailTarget } from "../lib/detail-link"
import type { RankBorderHonorView, RankBorderQuickFacts } from "../lib/rank-border-types"
import HonorBadge from "./HonorBadge.vue"
import RelativeTime from "./RelativeTime.vue"

/**
 * What a row opens into: the player's honors and profile comment, then every
 * figure the overview already holds for the seat (the holder's and the seat's
 * growth and pace, the gaps on either side and how long they would take to
 * close). Expanding a row costs zero requests; the trends live on the detail
 * page behind the button.
 */
const props = withDefaults(defineProps<{
  facts: RankBorderQuickFacts
  honors?: readonly RankBorderHonorView[]
}>(), {
  honors: () => [],
})

const { t } = useI18n()
const { ui } = useRankBorderContext()
const { openDetailPage } = ui

function openFullDetail() {
  openDetailPage(resolveQuickFactsDetailTarget(props.facts))
}
</script>

<template>
  <div class="@container flex flex-col gap-2.5 border-t border-border/60 bg-muted/20 px-3 py-2.5" data-slot="rank-quick-facts">
    <div v-if="honors.length > 0 || facts.profileWord" class="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span v-if="honors.length > 0" class="flex shrink-0 flex-wrap items-center gap-1.5">
        <HonorBadge v-for="honor in honors" :key="honor.key" :honor="honor" variant="row" />
      </span>
      <p
        v-if="facts.profileWord"
        class="min-w-0 flex-1 basis-48 text-xs whitespace-pre-line text-muted-foreground [overflow-wrap:anywhere]"
        :title="t('rankBorder.overview.facts.profileWord')"
      >
        {{ facts.profileWord }}
      </p>
    </div>

    <div class="flex flex-wrap items-end gap-x-4 gap-y-2.5">
      <dl class="grid min-w-0 flex-1 basis-64 grid-cols-2 gap-x-4 gap-y-2 @min-[34rem]:grid-cols-3 @min-[52rem]:grid-cols-4">
        <div v-if="facts.playerGrowthLabel" class="flex min-w-0 flex-col">
          <dt class="truncate text-[11px] text-muted-foreground">{{ t("rankBorder.overview.facts.holderGrowth") }}</dt>
          <dd :class="['truncate text-sm font-semibold tabular-nums', facts.playerGrowthPositive ? 'text-emerald-600 dark:text-emerald-400' : '']">
            {{ facts.playerGrowthLabel }}
          </dd>
          <dd v-if="facts.hourlySpeedLabel" class="truncate text-[11px] tabular-nums text-muted-foreground">{{ facts.hourlySpeedLabel }}</dd>
        </div>
        <div v-if="facts.rankGrowthLabel" class="flex min-w-0 flex-col">
          <dt class="truncate text-[11px] text-muted-foreground">{{ t("rankBorder.overview.facts.seatGrowth") }}</dt>
          <dd :class="['truncate text-sm font-semibold tabular-nums', facts.rankGrowthPositive ? 'text-emerald-600 dark:text-emerald-400' : '']">
            {{ facts.rankGrowthLabel }}
          </dd>
          <dd v-if="facts.seatSpeedLabel" class="truncate text-[11px] tabular-nums text-muted-foreground">{{ facts.seatSpeedLabel }}</dd>
        </div>
        <div v-if="facts.prevGapLabel" class="flex min-w-0 flex-col">
          <dt class="truncate text-[11px] text-muted-foreground">{{ facts.prevLabel }}</dt>
          <dd class="truncate text-sm font-semibold tabular-nums">{{ facts.prevGapLabel }}</dd>
          <dd v-if="facts.prevNote" class="text-[11px] text-muted-foreground">{{ facts.prevNote }}</dd>
        </div>
        <div v-if="facts.nextGapLabel" class="flex min-w-0 flex-col">
          <dt class="truncate text-[11px] text-muted-foreground">{{ facts.nextLabel }}</dt>
          <dd class="truncate text-sm font-semibold tabular-nums">{{ facts.nextGapLabel }}</dd>
          <dd v-if="facts.nextNote" class="text-[11px] text-muted-foreground">{{ facts.nextNote }}</dd>
        </div>
        <!-- The value is relative ("50 s ago"), so the label says "updated" rather than naming a clock. -->
        <div
          class="flex min-w-0 flex-col"
          :title="facts.timestamp ? t('rankBorder.result.latest', { value: ui.formatTimestamp(facts.timestamp) }) : undefined"
        >
          <dt class="truncate text-[11px] text-muted-foreground">{{ t("rankBorder.result.updatedAgo") }}</dt>
          <dd class="truncate text-sm font-semibold tabular-nums"><RelativeTime :timestamp="facts.timestamp" /></dd>
        </div>
      </dl>
      <Button type="button" size="sm" class="ml-auto h-8 shrink-0" @click.stop="openFullDetail">
        <ChartLine class="size-4" />
        {{ t("rankBorder.actions.openDetailPage") }}
      </Button>
    </div>
  </div>
</template>
