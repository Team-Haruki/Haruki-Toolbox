import { describe, expect, it } from "bun:test"
import { holdEdgesAtTime, parseDynamicChart } from "./chart-dynamic"

// 120 BPM, 4/4: one bar = 2 seconds.
const BASE_SUS = `
#BPM01: 120
#00008: 01
`

describe("parseDynamicChart", () => {
  it("parses taps with timing from bpm events", () => {
    const chart = parseDynamicChart(`${BASE_SUS}
#00014: 14
#00114: 24
`)
    expect(chart.taps).toHaveLength(2)
    expect(chart.taps[0]).toMatchObject({ time: 0, lane: 2, width: 4, critical: false, flick: null })
    expect(chart.taps[1]).toMatchObject({ time: 2, lane: 2, width: 4, critical: true })
    expect(chart.bpmEvents).toEqual([{ time: 0, bpm: 120 }])
  })

  it("merges directional flicks with their tap and keeps critical state", () => {
    const chart = parseDynamicChart(`${BASE_SUS}
#00014: 24
#00054: 14
`)
    // The tap is consumed by the directional note: one flick note remains.
    expect(chart.taps).toHaveLength(1)
    expect(chart.taps[0]).toMatchObject({ time: 0, lane: 2, critical: true, flick: "up" })
  })

  it("maps upper-left/right directional types to side flicks", () => {
    const chart = parseDynamicChart(`${BASE_SUS}
#00054: 34
#00154: 44
`)
    expect(chart.taps.map((tap) => tap.flick)).toEqual(["left", "right"])
  })

  it("chains slides into holds with relay ticks and end flicks", () => {
    const chart = parseDynamicChart(`${BASE_SUS}
#002360: 13000023
#00256: 00000043
`)
    expect(chart.holds).toHaveLength(1)
    const hold = chart.holds[0]
    expect(hold.points).toHaveLength(2)
    expect(hold.points[0]).toMatchObject({ time: 4, lane: 4, width: 3, tick: false })
    expect(hold.points[1]).toMatchObject({ time: 5.5, lane: 4, width: 3 })
    // Directional at the slide end position becomes the end flick.
    expect(hold.endFlick).toBe("right")
    expect(chart.duration).toBe(5.5)
  })

  it("skips skill/fever marker lanes and cancel taps", () => {
    const chart = parseDynamicChart(`${BASE_SUS}
#00010: 11
#00014: 74
`)
    expect(chart.taps).toHaveLength(0)
    expect(chart.holds).toHaveLength(0)
  })

  it("honors bar length changes when computing times", () => {
    const chart = parseDynamicChart(`${BASE_SUS}
#00002: 2
#00114: 14
`)
    // Bar 0 lasts 2 beats at 120 BPM = 1 second.
    expect(chart.taps[0].time).toBe(1)
  })
})

describe("holdEdgesAtTime", () => {
  it("interpolates lanes linearly between hold points", () => {
    const chart = parseDynamicChart(`${BASE_SUS}
#002360: 13
#003340: 23
`)
    const hold = chart.holds[0]
    expect(hold.points[0]).toMatchObject({ time: 4, lane: 4 })
    expect(hold.points[1]).toMatchObject({ time: 6, lane: 2 })
    expect(holdEdgesAtTime(hold, 5)).toEqual({ left: 3, right: 6 })
    expect(holdEdgesAtTime(hold, 7)).toBeNull()
  })
})
