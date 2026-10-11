import { afterEach, beforeEach, describe, expect, it, jest } from "bun:test"
import { effectScope } from "vue"
import { useHoldToBlock } from "./useHoldToBlock"

const noopTarget = { addEventListener: () => {}, removeEventListener: () => {} }

beforeEach(() => {
  jest.useFakeTimers()
  Object.assign(globalThis, { window: noopTarget, document: noopTarget })
})

afterEach(() => {
  jest.useRealTimers()
  delete (globalThis as { window?: unknown }).window
  delete (globalThis as { document?: unknown }).document
})

/** Presses the number for `ms`, then releases it (or slides off); returns what fired */
function press(ms: number, end: "release" | "leave" = "release"): string[] {
  const fired: string[] = []
  const scope = effectScope()
  scope.run(() => {
    const hold = useHoldToBlock({ onClick: () => fired.push("click"), onHold: () => fired.push("hold") })
    hold.onPointerDown({ button: 0, currentTarget: null, pointerId: 1 } as unknown as PointerEvent)
    jest.advanceTimersByTime(ms)
    if (end === "release") {
      hold.onPointerUp()
    } else {
      hold.onPointerLeave()
    }
    // A click event follows the release
    hold.onClick()
  })
  scope.stop()
  return fired
}

describe("useHoldToBlock", () => {
  it("copies on a short press", () => {
    expect(press(100)).toEqual(["click"])
  })

  it("does nothing when released between a click and a hold", () => {
    expect(press(600)).toEqual([])
  })

  it("hides once held long enough, without copying", () => {
    expect(press(1_000)).toEqual(["hold"])
  })

  it("cancels when the pointer slides off", () => {
    expect(press(500, "leave")).toEqual([])
  })
})
