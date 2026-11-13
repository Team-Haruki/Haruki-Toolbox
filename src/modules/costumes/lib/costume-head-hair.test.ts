import { describe, expect, it } from "bun:test"
import { fitsWornHair, hairForHead, headForHair, type HeadHairRules } from "./costume-head-hair"

// Miku piapro: the set 140129 (its own hairstyle) brings hair 140161; accessory 900 cannot go with hair 221.
const rules: HeadHairRules = {
  notAvailable: new Set(["900|221"]),
  defaultHairs: new Map([
    [140129, 140161],
    [900, 300],
  ]),
}
const hairIds = new Set([221, 140161, 300])
const set = { id: 140129, includesHair: true }
const accessory = { id: 900, includesHair: false }
const plain = { id: 1102, includesHair: false }
const unset = { id: 41, includesHair: false }

describe("fitsWornHair", () => {
  it("keeps accessories the worn hair can go with, and the unset head", () => {
    expect(fitsWornHair(plain, 221, rules)).toBe(true)
    expect(fitsWornHair(unset, 221, rules)).toBe(true)
    // A pair the unit forbids, and a full head set with its own hairstyle, do not fit.
    expect(fitsWornHair(accessory, 221, rules)).toBe(false)
    expect(fitsWornHair(accessory, 300, rules)).toBe(true)
    expect(fitsWornHair(set, 221, rules)).toBe(false)
  })
})

describe("hairForHead", () => {
  it("brings the default hair of a head that overrides the hair", () => {
    expect(hairForHead(set, 221, rules, hairIds)).toBe(140161)
    expect(hairForHead(accessory, 221, rules, hairIds)).toBe(300)
  })

  it("keeps the hair for a head that goes with it, the unset head, or a default hair the role lacks", () => {
    expect(hairForHead(plain, 221, rules, hairIds)).toBe(221)
    expect(hairForHead(accessory, 140161, rules, hairIds)).toBe(140161)
    expect(hairForHead(unset, 221, rules, hairIds)).toBe(221)
    expect(hairForHead(set, 221, rules, new Set([221]))).toBe(221)
  })
})

describe("headForHair", () => {
  const heads = [unset, set, accessory, plain]

  it("takes off a head that overrides the new hair", () => {
    expect(headForHair(set, 221, rules, heads, 140129)).toBe(41)
    expect(headForHair(accessory, 221, rules, heads, 140129)).toBe(41)
    // Without an unset head: the role's default head.
    expect(headForHair(accessory, 221, rules, [accessory, plain], 1102)).toBe(1102)
  })

  it("keeps a head that goes with the new hair", () => {
    expect(headForHair(accessory, 300, rules, heads, 140129)).toBe(900)
    expect(headForHair(plain, 221, rules, heads, 140129)).toBe(1102)
    expect(headForHair(null, 221, rules, heads, 140129)).toBeNull()
  })
})
