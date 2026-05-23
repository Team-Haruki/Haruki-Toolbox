import { describe, expect, it } from "bun:test"
import {
  calculateScoreControlPoints,
  findScoreControlRanges,
  selectScoreControlBasicPoint,
} from "./score-control"

describe("score control helpers", () => {
  it("calculates points with integer flooring at 20,000 score steps", () => {
    expect(calculateScoreControlPoints(0, 0, 100, 0)).toBe(100)
    expect(calculateScoreControlPoints(19_999, 0, 100, 0)).toBe(100)
    expect(calculateScoreControlPoints(20_000, 0, 100, 0)).toBe(101)
    expect(calculateScoreControlPoints(0, 435, 100, 10)).toBe(18_725)
  })

  it("finds exact score ranges with binary-search boundaries", () => {
    expect(findScoreControlRanges({
      targetPoint: 505,
      basicPoint: 100,
      boost: 1,
      maxEventBonus: 0,
      limit: 1,
    })).toEqual([
      {
        eventBonus: 0,
        boost: 1,
        boostMultiplier: 5,
        scoreMin: 20_000,
        scoreMax: 39_999,
      },
    ])
  })

  it("sorts result ranges by event bonus from high to low before applying the limit", () => {
    expect(findScoreControlRanges({
      targetPoint: 505,
      basicPoint: 100,
      boost: 1,
      maxEventBonus: 1,
      limit: 2,
    })).toEqual([
      {
        eventBonus: 1,
        boost: 1,
        boostMultiplier: 5,
        scoreMin: 0,
        scoreMax: 19_999,
      },
      {
        eventBonus: 0,
        boost: 1,
        boostMultiplier: 5,
        scoreMin: 20_000,
        scoreMax: 39_999,
      },
    ])
  })

  it("skips boost levels that cannot divide the target point", () => {
    expect(findScoreControlRanges({
      targetPoint: 101,
      basicPoint: 100,
      boost: 1,
    })).toEqual([])
  })

  it("supports World Link bonus cap without allowing it in normal mode", () => {
    const worldLinkRanges = findScoreControlRanges({
      targetPoint: 700,
      basicPoint: 100,
      worldLink: true,
      boost: 0,
      limit: 0,
    })
    const normalRanges = findScoreControlRanges({
      targetPoint: 700,
      basicPoint: 100,
      worldLink: false,
      boost: 0,
      limit: 0,
    })

    expect(worldLinkRanges.some((row) =>
      row.eventBonus === 600
      && row.scoreMin === 0
      && row.scoreMax === 19_999,
    )).toBe(true)
    expect(normalRanges.every((row) => row.eventBonus <= 435)).toBe(true)
  })

  it("uses a custom event bonus cap when provided", () => {
    const cappedRanges = findScoreControlRanges({
      targetPoint: 200,
      basicPoint: 100,
      boost: 0,
      maxEventBonus: 100,
      limit: 0,
    })

    expect(cappedRanges.length).toBeGreaterThan(0)
    expect(cappedRanges.every((row) => row.eventBonus <= 100)).toBe(true)
    expect(cappedRanges.some((row) => row.eventBonus > 100)).toBe(false)
  })

  it("uses a custom event bonus floor when provided", () => {
    const rangedResults = findScoreControlRanges({
      targetPoint: 200,
      basicPoint: 100,
      boost: 0,
      minEventBonus: 100,
      maxEventBonus: 150,
      limit: 0,
    })

    expect(rangedResults.length).toBeGreaterThan(0)
    expect(rangedResults.every((row) => row.eventBonus >= 100 && row.eventBonus <= 150)).toBe(true)
  })

  it("selects master basic point first and otherwise highest event rate", () => {
    expect(selectScoreControlBasicPoint(74, [
      { music_id: 74, difficulty: "expert", event_rate: 110 },
      { music_id: 74, difficulty: "master", event_rate: 100 },
      { music_id: 75, difficulty: "master", event_rate: 300 },
    ])).toEqual({
      musicId: 74,
      difficulty: "master",
      basicPoint: 100,
    })

    expect(selectScoreControlBasicPoint(74, [
      { music_id: 74, difficulty: "easy", event_rate: 80 },
      { music_id: 74, difficulty: "expert", event_rate: 120 },
    ])).toEqual({
      musicId: 74,
      difficulty: "expert",
      basicPoint: 120,
    })
  })
})
