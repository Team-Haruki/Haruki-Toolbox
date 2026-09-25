import { describe, expect, it } from "bun:test"
import { createRealtimeRefreshGate } from "./realtime-refresh"

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

async function flush() {
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve()
  }
}

function createHarness(hidden = { value: false }) {
  const runs: Array<number | null> = []
  const gates: Array<ReturnType<typeof deferred>> = []
  let idle = 0
  const gate = createRealtimeRefreshGate({
    run: (version) => {
      runs.push(version)
      const pending = deferred()
      gates.push(pending)
      return pending.promise
    },
    isHidden: () => hidden.value,
    onIdle: () => {
      idle += 1
    },
  })
  return {
    gate,
    runs,
    hidden,
    get idle() {
      return idle
    },
    async finish(index: number) {
      gates[index]?.resolve()
      await flush()
    },
  }
}

describe("realtime refresh gate", () => {
  it("coalesces pushes that arrive mid-fetch into one follow-up for the newest version", async () => {
    const harness = createHarness()
    harness.gate.notify(1)
    harness.gate.notify(2)
    harness.gate.notify(3)
    harness.gate.notify(4)
    expect(harness.runs).toEqual([1])

    await harness.finish(0)
    expect(harness.runs).toEqual([1, 4])

    await harness.finish(1)
    expect(harness.runs).toEqual([1, 4])
    expect(harness.idle).toBe(1)
  })

  it("skips the follow-up when no newer version arrived", async () => {
    const harness = createHarness()
    harness.gate.notify(5)
    harness.gate.notify(5)
    await harness.finish(0)
    expect(harness.runs).toEqual([5])
    expect(harness.idle).toBe(1)
  })

  it("always follows up for pushes without a version", async () => {
    const harness = createHarness()
    harness.gate.notify(null)
    harness.gate.notify(null)
    harness.gate.notify(null)
    await harness.finish(0)
    expect(harness.runs).toEqual([null, null])
    await harness.finish(1)
    expect(harness.runs).toEqual([null, null])
  })

  it("defers pushes while hidden and catches up once on resume", async () => {
    const harness = createHarness({ value: true })
    harness.gate.notify(7)
    harness.gate.notify(8)
    expect(harness.runs).toEqual([])

    harness.hidden.value = false
    void harness.gate.resume()
    expect(harness.runs).toEqual([8])
    await harness.finish(0)
    expect(harness.runs).toEqual([8])
  })

  it("drops a realtime follow-up when the tab became hidden mid-fetch", async () => {
    const harness = createHarness()
    harness.gate.notify(1)
    harness.gate.notify(2)
    harness.hidden.value = true
    await harness.finish(0)
    expect(harness.runs).toEqual([1])
  })

  it("runs direct requests unversioned and lets them win over realtime follow-ups", async () => {
    const harness = createHarness()
    harness.gate.notify(3)
    void harness.gate.request("direct")
    harness.gate.notify(4)
    await harness.finish(0)
    expect(harness.runs).toEqual([3, null])
  })

  it("forgets the version after a reset", async () => {
    const harness = createHarness()
    harness.gate.notify(9)
    await harness.finish(0)
    harness.gate.resetVersion()
    void harness.gate.request("realtime")
    expect(harness.runs).toEqual([9, null])
  })
})
