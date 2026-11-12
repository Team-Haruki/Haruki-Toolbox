import { describe, expect, it } from "bun:test"
import {
  checkTicketText,
  countCharacters,
  firstInvalidField,
  showsCharacterCount,
  TICKET_MESSAGE_MAX_LENGTH,
  TICKET_SUBJECT_MAX_LENGTH,
  validateTicketDraft,
} from "./ticket-draft"

describe("countCharacters", () => {
  it("counts code points, not UTF-16 units", () => {
    expect(countCharacters("")).toBe(0)
    expect(countCharacters("上传失败")).toBe(4)
    expect(countCharacters("a😀b")).toBe(3)
  })
})

describe("checkTicketText", () => {
  it("requires something other than whitespace", () => {
    expect(checkTicketText("", 10)).toBe("required")
    expect(checkTicketText("  \n\t ", 10)).toBe("required")
    expect(checkTicketText(" a ", 10)).toBeNull()
  })

  it("measures the trimmed text against the limit", () => {
    expect(checkTicketText("字".repeat(10), 10)).toBeNull()
    expect(checkTicketText(`  ${"字".repeat(10)}  `, 10)).toBeNull()
    expect(checkTicketText("字".repeat(11), 10)).toBe("tooLong")
    // 10 emoji are 20 UTF-16 units but 10 characters for the backend.
    expect(checkTicketText("😀".repeat(10), 10)).toBeNull()
  })
})

describe("validateTicketDraft", () => {
  it("checks the subject and the message against the backend limits", () => {
    expect(validateTicketDraft({ subject: "上传失败", message: "详细描述" })).toEqual({ subject: null, message: null })
    expect(validateTicketDraft({ subject: " ", message: "" })).toEqual({ subject: "required", message: "required" })
    expect(validateTicketDraft({
      subject: "s".repeat(TICKET_SUBJECT_MAX_LENGTH + 1),
      message: "m".repeat(TICKET_MESSAGE_MAX_LENGTH + 1),
    })).toEqual({ subject: "tooLong", message: "tooLong" })
    expect(validateTicketDraft({
      subject: "s".repeat(TICKET_SUBJECT_MAX_LENGTH),
      message: "m".repeat(TICKET_MESSAGE_MAX_LENGTH),
    })).toEqual({ subject: null, message: null })
  })

  it("names the first invalid field in form order", () => {
    expect(firstInvalidField({ subject: "required", message: "required" })).toBe("subject")
    expect(firstInvalidField({ subject: null, message: "tooLong" })).toBe("message")
    expect(firstInvalidField({ subject: null, message: null })).toBeNull()
  })
})

describe("showsCharacterCount", () => {
  it("shows a long field's counter only near the limit", () => {
    expect(showsCharacterCount(0, 4000)).toBe(false)
    expect(showsCharacterCount(3599, 4000)).toBe(false)
    expect(showsCharacterCount(3600, 4000)).toBe(true)
    expect(showsCharacterCount(4100, 4000)).toBe(true)
    expect(showsCharacterCount(0, 200, true)).toBe(true)
  })
})
