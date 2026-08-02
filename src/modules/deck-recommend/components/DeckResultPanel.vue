<script setup lang="ts">
import { computed, ref, watch } from "vue"
import type { RecommendDeck } from "haruki-sekai-deck-recommend-cpp"
import {
  LucideCheck,
  LucideChevronDown,
  LucideCopy,
  LucideGamepad2,
  LucideListMusic,
  LucideTriangleAlert,
} from "lucide-vue-next"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import CardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"
import { useSettingsStore } from "@/shared/stores/settings"
import type { SekaiRegion } from "@/types"
import DeckSongRankingDialog from "./DeckSongRankingDialog.vue"
import {
  buildDeckSupportCardViews,
  resolveDeckSupportCards,
  type DeckResultDeckView,
  type DeckResultSupportCardView,
} from "../lib/card-thumbnail"
import {
  algorithmLabel as resolveAlgorithmLabel,
  algorithmTagClass,
  buildDeckCompareRows,
  cardDetailTitle,
  deckBasicInfoGridClass as resolveDeckBasicInfoGridClass,
  deckBasicInfoMetrics as buildDeckBasicInfoMetrics,
  deckBonusParts,
  deckMetricGridClass,
  deckPowerDetailItems as buildDeckPowerDetailItems,
  deckSourceAlgorithms,
  deckSummaryMetrics as buildDeckSummaryMetrics,
  formatDeckInteger,
  formatDeckPercent,
  readStateTagClass,
  recommendElapsedTimingLabel,
  type DeckResultMetricsContext,
} from "../lib/deck-result-metrics"
import type { DeckRecommendAlgorithm, DeckRecommendMode, DeckRecommendTarget } from "../lib/recommend-options"
import type { useDeckRecommendRunner } from "../composables/useDeckRecommendRunner"

const props = defineProps<{
  runner: ReturnType<typeof useDeckRecommendRunner>
  resultDecks: DeckResultDeckView[]
  warnings: Array<{ key: string; message: string }>
  mode: DeckRecommendMode
  target: DeckRecommendTarget
  /** Treat decks as world-bloom even without a support bonus (selection/simulation says so). */
  assumeWorldBloom: boolean
  dataRegion: SekaiRegion
  accountServer: SekaiRegion | null
  eventId: string | null
  liveType: "multi" | "solo"
  songRankingAvailable: boolean
}>()

const { t, locale } = useI18n()
const settingsStore = useSettingsStore()
const runner = props.runner

const metricsContext = computed<DeckResultMetricsContext>(() => ({
  t,
  locale: locale.value,
  mode: props.mode,
  target: props.target,
}))

const resultDecks = computed(() => props.resultDecks)
const showResultCard = computed(() =>
  runner.error.value != null || runner.elapsedMs.value != null || resultDecks.value.length > 0,
)

// --- Runner phase steps for the progress panel ---

const RUNNER_PHASE_STEPS = [
  "fetching-user-data",
  "preparing-data",
  "initializing",
  "loading-data",
  "recommending",
] as const

const runnerPhaseIndex = computed(() => {
  const phase = runner.phase.value
  return phase != null ? (RUNNER_PHASE_STEPS as readonly string[]).indexOf(phase) : -1
})

const resultTimingItems = computed<Array<{ key: string; label: string; elapsedMs: number; class: string }>>(() => {
  const items: Array<{ key: string; label: string; elapsedMs: number; class: string }> = []
  if (runner.dataElapsedMs.value != null) {
    items.push({
      key: "data",
      label: t("deckRecommend.result.dataElapsed"),
      elapsedMs: runner.dataElapsedMs.value,
      class: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
    })
  }
  if (runner.engineDataElapsedMs.value != null) {
    items.push({
      key: "engine-data",
      label: t("deckRecommend.result.engineDataElapsed"),
      elapsedMs: runner.engineDataElapsedMs.value,
      class: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
    })
  }
  if (runner.recommendElapsedMs.value != null) {
    items.push({
      key: "recommend",
      label: recommendElapsedTimingLabel(t, runner.resultExecutionMode.value),
      elapsedMs: runner.recommendElapsedMs.value,
      class: "border-lime-200 bg-lime-50 text-lime-800 dark:border-lime-500/30 dark:bg-lime-500/10 dark:text-lime-200",
    })
  }

  return items
})

