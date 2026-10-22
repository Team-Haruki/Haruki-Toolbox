import { describe, expect, test } from "bun:test"
import {
  applyRegionText,
  applyTranslation,
  isPlaceholderText,
  storyFontScript,
  storyLangChain,
  type StoryTextScenario,
} from "@/modules/story/lib/story-text"

function scenario(lines: [string, string][], effects: [number, string][] = []): StoryTextScenario {
  return {
    TalkData: lines.map(([WindowDisplayName, Body]) => ({ WindowDisplayName, Body })),
    SpecialEffectData: effects.map(([EffectType, StringVal]) => ({ EffectType, StringVal })),
  }
}

describe("storyLangChain", () => {
  test("follows the Toolbox locale", () => {
    expect(storyLangChain("zh-CN", null)).toEqual(["zh-Hans", "zh-Hans-ai", "ja"])
    expect(storyLangChain("zh-TW", null)).toEqual(["zh-Hant", "zh-Hans", "zh-Hans-ai", "ja"])
    expect(storyLangChain("en-US", null)).toEqual(["en", "ja"])
  })

  test("puts an explicit pick first without repeating it", () => {
    expect(storyLangChain("zh-CN", "ko")).toEqual(["ko", "zh-Hans", "zh-Hans-ai", "ja"])
    expect(storyLangChain("zh-CN", "zh-Hans-ai")).toEqual(["zh-Hans-ai", "zh-Hans", "ja"])
  })
})

describe("isPlaceholderText", () => {
  test("flags JP text shipped in another region's file", () => {
    expect(isPlaceholderText(scenario([["杏", "やっとこのセカイに来てもらえたのね。"]]))).toBe(true)
    expect(isPlaceholderText(scenario([["杏", "你们终于来到这个「世界」了。"]]))).toBe(false)
    expect(isPlaceholderText(scenario([["An", "You finally made it to this SEKAI."]]))).toBe(false)
  })
})

describe("applyRegionText", () => {
  test("copies dialogue and text effects by index", () => {
    const jp = scenario([["杏", "おはよう"], ["こはね", "うん"]], [[8, "教室"], [7, "bg_a"]])
    const cn = scenario([["杏", "早上好"], ["心羽", "嗯"]], [[8, "教室（中）"], [7, "bg_b"]])
    const out = applyRegionText(jp, cn)!
    expect(out.TalkData.map((t) => [t.WindowDisplayName, t.Body])).toEqual([["杏", "早上好"], ["心羽", "嗯"]])
    // the telop text follows; a background name (not text) stays JP
    expect(out.SpecialEffectData.map((e) => e.StringVal)).toEqual(["教室（中）", "bg_a"])
    expect(jp.TalkData[0].Body).toBe("おはよう")
  })

  test("refuses scenarios that do not align", () => {
    expect(applyRegionText(scenario([["杏", "a"], ["杏", "b"]]), scenario([["杏", "a"]]))).toBeNull()
  })
})

describe("applyTranslation", () => {
  test("maps speakers through the names table and applies text effects", () => {
    const jp = scenario([["こはね", "うん"], ["？？？", "……"]], [[8, "放課後"], [7, "bg_a"]])
    const out = applyTranslation(jp, {
      scenarioId: "s", lang: "zh-Hans", model: "m", updatedAt: "",
      names: { "こはね": "心羽" }, lines: ["嗯", "……"], effects: { "0": "放学后", "1": "ignored" },
    })!
    expect(out.TalkData.map((t) => [t.WindowDisplayName, t.Body])).toEqual([["心羽", "嗯"], ["？？？", "……"]])
    expect(out.SpecialEffectData.map((e) => e.StringVal)).toEqual(["放学后", "bg_a"])
  })

  test("refuses a translation of another revision", () => {
    const tr = { scenarioId: "s", lang: "zh-Hans", model: "m", updatedAt: "", names: {}, lines: ["a"] }
    expect(applyTranslation(scenario([["a", "b"], ["c", "d"]]), tr)).toBeNull()
  })
})

test("storyFontScript groups languages by the face they need", () => {
  expect(storyFontScript("ja")).toBe("ja")
  expect(storyFontScript("zh-Hans-ai")).toBe("zh")
  expect(storyFontScript("zh-Hant")).toBe("zh")
  expect(storyFontScript("ko")).toBe("ko")
  expect(storyFontScript("en")).toBe("latin")
})
