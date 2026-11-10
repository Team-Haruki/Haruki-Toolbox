import { describe, expect, it } from "bun:test"
import type { TicketMessage } from "@/types/ticket"
import {
  durationParts,
  nameInitial,
  parseAdminTicketSystemMessage,
  summarizeTicketThread,
} from "./admin-ticket-thread"

describe("parseAdminTicketSystemMessage", () => {
  it("reads a status change into ticket statuses", () => {
    expect(parseAdminTicketSystemMessage("Status changed: Pending admin -> Pending user")).toEqual({
      kind: "status",
      from: "pending_admin",
      to: "pending_user",
    })
    expect(parseAdminTicketSystemMessage("  status changed:Open->Closed ")).toEqual({ kind: "status", from: "open", to: "closed" })
  })

  it("keeps a status label it does not know as text", () => {
    expect(parseAdminTicketSystemMessage("Status changed: Unknown -> Resolved")).toEqual({
      kind: "status",
      from: "Unknown",
      to: "resolved",
    })
  })

  it("reads an assignee change, with nobody as null", () => {
    expect(parseAdminTicketSystemMessage("Assignee changed: Unassigned -> Mafuyu (1200450078)")).toEqual({
      kind: "assignee",
      from: null,
      to: "Mafuyu (1200450078)",
    })
    expect(parseAdminTicketSystemMessage("Assignee changed: 1200450078 -> Unassigned")).toEqual({
      kind: "assignee",
      from: "1200450078",
      to: null,
    })
  })

  it("returns anything else verbatim", () => {
    expect(parseAdminTicketSystemMessage(" Ticket merged into TK-1 ")).toEqual({ kind: "text", text: "Ticket merged into TK-1" })
    expect(parseAdminTicketSystemMessage("Status changed to pending_admin")).toEqual({ kind: "text", text: "Status changed to pending_admin" })
  })
})

const CREATED = "2026-11-09T04:00:00Z"
const at = (minutes: number) => new Date(Date.parse(CREATED) + minutes * 60_000).toISOString()

function message(senderRole: TicketMessage["senderRole"], minutes: number, internal = false): TicketMessage {
  return {
    id: `${senderRole}-${minutes}`,
    ticketId: "TK-1",
    senderId: senderRole === "system" ? "" : `${senderRole}-1`,
    senderRole,
    message: "…",
    internal,
    createdAt: at(minutes),
  }
}

describe("summarizeTicketThread", () => {
  const thread = [
    message("user", 0),
    message("system", 10, true),
    message("admin", 12, true),
    message("admin", 30),
    message("system", 30, true),
    message("admin", 45),
    message("user", 90),
    message("admin", 100, true),
  ]

  it("counts user messages, visible replies, internal notes and system lines apart", () => {
    const summary = summarizeTicketThread({ status: "pending_admin", createdAt: CREATED }, thread, Date.parse(at(150)))
    expect(summary.userMessages).toBe(2)
    expect(summary.adminReplies).toBe(2)
    expect(summary.internalNotes).toBe(2)
    expect(summary.systemEvents).toBe(2)
  })

  it("times the first response from creation to the first reply the user can see", () => {
    const summary = summarizeTicketThread({ status: "pending_admin", createdAt: CREATED }, thread, Date.parse(at(150)))
    expect(summary.firstResponseMs).toBe(30 * 60_000)
  })

  it("has the user waiting since their last message, ignoring later internal notes", () => {
    const summary = summarizeTicketThread({ status: "pending_admin", createdAt: CREATED }, thread, Date.parse(at(150)))
    expect(summary.waiting).toEqual({ on: "admin", ms: 60 * 60_000 })
  })

  it("waits on the user after a visible admin reply", () => {
    const summary = summarizeTicketThread({ status: "pending_user", createdAt: CREATED }, thread.slice(0, 6), Date.parse(at(75)))
    expect(summary.waiting).toEqual({ on: "user", ms: 30 * 60_000 })
  })

  it("reports creation to closing for a closed ticket and nothing for a resolved one", () => {
    const closed = summarizeTicketThread({ status: "closed", createdAt: CREATED, closedAt: at(600) }, thread, Date.parse(at(9000)))
    expect(closed.waiting).toEqual({ on: "closed", ms: 600 * 60_000 })
    const closedWithoutTime = summarizeTicketThread({ status: "closed", createdAt: CREATED }, thread, Date.parse(at(9000)))
    expect(closedWithoutTime.waiting).toBeNull()
    const resolved = summarizeTicketThread({ status: "resolved", createdAt: CREATED }, thread, Date.parse(at(9000)))
    expect(resolved.waiting).toBeNull()
  })

  it("has no first response and no waiting side for an empty or notes-only thread", () => {
    const empty = summarizeTicketThread({ status: "open", createdAt: CREATED }, [], Date.parse(at(5)))
    expect(empty).toEqual({ userMessages: 0, adminReplies: 0, internalNotes: 0, systemEvents: 0, firstResponseMs: null, waiting: null })
    const notesOnly = summarizeTicketThread({ status: "open", createdAt: CREATED }, [message("admin", 3, true)], Date.parse(at(5)))
    expect(notesOnly.firstResponseMs).toBeNull()
    expect(notesOnly.waiting).toBeNull()
  })

  it("never reports a negative wait when clocks disagree", () => {
    const summary = summarizeTicketThread({ status: "open", createdAt: CREATED }, [message("user", 20)], Date.parse(at(5)))
    expect(summary.waiting).toEqual({ on: "admin", ms: 0 })
  })
})

describe("durationParts", () => {
  it("uses the two largest units", () => {
    expect(durationParts(20_000)).toEqual({ unit: "moment" })
    expect(durationParts(5 * 60_000)).toEqual({ unit: "minutes", minutes: 5 })
    expect(durationParts(133 * 60_000)).toEqual({ unit: "hours", hours: 2, minutes: 13 })
    expect(durationParts((3 * 24 * 60 + 4 * 60 + 59) * 60_000)).toEqual({ unit: "days", days: 3, hours: 4 })
  })

  it("treats negative and non-finite input as no time", () => {
    expect(durationParts(-5)).toEqual({ unit: "moment" })
    expect(durationParts(Number.NaN)).toEqual({ unit: "moment" })
  })
})

describe("nameInitial", () => {
  it("takes the first character, upper-cased, whole code points", () => {
    expect(nameInitial("mafuyu")).toBe("M")
    expect(nameInitial("  一歌")).toBe("一")
    expect(nameInitial("🎸rock")).toBe("🎸")
  })

  it("falls back to a question mark", () => {
    expect(nameInitial("")).toBe("?")
    expect(nameInitial(undefined)).toBe("?")
  })
})
