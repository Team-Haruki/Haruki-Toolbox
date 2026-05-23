import type { RecommendDeck, RecommendResult } from "haruki-sekai-deck-recommend-cpp"
import type { DeckRecommendAlgorithm, DeckRecommendMode, DeckRecommendTarget } from "./recommend-options"

export type AlgorithmRecommendResult = {
  algorithm: DeckRecommendAlgorithm
  result: RecommendResult
}

export type TaggedRecommendDeck = RecommendDeck & {
  source_algorithms: DeckRecommendAlgorithm[]
}

export type TaggedRecommendResult = {
  decks: TaggedRecommendDeck[]
}

export function mergeDeckRecommendResults(
  results: readonly AlgorithmRecommendResult[],
  mode: DeckRecommendMode = "event",
  target: DeckRecommendTarget = "score",
): TaggedRecommendResult {
  const deckByKey = new Map<string, TaggedRecommendDeck>()

  for (const { algorithm, result } of results) {
    for (const deck of result.decks) {
      const key = buildDeckDedupKey(deck)
      const previous = deckByKey.get(key)
      if (!previous || compareRecommendDecks(mode, target, deck, previous) < 0) {
        deckByKey.set(key, {
          ...deck,
          source_algorithms: mergeAlgorithms(previous?.source_algorithms ?? [], [algorithm]),
        })
        continue
      }

      previous.source_algorithms = mergeAlgorithms(previous.source_algorithms, [algorithm])
    }
  }

  return {
    decks: [...deckByKey.values()].sort((a, b) => compareRecommendDecks(mode, target, a, b)),
  }
}

export function compareRecommendDecks(
  mode: DeckRecommendMode,
  target: DeckRecommendTarget,
  left: RecommendDeck,
  right: RecommendDeck,
): number {
  if (mode === "mysekai") {
    if (target === "power") {
      return compareValues([
        numberDesc(left.total_power, right.total_power),
        numberDesc(left.mysekai_event_point, right.mysekai_event_point),
        numberDesc(mysekaiCombinedBonusRate(left), mysekaiCombinedBonusRate(right)),
        numberDesc(left.multi_live_score_up, right.multi_live_score_up),
        numberDesc(left.score, right.score),
      ])
    }

    if (target === "bonus") {
      return compareValues([
        numberDesc(mysekaiCombinedBonusRate(left), mysekaiCombinedBonusRate(right)),
        numberDesc(left.support_deck_bonus_rate, right.support_deck_bonus_rate),
        numberDesc(left.event_bonus_rate, right.event_bonus_rate),
        numberDesc(left.mysekai_event_point, right.mysekai_event_point),
        numberDesc(left.total_power, right.total_power),
        numberDesc(left.score, right.score),
      ])
    }

    return compareValues([
      numberDesc(left.mysekai_event_point, right.mysekai_event_point),
      numberDesc(mysekaiInternalPoint(left), mysekaiInternalPoint(right)),
      numberDesc(mysekaiCombinedBonusRate(left), mysekaiCombinedBonusRate(right)),
      numberDesc(left.total_power, right.total_power),
      numberDesc(left.support_deck_bonus_rate, right.support_deck_bonus_rate),
      numberDesc(left.event_bonus_rate, right.event_bonus_rate),
      numberDesc(left.multi_live_score_up, right.multi_live_score_up),
      numberDesc(left.score, right.score),
    ])
  }

  if (mode === "bonus") {
    return compareValues([
      numberDesc(left.event_bonus_rate, right.event_bonus_rate),
      numberDesc(left.score, right.score),
      numberDesc(left.multi_live_score_up, right.multi_live_score_up),
    ])
  }

  if (target === "power") {
    return compareValues([
      numberDesc(left.total_power, right.total_power),
      numberDesc(left.score, right.score),
      numberDesc(left.multi_live_score_up, right.multi_live_score_up),
      numberDesc(combinedBonusRate(left), combinedBonusRate(right)),
    ])
  }

  if (target === "skill") {
    return compareValues([
      numberDesc(left.multi_live_score_up, right.multi_live_score_up),
      numberDesc(left.score, right.score),
      numberDesc(left.total_power, right.total_power),
    ])
  }

  if (target === "bonus") {
    return compareValues([
      numberDesc(combinedBonusRate(left), combinedBonusRate(right)),
      numberDesc(left.event_bonus_rate, right.event_bonus_rate),
      numberDesc(left.score, right.score),
      numberDesc(left.total_power, right.total_power),
      numberDesc(left.multi_live_score_up, right.multi_live_score_up),
    ])
  }

  return compareValues([
    numberDesc(left.score, right.score),
    numberDesc(left.multi_live_score_up, right.multi_live_score_up),
    numberDesc(left.total_power, right.total_power),
  ])
}

function buildDeckDedupKey(deck: RecommendDeck): string {
  return deck.cards
    .map((card) => card.card_id)
    .sort((a, b) => a - b)
    .join(":")
}

function mergeAlgorithms(
  existingAlgorithms: readonly DeckRecommendAlgorithm[],
  newAlgorithms: readonly DeckRecommendAlgorithm[],
): DeckRecommendAlgorithm[] {
  return [...new Set([...existingAlgorithms, ...newAlgorithms])]
}

function compareValues(values: readonly number[]): number {
  return values.find((value) => value !== 0) ?? 0
}

function numberDesc(left: number, right: number): number {
  if (almostEqual(left, right)) {
    return 0
  }

  return right - left
}

function mysekaiCombinedBonusRate(deck: RecommendDeck): number {
  return combinedBonusRate(deck)
}

function combinedBonusRate(deck: RecommendDeck): number {
  return deck.event_bonus_rate + deck.support_deck_bonus_rate
}

function mysekaiInternalPoint(deck: RecommendDeck): number {
  const powerBonus = Math.floor((1 + deck.total_power / 450000) * 10 + 1e-6) / 10
  const eventBonus = Math.floor(mysekaiCombinedBonusRate(deck) + 1e-6) / 100
  return powerBonus * (1 + eventBonus) * 500
}

function almostEqual(left: number, right: number): boolean {
  return Math.abs(left - right) < 1e-6
}
