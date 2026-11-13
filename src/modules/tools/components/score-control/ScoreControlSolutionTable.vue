<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { ArrowRight } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { formatNumberCN } from "@/lib/number-format"
import type { ScoreControlRange } from "../../lib/score-control"
import { isIdleRange } from "../../lib/score-control-plan"

const INITIAL_ROWS = 12

/**
 * Every way to earn the pt in a single game, easiest first: the ones that
 * need no playing, then the lowest score windows. Long lists start folded.
 */
const props = defineProps<{
  /** Already sorted by ease. */
  ranges: readonly ScoreControlRange[]
}>()

const emit = defineEmits<{ "build-deck": [ScoreControlRange] }>()

const { t } = useI18n()

const expanded = ref(false)
watch(() => props.ranges, () => {
  expanded.value = false
})

const visible = computed(() => (expanded.value ? props.ranges : props.ranges.slice(0, INITIAL_ROWS)))
</script>

<template>
  <section class="overflow-hidden rounded-xl border bg-card" data-testid="score-control-single">
    <header class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 pt-3 pb-2">
      <h2 class="text-sm font-semibold">{{ t("tools.pointCalculator.result.allSingle") }}</h2>
      <p class="text-xs text-muted-foreground">{{ t("tools.pointCalculator.result.allSingleHint", { count: ranges.length }) }}</p>
    </header>
    <table class="w-full border-collapse text-sm tabular-nums">
      <thead>
        <tr class="text-left text-[11px] text-muted-foreground">
          <th scope="col" class="border-b border-border/60 py-1.5 pl-4 font-normal">{{ t("tools.pointCalculator.result.columns.bonus") }}</th>
          <th scope="col" class="border-b border-border/60 py-1.5 pl-3 font-normal">{{ t("tools.pointCalculator.result.columns.boost") }}</th>
          <th scope="col" class="border-b border-border/60 py-1.5 pl-3 font-normal">{{ t("tools.pointCalculator.result.columns.score") }}</th>
          <th scope="col" class="border-b border-border/60 py-1.5 pr-4"><span class="sr-only">{{ t("tools.pointCalculator.actions.buildDeck") }}</span></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border/60">
        <tr v-for="range in visible" :key="`${range.eventBonus}-${range.boost}-${range.scoreMin}`" data-testid="score-control-single-row">
          <td class="py-1.5 pl-4 font-semibold whitespace-nowrap">{{ range.eventBonus }}%</td>
          <td class="py-1.5 pl-3 whitespace-nowrap">
            {{ t("tools.pointCalculator.conditions.boostOption", { index: range.boost }) }}
            <span class="text-[11px] text-muted-foreground">×{{ range.boostMultiplier }}</span>
          </td>
          <td class="py-1.5 pl-3" :title="isIdleRange(range) ? t('tools.pointCalculator.result.step.idleHint') : undefined">
            <template v-if="isIdleRange(range)">
              {{ t("tools.pointCalculator.result.step.idle") }}
              <span class="text-[11px] whitespace-nowrap text-muted-foreground">
                {{ t("tools.pointCalculator.result.step.idleDetail", { score: formatNumberCN(range.scoreMax + 1) }) }}
              </span>
            </template>
            <span v-else class="whitespace-nowrap">{{ formatNumberCN(range.scoreMin) }} ~ {{ formatNumberCN(range.scoreMax) }}</span>
          </td>
          <td class="py-1 pr-2 text-right">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="h-8 px-2"
              :aria-label="`${t('tools.pointCalculator.actions.buildDeck')} ${range.eventBonus}%`"
              @click="emit('build-deck', range)"
            >
              <span class="hidden sm:inline">{{ t("tools.pointCalculator.actions.buildDeck") }}</span>
              <ArrowRight class="size-4" />
            </Button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="ranges.length > INITIAL_ROWS && !expanded" class="border-t border-border/60 p-2">
      <Button type="button" variant="ghost" size="sm" class="w-full" @click="expanded = true">
        {{ t("tools.pointCalculator.result.showAll", { count: ranges.length }) }}
      </Button>
    </div>
  </section>
</template>
