import { afterEach, describe, expect, it } from "bun:test"
import { effectScope, nextTick, ref } from "vue"
import { buildMasterCardOptions } from "../lib/card-options"
import type { DeckRecommendMode } from "../lib/recommend-options"
import { useDeckRecommendFixedCards } from "./useDeckRecommendFixedCards"

const cards = buildMasterCardOptions({ cards: [
  ...[101, 102, 103, 104, 105, 106].map((id) => ({ id, characterId: 1 })),
  { id: 201, characterId: 2 },
  { id: 202, characterId: 2 },
  { id: 301, characterId: 3 },
] }, "jp", "global")

const scopes: ReturnType<typeof effectScope>[] = []
afterEach(() => {
  for (const scope of scopes.splice(0)) scope.stop()
})

function setup(mode: DeckRecommendMode, ids: number[], loaded = true) {
  const input = {
    recommendMode: ref(mode),
    selectedCharacterId: ref<string | null>("1"),
    cardOptions: ref(loaded ? cards : []),
    fixedCardIds: ref(ids),
  }
  const scope = effectScope()
  scopes.push(scope)
  const result = scope.run(() => useDeckRecommendFixedCards(input))!
  return { ...input, ...result }
}

describe("challenge fixed cards", () => {
  it("allows multiple cards of the selected challenge character only", () => {
    const state = setup("challenge", [101, 102, 201])
    expect(state.fixedCardOptions.value.map((card) => card.id)).toEqual([101, 102, 103, 104, 105, 106])
    expect(state.fixedCardIds.value).toEqual([101, 102])
  })

  it("clears incompatible selections when the challenge character changes", async () => {
    const state = setup("challenge", [101, 102])
    state.selectedCharacterId.value = "2"
    await nextTick()
    expect(state.fixedCardOptions.value.map((card) => card.id)).toEqual([201, 202])
    expect(state.fixedCardIds.value).toEqual([])
    state.fixedCardIds.value = [201, 202]
    await nextTick()
    expect(state.fixedCardIds.value).toEqual([201, 202])
  })

  it("requires a challenge character before fixing cards", async () => {
    const state = setup("challenge", [101])
    state.selectedCharacterId.value = null
    await nextTick()
    expect(state.fixedCardOptions.value).toEqual([])
    expect(state.fixedCardIds.value).toEqual([])
  })

  it("reconciles both directions of a mode switch", async () => {
    const state = setup("event", [101, 201, 301])
    expect(state.fixedCardOptions.value).toEqual(cards)
    expect(state.fixedCardIds.value).toEqual([101, 201, 301])
    state.recommendMode.value = "challenge"
    await nextTick()
    expect(state.fixedCardIds.value).toEqual([101])
    state.fixedCardIds.value.push(102, 103)
    await nextTick()
    expect(state.fixedCardIds.value).toEqual([101, 102, 103])
    state.recommendMode.value = "max"
    await nextTick()
    expect(state.fixedCardIds.value).toEqual([101])
    expect(state.fixedCardOptions.value).toEqual(cards)
  })

  it("preserves saved cards while loading and validates them when the catalog arrives", async () => {
    const state = setup("challenge", [101, 102, 201], false)
    expect(state.fixedCardIds.value).toEqual([101, 102, 201])
    state.cardOptions.value = cards
    await nextTick()
    expect(state.fixedCardIds.value).toEqual([101, 102])
    state.cardOptions.value = []
    await nextTick()
    expect(state.fixedCardIds.value).toEqual([101, 102])
  })

  it("caps distinct fixed cards at five without rejecting repeat characters in challenge", () => {
    const state = setup("challenge", [101, 101, 999, 102, 103, 104, 105, 106])
    expect(state.fixedCardIds.value).toEqual([101, 102, 103, 104, 105])
  })

  it("keeps only one card per character when restoring an ordinary deck", () => {
    const state = setup("event", [101, 102, 201, 202, 301])
    expect(state.fixedCardIds.value).toEqual([101, 201, 301])
  })
})
