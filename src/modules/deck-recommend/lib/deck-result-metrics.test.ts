import { describe, expect, it } from "bun:test"
import type { ComposerTranslation } from "vue-i18n"
import type { DeckResultDeckView } from "./card-thumbnail"
import {
  buildDeckCompareRows,
  deckBasicInfoMetricKinds,
  deckBonusParts,
  deckMetricNumeric,
  deckPointValue,
  deckSummaryMetricKinds,
  formatCompareDiff,
  formatDeckInteger,
  formatDeckSignedNumber,
  orderDeckMetricsByTarget,
  type DeckResultMetricsContext,
} from "./deck-result-metrics"

const t = ((key: string) => key) as ComposerTranslation

function makeDeck(overrides: Record<string, unknown> = {}): DeckResultDeckView["deck"] {
  return {
    score: 1000,
    live_score: 0,
    mysekai_event_point: 0,
    total_power: 300_000,
    base_power: 180_000,
    event_bonus_rate: 250,
    support_deck_bonus_rate: 30,
    multi_live_score_up: 200,
    ...overrides,
  } as unknown as DeckResultDeckView["deck"]
}

function makeView(index: number, overrides: Record<string, unknown> = {}): DeckResultDeckView {
  return { index, deck: makeDeck(overrides), cards: [] }
}

function makeContext(overrides: Partial<DeckResultMetricsContext> = {}): DeckResultMetricsContext {
  return { t, locale: "en-US", mode: "event", target: "score", ...overrides }
}

describe("deckPointValue", () => {
  it("prefers live score for challenge and max modes", () => {
    const deck = makeDeck({ live_score: 5000 })
    expect(deckPointValue("challenge", deck)).toBe(5000)
    expect(deckPointValue("max", deck)).toBe(5000)
    expect(deckPointValue("event", deck)).toBe(1000)
  })

  it("prefers mysekai points in mysekai mode, falling back to score", () => {
    expect(deckPointValue("mysekai", makeDeck({ mysekai_event_point: 777 }))).toBe(777)
    expect(deckPointValue("mysekai", makeDeck())).toBe(1000)
  })
})

describe("metric kinds per mode", () => {
  it("selects summary kinds by mode", () => {
    expect(deckSummaryMetricKinds("challenge")).toEqual(["score", "power"])
    expect(deckSummaryMetricKinds("bonus")).toEqual(["bonus", "score", "power", "effective"])
    expect(deckSummaryMetricKinds("event")).toEqual(["score", "power", "bonus", "effective"])
  })

  it("shows the challenge delta only when the deck carries one", () => {
    expect(deckBasicInfoMetricKinds("challenge", makeDeck())).toEqual(["score"])
    expect(deckBasicInfoMetricKinds("challenge", makeDeck({ challenge_score_delta: 12 })))
      .toEqual(["score", "challengeDelta"])
  })
})

describe("orderDeckMetricsByTarget", () => {
  it("moves the target metric to the front and keeps the rest stable", () => {
    expect(orderDeckMetricsByTarget("bonus", ["score", "power", "bonus", "effective"]))
      .toEqual(["bonus", "score", "power", "effective"])
    expect(orderDeckMetricsByTarget("skill", ["score", "power"])).toEqual(["score", "power"])
  })
})

describe("deckBonusParts", () => {
  it("splits main and support bonus with a total", () => {
    expect(deckBonusParts(makeDeck())).toEqual({ main: 250, support: 30, total: 280 })
  })
})

describe("deck comparison", () => {
  it("returns nothing with fewer than two decks", () => {
    expect(buildDeckCompareRows(makeContext(), [makeView(0)])).toEqual([])
  })

  it("uses the first deck as baseline and tones the diffs", () => {
    const rows = buildDeckCompareRows(makeContext(), [
      makeView(0, { score: 1000 }),
      makeView(1, { score: 990 }),
      makeView(2, { score: 1000 }),
    ])
    const scoreRow = rows.find((row) => row.kind === "score")
    expect(scoreRow).toBeDefined()
    expect(scoreRow?.cells[0]).toMatchObject({ diffLabel: null, tone: null })
    expect(scoreRow?.cells[1]).toMatchObject({ diffLabel: "10", tone: "down" })
    expect(scoreRow?.cells[2]).toMatchObject({ tone: "even" })
  })

  it("formats percent metrics with a percent diff", () => {
    expect(formatCompareDiff("en-US", "bonus", -10)).toBe("10%")
    expect(formatCompareDiff("en-US", "score", 1234)).toBe("1,234")
  })

  it("reads numeric values by kind", () => {
    const deck = makeDeck({ live_score: 4321 })
    expect(deckMetricNumeric("event", "bonus", deck)).toBe(280)
    expect(deckMetricNumeric("event", "liveScore", deck)).toBe(4321)
  })
})

describe("formatters", () => {
  it("formats integers and signed numbers", () => {
    expect(formatDeckInteger("en-US", 1234567.6)).toBe("1,234,568")
    expect(formatDeckInteger("en-US", undefined)).toBe("0")
    expect(formatDeckSignedNumber("en-US", 12)).toBe("+12")
    expect(formatDeckSignedNumber("en-US", -12)).toBe("-12")
  })
})
