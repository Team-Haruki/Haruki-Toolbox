import { describe, expect, it } from "bun:test"
import type { LocationQuery } from "vue-router"
import {
  buildCardsActiveChips,
  cardsQueryCodec,
  createDefaultCardsQueryState,
  parseCardsQuery,
  removeCardsQueryChip,
  serializeCardsQuery,
  toCardListFilters,
  type CardsQueryState,
} from "./card-query"

const labels = {
  t: (key: string) => `t:${key}`,
  te: (key: string) => key.startsWith("cards.") || key.startsWith("cardCatalog.") || key.startsWith("catalog."),
}

describe("cards query codec", () => {
  it("omits every default on serialize", () => {
    expect(serializeQuery(createDefaultCardsQueryState())).toEqual({})
  })

  it("round-trips a fully populated state", () => {
    const state: CardsQueryState = {
      q: "miku",
      chars: [21, 1],
      units: ["piapro", "light_sound"],
      attrs: ["cool"],
      rar: ["rarity_4", "rarity_birthday"],
      supply: ["term_limited"],
      skill: ["judgment_up"],
      year: 2024,
      sort: "power",
      dir: "asc",
      page: 3,
      size: 120,
    }
    const record = serializeCardsQuery(state)
    expect(record).toEqual({
      q: "miku",
      chars: "21,1",
      units: "piapro,light_sound",
      attrs: "cool",
      rar: "4,bd",
      supply: "term_limited",
      skill: "judgment_up",
      year: "2024",
      sort: "power",
      dir: "asc",
      page: "3",
      size: "120",
    })
    expect(parseCardsQuery(record as LocationQuery)).toEqual(state)
  })

  it("tolerates garbage and unknown values", () => {
    const parsed = parseCardsQuery({
      q: ["  spaced  ", "second"],
      chars: "1,x,-4,1,2",
      units: "idol,nope",
      attrs: "spicy,pure",
      rar: "9,bd,3",
      supply: "made_up",
      skill: "score_up,unknown",
      year: "abc",
      sort: "banana",
      dir: "sideways",
      page: "0",
      size: "999",
    })
    expect(parsed).toEqual({
      ...createDefaultCardsQueryState(),
      q: "spaced",
      chars: [1, 2],
      units: ["idol"],
      attrs: ["pure"],
      rar: ["rarity_birthday", "rarity_3"],
      skill: ["score_up"],
    })
  })

  it("declares every owned key and excludes sort/paging keys from the filters", () => {
    expect([...cardsQueryCodec.keys]).toEqual([
      "q", "chars", "units", "attrs", "rar", "supply", "skill", "year", "sort", "dir", "page", "size",
    ])
    expect(cardsQueryCodec.filterKeys).not.toContain("sort")
    expect(cardsQueryCodec.filterKeys).not.toContain("page")
    expect(cardsQueryCodec.filterKeys).not.toContain("size")
    expect(cardsQueryCodec.filterKeys).not.toContain("dir")
  })

  it("maps to the legacy filter shape", () => {
    const filters = toCardListFilters({ ...createDefaultCardsQueryState(), q: "x", chars: [3], rar: ["rarity_1"] })
    expect(filters.query).toBe("x")
    expect(filters.characterIds).toEqual([3])
    expect(filters.rarities).toEqual(["rarity_1"])
    expect(filters.skillTypes).toEqual([])
  })
})

describe("active chips", () => {
  const ctx = { characterNames: new Map([[21, "Miku"]]), labels }

  it("produces one chip per active value with removable keys", () => {
    const chips = buildCardsActiveChips({
      ...createDefaultCardsQueryState(),
      q: "hello",
      chars: [21, 99],
      units: ["idol"],
      attrs: ["cute"],
      rar: ["rarity_4"],
      supply: ["birthday"],
      skill: ["life_recovery"],
      year: 2021,
    }, ctx)
    expect(chips).toEqual([
      { key: "q", label: "t:catalog.search.label: hello" },
      { key: "chars:21", label: "Miku" },
      { key: "chars:99", label: "#99" },
      { key: "units:idol", label: "t:cards.unit.idol" },
      { key: "attrs:cute", label: "t:cards.attr.cute" },
      { key: "rar:rarity_4", label: "t:cards.rarity.rarity_4" },
      { key: "supply:birthday", label: "t:cards.supply.birthday" },
      { key: "skill:life_recovery", label: "t:cardCatalog.skillTypes.life_recovery" },
      { key: "year", label: "2021" },
    ])
  })

  it("returns nothing for the default state", () => {
    expect(buildCardsActiveChips(createDefaultCardsQueryState(), ctx)).toEqual([])
  })

  it("removes a single list value or a scalar field", () => {
    const state: CardsQueryState = {
      ...createDefaultCardsQueryState(),
      q: "hello",
      chars: [21, 1],
      rar: ["rarity_4", "rarity_3"],
      year: 2021,
    }
    removeCardsQueryChip(state, "chars:21")
    expect(state.chars).toEqual([1])
    removeCardsQueryChip(state, "rar:rarity_3")
    expect(state.rar).toEqual(["rarity_4"])
    removeCardsQueryChip(state, "year")
    expect(state.year).toBeNull()
    removeCardsQueryChip(state, "q")
    expect(state.q).toBe("")
    removeCardsQueryChip(state, "unknown:1")
    expect(state.chars).toEqual([1])
  })
})

function serializeQuery(state: CardsQueryState): Record<string, string> {
  const record = serializeCardsQuery(state)
  const compact: Record<string, string> = {}
  for (const [key, value] of Object.entries(record)) {
    if (value != null) {
      compact[key] = value
    }
  }
  return compact
}
