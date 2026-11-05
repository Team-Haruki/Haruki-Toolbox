import { describe, expect, test } from "bun:test"
import { resolveInitialRankBorderRegion } from "./initial-region"

describe("resolveInitialRankBorderRegion", () => {
  test("a remembered region wins over every setting", () => {
    expect(resolveInitialRankBorderRegion({ persisted: "kr", mode: "follow", catalogRegion: "jp", accountServer: "cn" })).toBe("kr")
  })

  test("ignores a remembered value that is not a region", () => {
    expect(resolveInitialRankBorderRegion({ persisted: "mars", mode: "manual", catalogRegion: "tw" })).toBe("tw")
    expect(resolveInitialRankBorderRegion({ persisted: 42, mode: "manual", catalogRegion: "tw" })).toBe("tw")
  })

  test("follow mode lands on the bound account's server", () => {
    expect(resolveInitialRankBorderRegion({ mode: "follow", catalogRegion: "jp", accountServer: "cn" })).toBe("cn")
  })

  test("follow mode without a bound account falls back to the catalog region", () => {
    expect(resolveInitialRankBorderRegion({ mode: "follow", catalogRegion: "jp", accountServer: null })).toBe("jp")
    expect(resolveInitialRankBorderRegion({ mode: "follow", catalogRegion: "en" })).toBe("en")
  })

  test("a fixed catalog region is used as is, even with a bound account elsewhere", () => {
    expect(resolveInitialRankBorderRegion({ mode: "manual", catalogRegion: "jp", accountServer: "cn" })).toBe("jp")
  })
})
