import { beforeEach, describe, expect, test } from "bun:test"
import {
  isDeckRecommendUserDataKnownMissing,
  markDeckRecommendUserDataAvailable,
  markDeckRecommendUserDataMissing,
  resetDeckRecommendUserDataAvailability,
} from "./user-data-availability"

describe("deck recommend user data availability", () => {
  beforeEach(() => {
    resetDeckRecommendUserDataAvailability()
  })

  test("remembers a missing upload per account and mode until a fetch succeeds", () => {
    expect(isDeckRecommendUserDataKnownMissing("jp", "123", "suite")).toBe(false)
    markDeckRecommendUserDataMissing("jp", "123", "suite")
    expect(isDeckRecommendUserDataKnownMissing("jp", "123", "suite")).toBe(true)
    expect(isDeckRecommendUserDataKnownMissing("jp", 123, "suite")).toBe(true)
    // Other modes and accounts are untouched.
    expect(isDeckRecommendUserDataKnownMissing("jp", "123", "mysekai")).toBe(false)
    expect(isDeckRecommendUserDataKnownMissing("cn", "123", "suite")).toBe(false)
    markDeckRecommendUserDataAvailable("jp", "123", "suite")
    expect(isDeckRecommendUserDataKnownMissing("jp", "123", "suite")).toBe(false)
  })

  test("reset drops one account, one server, or everything", () => {
    markDeckRecommendUserDataMissing("jp", "1", "suite")
    markDeckRecommendUserDataMissing("jp", "1", "mysekai")
    markDeckRecommendUserDataMissing("jp", "2", "suite")
    markDeckRecommendUserDataMissing("cn", "1", "suite")

    resetDeckRecommendUserDataAvailability("jp", 1)
    expect(isDeckRecommendUserDataKnownMissing("jp", "1", "suite")).toBe(false)
    expect(isDeckRecommendUserDataKnownMissing("jp", "1", "mysekai")).toBe(false)
    expect(isDeckRecommendUserDataKnownMissing("jp", "2", "suite")).toBe(true)
    expect(isDeckRecommendUserDataKnownMissing("cn", "1", "suite")).toBe(true)

    resetDeckRecommendUserDataAvailability("jp")
    expect(isDeckRecommendUserDataKnownMissing("jp", "2", "suite")).toBe(false)
    expect(isDeckRecommendUserDataKnownMissing("cn", "1", "suite")).toBe(true)

    resetDeckRecommendUserDataAvailability()
    expect(isDeckRecommendUserDataKnownMissing("cn", "1", "suite")).toBe(false)
  })

  test("never flags an unselected account", () => {
    markDeckRecommendUserDataMissing("jp", "", "suite")
    expect(isDeckRecommendUserDataKnownMissing(null, null, "suite")).toBe(false)
    expect(isDeckRecommendUserDataKnownMissing("jp", "", "suite")).toBe(false)
  })
})
