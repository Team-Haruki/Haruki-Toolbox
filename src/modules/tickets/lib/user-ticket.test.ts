import { describe, expect, it } from "bun:test"
import {
  canCloseTicket,
  canReplyToTicket,
  formatRelativeTicketAge,
  isUserTicketStatusFilter,
  showsTicketPriority,
  ticketAge,
  ticketCategoryGuideKey,
  USER_TICKET_STATUS_FILTERS,
  userTicketStage,
  userTicketStatusHintKey,
  userTicketStatusLabelKey,
  userTicketStatusTone,
} from "./user-ticket"

describe("user ticket stage", () => {
  it("reads whose turn it is from the status", () => {
    expect(userTicketStage("open")).toBe("waitingSupport")
    expect(userTicketStage("pending_admin")).toBe("waitingSupport")
    expect(userTicketStage("pending_user")).toBe("waitingUser")
    expect(userTicketStage("resolved")).toBe("resolved")
    expect(userTicketStage("closed")).toBe("closed")
  })

  it("is amber only when the user has something to do", () => {
    expect(userTicketStatusTone("pending_user")).toBe("warning")
    expect(userTicketStatusTone("open")).toBe("primary")
    expect(userTicketStatusTone("pending_admin")).toBe("primary")
    expect(userTicketStatusTone("resolved")).toBe("neutral")
    expect(userTicketStatusTone("closed")).toBe("neutral")
  })

  it("allows replying and closing until the ticket is closed", () => {
    expect(canReplyToTicket("resolved")).toBe(true)
    expect(canReplyToTicket("closed")).toBe(false)
    expect(canCloseTicket("pending_user")).toBe(true)
    expect(canCloseTicket("closed")).toBe(false)
  })
})

describe("user ticket wording", () => {
  it("has a label for every filter, the pressing ones first", () => {
    expect(USER_TICKET_STATUS_FILTERS.slice(0, 2)).toEqual(["all", "pending_user"])
    const keys = USER_TICKET_STATUS_FILTERS.map(userTicketStatusLabelKey)
    expect(new Set(keys).size).toBe(USER_TICKET_STATUS_FILTERS.length)
    expect(userTicketStatusLabelKey("pending_user")).toBe("tickets.userStatus.pendingUser")
  })

  it("recognises filter values", () => {
    expect(isUserTicketStatusFilter("resolved")).toBe(true)
    expect(isUserTicketStatusFilter("")).toBe(false)
    expect(isUserTicketStatusFilter(undefined)).toBe(false)
    expect(isUserTicketStatusFilter(["open"])).toBe(false)
  })

  it("says an admin has picked the ticket up only while it waits for one", () => {
    expect(userTicketStatusHintKey("open", false)).toBe("tickets.userStatusHint.waitingAdmin")
    expect(userTicketStatusHintKey("pending_admin", true)).toBe("tickets.userStatusHint.waitingAdminAssigned")
    expect(userTicketStatusHintKey("pending_user", true)).toBe("tickets.userStatusHint.waitingUser")
    expect(userTicketStatusHintKey("resolved", true)).toBe("tickets.userStatusHint.resolved")
    expect(userTicketStatusHintKey("closed", false)).toBe("tickets.userStatusHint.closed")
  })

  it("names a priority only when it is not the default", () => {
    expect(showsTicketPriority("normal")).toBe(false)
    expect(showsTicketPriority("low")).toBe(true)
    expect(showsTicketPriority("urgent")).toBe(true)
  })

  it("guides the description per category", () => {
    expect(ticketCategoryGuideKey("upload")).toBe("tickets.create.guide.upload")
    expect(ticketCategoryGuideKey("other")).toBe("tickets.create.guide.other")
  })
})

describe("ticketAge", () => {
  const now = Date.parse("2026-11-12T08:00:00Z")
  const before = (ms: number) => new Date(now - ms).toISOString()

  it("uses the largest unit under a week", () => {
    expect(ticketAge(before(20_000), now)).toEqual({ unit: "moment" })
    expect(ticketAge(before(42 * 60_000), now)).toEqual({ unit: "minute", value: 42 })
    expect(ticketAge(before(59 * 60_000 + 59_000), now)).toEqual({ unit: "minute", value: 59 })
    expect(ticketAge(before(3 * 3_600_000 + 10 * 60_000), now)).toEqual({ unit: "hour", value: 3 })
    expect(ticketAge(before(6 * 86_400_000 + 3_600_000), now)).toEqual({ unit: "day", value: 6 })
  })

  it("falls back to a date from a week on", () => {
    expect(ticketAge(before(7 * 86_400_000), now)).toEqual({ unit: "date", sameYear: true })
    expect(ticketAge("2025-03-01T12:00:00Z", now)).toEqual({ unit: "date", sameYear: false })
  })

  it("treats a timestamp slightly in the future as just now", () => {
    expect(ticketAge(new Date(now + 5_000).toISOString(), now)).toEqual({ unit: "moment" })
  })

  it("returns null without a readable timestamp", () => {
    expect(ticketAge(undefined, now)).toBeNull()
    expect(ticketAge("", now)).toBeNull()
    expect(ticketAge("not a date", now)).toBeNull()
  })
})

describe("formatRelativeTicketAge", () => {
  it("words minutes, hours and days in the given locale", () => {
    expect(formatRelativeTicketAge({ unit: "minute", value: 42 }, "en-US")).toBe("42 minutes ago")
    expect(formatRelativeTicketAge({ unit: "hour", value: 1 }, "en-US")).toBe("1 hour ago")
    expect(formatRelativeTicketAge({ unit: "day", value: 3 }, "zh-CN")).toBe("3天前")
  })

  it("leaves just-now and dates to the caller", () => {
    expect(formatRelativeTicketAge({ unit: "moment" }, "en-US")).toBeNull()
    expect(formatRelativeTicketAge({ unit: "date", sameYear: true }, "en-US")).toBeNull()
  })
})
