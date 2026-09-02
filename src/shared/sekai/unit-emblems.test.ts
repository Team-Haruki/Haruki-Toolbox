import { describe, expect, it } from "bun:test"
import { SEKAI_UNITS } from "./catalog"
import { resolveUnitLogoUrl } from "./data-sources"
import {
  SEKAI_UNIT_EMBLEMS,
  buildSekaiUnitEmblemSvg,
  isSekaiUnitWithEmblem,
  resolveUnitEmblemDataUrl,
} from "./unit-emblems"

/**
 * The emblem table is a hook that stays empty until someone adds SVGs to
 * `assets/unit-emblems/`. These tests pin both halves of the contract: a unit
 * without an emblem keeps resolving to the hosted PNG, and any emblem that
 * does land is inlined as a self-contained `data:` URL.
 */
describe("unit emblems", () => {
  it("falls back to the hosted PNG for every unit that has no emblem", () => {
    for (const unit of SEKAI_UNITS) {
      if (isSekaiUnitWithEmblem(unit)) {
        continue
      }
      expect(resolveUnitEmblemDataUrl(unit)).toBeNull()
      expect(buildSekaiUnitEmblemSvg(unit)).toBeNull()
      expect(resolveUnitLogoUrl(unit)).toEndWith(`static_images/icon_${unit}.png`)
    }
  })

  it("never claims an emblem for an unknown unit", () => {
    expect(isSekaiUnitWithEmblem("mystery")).toBe(false)
    expect(buildSekaiUnitEmblemSvg("mystery")).toBeNull()
    expect(resolveUnitLogoUrl("mystery")).toEndWith("static_images/icon_mystery.png")
  })

  it("inlines any emblem that is present as a self-contained data URL", () => {
    for (const [unit, svg] of Object.entries(SEKAI_UNIT_EMBLEMS)) {
      // Inlined into `data:` URLs, so nothing may be fetched at render time.
      expect(svg).not.toContain("<script")
      expect(svg).not.toMatch(/<(image|use)\b/)
      expect(svg).not.toMatch(/\bhref\s*=\s*"(?!#)/)
      expect(svg).toStartWith("<svg")
      expect(svg).toContain("xmlns=")
      expect(svg).toMatch(/\bviewBox\s*=/)
      expect(svg).toEndWith("</svg>")
      expect(buildSekaiUnitEmblemSvg(unit)).toBe(svg)

      const url = resolveUnitLogoUrl(unit)
      expect(url).toBe(resolveUnitEmblemDataUrl(unit))
      expect(url).toStartWith("data:image/svg+xml,")
      expect(decodeURIComponent(url.slice("data:image/svg+xml,".length))).toBe(svg)
    }
  })

  it("scopes ids and class names per unit so inlined emblems cannot collide", () => {
    // Editors emit the same `cls-1` in every export.
    const seen = new Map<string, string>()
    for (const [unit, svg] of Object.entries(SEKAI_UNIT_EMBLEMS)) {
      for (const [, , value] of svg.matchAll(/\b(id|class)="([^"]*)"/g)) {
        for (const name of value.trim().split(/\s+/).filter(Boolean)) {
          expect(name).toStartWith(`${unit}-`)
          // Reused within one file is normal; shared across units is the bug.
          expect(seen.get(name) ?? unit).toBe(unit)
          seen.set(name, unit)
        }
      }
    }
  })
})
