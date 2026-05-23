import { describe, expect, it } from "bun:test"
import { buildSearchVariants, matchesCommandSearch } from "./search"

describe("command search", () => {
  it("matches plain, compact, and id-prefixed queries", () => {
    const parts = ["74", "#74", "Tell Your World"]

    expect(matchesCommandSearch(parts, "tell world")).toBe(true)
    expect(matchesCommandSearch(parts, "#74")).toBe(true)
    expect(matchesCommandSearch(parts, "ID 74")).toBe(true)
    expect(matchesCommandSearch(parts, "id74")).toBe(true)
  })

  it("matches pinyin and pinyin initials for CJK labels", () => {
    const parts = ["星界"]

    expect(matchesCommandSearch(parts, "xingjie")).toBe(true)
    expect(matchesCommandSearch(parts, "xing jie")).toBe(true)
    expect(matchesCommandSearch(parts, "xj")).toBe(true)
  })

  it("matches romaji generated from kana pronunciation keywords", () => {
    const parts = ["ロキ", "ろき", "はつねみくのしょうしつ"]

    expect(matchesCommandSearch(parts, "roki")).toBe(true)
    expect(matchesCommandSearch(parts, "hatsunemiku")).toBe(true)
    expect(matchesCommandSearch(parts, "shoshitsu")).toBe(true)
  })

  it("keeps long-vowel variants searchable", () => {
    expect(buildSearchVariants("わーるど")).toContain("waarudo")
    expect(matchesCommandSearch(["わーるど"], "warudo")).toBe(true)
  })
})
