import { describe, expect, it } from "bun:test"
import { isStationApiConfigured, stationRealtimeUrl } from "./station"

const BASE = "https://station.example/station/api/v2"

describe("isStationApiConfigured", () => {
  it("is false only without a base", () => {
    expect(isStationApiConfigured(BASE)).toBe(true)
    expect(isStationApiConfigured("")).toBe(false)
  })
})

describe("stationRealtimeUrl", () => {
  it("appends the stream path", () => {
    expect(stationRealtimeUrl(BASE)).toBe(`${BASE}/realtime`)
  })
})
