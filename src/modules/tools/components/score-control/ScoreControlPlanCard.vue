<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { ArrowRight } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { formatNumberCN } from "@/lib/number-format"
import { isIdleRange, type ScoreControlOutcome, type ScoreControlPlan } from "../../lib/score-control-plan"

/**
 * One way to earn the gap: the games in playing order, each with the deck
 * bonus, the Live Boost and what to do with the score, then what it adds.
 * When the page knows the current pt, every step also shows the total to
 * expect afterwards, so the player can check the plan is on track as it goes.
 */
const props = defineProps<{
  plan: ScoreControlPlan
  index: number
  /** The pt total before the first game; null when only the gap was entered. */
  startPoint: number | null
}>()

const emit = defineEmits<{ "build-deck": [ScoreControlOutcome] }>()

const { t } = useI18n()

const steps = computed(() => {
  let running = props.startPoint
  return props.plan.steps.map((step, index) => {
    const subtotal = step.count * step.outcome.point
    if (running != null) {
      running += subtotal
    }
    return {
      key: index,
      count: step.count,
      outcome: step.outcome,
      idle: isIdleRange(step.outcome),
      subtotal,
      after: running,
    }
  })
})
</script>

<template>
  <article class="@container overflow-hidden rounded-xl border bg-card" data-testid="score-control-plan">
    <header class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/60 px-4 py-2.5">
      <h3 class="text-sm font-semibold">{{ t("tools.pointCalculator.result.planTitle", { index }) }}</h3>
      <span
        v-for="tag in plan.tags"
        :key="tag"
        class="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary"
      >
        {{ t(`tools.pointCalculator.result.tags.${tag}`) }}
      </span>
      <span
        v-if="!plan.idleOnly"
        class="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300"
      >
        {{ t("tools.pointCalculator.result.needsScore") }}
      </span>
      <p class="ml-auto text-xs tabular-nums text-muted-foreground">
        {{ t("tools.pointCalculator.result.planTotals", { games: plan.games, energy: plan.energy, decks: plan.decks }) }}
      </p>
    </header>

    <ol class="divide-y divide-border/60">
      <li
        v-for="step in steps"
        :key="step.key"
        class="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-2.5 @min-[42rem]:grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1.15fr)_8.5rem_auto]"
        data-testid="score-control-step"
      >
        <span class="order-1 text-sm font-semibold tabular-nums @min-[42rem]:order-none">
          {{ t("tools.pointCalculator.result.step.times", { count: step.count }) }}
        </span>

        <div class="order-2 flex min-w-0 flex-col @min-[42rem]:order-none">
          <p class="text-sm font-semibold tabular-nums">
            {{ t("tools.pointCalculator.result.step.deck", { value: step.outcome.eventBonus }) }}
          </p>
          <p class="text-[11px] tabular-nums text-muted-foreground">
            {{ t("tools.pointCalculator.result.step.boost", { index: step.outcome.boost, rate: step.outcome.boostMultiplier }) }}
          </p>
        </div>

        <div class="order-4 col-start-2 flex min-w-0 flex-col @min-[42rem]:order-none @min-[42rem]:col-start-auto">
          <template v-if="step.idle">
            <p class="text-sm" :title="t('tools.pointCalculator.result.step.idleHint')">{{ t("tools.pointCalculator.result.step.idle") }}</p>
            <p class="text-[11px] tabular-nums text-muted-foreground">
              {{ t("tools.pointCalculator.result.step.idleDetail", { score: formatNumberCN(step.outcome.scoreMax + 1) }) }}
            </p>
          </template>
          <p v-else class="text-sm font-medium tabular-nums text-amber-700 dark:text-amber-300">
            {{ formatNumberCN(step.outcome.scoreMin) }} ~ {{ formatNumberCN(step.outcome.scoreMax) }}
          </p>
        </div>

        <div class="order-3 flex flex-col items-end tabular-nums @min-[42rem]:order-none">
          <p class="text-sm font-semibold">+{{ formatNumberCN(step.subtotal) }}</p>
          <p v-if="step.after != null" class="text-[11px] text-muted-foreground">
            {{ t("tools.pointCalculator.result.step.after", { value: formatNumberCN(step.after) }) }}
          </p>
          <p v-else-if="step.count > 1" class="text-[11px] text-muted-foreground">
            {{ t("tools.pointCalculator.result.step.each", { value: formatNumberCN(step.outcome.point) }) }}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          class="order-5 -mr-2 h-8 shrink-0 px-2 @min-[42rem]:order-none"
          @click="emit('build-deck', step.outcome)"
        >
          {{ t("tools.pointCalculator.actions.buildDeck") }}
          <ArrowRight class="size-4" />
        </Button>
      </li>
    </ol>
  </article>
</template>
