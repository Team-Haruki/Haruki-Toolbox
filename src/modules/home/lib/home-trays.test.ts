import { describe, expect, it } from "bun:test"
import { WEB_NAV_SECTIONS } from "@/config/navigation"
import { HOME_TOOL_URLS, HOME_TRAY_SPECS, resolveHomeTrays } from "./home-trays"

describe("home trays", () => {
  const trays = resolveHomeTrays()

  it("resolves a name and an icon for every configured tool", () => {
    expect(trays.map((tray) => tray.tools.length)).toEqual(HOME_TRAY_SPECS.map((tray) => tray.tools.length))
    for (const tool of trays.flatMap((tray) => tray.tools)) {
      expect(tool.titleKey).not.toBe("")
      expect(tool.icon).toBeDefined()
    }
  })

  it("lists each tool once", () => {
    expect(new Set(HOME_TOOL_URLS).size).toBe(HOME_TOOL_URLS.length)
  })

  it("covers every page the sidebar links to", () => {
    const sidebarUrls = WEB_NAV_SECTIONS.flatMap((section) =>
      section.items.flatMap((item) => (item.url ? [item.url] : (item.items ?? []).map((child) => child.url)))
    )
    expect(sidebarUrls.filter((url) => !HOME_TOOL_URLS.includes(url))).toEqual([])
  })

  it("takes names from the sidebar config so the two stay in sync", () => {
    const deck = trays.flatMap((tray) => tray.tools).find((tool) => tool.url === "/deck-recommend")
    expect(deck?.titleKey).toBe("navigation.items.deckRecommend")
  })

  it("drops a tool that has no name anywhere", () => {
    const resolved = resolveHomeTrays([
      { id: "event", titleKey: "t", emphasis: "feature", tools: [{ url: "/nowhere", descriptionKey: "d" }] },
    ])
    expect(resolved[0]?.tools).toEqual([])
  })
})
