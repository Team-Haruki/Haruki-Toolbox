import type { Component } from "vue"
import { LucideInfo, LucideNavigation, LucideTicket } from "lucide-vue-next"
import { WEB_NAV_SECTIONS, type NavItem, type NavSubItem } from "@/config/navigation"

/**
 * The home page's tool trays. Names and icons come from the sidebar config
 * (matched by URL) so the two never drift; the trays add the grouping by job
 * and a one-line description per tool.
 */

export type HomeTrayId = "event" | "player" | "catalog" | "community"

export interface HomeToolSpec {
  url: string
  /** i18n key of the one-line description. */
  descriptionKey: string
  /** Only for pages the sidebar config does not list. */
  titleKey?: string
  icon?: Component
  /** The tool works on the visitor's uploaded game data. */
  needsData?: boolean
}

export interface HomeTraySpec {
  id: HomeTrayId
  titleKey: string
  hintKey: string
  /** `feature` trays get larger tiles; they hold the tools people come for. */
  emphasis: "feature" | "standard"
  tools: HomeToolSpec[]
}

export interface HomeTool {
  url: string
  titleKey: string
  descriptionKey: string
  icon: Component
  tray: HomeTrayId
  needsData: boolean
}

export interface HomeTray extends Omit<HomeTraySpec, "tools"> {
  tools: HomeTool[]
}

export const HOME_TRAY_SPECS: readonly HomeTraySpec[] = [
  {
    id: "event",
    titleKey: "navigation.groups.eventRankingTools",
    hintKey: "home.trays.event.hint",
    emphasis: "feature",
    tools: [
      { url: "/deck-recommend", descriptionKey: "home.tools.deckRecommend", needsData: true },
      { url: "/rank-border", descriptionKey: "home.tools.rankBorder" },
      { url: "/pt-calculator", descriptionKey: "home.tools.ptCalculator" },
      { url: "/event-planner", descriptionKey: "home.tools.eventPlanner", needsData: true },
    ],
  },
  {
    id: "player",
    titleKey: "navigation.groups.sekaiPlayer",
    hintKey: "home.trays.player.hint",
    emphasis: "standard",
    tools: [
      { url: "/upload-data", descriptionKey: "home.tools.uploadData" },
      { url: "/profile/me", descriptionKey: "home.tools.playerProfile", needsData: true },
      { url: "/cards/box", descriptionKey: "home.tools.cardBox", needsData: true },
      { url: "/music/progress", descriptionKey: "home.tools.musicProgress", needsData: true },
      { url: "/events/records", descriptionKey: "home.tools.eventRecords", needsData: true },
      { url: "/training", descriptionKey: "home.tools.training", needsData: true },
    ],
  },
  {
    id: "catalog",
    titleKey: "navigation.groups.sekaiCatalog",
    hintKey: "home.trays.catalog.hint",
    emphasis: "standard",
    tools: [
      { url: "/music", descriptionKey: "home.tools.musicLibrary" },
      { url: "/cards", descriptionKey: "home.tools.cards" },
      { url: "/events", descriptionKey: "home.tools.events" },
      { url: "/gachas", descriptionKey: "home.tools.gachas" },
      { url: "/costumes", descriptionKey: "home.tools.costumes" },
      { url: "/story", descriptionKey: "home.tools.storyPlayer" },
    ],
  },
  {
    id: "community",
    titleKey: "home.trays.community.title",
    hintKey: "home.trays.community.hint",
    emphasis: "standard",
    tools: [
      { url: "/sekai-station", descriptionKey: "home.tools.sekaiStation" },
      { url: "/friend-groups", descriptionKey: "home.tools.friendGroups" },
      { url: "/friend-links", descriptionKey: "home.tools.friendLinks" },
      { url: "/tickets", descriptionKey: "home.tools.tickets", titleKey: "webLayout.nav.myTickets", icon: LucideTicket },
      { url: "/about", descriptionKey: "home.tools.about", titleKey: "navigation.items.about", icon: LucideInfo },
      { url: "/sponsors", descriptionKey: "home.tools.sponsors" },
    ],
  },
]

type NavEntry = Pick<NavItem | NavSubItem, "titleKey" | "icon">

function indexNavByUrl(): Map<string, NavEntry> {
  const index = new Map<string, NavEntry>()
  for (const section of WEB_NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.url) {
        index.set(item.url, item)
      }
      for (const child of item.items ?? []) {
        index.set(child.url, child)
      }
    }
  }
  return index
}

/** Trays with every tool's name and icon resolved; a tool with no name anywhere is dropped. */
export function resolveHomeTrays(specs: readonly HomeTraySpec[] = HOME_TRAY_SPECS): HomeTray[] {
  const nav = indexNavByUrl()
  return specs.map((spec) => ({
    ...spec,
    tools: spec.tools.flatMap((tool) => {
      const entry = nav.get(tool.url)
      const titleKey = tool.titleKey ?? entry?.titleKey
      if (!titleKey) {
        return []
      }
      return [{
        url: tool.url,
        titleKey,
        descriptionKey: tool.descriptionKey,
        icon: tool.icon ?? entry?.icon ?? LucideNavigation,
        tray: spec.id,
        needsData: tool.needsData === true,
      }]
    }),
  }))
}

/** Every tool URL on the home page, for usage tracking. */
export const HOME_TOOL_URLS: readonly string[] = HOME_TRAY_SPECS.flatMap((tray) => tray.tools.map((tool) => tool.url))
