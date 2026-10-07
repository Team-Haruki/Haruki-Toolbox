import { describe, expect, it } from "bun:test"
import {
  collectBurst,
  isExpired,
  nextRetryDelay,
  nowSeconds,
  selectExpiredKeys,
  splitEndedBlocks,
} from "./room-stream"
import type { StationRoom } from "./station-types"

function room(id: string, time: number): StationRoom {
  return { id, time, msg: "", name: "", source: "qq", info: { handle: "", url: "", avatar: null } }
}

describe("nextRetryDelay", () => {
  it("doubles from 1 s up to 30 s", () => {
    const middle = () => 0.5
    expect([0, 1, 2, 3, 4, 5, 6, 10].map((attempt) => nextRetryDelay(attempt, middle))).toEqual([
      1_000, 2_000, 4_000, 8_000, 16_000, 30_000, 30_000, 30_000,
    ])
  })

  it("adds ±25 % jitter", () => {
    expect(nextRetryDelay(2, () => 0)).toBe(3_000)
    expect(nextRetryDelay(2, () => 0.999_999)).toBe(5_000)
  })
})

describe("collectBurst", () => {
  it("drops known, expired and duplicate rooms and sorts newest first", () => {
    const now = 1_000
    const burst = [room("11111", 990), room("22222", 999), room("33333", 600), room("22222", 999), room("44444", 995)]
    const result = collectBurst(burst, (key) => key === "44444-995", 300, now)
    expect(result.map(([key]) => key)).toEqual(["22222-999", "11111-990"])
  })
})

describe("expiry", () => {
  it("compares against the window plus grace", () => {
    expect(isExpired({ time: 700 }, 300, 1_000)).toBe(false)
    expect(isExpired({ time: 699 }, 300, 1_000)).toBe(true)
    expect(isExpired({ time: 699 }, 300, 1_000, 5)).toBe(false)
    expect(nowSeconds(1_999)).toBe(1)
  })

  it("selects expired rooms that are not pinned", () => {
    const rooms: Array<[string, StationRoom]> = [
      ["a", room("11111", 100)],
      ["b", room("22222", 900)],
      ["c", room("33333", 100)],
      // Past the window but still within the grace period
      ["d", room("44444", 695)],
    ]
    expect(selectExpiredKeys(rooms, (key) => key === "c", 300, 1_000, 5)).toEqual(["a"])
  })
})

describe("splitEndedBlocks", () => {
  it("splits ended blocks and finds the next end", () => {
    expect(splitEndedBlocks({ "11111": 100, "22222": 500, "33333": 300 }, 200)).toEqual({
      ended: ["11111"],
      nextEndMs: 300,
    })
    expect(splitEndedBlocks({}, 200)).toEqual({ ended: [], nextEndMs: null })
  })
})
