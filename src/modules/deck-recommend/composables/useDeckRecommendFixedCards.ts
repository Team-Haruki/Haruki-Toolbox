import { computed, watch, type Ref } from "vue"
import type { DeckRecommendMasterCardOption } from "../lib/card-options"
import type { DeckRecommendMode } from "../lib/recommend-options"

export function useDeckRecommendFixedCards(input: {
  recommendMode: Readonly<Ref<DeckRecommendMode>>
  selectedCharacterId: Readonly<Ref<string | null>>
  cardOptions: Readonly<Ref<DeckRecommendMasterCardOption[]>>
  fixedCardIds: Ref<number[]>
}) {
  const isChallenge = computed(() => input.recommendMode.value === "challenge")
  const fixedCardOptions = computed(() => isChallenge.value
    ? input.cardOptions.value.filter((card) => card.characterId === Number(input.selectedCharacterId.value))
    : input.cardOptions.value,
  )

  watch(
    [isChallenge, fixedCardOptions, () => [...input.fixedCardIds.value]],
    () => {
      // Saved selections must survive until the asynchronous card catalog arrives.
      if (input.cardOptions.value.length === 0) return

      const cardMap = new Map(fixedCardOptions.value.map((card) => [card.id, card]))
      const seenCharacters = new Set<number>()
      const next: number[] = []
      for (const id of input.fixedCardIds.value) {
        const card = cardMap.get(id)
        if (!card || next.includes(id)) continue
        if (!isChallenge.value && card.characterId != null) {
          if (seenCharacters.has(card.characterId)) continue
          seenCharacters.add(card.characterId)
        }
        next.push(id)
        if (next.length === 5) break
      }

      if (next.length !== input.fixedCardIds.value.length
        || next.some((id, index) => id !== input.fixedCardIds.value[index])) {
        input.fixedCardIds.value = next
      }
    },
    { immediate: true },
  )

  return { fixedCardOptions }
}
