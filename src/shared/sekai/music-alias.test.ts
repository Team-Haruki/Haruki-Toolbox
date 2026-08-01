import { describe, expect, it } from "bun:test"
import { parseMusicAliasMatchIds } from "./music-alias"

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
