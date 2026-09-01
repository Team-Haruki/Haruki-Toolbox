import { describe, expect, it } from "bun:test"
import {
  buildMusicDetailExtras,
  buildMusicOriginalLinkMap,
  buildMusicReleaseConditionMap,
  isSafeExternalLink,
  resolveExternalLinkHost,
} from "./music-extras"

describe("buildMusicReleaseConditionMap", () => {
  it("keeps id, sentence and type, skipping rows without a sentence", () => {
    const map = buildMusicReleaseConditionMap([
      { id: 1, sentence: "初期解放", releaseConditionType: "none" },
      { id: 5, sentence: "ショップで購入", releaseConditionType: "music_shop", releaseConditionTypeId: 3 },
      { id: 6, sentence: "", releaseConditionType: "none" },
      { sentence: "no id" },
    ])
    expect(map.get(1)).toEqual({ id: 1, sentence: "初期解放", releaseConditionType: "none" })
    expect(map.get(5)?.releaseConditionType).toBe("music_shop")
    expect(map.size).toBe(2)
    expect(buildMusicReleaseConditionMap(undefined).size).toBe(0)
  })
})

describe("buildMusicOriginalLinkMap", () => {
  it("maps music ids to http(s) links only, first link wins", () => {
    const map = buildMusicOriginalLinkMap([
      { id: 1, musicId: 10, videoLink: "https://youtu.be/abc" },
      { id: 2, musicId: 10, videoLink: "https://youtu.be/second" },
      { id: 3, musicId: 11, videoLink: "javascript:alert(1)" },
      { id: 4, musicId: 12, videoLink: "" },
    ])
    expect(map.get(10)).toBe("https://youtu.be/abc")
    expect(map.has(11)).toBe(false)
    expect(map.has(12)).toBe(false)
  })

  it("validates links", () => {
    expect(isSafeExternalLink("http://example.com/x")).toBe(true)
    expect(isSafeExternalLink("https://youtu.be/abc")).toBe(true)
    expect(isSafeExternalLink("ftp://example.com")).toBe(false)
    expect(isSafeExternalLink("https://bad link")).toBe(false)
  })

  it("extracts the host for the collapsed summary", () => {
    expect(resolveExternalLinkHost("https://www.youtube.com/watch?v=1")).toBe("youtube.com")
    expect(resolveExternalLinkHost("https://youtu.be/abc")).toBe("youtu.be")
    expect(resolveExternalLinkHost("not a url")).toBeNull()
  })
})

describe("buildMusicDetailExtras", () => {
  it("builds all three lookups and tolerates missing optional files", () => {
    const extras = buildMusicDetailExtras({
      outsideCharacters: [{ id: 6, seq: 6, name: "歌愛ユキ" }],
      releaseConditions: [{ id: 1, sentence: "初期解放", releaseConditionType: "none" }],
    })
    expect(extras.outsideCharacterNames.get(6)).toBe("歌愛ユキ")
    expect(extras.releaseConditionsById.get(1)?.sentence).toBe("初期解放")
    expect(extras.originalLinkByMusic.size).toBe(0)
  })
})
