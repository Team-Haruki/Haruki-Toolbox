import type { RecommendDeck, RecommendResult } from "haruki-sekai-deck-recommend-cpp"
import type { DeckRecommendAlgorithm } from "./recommend-options"

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

export function mergeDeckRecommendResults(results: readonly AlgorithmRecommendResult[]): TaggedRecommendResult {
  const deckByKey = new Map<string, TaggedRecommendDeck>()

  for (const { algorithm, result } of results) {
    for (const deck of result.decks) {
      const key = buildDeckDedupKey(deck)
      const previous = deckByKey.get(key)
      if (!previous || deck.score > previous.score) {
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
    decks: [...deckByKey.values()].sort((a, b) => b.score - a.score),
  }
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