// --- Deck actions ---

const songRankingOpen = ref(false)
const songRankingDeck = ref<RecommendDeck | null>(null)

function openSongRanking(deckView: DeckResultDeckView) {
  songRankingDeck.value = deckView.deck as RecommendDeck
  songRankingOpen.value = true
}

async function copyDeck(deckView: DeckResultDeckView) {
  const metrics = deckBasicInfoMetrics(deckView.deck)
    .map((metric) => `${metric.label} ${metric.value}`)
    .join(" · ")
  const cards = deckView.cards
    .map((cardView) => `#${cardView.card.card_id} ${cardDetailTitle(cardView)}`)
    .join("\n")
  const text = `${t("deckRecommend.result.deckTitle", { index: deckView.index + 1 })} · ${metrics}\n${cards}`
  try {
    await navigator.clipboard.writeText(text)
    toast.success(t("deckRecommend.result.actions.copied"))
  } catch {
    toast.error(t("deckRecommend.result.actions.copyFailed"))
  }
}

// --- Deck comparison (first selected deck is the baseline) ---

const comparedDeckIndexes = ref<number[]>([])

watch(resultDecks, () => {
  comparedDeckIndexes.value = []
})

function toggleDeckCompare(index: number, checked: boolean) {
  const rest = comparedDeckIndexes.value.filter((item) => item !== index)
  comparedDeckIndexes.value = checked ? [...rest, index] : rest
}

const comparedDecks = computed(() => comparedDeckIndexes.value
  .map((index) => resultDecks.value.find((view) => view.index === index))
  .filter((view): view is DeckResultDeckView => view != null))

const deckCompareRows = computed(() => buildDeckCompareRows(metricsContext.value, comparedDecks.value))

// --- Template helpers bound to the metrics context ---

function deckSummaryMetrics(deck: DeckResultDeckView["deck"]) {
  return buildDeckSummaryMetrics(metricsContext.value, deck)
}

function deckBasicInfoMetrics(deck: DeckResultDeckView["deck"]) {
  return buildDeckBasicInfoMetrics(metricsContext.value, deck)
}

function deckBasicInfoGridClass(deck: DeckResultDeckView["deck"]) {
  return resolveDeckBasicInfoGridClass(props.mode, deck)
}

function deckPowerDetailItems(deck: DeckResultDeckView["deck"]) {
  return buildDeckPowerDetailItems(t, deck)
}

function algorithmLabel(algorithm: DeckRecommendAlgorithm) {
  return resolveAlgorithmLabel(t, algorithm)
}

function isWorldBloomResultDeck(deck: DeckResultDeckView["deck"]) {
  return Number(deck.support_deck_bonus_rate) > 0 || props.assumeWorldBloom
}

function worldBloomSupportCardViews(deck: DeckResultDeckView["deck"]): DeckResultSupportCardView[] {
  return buildDeckSupportCardViews(
    resolveDeckSupportCards(deck),
    runner.masterData.value,
    props.dataRegion,
    settingsStore.currentAssetEndpoint,
  )
}

function mainDeckSectionTitle(deck: DeckResultDeckView["deck"]) {
  return isWorldBloomResultDeck(deck)
    ? t("deckRecommend.result.sections.mainCards")
    : t("deckRecommend.result.sections.cards")
}

function bonusTagLabel(value: number) {
  return t("deckRecommend.result.bonusTag", { value: formatDeckPercent(locale.value, value) })
}

function readStateLabel(read: boolean) {
  return t(read ? "deckRecommend.result.readState.read" : "deckRecommend.result.readState.unread")
}

function formatInteger(value: number | undefined) {
  return formatDeckInteger(locale.value, value)
}

function formatPercentValue(value: number) {
  return formatDeckPercent(locale.value, value)
}

</script>

