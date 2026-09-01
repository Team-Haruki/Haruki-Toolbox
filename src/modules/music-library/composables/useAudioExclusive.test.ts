import { describe, expect, it } from "bun:test"
import { effectScope } from "vue"
import { useAudioExclusive } from "./useAudioExclusive"

describe("useAudioExclusive", () => {
  it("pauses the previous holder when another source claims playback", () => {
    const events: string[] = []
    const vocal = useAudioExclusive(() => events.push("vocal-paused"))
    const chart = useAudioExclusive(() => events.push("chart-paused"))

    vocal.claim()
    expect(vocal.isActive()).toBe(true)
    chart.claim()
    expect(events).toEqual(["vocal-paused"])
    expect(vocal.isActive()).toBe(false)
    expect(chart.isActive()).toBe(true)

    // Re-claiming your own slot is a no-op.
    chart.claim()
    expect(events).toEqual(["vocal-paused"])

    chart.release()
    expect(chart.isActive()).toBe(false)
    vocal.claim()
    expect(events).toEqual(["vocal-paused"])
    vocal.release()
  })

  it("releases the slot when the owning scope is disposed", () => {
    const scope = effectScope()
    const source = scope.run(() => useAudioExclusive(() => {}))!
    source.claim()
    expect(source.isActive()).toBe(true)
    scope.stop()
    expect(source.isActive()).toBe(false)
  })
})
