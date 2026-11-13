import { describe, expect, it } from "bun:test"
import { blockMinutesLeft, resolveConnectionStatus, retrySecondsLeft } from "./station-status"

describe("resolveConnectionStatus", () => {
  it("is open whenever the stream is open", () => {
    expect(resolveConnectionStatus("open", false)).toBe("open")
    expect(resolveConnectionStatus("open", true)).toBe("open")
  })

  it("stays lost while a retry is connecting", () => {
    expect(resolveConnectionStatus("connecting", true)).toBe("lost")
    expect(resolveConnectionStatus("closed", true)).toBe("lost")
  })

  it("is connecting on the first attempt and idle before it", () => {
    expect(resolveConnectionStatus("connecting", false)).toBe("connecting")
    expect(resolveConnectionStatus("closed", false)).toBe("idle")
  })
})

describe("retrySecondsLeft", () => {
  it("rounds up to whole seconds", () => {
    expect(retrySecondsLeft(10_000, 7_900)).toBe(3)
    expect(retrySecondsLeft(10_000, 8_000)).toBe(2)
  })

  it("never shows less than one second", () => {
    expect(retrySecondsLeft(10_000, 9_990)).toBe(1)
    expect(retrySecondsLeft(10_000, 12_000)).toBe(1)
  })
})

describe("blockMinutesLeft", () => {
  const TEN_MINUTES = 10 * 60_000

  it("rounds up to whole minutes", () => {
    expect(blockMinutesLeft(TEN_MINUTES, 61_000, TEN_MINUTES)).toBe(9)
    expect(blockMinutesLeft(TEN_MINUTES, 9 * 60_000 + 1, TEN_MINUTES)).toBe(1)
  })

  it("caps a fresh block at its full length when the clock is a little old", () => {
    expect(blockMinutesLeft(TEN_MINUTES + 900, 0, TEN_MINUTES)).toBe(10)
  })

  it("never shows less than one minute", () => {
    expect(blockMinutesLeft(TEN_MINUTES, TEN_MINUTES + 5_000, TEN_MINUTES)).toBe(1)
  })
})
