import { describe, expect, it } from "bun:test"
import { describeSystemMessage, splitMessageLinks, visibleUserMessages } from "./messages"
import type { TicketMessage } from "@/types/ticket"

describe("splitMessageLinks", () => {
  it("returns plain text untouched", () => {
    expect(splitMessageLinks("hello world")).toEqual([{ type: "text", value: "hello world" }])
  })

  it("splits http(s) links out of the text", () => {
    expect(splitMessageLinks("see https://example.com/a?b=1 and http://x.y")).toEqual([
      { type: "text", value: "see " },
      { type: "link", value: "https://example.com/a?b=1", href: "https://example.com/a?b=1" },
      { type: "text", value: " and " },
      { type: "link", value: "http://x.y", href: "http://x.y" },
    ])
  })

  it("leaves trailing sentence punctuation in the text", () => {
    expect(splitMessageLinks("打开 https://example.com/path。")).toEqual([
      { type: "text", value: "打开 " },
      { type: "link", value: "https://example.com/path", href: "https://example.com/path" },
      { type: "text", value: "。" },
    ])
    expect(splitMessageLinks("(https://example.com/a).")).toEqual([
      { type: "text", value: "(" },
      { type: "link", value: "https://example.com/a", href: "https://example.com/a" },
      { type: "text", value: ")." },
    ])
  })

  it("keeps a balanced closing bracket inside the URL", () => {
    expect(splitMessageLinks("https://en.wikipedia.org/wiki/Foo_(bar)")).toEqual([
      { type: "link", value: "https://en.wikipedia.org/wiki/Foo_(bar)", href: "https://en.wikipedia.org/wiki/Foo_(bar)" },
    ])
  })

  it("never links javascript: or bare domains", () => {
    expect(splitMessageLinks("javascript:alert(1) example.com")).toEqual([
      { type: "text", value: "javascript:alert(1) example.com" },
    ])
  })
})

describe("describeSystemMessage", () => {
  it("localizes status changes", () => {
    const text = describeSystemMessage("Status changed to pending_admin")
    expect(text).not.toContain("pending_admin")
    expect(text.length).toBeGreaterThan(0)
  })

  it("passes unknown text through", () => {
    expect(describeSystemMessage("  Assigned to someone ")).toBe("Assigned to someone")
  })
})

describe("visibleUserMessages", () => {
  it("drops internal notes", () => {
    const base: TicketMessage = {
      id: "1",
      ticketId: "t",
      senderId: "",
      senderRole: "admin",
      message: "x",
      internal: false,
      createdAt: "",
    }
    const result = visibleUserMessages([base, { ...base, id: "2", internal: true }, { ...base, id: "3" }])
    expect(result.map((item) => item.id)).toEqual(["1", "3"])
  })
})