<template>
        <div v-if="runner.running.value" class="rounded-lg border bg-card p-4 shadow-sm">
          <div class="grid gap-2">
            <div
              v-for="(step, stepIndex) in RUNNER_PHASE_STEPS"
              :key="step"
              class="flex items-center gap-2 text-sm"
            >
              <LucideCheck v-if="runnerPhaseIndex > stepIndex" class="size-4 shrink-0 text-emerald-500" />
              <span
                v-else-if="runnerPhaseIndex === stepIndex"
                class="size-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent"
                aria-hidden="true"
              />
              <span v-else class="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
                <span class="size-1.5 rounded-full bg-muted-foreground/40" />
              </span>
              <span
                :class="runnerPhaseIndex === stepIndex
                  ? 'font-medium'
                  : runnerPhaseIndex > stepIndex
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/60'"
              >
                {{ t(`deckRecommend.runner.phases.${step}`) }}
              </span>
            </div>
          </div>
          <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div class="deck-recommend-progress-bar h-full w-1/3 rounded-full bg-primary" />
          </div>
        </div>

        <div
          v-if="!showResultCard && !runner.running.value"
          class="flex min-h-72 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-card/50 p-8 text-center"
        >
          <LucideGamepad2 class="size-8 text-muted-foreground/50" />
          <p class="text-sm font-medium">{{ t("deckRecommend.result.title") }}</p>
          <p class="max-w-sm text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.result.idlePlaceholder") }}</p>
        </div>

        <Card v-if="showResultCard" class="min-w-0 gap-3 rounded-lg py-3 xl:gap-4 xl:py-4">
          <CardHeader class="px-2 sm:px-4 xl:px-6">
            <CardTitle class="text-base">{{ t("deckRecommend.result.title") }}</CardTitle>
            <CardDescription>
              <template v-if="runner.elapsedMs.value != null">
                {{ t("deckRecommend.result.totalElapsed", { ms: runner.elapsedMs.value }) }}
              </template>
              <template v-else>
                {{ t("deckRecommend.result.description") }}
              </template>
            </CardDescription>
            <div v-if="runner.elapsedMs.value != null && warnings.length > 0" class="grid gap-1.5 pt-1 sm:gap-2">
              <div
                v-for="warning in warnings"
                :key="warning.key"
                class="flex w-full items-start gap-2 rounded-md border border-amber-300 bg-amber-50/90 px-2 py-2 text-sm font-medium leading-5 text-amber-900 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100 sm:px-3"
              >
                <LucideTriangleAlert class="mt-0.5 size-4 shrink-0" />
                <span>{{ warning.message }}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent class="space-y-2 px-2 pb-2 sm:px-4 sm:pb-4 xl:space-y-3 xl:px-6 xl:pb-6">
            <div v-if="resultTimingItems.length > 0" class="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span
                v-for="item in resultTimingItems"
                :key="item.key"
                :class="[
                  'inline-flex items-baseline gap-1 rounded-md border px-1.5 py-1 font-medium sm:px-2',
                  item.class,
                ]"
              >
                <span>{{ item.label }}</span>
                <span class="rounded bg-background/80 px-1 font-mono text-sm font-bold text-foreground shadow-sm">
                  {{ item.elapsedMs }}
                </span>
                <span>ms</span>
              </span>
            </div>
            <div v-if="runner.algorithmTimings.value.length > 0" class="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span
                v-for="item in runner.algorithmTimings.value"
                :key="item.algorithm"
                :class="[
                  'inline-flex items-baseline gap-1 rounded-md border px-1.5 py-1 font-medium sm:px-2',
                  algorithmTagClass(item.algorithm),
                ]"
              >
                <span>{{ algorithmLabel(item.algorithm) }}</span>
                <span class="rounded bg-background/80 px-1 font-mono text-sm font-bold text-foreground shadow-sm">
                  {{ item.elapsedMs }}
                </span>
                <span>ms</span>
              </span>
            </div>
            <div v-if="runner.error.value" class="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {{ runner.error.value }}
            </div>
            <div v-else-if="resultDecks.length === 0" class="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {{ t("deckRecommend.result.empty") }}
            </div>
            <div v-if="deckCompareRows.length > 0" class="overflow-x-auto rounded-md border bg-background/80 shadow-sm">
              <table class="w-full min-w-[28rem] text-xs">
                <thead>
                  <tr class="border-b bg-muted/30 text-muted-foreground">
                    <th class="px-2.5 py-2 text-left font-medium">{{ t("deckRecommend.result.actions.compareTitle") }}</th>
                    <th
                      v-for="(view, position) in comparedDecks"
                      :key="view.index"
                      class="px-2.5 py-2 text-right font-medium"
                    >
                      {{ t("deckRecommend.result.deckTitle", { index: view.index + 1 }) }}
                      <span
                        v-if="position === 0"
                        class="ml-1 rounded bg-muted px-1 py-0.5 text-[10px] font-medium"
                      >
                        {{ t("deckRecommend.result.actions.compareBaseline") }}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in deckCompareRows" :key="row.kind" class="border-b last:border-b-0">
                    <td class="px-2.5 py-2 text-muted-foreground">{{ row.label }}</td>
                    <td
                      v-for="(cell, position) in row.cells"
                      :key="position"
                      class="px-2.5 py-2 text-right tabular-nums"
                    >
                      <span class="font-medium">{{ cell.value }}</span>
                      <span
                        v-if="cell.diffLabel"
                        :class="[
                          'ml-1 text-[10px] font-semibold',
                          cell.tone === 'up'
                            ? 'text-emerald-600 dark:text-emerald-300'
                            : cell.tone === 'down'
                              ? 'text-red-500 dark:text-red-300'
                              : 'text-muted-foreground',
                        ]"
                      >{{ cell.tone === 'up' ? '▲' : cell.tone === 'down' ? '▼' : '' }}{{ cell.diffLabel }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Collapsible
              v-for="deckView in resultDecks"
              :key="deckView.index"
              v-slot="{ open }"
              as-child
            >
              <section class="overflow-hidden rounded-md border bg-background/80 shadow-sm">
                <CollapsibleTrigger as-child>
                  <button
                    type="button"
                    class="relative grid w-full gap-2 p-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-start sm:gap-3 sm:p-3"
                  >
                    <div class="min-w-0 space-y-2">
                      <div class="flex min-w-0 flex-wrap items-center gap-2 pr-7 md:pr-0">
                        <span class="shrink-0 text-sm font-semibold text-foreground">
                          {{ t("deckRecommend.result.deckTitle", { index: deckView.index + 1 }) }}
                        </span>
                        <div v-if="deckSourceAlgorithms(deckView.deck).length > 0" class="flex min-w-0 flex-wrap gap-1.5">
                          <span
                            v-for="algorithm in deckSourceAlgorithms(deckView.deck)"
                            :key="algorithm"
                            :class="[
                              'rounded-md border px-1.5 py-0.5 text-[11px] font-medium',
                              algorithmTagClass(algorithm),
                            ]"
                          >
                            {{ algorithmLabel(algorithm) }}
                          </span>
                        </div>
                      </div>

                      <div v-if="!open" :class="['grid min-w-0 gap-1 sm:gap-2', deckMetricGridClass(deckSummaryMetrics(deckView.deck).length)]">
                        <div
                          v-for="metric in deckSummaryMetrics(deckView.deck)"
                          :key="metric.kind"
                          class="min-w-0 rounded bg-muted/20 px-1.5 py-1 sm:rounded-md sm:px-3 sm:py-2"
                        >
                          <span class="block truncate text-[10px] font-medium uppercase leading-4 text-muted-foreground sm:text-[11px]">{{ metric.label }}</span>
                          <span class="block truncate font-mono text-xs font-semibold text-foreground sm:text-sm">
                            {{ metric.value }}
                          </span>
                          <span v-if="metric.detail" class="hidden truncate text-[11px] text-muted-foreground sm:block">
                            {{ metric.detail }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      v-if="!open"
                      class="grid w-full max-w-[41rem] grid-cols-5 content-center justify-items-center gap-0.5 self-end justify-self-center rounded bg-muted/20 p-0.5 ring-1 ring-border/60 sm:gap-1 sm:rounded-md md:w-[26rem] md:max-w-full md:justify-self-end"
                    >
                      <CardThumbnail
                        v-for="cardView in deckView.cards"
                        :key="cardView.card.card_id"
                        :thumbnail="cardView.thumbnail"
                        size="fluid"
                      />
                    </div>

                    <LucideChevronDown
                      :class="[
                        'absolute right-2 top-2 size-5 text-muted-foreground transition-transform duration-200 sm:right-3 sm:top-3 md:static md:mt-1 md:self-start md:justify-self-end',
                        open ? 'rotate-180' : '',
                      ]"
                    />
                  </button>
                </CollapsibleTrigger>

                <div class="flex flex-wrap items-center gap-2 border-t bg-muted/10 px-2.5 py-1.5 sm:px-3">
                  <label class="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                    <Checkbox
                      :model-value="comparedDeckIndexes.includes(deckView.index)"
                      @update:model-value="checked => toggleDeckCompare(deckView.index, checked === true)"
                    />
                    {{ t("deckRecommend.result.actions.compare") }}
                  </label>
                  <span class="flex-1" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    class="h-7 gap-1 px-2 text-xs"
                    @click="copyDeck(deckView)"
                  >
                    <LucideCopy class="size-3.5" />
                    {{ t("deckRecommend.result.actions.copy") }}
                  </Button>
                  <Button
                    v-if="songRankingAvailable"
                    type="button"
                    variant="ghost"
                    size="sm"
                    class="h-7 gap-1 px-2 text-xs"
                    @click="openSongRanking(deckView)"
                  >
                    <LucideListMusic class="size-3.5" />
                    {{ t("deckRecommend.result.actions.songRanking") }}
                  </Button>
                </div>

                <CollapsibleContent>
                  <div class="space-y-3 border-t bg-muted/5 p-2.5 sm:p-3">
                    <Collapsible v-slot="{ open: basicOpen }" as-child>
                      <section class="overflow-hidden rounded-md bg-background/70 ring-1 ring-border/60">
                        <CollapsibleTrigger as-child>
                          <button
                            type="button"
                            class="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
                          >
                            <span class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                              <span class="mr-1 min-w-0 text-sm font-semibold">{{ t("deckRecommend.result.sections.basic") }}</span>
                              <template v-if="!basicOpen">
                                <span
                                  v-for="metric in deckBasicInfoMetrics(deckView.deck)"
                                  :key="metric.kind"
                                  :class="[
                                    'rounded-md bg-muted/45 px-1.5 py-0.5 text-xs font-medium text-muted-foreground',
                                    metric.class,
                                  ]"
                                >
                                  {{ metric.label }}
                                  <span class="font-mono font-semibold text-foreground">{{ metric.value }}</span>
                                </span>
                              </template>
                            </span>
                            <LucideChevronDown
                              :class="[
                                'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                                basicOpen ? 'rotate-180' : '',
                              ]"
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div :class="['grid grid-cols-2 gap-1.5 border-t bg-muted/5 p-2 sm:gap-2 sm:p-3', deckBasicInfoGridClass(deckView.deck)]">
                            <div
                              v-for="metric in deckBasicInfoMetrics(deckView.deck)"
                              :key="metric.kind"
                              class="rounded bg-background/80 px-2 py-1.5 ring-1 ring-border/40 sm:rounded-md sm:px-3 sm:py-2"
                            >
                              <span class="block text-xs text-muted-foreground">{{ metric.label }}</span>
                              <span class="block font-mono text-sm font-semibold sm:text-base">
                                {{ metric.value }}
                              </span>
                              <span v-if="metric.detail" class="block text-xs text-muted-foreground">
                                {{ metric.detail }}
                              </span>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </section>
                    </Collapsible>

                    <Collapsible v-slot="{ open: powerOpen }" as-child>
                      <section class="overflow-hidden rounded-md bg-background/70 ring-1 ring-border/60">
                        <CollapsibleTrigger as-child>
                          <button
                            type="button"
                            class="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
                          >
                            <span class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                              <span class="mr-1 min-w-0 text-sm font-semibold">{{ t("deckRecommend.result.sections.power") }}</span>
                              <template v-if="!powerOpen">
                                <span class="rounded-md bg-muted/45 px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                                  {{ t("deckRecommend.result.power.total") }}
                                  <span class="font-mono font-semibold text-foreground">{{ formatInteger(deckView.deck.total_power) }}</span>
                                </span>
                                <span class="rounded-md bg-muted/45 px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                                  {{ t("deckRecommend.result.power.base") }}
                                  <span class="font-mono font-semibold text-foreground">{{ formatInteger(deckView.deck.base_power) }}</span>
                                </span>
                              </template>
                            </span>
                            <LucideChevronDown
                              :class="[
                                'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                                powerOpen ? 'rotate-180' : '',
                              ]"
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div class="grid grid-cols-2 gap-1.5 border-t bg-muted/5 p-2 sm:grid-cols-4 sm:gap-2 sm:p-3">
                            <div
                              v-for="item in deckPowerDetailItems(deckView.deck)"
                              :key="item.key"
                              class="rounded bg-background/80 px-2 py-1.5 ring-1 ring-border/40 sm:rounded-md sm:px-3 sm:py-2"
                            >
                              <span class="block text-xs text-muted-foreground">{{ item.label }}</span>
                              <span class="block font-mono text-sm font-semibold text-foreground">
                                {{ formatInteger(item.value) }}
                              </span>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </section>
                    </Collapsible>

                    <Collapsible v-slot="{ open: mainCardsOpen }" as-child default-open>
                      <section class="overflow-hidden rounded-md bg-background/70 ring-1 ring-border/60">
                        <CollapsibleTrigger as-child>
                          <button
                            type="button"
                            class="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
                          >
                            <span class="flex min-w-0 flex-wrap items-center gap-2">
                              <span class="text-sm font-semibold">{{ mainDeckSectionTitle(deckView.deck) }}</span>
                              <span class="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                                {{ bonusTagLabel(deckBonusParts(deckView.deck).main) }}
                              </span>
                            </span>
                            <LucideChevronDown
                              :class="[
                                'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                                mainCardsOpen ? 'rotate-180' : '',
                              ]"
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div class="grid gap-2 border-t bg-muted/5 p-2 sm:p-3 lg:grid-cols-2">
                            <div
                              v-for="cardView in deckView.cards"
                              :key="cardView.card.card_id"
                              class="flex min-w-0 items-start gap-2 rounded-md bg-background/70 p-2 ring-1 ring-border/60 sm:gap-3"
                            >
                              <CardThumbnail :thumbnail="cardView.thumbnail" size="md" />
                              <div class="min-w-0 flex-1 space-y-2">
                                <div class="flex min-w-0 flex-wrap items-start justify-between gap-2">
                                  <span class="min-w-0 text-sm font-semibold leading-5">
                                    {{ cardDetailTitle(cardView) }}
                                  </span>
                                  <span class="shrink-0 rounded-md bg-background/70 px-1.5 py-0.5 font-mono text-xs text-muted-foreground ring-1 ring-border/70">
                                    #{{ cardView.card.card_id }}
                                  </span>
                                </div>
                                <div class="flex flex-wrap gap-1.5 text-xs">
                                  <span class="rounded-md bg-muted/50 px-1.5 py-0.5 font-medium text-foreground">
                                    {{ t("deckRecommend.result.cardTotalPowerShort", { value: formatInteger(cardView.card.total_power) }) }}
                                  </span>
                                  <span class="rounded-md bg-muted/50 px-1.5 py-0.5 text-muted-foreground">
                                    {{ t("deckRecommend.result.cardBasePowerShort", { value: formatInteger(cardView.card.base_power) }) }}
                                  </span>
                                  <span class="rounded-md bg-violet-50 px-1.5 py-0.5 font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">
                                    {{ t("deckRecommend.result.cardLevel", { value: cardView.card.level }) }}
                                  </span>
                                  <span class="rounded-md bg-violet-50 px-1.5 py-0.5 font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">
                                    {{ t("deckRecommend.result.skillLevel", { value: cardView.card.skill_level }) }}
                                  </span>
                                  <span class="rounded-md bg-rose-50 px-1.5 py-0.5 font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                                    {{ t("deckRecommend.result.skillScoreUpShort", { value: cardView.card.skill_score_up }) }}
                                  </span>
                                  <span
                                    v-if="cardView.card.skill_life_recovery > 0"
                                    class="rounded-md bg-rose-50 px-1.5 py-0.5 font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-200"
                                  >
                                    {{ t("deckRecommend.result.skillLifeRecoveryShort", { value: cardView.card.skill_life_recovery }) }}
                                  </span>
                                  <span class="rounded-md bg-rose-50 px-1.5 py-0.5 font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                                    {{ t("deckRecommend.result.cardEventBonusShort", { value: cardView.card.event_bonus_rate }) }}
                                  </span>
                                  <span
                                    :class="[
                                      'rounded-md border px-1.5 py-0.5 font-medium',
                                      readStateTagClass(cardView.card.episode1_read),
                                    ]"
                                  >
                                    {{ t("deckRecommend.result.episodeFirst") }} {{ readStateLabel(cardView.card.episode1_read) }}
                                  </span>
                                  <span
                                    :class="[
                                      'rounded-md border px-1.5 py-0.5 font-medium',
                                      readStateTagClass(cardView.card.episode2_read),
                                    ]"
                                  >
                                    {{ t("deckRecommend.result.episodeSecond") }} {{ readStateLabel(cardView.card.episode2_read) }}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </section>
                    </Collapsible>

                    <Collapsible
                      v-if="isWorldBloomResultDeck(deckView.deck) && worldBloomSupportCardViews(deckView.deck).length > 0"
                      v-slot="{ open: supportOpen }"
                      as-child
                    >
                      <section class="overflow-hidden rounded-md border bg-background/70">
                        <CollapsibleTrigger as-child>
                          <button
                            type="button"
                            class="flex w-full items-start justify-between gap-3 p-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-3"
                          >
                            <span class="flex min-w-0 flex-wrap items-center gap-2">
                              <span class="text-sm font-semibold">{{ t("deckRecommend.result.sections.supportCards") }}</span>
                              <span class="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                                {{ bonusTagLabel(deckBonusParts(deckView.deck).support) }}
                              </span>
                            </span>
                            <LucideChevronDown
                              :class="[
                                'mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                                supportOpen ? 'rotate-180' : '',
                              ]"
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div class="grid grid-cols-3 gap-1.5 border-t bg-muted/5 p-2 sm:grid-cols-4 sm:gap-2 sm:p-3 xl:grid-cols-5">
                            <div
                              v-for="supportCardView in worldBloomSupportCardViews(deckView.deck)"
                              :key="supportCardView.card.card_id"
                              class="grid gap-1.5 rounded-md bg-background/75 p-1.5 ring-1 ring-border/60 sm:gap-2 sm:p-2"
                            >
                              <div class="flex justify-center">
                                <CardThumbnail
                                  :thumbnail="supportCardView.thumbnail"
                                  :corner-badge="`#${supportCardView.card.card_id}`"
                                />
                              </div>
                              <div class="flex flex-wrap items-center justify-center gap-1.5 text-xs">
                                <span class="rounded-md bg-rose-50 px-1.5 py-0.5 font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                                  {{ formatPercentValue(supportCardView.card.bonus) }}%
                                </span>
                                <span class="font-mono text-muted-foreground">
                                  {{ t("deckRecommend.result.supportSkillLevel", { value: supportCardView.card.skill_level }) }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </section>
                    </Collapsible>
                  </div>
                </CollapsibleContent>
              </section>
            </Collapsible>
          </CardContent>
      </Card>

  <DeckSongRankingDialog
    v-model:open="songRankingOpen"
    :data-region="props.dataRegion"
    :account-server="props.accountServer"
    :deck="songRankingDeck"
    :event-id="props.eventId"
    :live-type="props.liveType"
  />
</template>

<style scoped>
.deck-recommend-progress-bar {
  animation: deck-recommend-progress-slide 1.4s ease-in-out infinite;
}

@keyframes deck-recommend-progress-slide {
  0% {
    transform: translateX(-120%);
  }

  100% {
    transform: translateX(320%);
  }
}
</style>
