import { describe, expect, it } from "bun:test"
import {
  categoryBadgeVariant,
  emptyManualDurationForm,
  manualDurationFormFromEntry,
  manualDurationPayload,
} from "./manual-duration"

describe("manual duration form", () => {
  it("builds a payload and leaves out an empty start time", () => {
    expect(manualDurationPayload({ amount: " 3 ", unit: "month", startsAt: "", note: " 微信转账 " })).toEqual({
      ok: true,
      payload: { amount: 3, unit: "month", note: "微信转账" },
    })
  })

  it("sends the start time as ISO", () => {
    const result = manualDurationPayload({ amount: "10", unit: "day", startsAt: "2026-10-10T12:00", note: "QQ" })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.payload.startsAt).toBe(new Date("2026-10-10T12:00").toISOString())
    }
  })

  it("accepts the number a number input hands back", () => {
    expect(manualDurationPayload({ amount: 2, unit: "day", startsAt: "", note: "x" })).toEqual({ ok: true, payload: { amount: 2, unit: "day", note: "x" } })
  })

  it("rejects amounts that are not positive integers within range", () => {
    for (const amount of ["", "0", "-1", "1.5", "abc", "1201"]) {
      expect(manualDurationPayload({ amount, unit: "month", startsAt: "", note: "x" })).toEqual({ ok: false, error: "amount" })
    }
    expect(manualDurationPayload({ amount: "1201", unit: "day", startsAt: "", note: "x" }).ok).toBe(true)
  })

  it("requires a note of at most 500 bytes", () => {
    expect(manualDurationPayload({ amount: "1", unit: "day", startsAt: "", note: "   " })).toEqual({ ok: false, error: "note" })
    expect(manualDurationPayload({ amount: "1", unit: "day", startsAt: "", note: "赞".repeat(167) })).toEqual({ ok: false, error: "note" })
    expect(manualDurationPayload({ amount: "1", unit: "day", startsAt: "", note: "赞".repeat(166) }).ok).toBe(true)
  })

  it("round-trips an existing entry", () => {
    const form = manualDurationFormFromEntry({
      id: 1,
      amount: 2,
      unit: "month",
      startsAt: "2026-10-10T04:00:00.000Z",
      note: "迁移自旧版手动调整",
      origin: "migration",
      createdBy: "system:migration",
      createdAt: "",
      updatedBy: "",
      updatedAt: "",
    })
    expect(form.amount).toBe("2")
    expect(form.unit).toBe("month")
    const result = manualDurationPayload(form)
    expect(result.ok && result.payload.startsAt).toBe("2026-10-10T04:00:00.000Z")
    expect(emptyManualDurationForm()).toEqual({ amount: "", unit: "month", startsAt: "", note: "" })
  })

  it("has a distinct badge per category", () => {
    expect(categoryBadgeVariant("current")).not.toBe(categoryBadgeVariant("former"))
  })
})
