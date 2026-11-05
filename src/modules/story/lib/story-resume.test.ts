import { describe, expect, test } from "bun:test"
import {
  RESUME_MAX_AGE_MS,
  isWorthResuming,
  parseStoryResume,
  serializeStoryResume,
} from "@/modules/story/lib/story-resume"

const now = 1_800_000_000_000

describe("parseStoryResume", () => {
  test("round-trips a record", () => {
    const raw = serializeStoryResume({ sid: "event_223_01", index: 42, at: now - 1000 })
    expect(parseStoryResume(raw, now)).toEqual({ sid: "event_223_01", index: 42, at: now - 1000 })
  })
  test("rejects junk, bad ids and negative lines", () => {
    expect(parseStoryResume(null, now)).toBeNull()
    expect(parseStoryResume("", now)).toBeNull()
    expect(parseStoryResume("{", now)).toBeNull()
    expect(parseStoryResume("[]", now)).toBeNull()
    expect(parseStoryResume(JSON.stringify({ sid: "<script>", index: 1, at: now }), now)).toBeNull()
    expect(parseStoryResume(JSON.stringify({ sid: "event_1_01", index: -1, at: now }), now)).toBeNull()
    expect(parseStoryResume(JSON.stringify({ sid: "event_1_01", index: 1.5, at: now }), now)).toBeNull()
    expect(parseStoryResume(JSON.stringify({ sid: "event_1_01", index: 1 }), now)).toBeNull()
  })
  test("forgets positions older than a month", () => {
    const old = JSON.stringify({ sid: "event_1_01", index: 10, at: now - RESUME_MAX_AGE_MS - 1 })
    expect(parseStoryResume(old, now)).toBeNull()
    const fresh = JSON.stringify({ sid: "event_1_01", index: 10, at: now - RESUME_MAX_AGE_MS + 1000 })
    expect(parseStoryResume(fresh, now)).not.toBeNull()
  })
})

describe("isWorthResuming", () => {
  test("only past the first lines", () => {
    expect(isWorthResuming(null)).toBe(false)
    expect(isWorthResuming({ sid: "a", index: 2, at: now })).toBe(false)
    expect(isWorthResuming({ sid: "a", index: 5, at: now })).toBe(true)
  })
})
