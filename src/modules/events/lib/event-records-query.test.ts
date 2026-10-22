import { describe, expect, test } from "bun:test"
import {
  createDefaultEventRecordsQuery,
  parseEventRecordsQuery,
  serializeEventRecordsQuery,
} from "./event-records-query"

describe("event records query codec", () => {
  test("defaults serialize to an empty query", () => {
    const record = serializeEventRecordsQuery(createDefaultEventRecordsQuery())
    expect(Object.values(record).every((value) => value === undefined)).toBe(true)
  })

  test("round-trips filters and sort", () => {
    const state = parseEventRecordsQuery({
      time: "custom", from: "1700000000000", to: "1710000000000", types: "marathon,cheerful_carnival", units: "light_sound", sort: "point",
    })
    expect(state).toEqual({
      time: "custom", from: 1700000000000, to: 1710000000000, types: ["marathon", "cheerful_carnival"], units: ["light_sound"], sort: "point",
    })
    expect(serializeEventRecordsQuery(state)).toEqual({
      time: "custom", from: "1700000000000", to: "1710000000000", types: "marathon,cheerful_carnival", units: "light_sound", sort: "point",
    })
  })

  test("drops custom bounds outside custom mode and ignores garbage", () => {
    expect(parseEventRecordsQuery({ time: "all", from: "1", to: "2" })).toMatchObject({ time: "all", from: null, to: null })
    expect(parseEventRecordsQuery({ time: "never", sort: "nope", types: "bogus" })).toEqual(createDefaultEventRecordsQuery())
    expect(serializeEventRecordsQuery({ ...createDefaultEventRecordsQuery(), time: "year", from: 5, to: 6 }).from).toBeUndefined()
  })
})
