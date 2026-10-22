import { describe, expect, it } from "bun:test"
import { centeredScrollLeft, edgeOverflow } from "./nav-scroll"

describe("centeredScrollLeft", () => {
  it("centres the item in the viewport", () => {
    expect(centeredScrollLeft(500, 100, 300, 1000)).toBe(400)
  })

  it("clamps to the scrollable range", () => {
    expect(centeredScrollLeft(10, 100, 300, 1000)).toBe(0)
    expect(centeredScrollLeft(950, 100, 300, 1000)).toBe(700)
  })

  it("returns 0 when nothing scrolls", () => {
    expect(centeredScrollLeft(50, 100, 300, 200)).toBe(0)
  })
})

describe("edgeOverflow", () => {
  it("reports no overflow when the content fits", () => {
    expect(edgeOverflow({ scrollLeft: 0, clientWidth: 300, scrollWidth: 300 })).toEqual({ start: false, end: false })
  })

  it("reports only the end edge at the start", () => {
    expect(edgeOverflow({ scrollLeft: 0, clientWidth: 300, scrollWidth: 1000 })).toEqual({ start: false, end: true })
  })

  it("reports both edges in the middle", () => {
    expect(edgeOverflow({ scrollLeft: 200, clientWidth: 300, scrollWidth: 1000 })).toEqual({ start: true, end: true })
  })

  it("reports only the start edge at the end, tolerating subpixel positions", () => {
    expect(edgeOverflow({ scrollLeft: 699.5, clientWidth: 300, scrollWidth: 1000 })).toEqual({ start: true, end: false })
  })
})
