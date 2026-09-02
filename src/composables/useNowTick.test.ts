import { afterEach, describe, expect, test } from "bun:test"
import { effectScope, type EffectScope } from "vue"
import { useNowTick } from "./useNowTick"

const INTERVAL = 250
const scopes: EffectScope[] = []

function subscribe(intervalMs = INTERVAL) {
  const scope = effectScope()
  scopes.push(scope)
  const now = scope.run(() => useNowTick(intervalMs))!
  return { scope, now }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

afterEach(() => {
  for (const scope of scopes.splice(0)) {
    scope.stop()
  }
})

describe("useNowTick", () => {
  test("starts at the current time and advances on the interval", async () => {
    const before = Date.now()
    const { now } = subscribe()
    expect(now.value).toBeGreaterThanOrEqual(before)
    expect(now.value).toBeLessThanOrEqual(Date.now())

    const initial = now.value
    await sleep(INTERVAL + 80)
    expect(now.value).toBeGreaterThan(initial)
  })

  test("shares one ref per interval and clamps sub-250 ms intervals to the shared one", () => {
    const a = subscribe(INTERVAL)
    const b = subscribe(INTERVAL)
    const clamped = subscribe(10)
    const other = subscribe(INTERVAL * 2)

    expect(b.now).toBe(a.now)
    expect(clamped.now).toBe(a.now)
    expect(other.now).not.toBe(a.now)
  })

  test("keeps the shared ticker alive until the last subscriber's scope is disposed", async () => {
    const a = subscribe()
    const b = subscribe()

    a.scope.stop()
    // Another subscriber still holds the ticker, so a new one joins it.
    const c = subscribe()
    expect(c.now).toBe(b.now)

    b.scope.stop()
    c.scope.stop()

    // Last subscriber gone: the timer stops and the value freezes.
    const frozen = c.now.value
    await sleep(INTERVAL + 80)
    expect(c.now.value).toBe(frozen)

    // The next subscriber gets a fresh ticker rather than the torn-down one.
    const d = subscribe()
    expect(d.now).not.toBe(c.now)
    expect(d.now.value).toBeGreaterThanOrEqual(frozen)
  })
})
