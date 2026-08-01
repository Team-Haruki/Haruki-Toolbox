import { describe, expect, it } from "bun:test"
import { parseMusicAliasList, parseMusicAliasMatchIds } from "./music-alias"

describe("parseMusicAliasMatchIds", () => {
  it("extracts match ids from the alias API envelope", () => {
    expect(parseMusicAliasMatchIds({
      status: 200,
      message: "ok",
      data: { match_ids: [138, 74] },
    })).toEqual([138, 74])
  })

  it("drops non-numeric ids and tolerates malformed payloads", () => {
    expect(parseMusicAliasMatchIds({ data: { match_ids: [1, "2", null, Number.NaN] } })).toEqual([1])
    expect(parseMusicAliasMatchIds({ data: null })).toEqual([])
    expect(parseMusicAliasMatchIds({ data: { match_ids: "138" } })).toEqual([])
    expect(parseMusicAliasMatchIds(null)).toEqual([])
    expect(parseMusicAliasMatchIds("oops")).toEqual([])
  })
})

describe("parseMusicAliasList", () => {
  it("extracts alias strings from the alias API envelope", () => {
    expect(parseMusicAliasList({
      status: 200,
      message: "ok",
      data: { aliases: ["虾", "孑然妒火"] },
    })).toEqual(["虾", "孑然妒火"])
  })

  it("drops blank entries and tolerates malformed payloads", () => {
    expect(parseMusicAliasList({ data: { aliases: ["ok", "", "  ", 3, null] } })).toEqual(["ok"])
    expect(parseMusicAliasList({ data: { aliases: "虾" } })).toEqual([])
    expect(parseMusicAliasList({ data: null })).toEqual([])
    expect(parseMusicAliasList(null)).toEqual([])
  })
})
