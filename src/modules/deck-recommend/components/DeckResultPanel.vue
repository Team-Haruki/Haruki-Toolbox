<script setup lang="ts">
import { computed, ref, watch } from "vue"
import type { RecommendDeck } from "haruki-sekai-deck-recommend-cpp"
import {
  LucideCheck,
  LucideChevronDown,
  LucideCopy,
  LucideCloudUpload,
  LucideGamepad2,
  LucideListMusic,
  LucideScale,
  LucideTriangleAlert,
} from "lucide-vue-next"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import { Button } from "@/components/ui/button"
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
  deckBasicInfoMetrics as buildDeckBasicInfoMetrics,
  deckBonusParts,
  deckMetricGridClass,
  deckPowerDetailItems as buildDeckPowerDetailItems,
  deckSourceAlgorithms,
  deckSummaryMetrics as buildDeckSummaryMetrics,
  formatDeckInteger,
  formatDeckPercent,
  formatElapsedSeconds,
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

const resultTimingItems = computed<Array<{ key: string; label: string; elapsedMs: number }>>(() => {
  const items: Array<{ key: string; label: string; elapsedMs: number }> = []
  if (runner.dataElapsedMs.value != null) {
    items.push({
      key: "data",
      label: t("deckRecommend.result.dataElapsed"),
      elapsedMs: runner.dataElapsedMs.value,
    })
  }
  if (runner.engineDataElapsedMs.value != null) {
    items.push({
      key: "engine-data",
      label: t("deckRecommend.result.engineDataElapsed"),
      elapsedMs: runner.engineDataElapsedMs.value,
    })
  }
  if (runner.recommendElapsedMs.value != null) {
    items.push({
      key: "recommend",
      label: recommendElapsedTimingLabel(t, runner.resultExecutionMode.value),
      elapsedMs: runner.recommendElapsedMs.value,
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

/** Figures the expanded detail adds to the ones already on the deck's header line. */
function deckExtraMetrics(deck: DeckResultDeckView["deck"]) {
  const shown = new Set(deckSummaryMetrics(deck).map((metric) => metric.kind))
  return deckBasicInfoMetrics(deck).filter((metric) => !shown.has(metric.kind))
}

function deckPowerDetailItems(deck: DeckResultDeckView["deck"]) {
  return buildDeckPowerDetailItems(t, deck)
}

function algorithmLabel(algorithm: DeckRecommendAlgorithm) {
  return resolveAlgorithmLabel(t, algorithm)
}

const ALGORITHM_SHORT_KEYS: Record<DeckRecommendAlgorithm, string> = {
  dfs_ga: "dfsGa",
  dfs: "dfs",
  ga: "ga",
  rl: "rl",
}

/** The tag under a deck's cards; the full name is on the timing line. */
function algorithmShortLabel(algorithm: DeckRecommendAlgorithm) {
  return t(`deckRecommend.algorithmsShort.${ALGORITHM_SHORT_KEYS[algorithm]}`)
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

function episodeSymbol(read: boolean) {
  return read ? "\u2713" : "\u2717"
}

function episodeTagClass(card: { episode1_read: boolean; episode2_read: boolean }) {
  return card.episode1_read && card.episode2_read
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
    : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
}

function episodeTitle(card: { episode1_read: boolean; episode2_read: boolean }) {
  const first = t(card.episode1_read ? "deckRecommend.result.readState.read" : "deckRecommend.result.readState.unread")
  const second = t(card.episode2_read ? "deckRecommend.result.readState.read" : "deckRecommend.result.readState.unread")
  return `${t("deckRecommend.result.episodeFirst")} ${first} / ${t("deckRecommend.result.episodeSecond")} ${second}`
}

function formatInteger(value: number | undefined) {
  return formatDeckInteger(locale.value, value)
}

function formatPercentValue(value: number) {
  return formatDeckPercent(locale.value, value)
}

</script>

<template>
  <div class="@container/result flex min-w-0 flex-col gap-3" data-testid="deck-result-panel">
    <!-- Running: the phases as a checklist -->
    <div v-if="runner.running.value" class="rounded-xl border bg-card p-4">
      <div class="grid gap-2">
        <div
          v-for="(step, stepIndex) in RUNNER_PHASE_STEPS"
          :key="step"
          class="flex items-center gap-2 text-sm"
        >
          <LucideCheck v-if="runnerPhaseIndex > stepIndex" class="size-4 shrink-0 text-primary" />
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

    <!-- Nothing run yet -->
    <div
      v-if="!showResultCard && !runner.running.value"
      class="flex min-h-64 flex-col items-center justify-center gap-2 rounded-xl border bg-card p-8 text-center"
    >
      <LucideGamepad2 class="size-8 text-muted-foreground/50" />
      <p class="text-sm font-medium">{{ t("deckRecommend.result.title") }}</p>
      <p class="max-w-sm text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.result.idlePlaceholder") }}</p>
    </div>

    <template v-if="showResultCard">
      <!-- Heading: the total on the title line, the per-stage timings as one quiet line. -->
      <header class="flex flex-col gap-1.5">
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 class="text-base font-semibold">{{ t("deckRecommend.result.title") }}</h2>
          <p class="text-xs tabular-nums text-muted-foreground">
            <template v-if="runner.elapsedMs.value != null">
              {{ t("deckRecommend.result.totalElapsed", { seconds: formatElapsedSeconds(runner.elapsedMs.value) }) }}
            </template>
            <template v-else>
              {{ t("deckRecommend.result.description") }}
            </template>
          </p>
        </div>
        <p
          v-if="resultTimingItems.length > 0 || runner.algorithmTimings.value.length > 0"
          class="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] tabular-nums text-muted-foreground"
        >
          <span v-for="item in resultTimingItems" :key="item.key">
            {{ item.label }}
            <span class="font-medium text-foreground/80">{{ formatElapsedSeconds(item.elapsedMs) }}</span>
            {{ t("deckRecommend.result.secondsUnit") }}
          </span>
          <span v-for="item in runner.algorithmTimings.value" :key="item.algorithm">
            {{ algorithmLabel(item.algorithm) }}
            <span class="font-medium text-foreground/80">{{ formatElapsedSeconds(item.elapsedMs) }}</span>
            {{ t("deckRecommend.result.secondsUnit") }}
          </span>
        </p>
      </header>

      <div v-if="runner.elapsedMs.value != null && warnings.length > 0" class="grid gap-1.5">
        <div
          v-for="warning in warnings"
          :key="warning.key"
          class="flex w-full items-start gap-2 rounded-lg border border-amber-300 bg-amber-50/90 px-3 py-2 text-sm font-medium leading-5 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100"
        >
          <LucideTriangleAlert class="mt-0.5 size-4 shrink-0" />
          <span>{{ warning.message }}</span>
        </div>
      </div>

      <div
        v-if="runner.userDataMissing.value"
        class="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50/90 p-3 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100 sm:flex-row sm:items-center"
      >
        <LucideCloudUpload class="size-5 shrink-0" aria-hidden="true" />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold">{{ t("deckRecommend.result.missingUserDataTitle") }}</p>
          <p class="mt-1 text-xs leading-5 text-amber-900/80 dark:text-amber-100/75">
            {{ t("deckRecommend.result.missingUserDataDescription") }}
          </p>
        </div>
        <Button as-child size="sm" class="w-full shrink-0 sm:w-auto">
          <RouterLink to="/upload-data">
            <LucideCloudUpload class="size-4" aria-hidden="true" />
            {{ t("deckRecommend.result.uploadDataAction") }}
          </RouterLink>
        </Button>
      </div>
      <div v-else-if="runner.errorDescription.value" class="break-words rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
        <p>{{ runner.errorDescription.value.message }}</p>
        <p v-if="runner.errorDescription.value.detail" class="mt-1 text-xs text-destructive/70">
          {{ t("core.errors.detail", { detail: runner.errorDescription.value.detail }) }}
        </p>
      </div>
      <div v-else-if="resultDecks.length === 0" class="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        {{ t("deckRecommend.result.empty") }}
      </div>

      <!-- Comparison of the ticked decks; the first ticked one is the baseline. -->
      <div v-if="deckCompareRows.length > 0" class="overflow-x-auto rounded-xl border bg-card" data-testid="deck-compare">
        <table class="w-full min-w-[28rem] text-xs">
          <thead>
            <tr class="border-b bg-muted/30 text-muted-foreground">
              <th class="px-3 py-1.5 text-left font-medium">{{ t("deckRecommend.result.actions.compareTitle") }}</th>
              <th
                v-for="(view, position) in comparedDecks"
                :key="view.index"
                class="px-3 py-1.5 text-right font-medium"
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
            <tr v-for="row in deckCompareRows" :key="row.kind" class="border-b border-border/60 last:border-b-0">
              <td class="px-3 py-1.5 text-muted-foreground">{{ row.label }}</td>
              <td
                v-for="(cell, position) in row.cells"
                :key="position"
                class="px-3 py-1.5 text-right tabular-nums"
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
        <section class="overflow-hidden rounded-xl border bg-card" data-slot="deck-result">
          <!-- Three layouts by the pane's own width (container query, not
               viewport: beside the config pane it is ~45rem at 1440):
               wide, one line — rank, the five cards, the numbers, the actions;
               middle, the numbers take a second line;
               phone, the cards get a line of their own so they stay legible.
               The whole header toggles the detail: a stretched button sits
               under the content, and only the actions take clicks of their own. -->
          <div class="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 p-2.5 @[30rem]/result:grid-cols-[auto_14.5rem_minmax(0,1fr)_auto]">
            <CollapsibleTrigger as-child>
              <button
                type="button"
                class="absolute inset-0 outline-none transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                :aria-label="t('deckRecommend.result.deckTitle', { index: deckView.index + 1 })"
              />
            </CollapsibleTrigger>

            <span
              :class="[
                'pointer-events-none relative col-start-1 row-start-1 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums @[30rem]/result:row-span-2',
                deckView.index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              ]"
              aria-hidden="true"
            >
              {{ deckView.index + 1 }}
            </span>

            <div class="pointer-events-none relative col-span-3 col-start-1 row-start-2 grid max-w-80 grid-cols-5 gap-1 @[30rem]/result:col-span-1 @[30rem]/result:col-start-2 @[30rem]/result:row-start-1 @[30rem]/result:max-w-none">
              <CardThumbnail
                v-for="cardView in deckView.cards"
                :key="cardView.card.card_id"
                :thumbnail="cardView.thumbnail"
                size="fluid"
              />
            </div>

            <!-- Which algorithms arrived at this deck, in short form; the
                 timing line above spells the names out. -->
            <div
              v-if="deckSourceAlgorithms(deckView.deck).length > 0"
              class="pointer-events-none relative col-start-2 row-start-1 flex min-w-0 flex-wrap gap-1 @[30rem]/result:row-start-2"
            >
              <span
                v-for="algorithm in deckSourceAlgorithms(deckView.deck)"
                :key="algorithm"
                :class="['rounded border px-1 text-[10px] leading-4 font-medium whitespace-nowrap', algorithmTagClass(algorithm)]"
              >
                {{ algorithmShortLabel(algorithm) }}
              </span>
            </div>

            <dl
              :class="[
                'pointer-events-none relative col-span-3 col-start-1 row-start-3 grid min-w-0 gap-x-3 gap-y-1 @[30rem]/result:col-span-4 @[44rem]/result:col-span-1 @[44rem]/result:col-start-3 @[44rem]/result:row-span-2 @[44rem]/result:row-start-1',
                deckMetricGridClass(deckSummaryMetrics(deckView.deck).length),
              ]"
            >
              <div
                v-for="(metric, metricIndex) in deckSummaryMetrics(deckView.deck)"
                :key="metric.kind"
                class="flex min-w-0 flex-col"
              >
                <dt class="truncate text-[11px] text-muted-foreground">{{ metric.label }}</dt>
                <dd :class="['truncate font-semibold tabular-nums', metricIndex === 0 ? 'text-base leading-tight' : 'text-sm']">
                  {{ metric.value }}
                </dd>
                <dd v-if="metric.detail" class="truncate text-[11px] text-muted-foreground" :title="metric.detail">
                  {{ metric.detail }}
                </dd>
              </div>
            </dl>

            <div class="relative col-start-3 row-start-1 flex shrink-0 items-center gap-0.5 justify-self-end pointer-coarse:-my-1.5 @[30rem]/result:col-start-4 @[30rem]/result:row-span-2">
              <!-- Compare is a toggle like its two neighbours; ticked decks line up in the table above the list. -->
              <Button
                type="button"
                variant="ghost"
                size="icon"
                :class="[
                  'size-7 pointer-coarse:size-10',
                  comparedDeckIndexes.includes(deckView.index) ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary' : 'text-muted-foreground',
                ]"
                :aria-pressed="comparedDeckIndexes.includes(deckView.index)"
                :aria-label="t('deckRecommend.result.actions.compare')"
                :title="t('deckRecommend.result.actions.compare')"
                @click="toggleDeckCompare(deckView.index, !comparedDeckIndexes.includes(deckView.index))"
              >
                <LucideScale class="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="size-7 text-muted-foreground pointer-coarse:size-10"
                :aria-label="t('deckRecommend.result.actions.copy')"
                :title="t('deckRecommend.result.actions.copy')"
                @click="copyDeck(deckView)"
              >
                <LucideCopy class="size-3.5" />
              </Button>
              <Button
                v-if="songRankingAvailable"
                type="button"
                variant="ghost"
                size="icon"
                class="size-7 text-muted-foreground pointer-coarse:size-10"
                :aria-label="t('deckRecommend.result.actions.songRanking')"
                :title="t('deckRecommend.result.actions.songRanking')"
                @click="openSongRanking(deckView)"
              >
                <LucideListMusic class="size-3.5" />
              </Button>
              <LucideChevronDown
                :class="['pointer-events-none ml-0.5 size-4 text-muted-foreground transition-transform duration-200', open ? 'rotate-180' : '']"
                aria-hidden="true"
              />
            </div>
          </div>

          <CollapsibleContent>
            <div class="@container/detail flex flex-col gap-3 border-t border-border/60 bg-muted/20 p-3">
              <!-- The header already shows the main figures: here only the ones
                   it leaves out (live score, challenge delta), then how the
                   power adds up. -->
              <dl class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <div v-for="metric in deckExtraMetrics(deckView.deck)" :key="metric.kind" class="flex items-baseline gap-1.5">
                  <dt class="text-muted-foreground">{{ metric.label }}</dt>
                  <dd class="font-semibold tabular-nums">{{ metric.value }}</dd>
                </div>
                <div v-for="item in deckPowerDetailItems(deckView.deck)" :key="item.key" class="flex items-baseline gap-1.5">
                  <dt class="text-muted-foreground">{{ item.label }}</dt>
                  <dd :class="['tabular-nums', item.key === 'total' ? 'font-semibold' : 'font-medium']">{{ formatInteger(item.value) }}</dd>
                </div>
              </dl>

              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-sm font-semibold">{{ mainDeckSectionTitle(deckView.deck) }}</h3>
                <span class="rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[11px] font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                  {{ bonusTagLabel(deckBonusParts(deckView.deck).main) }}
                </span>
              </div>

              <!-- The five cards as a table: one line each, numbers in columns.
                   Under 40rem the numbers fold under the name as labelled pairs. -->
              <div class="divide-y divide-border/60 overflow-hidden rounded-lg border bg-card">
                <div class="hidden items-center gap-3 bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground @[40rem]/detail:flex">
                  <span class="min-w-0 flex-1">{{ t("deckRecommend.result.columns.card") }}</span>
                  <span class="w-20 shrink-0 text-right">{{ t("deckRecommend.result.columns.power") }}</span>
                  <span class="w-14 shrink-0 text-right">{{ t("deckRecommend.result.columns.skillLevel") }}</span>
                  <span class="w-20 shrink-0 text-right">{{ t("deckRecommend.result.columns.scoreUp") }}</span>
                  <span class="w-16 shrink-0 text-right">{{ t("deckRecommend.result.columns.eventBonus") }}</span>
                  <span class="w-12 shrink-0 text-right">{{ t("deckRecommend.result.episodesShort") }}</span>
                </div>
                <div
                  v-for="cardView in deckView.cards"
                  :key="cardView.card.card_id"
                  class="flex flex-wrap items-center gap-x-3 gap-y-1 px-2.5 py-1.5"
                >
                  <div class="size-11 shrink-0">
                    <CardThumbnail :thumbnail="cardView.thumbnail" size="fluid" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium" :title="cardDetailTitle(cardView)">{{ cardDetailTitle(cardView) }}</p>
                    <p class="text-[11px] tabular-nums text-muted-foreground">
                      #{{ cardView.card.card_id }} · {{ t("deckRecommend.result.cardLevel", { value: cardView.card.level }) }}
                    </p>
                  </div>
                  <div class="flex basis-full flex-wrap items-center gap-x-3 gap-y-1 pl-14 text-xs tabular-nums @[40rem]/detail:basis-auto @[40rem]/detail:flex-nowrap @[40rem]/detail:pl-0">
                    <span class="font-medium @[40rem]/detail:w-20 @[40rem]/detail:text-right">
                      <span class="mr-1 font-normal text-muted-foreground @[40rem]/detail:hidden">{{ t("deckRecommend.result.columns.power") }}</span>{{ formatInteger(cardView.card.total_power) }}
                    </span>
                    <span class="@[40rem]/detail:w-14 @[40rem]/detail:text-right">
                      <span class="mr-1 text-muted-foreground @[40rem]/detail:hidden">{{ t("deckRecommend.result.columns.skillLevel") }}</span>Lv.{{ cardView.card.skill_level }}
                    </span>
                    <span class="@[40rem]/detail:w-20 @[40rem]/detail:text-right">
                      <span class="mr-1 text-muted-foreground @[40rem]/detail:hidden">{{ t("deckRecommend.result.columns.scoreUp") }}</span>{{ cardView.card.skill_score_up }}%
                      <span
                        v-if="cardView.card.skill_life_recovery > 0"
                        class="ml-1 text-[11px] text-muted-foreground"
                        :title="t('deckRecommend.result.skillLifeRecoveryShort', { value: cardView.card.skill_life_recovery })"
                      >+{{ cardView.card.skill_life_recovery }}</span>
                    </span>
                    <span class="@[40rem]/detail:w-16 @[40rem]/detail:text-right">
                      <span class="mr-1 text-muted-foreground @[40rem]/detail:hidden">{{ t("deckRecommend.result.columns.eventBonus") }}</span>{{ cardView.card.event_bonus_rate }}%
                    </span>
                    <span class="flex @[40rem]/detail:w-12 @[40rem]/detail:justify-end">
                      <span
                        :class="['rounded border px-1 py-px text-[11px] font-medium', episodeTagClass(cardView.card)]"
                        :title="episodeTitle(cardView.card)"
                      >
                        <span class="mr-1 @[40rem]/detail:hidden">{{ t("deckRecommend.result.episodesShort") }}</span>{{ episodeSymbol(cardView.card.episode1_read) }}{{ episodeSymbol(cardView.card.episode2_read) }}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <template v-if="isWorldBloomResultDeck(deckView.deck) && worldBloomSupportCardViews(deckView.deck).length > 0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-sm font-semibold">{{ t("deckRecommend.result.sections.supportCards") }}</h3>
                  <span class="rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[11px] font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                    {{ bonusTagLabel(deckBonusParts(deckView.deck).support) }}
                  </span>
                </div>
                <div class="grid grid-cols-4 gap-1.5 @[28rem]/detail:grid-cols-6 @[40rem]/detail:grid-cols-8 @[52rem]/detail:grid-cols-10">
                  <div
                    v-for="supportCardView in worldBloomSupportCardViews(deckView.deck)"
                    :key="supportCardView.card.card_id"
                    class="flex flex-col items-center gap-0.5"
                    :title="`#${supportCardView.card.card_id}`"
                  >
                    <CardThumbnail :thumbnail="supportCardView.thumbnail" size="fluid" />
                    <span class="text-[11px] tabular-nums">
                      <span class="font-medium">{{ formatPercentValue(supportCardView.card.bonus) }}%</span>
                      <span class="ml-1 text-muted-foreground">{{ t("deckRecommend.result.supportSkillLevel", { value: supportCardView.card.skill_level }) }}</span>
                    </span>
                  </div>
                </div>
              </template>
            </div>
          </CollapsibleContent>
        </section>
      </Collapsible>
    </template>
  </div>

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
