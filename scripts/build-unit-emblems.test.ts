import { describe, expect, it } from "bun:test"
import { UNIT_ORDER, normalizeSvg } from "./build-unit-emblems.mjs"

const WRAP = (inner: string, attrs = 'viewBox="0 0 60 60"') =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>\n${inner}\n</svg>\n`

/**
 * The ingestion contract for `assets/unit-emblems/*.svg` — what a designer's
 * export has to satisfy before it reaches the app.
 */
describe("emblem SVG ingestion", () => {
  it("drops the XML prolog and collapses whitespace between elements", () => {
    const svg = normalizeSvg(WRAP('  <circle cx="30" cy="30" r="27"/>\n  <path d="M0 0"/>'), "x.svg")
    expect(svg).toStartWith("<svg")
    expect(svg).toContain('<circle cx="30" cy="30" r="27"/><path d="M0 0"/>')
    expect(svg).not.toContain("<?xml")
  })

  it("keeps the file's own viewBox rather than forcing one", () => {
    const svg = normalizeSvg(WRAP('<path d="M0 0"/>', 'viewBox="0 0 283.46 283.46"'), "x.svg")
    expect(svg).toContain('viewBox="0 0 283.46 283.46"')
  })

  it("scopes ids, class names and url(#…) references to the unit", () => {
    const inner = '<defs><style>.cls-1 { fill: #f00; }</style></defs>'
      + '<linearGradient id="g"/><path class="cls-1" fill="url(#g)" d="M0 0"/>'
    const svg = normalizeSvg(WRAP(inner), "idol.svg", "idol")
    expect(svg).toContain(".idol-cls-1 { fill: #f00; }")
    expect(svg).toContain('class="idol-cls-1"')
    expect(svg).toContain('id="idol-g"')
    expect(svg).toContain("url(#idol-g)")
    // No bare name survives to collide with another unit's export.
    expect(svg).not.toMatch(/["#.]cls-1\b/)
  })

  it("adds the namespace when the export omits it", () => {
    const svg = normalizeSvg('<svg viewBox="0 0 60 60"><path d="M0 0"/></svg>', "x.svg")
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
  })

  it("rejects markup that cannot be inlined", () => {
    expect(() => normalizeSvg(WRAP("<script>alert(1)</script>"), "x.svg")).toThrow(/script/i)
    expect(() => normalizeSvg(WRAP('<image href="a.png"/>'), "x.svg")).toThrow(/external/i)
    expect(() => normalizeSvg('<svg xmlns="x"><path/></svg>', "x.svg")).toThrow(/viewBox/)
    expect(() => normalizeSvg('<path d="M0 0"/>', "x.svg")).toThrow(/<svg> root/)
  })

  it("names every unit key an emblem file may use", () => {
    expect([...UNIT_ORDER].sort()).toEqual(
      ["idol", "light_sound", "piapro", "school_refusal", "street", "theme_park"],
    )
  })
})
