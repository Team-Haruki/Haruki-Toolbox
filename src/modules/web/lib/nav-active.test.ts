import { describe, expect, it } from "bun:test"
import type { NavItem, NavSection } from "@/config/navigation"
import { collectNavUrls, navGroupContainsUrl, navUrlCoversPath, resolveActiveNavUrl } from "./nav-active"

const sections: NavSection[] = [
  {
    items: [
      {
        titleKey: "catalog",
        items: [
          { titleKey: "cards", url: "/cards" },
          { titleKey: "events", url: "/events" },
        ],
      },
      {
        titleKey: "player",
        items: [
          { titleKey: "cardBox", url: "/cards/box" },
          { titleKey: "profile", url: "/profile/me" },
        ],
      },
      { titleKey: "upload", url: "/upload-data" },
    ],
  },
]

describe("navUrlCoversPath", () => {
  it("matches exact and nested paths at segment boundaries", () => {
    expect(navUrlCoversPath("/cards", "/cards")).toBe(true)
    expect(navUrlCoversPath("/cards", "/cards/123")).toBe(true)
    expect(navUrlCoversPath("/cards", "/cardsx")).toBe(false)
    expect(navUrlCoversPath("/", "/cards")).toBe(false)
    expect(navUrlCoversPath("/", "/")).toBe(true)
  })
})

describe("resolveActiveNavUrl", () => {
  const urls = collectNavUrls(sections, ["/", "/about"])

  it("picks the longest covering url so sibling pages do not double-highlight", () => {
    expect(resolveActiveNavUrl("/cards", urls)).toBe("/cards")
    expect(resolveActiveNavUrl("/cards/123", urls)).toBe("/cards")
    expect(resolveActiveNavUrl("/cards/box", urls)).toBe("/cards/box")
    expect(resolveActiveNavUrl("/profile/me", urls)).toBe("/profile/me")
    expect(resolveActiveNavUrl("/profile/42", urls)).toBeNull()
    expect(resolveActiveNavUrl("/", urls)).toBe("/")
    expect(resolveActiveNavUrl("/nowhere", urls)).toBeNull()
  })

  it("collects every leaf and group link once", () => {
    expect(urls.sort()).toEqual(["/", "/about", "/cards", "/cards/box", "/events", "/profile/me", "/upload-data"].sort())
  })
})

describe("navGroupContainsUrl", () => {
  const group = sections[0]!.items[0] as NavItem

  it("reports membership of the resolved active url", () => {
    expect(navGroupContainsUrl(group, "/cards")).toBe(true)
    expect(navGroupContainsUrl(group, "/cards/box")).toBe(false)
    expect(navGroupContainsUrl(group, null)).toBe(false)
  })
})
