import { describe, expect, test } from "bun:test"
import {
  creditFontSize,
  layoutMode,
  menuCloseScale,
  menuScale,
  rotatedStage,
  stageMenuFits,
  stageWidthFor,
} from "@/modules/story/engine/layout"

describe("layoutMode", () => {
  test("three columns from 1180, two from 720, stacked below", () => {
    expect(layoutMode(1296)).toBe("wide")
    expect(layoutMode(1180)).toBe("wide")
    expect(layoutMode(944)).toBe("mid")
    expect(layoutMode(720)).toBe("mid")
    expect(layoutMode(719)).toBe("stack")
    expect(layoutMode(358)).toBe("stack")
  })
})

describe("stageWidthFor", () => {
  test("wide: what the two panels leave", () => {
    expect(stageWidthFor(1296, "wide", {}, 2000)).toBe(1296 - 280 - 300 - 24)
  })
  test("wide with the browser collapsed to its rail", () => {
    expect(stageWidthFor(1296, "wide", { browserCollapsed: true }, 2000)).toBe(1296 - 44 - 300 - 24)
  })
  test("wide without a talk log: only the browser beside the stage", () => {
    expect(stageWidthFor(1296, "wide", { logHidden: true }, 2000)).toBe(1296 - 280 - 12)
  })
  test("mid: one side panel", () => {
    expect(stageWidthFor(944, "mid", {}, 2000)).toBe(944 - 300 - 12)
  })
  test("capped by the room under the row (16:9)", () => {
    // 450px of room → 800px wide at most
    expect(stageWidthFor(2000, "wide", {}, 450)).toBe(800)
  })
  test("the height cap never shrinks the stage below 320px while the columns allow it", () => {
    expect(stageWidthFor(944, "mid", {}, 100)).toBe(320)
    expect(stageWidthFor(500, "mid", {}, 100)).toBe(188)
  })
  test("stacked: the full host width", () => {
    expect(stageWidthFor(358, "stack", {}, 100)).toBe(358)
  })
})

describe("menuScale", () => {
  test("no change while the 64px button is already 40px or more", () => {
    expect(menuScale(1)).toBe(1)
    expect(menuScale(0.625)).toBe(1)
  })
  test("scales a small stage's button up to 40px", () => {
    expect(menuScale(0.5) * 64 * 0.5).toBeCloseTo(40)
    expect(menuScale(0.26) * 64 * 0.26).toBeCloseTo(40)
  })
  test("the close cross reaches 40px too", () => {
    const k = 0.54
    expect(29.33 * k * menuScale(k) * menuCloseScale(k)).toBeCloseTo(40)
    expect(menuCloseScale(2)).toBe(1)
  })
  test("tolerates a zero scale", () => {
    expect(menuScale(0)).toBe(1)
    expect(menuCloseScale(0)).toBe(1)
    expect(stageMenuFits(0, 100)).toBe(false)
  })
})

describe("stageMenuFits", () => {
  test("a 334px phone stage cannot hold the scaled panel", () => {
    expect(stageMenuFits(334 / 1280, 188)).toBe(false)
  })
  test("a 640px stage can", () => {
    expect(stageMenuFits(0.5, 360)).toBe(true)
  })
  test("a desktop stage can", () => {
    expect(stageMenuFits(1, 720)).toBe(true)
  })
})

describe("rotatedStage", () => {
  test("fits the long side along the phone's height and centres", () => {
    const { k, transform } = rotatedStage(390, 844)
    expect(k).toBeCloseTo(390 / 720)
    expect(transform).toContain("rotate(90deg)")
    expect(transform).toContain(`scale(${k.toFixed(4)})`)
    // x: the rotated stage's right edge sits at (w + 720k) / 2 = 390
    expect(transform.startsWith("translate(390.00px, ")).toBe(true)
  })
})

describe("creditFontSize", () => {
  test("12px on phones, 18px on a wide stage", () => {
    expect(creditFontSize(334)).toBe(12)
    expect(creditFontSize(1280)).toBe(18)
    expect(creditFontSize(1000)).toBeCloseTo(16)
  })
})
