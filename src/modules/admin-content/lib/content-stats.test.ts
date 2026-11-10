import { describe, expect, it } from "bun:test"
import type { AdminFriendGroup, AdminFriendLink } from "@/types/admin"
import { countGroupItems, countLinkTags, linkHost, summarizeContent } from "./content-stats"

function link(id: string, tags?: string[]): AdminFriendLink {
  return { id, name: `Link ${id}`, description: "", avatar: "", url: "https://example.test", tags, sortOrder: 0 }
}

function group(id: number, name: string, size: number): AdminFriendGroup {
  return {
    id,
    group: name,
    sortOrder: id,
    groupList: Array.from({ length: size }, (_, index) => ({ id: index, name: `Item ${index}`, avatar: "", bg: "", sortOrder: index })),
  }
}

describe("summarizeContent", () => {
  it("counts links, distinct tags, groups, entries and the gaps", () => {
    const overview = summarizeContent(
      [link("1", ["blog", "tech"]), link("2", ["blog", " blog "]), link("3"), link("4", [" "])],
      [group(1, "Fans", 3), group(2, "Empty", 0), { id: 3, group: "No list", sortOrder: 3 }],
    )
    expect(overview).toEqual({ links: 4, untaggedLinks: 2, tags: 2, groups: 3, items: 3, emptyGroups: 2 })
  })

  it("is all zeros without data", () => {
    expect(summarizeContent([], [])).toEqual({ links: 0, untaggedLinks: 0, tags: 0, groups: 0, items: 0, emptyGroups: 0 })
  })
})

describe("countLinkTags", () => {
  it("counts a link once per tag and orders by use, then name", () => {
    expect(countLinkTags([link("1", ["tech", "blog"]), link("2", ["blog", "blog"]), link("3", ["art"])])).toEqual([
      { key: "blog", label: "blog", count: 2 },
      { key: "art", label: "art", count: 1 },
      { key: "tech", label: "tech", count: 1 },
    ])
  })
})

describe("countGroupItems", () => {
  it("keeps the list order and counts a missing list as empty", () => {
    expect(countGroupItems([group(2, "B", 1), group(1, "A", 4), { id: 9, group: "C", sortOrder: 0 }])).toEqual([
      { key: "2", label: "B", count: 1 },
      { key: "1", label: "A", count: 4 },
      { key: "9", label: "C", count: 0 },
    ])
  })
})

describe("linkHost", () => {
  it("returns the host of a URL and the raw text otherwise", () => {
    expect(linkHost("https://blog.example.test:8443/path?q=1")).toBe("blog.example.test:8443")
    expect(linkHost("not a url")).toBe("not a url")
    expect(linkHost("")).toBe("")
  })
})
