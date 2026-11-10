import { describe, expect, it } from "bun:test"
import { resolveScrollJumpState } from "./scroll-jump"

describe("resolveScrollJumpState", () => {
  it("shows nothing on a page that barely scrolls", () => {
    expect(resolveScrollJumpState(0, 800, 800)).toEqual({ showTop: false, showBottom: false })
    expect(resolveScrollJumpState(300, 800, 1399)).toEqual({ showTop: false, showBottom: false })
  })

  it("offers the bottom at the top of a long page", () => {
    expect(resolveScrollJumpState(0, 800, 4000)).toEqual({ showTop: false, showBottom: true })
  })

  it("offers both in the middle", () => {
    expect(resolveScrollJumpState(1500, 800, 4000)).toEqual({ showTop: true, showBottom: true })
  })

  it("offers the top at the bottom of a long page", () => {
    expect(resolveScrollJumpState(3200, 800, 4000)).toEqual({ showTop: true, showBottom: false })
    // Within the edge distance of the bottom counts as there.
    expect(resolveScrollJumpState(3000, 800, 4000)).toEqual({ showTop: true, showBottom: false })
  })

  it("clamps overscroll and ignores invalid input", () => {
    expect(resolveScrollJumpState(-50, 800, 4000)).toEqual({ showTop: false, showBottom: true })
    expect(resolveScrollJumpState(9999, 800, 4000)).toEqual({ showTop: true, showBottom: false })
    expect(resolveScrollJumpState(Number.NaN, 800, 4000)).toEqual({ showTop: false, showBottom: false })
    expect(resolveScrollJumpState(0, 0, 4000)).toEqual({ showTop: false, showBottom: false })
  })
})
