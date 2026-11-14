import { describe, expect, it } from "bun:test"
import type { HarukiCostumeSource } from "../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js"
import {
  costumeFilterCount,
  costumeRegionBadge,
  costumeYearOptions,
  emptyCostumeFilters,
  indexCostumeSources,
  isCostumeReleased,
  matchesCostumeFilters,
  UNKNOWN_YEAR,
  type CostumeFilters,
} from "./costume-filters"

const permanentCard: HarukiCostumeSource = { costume3dId: 1, source: "card", cardSupply: "normal", originCharacterId: 6, year: 2020 }
const limitedCard: HarukiCostumeSource = { costume3dId: 2, source: "card", cardSupply: "limited", originCharacterId: 21, year: 2023 }
const initial: HarukiCostumeSource = { costume3dId: 3, source: "initial", originCharacterId: 21, year: 2020 }
const exclusive: HarukiCostumeSource = { costume3dId: 4, source: "event", regions: ["cn", "tw", "kr"] }

const filters = (patch: Partial<CostumeFilters>): CostumeFilters => ({ ...emptyCostumeFilters(), ...patch })

describe("matchesCostumeFilters", () => {
  it("passes everything with no filter, a costume without a source included", () => {
    expect(matchesCostumeFilters(undefined, emptyCostumeFilters())).toBe(true)
    expect(costumeFilterCount(emptyCostumeFilters())).toBe(0)
  })

  it("narrows card costumes by supply only while card is a chosen source", () => {
    const limited = filters({ sources: ["card", "initial"], cardSupply: "limited" })
    expect(matchesCostumeFilters(limitedCard, limited)).toBe(true)
    expect(matchesCostumeFilters(permanentCard, limited)).toBe(false)
    // The other chosen source is not a card: the supply does not apply to it.
    expect(matchesCostumeFilters(initial, limited)).toBe(true)
    expect(matchesCostumeFilters(exclusive, limited)).toBe(false)
  })

  it("ANDs the rows: origin character, year and region exclusivity", () => {
    const miku2023 = filters({ originCharacterIds: [21], years: ["2023"] })
    expect(matchesCostumeFilters(limitedCard, miku2023)).toBe(true)
    expect(matchesCostumeFilters(initial, miku2023)).toBe(false)
    // Only card and initial costumes have an origin character.
    expect(matchesCostumeFilters(exclusive, filters({ originCharacterIds: [21] }))).toBe(false)
    expect(matchesCostumeFilters(exclusive, filters({ years: [UNKNOWN_YEAR], regionExclusive: true }))).toBe(true)
    expect(matchesCostumeFilters(initial, filters({ regionExclusive: true }))).toBe(false)
    expect(costumeFilterCount(filters({ sources: ["card"], years: ["2023"], regionExclusive: true }))).toBe(3)
  })
})

describe("isCostumeReleased", () => {
  it("holds a costume back until its region's date", () => {
    const later = { ...limitedCard, releaseAt: 2_000 }
    expect(isCostumeReleased(later, 1_999)).toBe(false)
    expect(isCostumeReleased(later, 2_000)).toBe(true)
    expect(isCostumeReleased(limitedCard, 0)).toBe(true)
    expect(isCostumeReleased(undefined, 0)).toBe(true)
  })
})

describe("costumeYearOptions", () => {
  it("lists the years in order, then unknown", () => {
    expect(costumeYearOptions([limitedCard, permanentCard, exclusive, initial])).toEqual(["2020", "2023", UNKNOWN_YEAR])
    expect(costumeYearOptions(indexCostumeSources([permanentCard]).values())).toEqual(["2020"])
  })
})

describe("costumeRegionBadge", () => {
  it("names an exclusive costume's regions in a fixed order", () => {
    expect(costumeRegionBadge(exclusive)).toBe("TW·KR·CN")
    expect(costumeRegionBadge({ ...exclusive, regions: ["en"] })).toBe("EN")
    expect(costumeRegionBadge(limitedCard)).toBeNull()
    expect(costumeRegionBadge(undefined)).toBeNull()
  })
})
