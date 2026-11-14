import { describe, expect, it } from "bun:test"
import { MOTION_FOLLOW, motionValue, orderMotions, parseMotionValue } from "./costume-motions"
import type { HarukiMotionEntry } from "../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js"

const entry = (motionType: HarukiMotionEntry["motionType"], characterId: number | null, unit: string, figure: "ladies" | "mens" | null = null): HarukiMotionEntry => ({
  motionType,
  motionRoleId: `${characterId ?? 1}:${unit}`,
  characterId,
  unit: characterId == null ? null : unit,
  figure,
})

describe("motion values", () => {
  it("round-trips a motion and reads the default as the role's own CostumeShop motion", () => {
    expect(motionValue(entry("result", 21, "light_sound"))).toBe("result:21:light_sound")
    expect(parseMotionValue("result:21:light_sound")).toEqual({ motionType: "result", motionRoleId: "21:light_sound" })
    expect(parseMotionValue(MOTION_FOLLOW)).toEqual({ motionType: "costume", motionRoleId: null })
    expect(parseMotionValue("dance:21:piapro")).toBeNull()
    expect(parseMotionValue("costume:21")).toBeNull()
  })
})

describe("orderMotions", () => {
  it("groups each character's motions, CostumeShop before result, previews last", () => {
    const ordered = orderMotions([
      entry("costume", 21, "piapro"),
      entry("result", 21, "piapro"),
      entry("costume", 1, "light_sound"),
      entry("result", 1, "light_sound"),
      entry("result", 21, "light_sound"),
      entry("preview", null, "light_sound", "ladies"),
    ])
    expect(ordered.map(motionValue)).toEqual([
      "costume:1:light_sound",
      "result:1:light_sound",
      "costume:21:piapro",
      "result:21:piapro",
      "result:21:light_sound",
      "preview:1:light_sound",
    ])
  })
})
