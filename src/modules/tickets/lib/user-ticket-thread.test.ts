import { describe, expect, it } from "bun:test"
import type { TicketMessage } from "@/types/ticket"
import { buildThreadEntries, foldThread, isOwnMessage, THREAD_FOLD_TAIL, THREAD_FOLD_THRESHOLD } from "./user-ticket-thread"

function message(id: string, createdAt: string, senderRole: TicketMessage["senderRole"] = "user"): TicketMessage {
  return { id, ticketId: "TK-1", senderId: "", senderRole, message: `m${id}`, internal: false, createdAt }
}

describe("foldThread", () => {
  const numbers = (count: number) => Array.from({ length: count }, (_, index) => index + 1)

  it("shows a short thread whole", () => {
    expect(foldThread(numbers(THREAD_FOLD_THRESHOLD), false)).toEqual({ hidden: 0, visible: numbers(THREAD_FOLD_THRESHOLD) })
    expect(foldThread([], false)).toEqual({ hidden: 0, visible: [] })
  })

  it("keeps the latest messages of a long thread and counts the rest", () => {
    const folded = foldThread(numbers(THREAD_FOLD_THRESHOLD + 1), false)
    expect(folded.hidden).toBe(THREAD_FOLD_THRESHOLD + 1 - THREAD_FOLD_TAIL)
    expect(folded.visible).toEqual(numbers(THREAD_FOLD_THRESHOLD + 1).slice(-THREAD_FOLD_TAIL))
  })

  it("shows everything once expanded", () => {
    expect(foldThread(numbers(30), true)).toEqual({ hidden: 0, visible: numbers(30) })
  })

  it("never folds below the tail", () => {
    expect(foldThread(numbers(5), false, 6, 2)).toEqual({ hidden: 0, visible: numbers(5) })
    expect(foldThread(numbers(7), false, 6, 2).hidden).toBe(1)
  })
})

describe("buildThreadEntries", () => {
  // Noon UTC is the same calendar day in every time zone a test can run in
  // only when the gap to the next message is a few minutes; two days apart
  // is a different day everywhere.
  const first = message("1", "2026-11-10T12:00:00Z")
  const second = message("2", "2026-11-10T12:05:00Z", "admin")
  const third = message("3", "2026-11-12T12:00:00Z")

  it("puts a day line before the first message of each day", () => {
    const entries = buildThreadEntries([first, second, third])
    expect(entries.map((entry) => entry.kind)).toEqual(["day", "message", "message", "day", "message"])
    expect(entries[0]).toMatchObject({ kind: "day", at: first.createdAt })
    expect(entries[3]).toMatchObject({ kind: "day", at: third.createdAt })
    expect(new Set(entries.map((entry) => entry.key)).size).toBe(entries.length)
  })

  it("keeps a message without a readable time under the previous day", () => {
    const entries = buildThreadEntries([first, message("x", "nope"), second])
    expect(entries.map((entry) => entry.kind)).toEqual(["day", "message", "message", "message"])
  })

  it("returns nothing for an empty thread", () => {
    expect(buildThreadEntries([])).toEqual([])
  })
})

describe("isOwnMessage", () => {
  it("falls back to the sender role when the API sends no sender id", () => {
    expect(isOwnMessage({ senderRole: "user", senderId: "" }, "u1")).toBe(true)
    expect(isOwnMessage({ senderRole: "admin", senderId: "" }, "u1")).toBe(false)
    expect(isOwnMessage({ senderRole: "system", senderId: "u1" }, "u1")).toBe(false)
  })

  it("compares the sender id when there is one", () => {
    expect(isOwnMessage({ senderRole: "user", senderId: "u1" }, "u1")).toBe(true)
    expect(isOwnMessage({ senderRole: "user", senderId: "u2" }, "u1")).toBe(false)
    // An admin writing on their own ticket.
    expect(isOwnMessage({ senderRole: "admin", senderId: "u1" }, "u1")).toBe(true)
  })
})
