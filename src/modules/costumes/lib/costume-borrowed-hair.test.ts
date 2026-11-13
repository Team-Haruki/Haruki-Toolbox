import { describe, expect, it } from "bun:test"
import { defaultHairThumbnail, hairDonors, MULTI_TONE_HAIR_CHARACTER_IDS } from "./costume-borrowed-hair"

const genders = new Map<number, string>(
  Array.from({ length: 26 }, (_, index) => {
    const id = index + 1
    return [id, [11, 12, 13, 16, 23, 26].includes(id) ? "male" : id === 20 ? "secret" : "female"] as const
  }),
)

describe("hairDonors", () => {
  it("lists the other characters of the same gender", () => {
    expect(hairDonors(11, genders)).toEqual([12, 13, 16, 23, 26])
    const female = hairDonors(5, genders)
    expect(female).toHaveLength(19)
    expect(female).not.toContain(5)
    expect(female).not.toContain(26)
    expect(female).toContain(20)
    expect(hairDonors(20, genders)).toHaveLength(19)
  })

  it("lends nothing when the gender is unknown", () => {
    expect(hairDonors(5, new Map())).toEqual([])
  })
})

describe("defaultHairThumbnail", () => {
  it("names the default hair's costume thumbnail", () => {
    expect(defaultHairThumbnail(5)).toBe("hair_default_05")
    expect(defaultHairThumbnail(21)).toBe("hair_default_21")
  })
})

describe("MULTI_TONE_HAIR_CHARACTER_IDS", () => {
  it("names the gradient and two-tone default hairs", () => {
    expect([...MULTI_TONE_HAIR_CHARACTER_IDS].sort((a, b) => a - b)).toEqual([2, 11, 12, 13, 17])
  })
})
