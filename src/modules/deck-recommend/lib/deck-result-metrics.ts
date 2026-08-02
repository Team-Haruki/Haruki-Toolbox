import type { ComposerTranslation } from "vue-i18n"
import type { DeckResultCardView, DeckResultDeckView } from "./card-thumbnail"
import type { DeckRecommendAlgorithm, DeckRecommendMode, DeckRecommendTarget } from "./recommend-options"

type ResultDeck = DeckResultDeckView["deck"]

export type DeckResultMetricKind = "score" | "power" | "bonus" | "effective" | "liveScore" | "challengeDelta"

export type DeckResultMetric = {
  kind: DeckResultMetricKind
  label: string
  value: string
  detail?: string
  class?: string
}

/** Everything metric building depends on besides the deck itself. */
export type DeckResultMetricsContext = {
  t: ComposerTranslation
  locale: string
  mode: DeckRecommendMode
  target: DeckRecommendTarget
}

export function formatDeckInteger(locale: string, value: number | undefined): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(value) || 0)
}

export function formatDeckSignedNumber(locale: string, value: number | undefined): string {
  return new Intl.NumberFormat(locale, {
    signDisplay: "exceptZero",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export function formatDeckPercent(locale: string, value: number): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
}

/** The headline number of a deck: live score, mysekai PT, or event PT by mode. */
export function deckPointValue(mode: DeckRecommendMode, deck: ResultDeck): number {
  if ((mode === "challenge" || mode === "max") && Number(deck.live_score) > 0) {
    return deck.live_score
  }

  if (mode === "mysekai" && Number(deck.mysekai_event_point) > 0) {
    return deck.mysekai_event_point
  }

  return deck.score
}

export function deckPointLabel(t: ComposerTranslation, mode: DeckRecommendMode): string {
  return mode === "challenge" || mode === "max"
    ? t("deckRecommend.targets.score")
    : t("deckRecommend.targets.pt")
}

export function deckBonusParts(deck: ResultDeck) {
  const main = Number(deck.event_bonus_rate) || 0
  const support = Number(deck.support_deck_bonus_rate) || 0
  return { main, support, total: main + support }
}

export function deckLiveBoostPointDetailText(
  ctx: Pick<DeckResultMetricsContext, "locale" | "mode">,
  deck: ResultDeck,
): string | null {
  const deckWithBoost = deck as ResultDeck & {
    live_boost_multiplier?: number
    live_boost_original_score?: number
    live_boost_original_mysekai_event_point?: number
  }
  const multiplier = Number(deckWithBoost.live_boost_multiplier)
  if (!Number.isFinite(multiplier) || multiplier <= 1) {
    return null
  }

  const originalPoint = ctx.mode === "mysekai" && Number(deckWithBoost.live_boost_original_mysekai_event_point) > 0
    ? Number(deckWithBoost.live_boost_original_mysekai_event_point)
    : Number(deckWithBoost.live_boost_original_score)
  if (!Number.isFinite(originalPoint)) {
    return null
  }

  return `${formatDeckInteger(ctx.locale, originalPoint)} (${formatDeckInteger(ctx.locale, multiplier)}x)`
}

export function shouldShowChallengeScoreDelta(mode: DeckRecommendMode, deck: ResultDeck): boolean {
  return mode === "challenge" && "challenge_score_delta" in deck
}

export function deckSummaryMetricKinds(mode: DeckRecommendMode): DeckResultMetricKind[] {
  switch (mode) {
    case "challenge":
      return ["score", "power"]
    case "mysekai":
      return ["score", "power", "bonus"]
    case "max":
      return ["score", "power", "bonus", "effective"]
    case "bonus":
      return ["bonus", "score", "power", "effective"]
    case "event":
    default:
      return ["score", "power", "bonus", "effective"]
  }
}

export function deckBasicInfoMetricKinds(mode: DeckRecommendMode, deck: ResultDeck): DeckResultMetricKind[] {
  switch (mode) {
    case "challenge":
      return shouldShowChallengeScoreDelta(mode, deck) ? ["score", "challengeDelta"] : ["score"]
    case "mysekai":
      return ["score", "bonus"]
    case "max":
      return ["score", "bonus", "effective"]
    case "bonus":
    case "event":
    default:
      return ["score", "bonus", "liveScore", "effective"]
  }
}

export function recommendTargetMetricKind(target: DeckRecommendTarget): DeckResultMetricKind | null {
  switch (target) {
    case "score":
      return "score"
    case "power":
      return "power"
    case "bonus":
      return "bonus"
    case "skill":
      return "effective"
    default:
      return null
  }
}

/** The metric matching the recommend target leads; the rest keep their order. */
export function orderDeckMetricsByTarget(
  target: DeckRecommendTarget,
  kinds: DeckResultMetricKind[],
): DeckResultMetricKind[] {
  const primary = recommendTargetMetricKind(target)
  if (!primary || !kinds.includes(primary)) {
    return kinds
  }

  return [primary, ...kinds.filter((kind) => kind !== primary)]
}

export function deckMetric(
  ctx: DeckResultMetricsContext,
  kind: DeckResultMetricKind,
  deck: ResultDeck,
): DeckResultMetric {
  switch (kind) {
    case "score":
      return {
        kind,
        label: deckPointLabel(ctx.t, ctx.mode),
        value: formatDeckInteger(ctx.locale, deckPointValue(ctx.mode, deck)),
        detail: deckLiveBoostPointDetailText(ctx, deck) ?? undefined,
      }
    case "power":
      return {
        kind,
        label: ctx.t("deckRecommend.result.summary.power"),
        value: formatDeckInteger(ctx.locale, deck.total_power),
      }
    case "bonus": {
      const bonusParts = deckBonusParts(deck)
      return {
        kind,
        label: ctx.t("deckRecommend.result.summary.totalBonus"),
        value: `${formatDeckPercent(ctx.locale, bonusParts.total)}%`,
        // The main/support split only means something for world-bloom decks;
        // everywhere else support is always 0 and the detail is just noise.
        detail: bonusParts.support > 0
          ? ctx.t("deckRecommend.result.summary.bonusBreakdown", {
            main: formatDeckPercent(ctx.locale, bonusParts.main),
            support: formatDeckPercent(ctx.locale, bonusParts.support),
          })
          : undefined,
        class: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
      }
    }
    case "effective":
      return {
        kind,
        label: ctx.t("deckRecommend.result.summary.effective"),
        value: `${formatDeckPercent(ctx.locale, deck.multi_live_score_up)}%`,
        class: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200",
      }
    case "liveScore":
      return {
        kind,
        label: ctx.t("deckRecommend.result.liveScoreLabel"),
        value: formatDeckInteger(ctx.locale, deck.live_score),
      }
    case "challengeDelta":
      return {
        kind,
        label: ctx.t("deckRecommend.result.challengeScoreDeltaLabel"),
        value: formatDeckSignedNumber(ctx.locale, deck.challenge_score_delta),
      }
  }
}

export function deckSummaryMetrics(ctx: DeckResultMetricsContext, deck: ResultDeck): DeckResultMetric[] {
  return orderDeckMetricsByTarget(ctx.target, deckSummaryMetricKinds(ctx.mode))
    .map((kind) => deckMetric(ctx, kind, deck))
}

export function deckBasicInfoMetrics(ctx: DeckResultMetricsContext, deck: ResultDeck): DeckResultMetric[] {
  return deckBasicInfoMetricKinds(ctx.mode, deck).map((kind) => deckMetric(ctx, kind, deck))
}

export function deckMetricGridClass(count: number): string {
  switch (Math.min(Math.max(count, 2), 4)) {
    case 2:
      return "grid-cols-2"
    case 3:
      return "grid-cols-3"
    default:
      return "grid-cols-4"
  }
}

export function deckBasicInfoGridClass(mode: DeckRecommendMode, deck: ResultDeck): string {
  switch (Math.min(Math.max(deckBasicInfoMetricKinds(mode, deck).length, 2), 4)) {
    case 2:
      return "sm:grid-cols-2"
    case 3:
      return "sm:grid-cols-3"
    default:
      return "sm:grid-cols-4"
  }
}

export function deckPowerDetailItems(t: ComposerTranslation, deck: ResultDeck) {
  return [
    { key: "total", label: t("deckRecommend.result.power.total"), value: deck.total_power },
    { key: "base", label: t("deckRecommend.result.power.base"), value: deck.base_power },
    { key: "areaItem", label: t("deckRecommend.result.power.areaItem"), value: deck.area_item_bonus_power },
    { key: "character", label: t("deckRecommend.result.power.character"), value: deck.character_bonus_power },
    { key: "honor", label: t("deckRecommend.result.power.honor"), value: deck.honor_bonus_power },
    { key: "fixture", label: t("deckRecommend.result.power.fixture"), value: deck.fixture_bonus_power },
    { key: "gate", label: t("deckRecommend.result.power.gate"), value: deck.gate_bonus_power },
  ]
}

// --- Deck comparison ---

export function deckMetricNumeric(mode: DeckRecommendMode, kind: DeckResultMetricKind, deck: ResultDeck): number {
  switch (kind) {
    case "score":
      return deckPointValue(mode, deck)
    case "power":
      return Number(deck.total_power) || 0
    case "bonus":
      return deckBonusParts(deck).total
    case "effective":
      return Number(deck.multi_live_score_up) || 0
    case "liveScore":
      return Number(deck.live_score) || 0
    case "challengeDelta":
      return Number(deck.challenge_score_delta) || 0
  }
}

export function formatCompareDiff(locale: string, kind: DeckResultMetricKind, diff: number): string {
  const magnitude = Math.abs(diff)
  return kind === "bonus" || kind === "effective"
    ? `${formatDeckPercent(locale, magnitude)}%`
    : formatDeckInteger(locale, magnitude)
}

export type DeckCompareCell = {
  value: string
  diffLabel: string | null
  tone: "up" | "down" | "even" | null
}

export type DeckCompareRow = {
  kind: DeckResultMetricKind
  label: string
  cells: DeckCompareCell[]
}

/** Rows for the comparison table; the first deck is the baseline. */
export function buildDeckCompareRows(
  ctx: DeckResultMetricsContext,
  decks: readonly DeckResultDeckView[],
): DeckCompareRow[] {
  if (decks.length < 2) {
    return []
  }

  return deckBasicInfoMetricKinds(ctx.mode, decks[0].deck).map((kind) => {
    const baseline = deckMetricNumeric(ctx.mode, kind, decks[0].deck)
    return {
      kind,
      label: deckMetric(ctx, kind, decks[0].deck).label,
      cells: decks.map((view, position): DeckCompareCell => {
        const metric = deckMetric(ctx, kind, view.deck)
        if (position === 0) {
          return { value: metric.value, diffLabel: null, tone: null }
        }

        const diff = deckMetricNumeric(ctx.mode, kind, view.deck) - baseline
        return {
          value: metric.value,
          diffLabel: formatCompareDiff(ctx.locale, kind, diff),
          tone: diff > 0 ? "up" : diff < 0 ? "down" : "even",
        }
      }),
    }
  })
}

// --- Algorithm and card labels ---

export function algorithmLabel(t: ComposerTranslation, algorithm: DeckRecommendAlgorithm): string {
  switch (algorithm) {
    case "dfs_ga":
      return t("deckRecommend.algorithms.dfsGa")
    case "dfs":
      return t("deckRecommend.algorithms.dfs")
    case "ga":
      return t("deckRecommend.algorithms.ga")
    case "rl":
      return t("deckRecommend.algorithms.rl")
  }
}

export function algorithmTagClass(algorithm: DeckRecommendAlgorithm): string {
  switch (algorithm) {
    case "dfs_ga":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
    case "dfs":
      return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200"
    case "ga":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
    case "rl":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
  }
}

export function deckSourceAlgorithms(deck: ResultDeck): DeckRecommendAlgorithm[] {
  if ("source_algorithms" in deck && Array.isArray(deck.source_algorithms)) {
    return deck.source_algorithms
  }

  return []
}

export function recommendElapsedTimingLabel(
  t: ComposerTranslation,
  mode: "sequential" | "parallel" | null,
): string {
  return mode === "parallel"
    ? t("deckRecommend.result.parallelRecommendElapsed")
    : t("deckRecommend.result.sequentialRecommendElapsed")
}

export function cardDetailTitle(cardView: DeckResultCardView): string {
  const cardTitle = cardView.thumbnail.title ?? `#${cardView.card.card_id}`
  const characterName = cardView.masterCard?.characterName
  return characterName ? `${cardTitle} - ${characterName}` : cardTitle
}

export function readStateTagClass(read: boolean): string {
  return read
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
    : "border-muted bg-muted/45 text-muted-foreground"
}
