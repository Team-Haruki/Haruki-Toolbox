import type { Component } from "vue"
import {
  LucideArrowDownToLine,
  LucideBox,
  LucideCalculator,
  LucideCalendarClock,
  LucideCalendarDays,
  LucideCloudUpload,
  LucideCog,
  LucideFileEdit,
  LucideGamepad2,
  LucideGift,
  LucideHeartHandshake,
  LucideHistory,
  LucideIdCard,
  LucideKeyRound,
  LucideLayoutDashboard,
  LucideLibrary,
  LucideListChecks,
  LucideMusic,
  LucideNavigation,
  LucideScrollText,
  LucideShieldAlert,
  LucideSprout,
  LucideTicket,
  LucideTrophy,
  LucideUserRound,
  LucideUsers,
  LucideWalletCards,
  LucideWebhook,
  LucideWrench,
} from "lucide-vue-next"

export interface NavSubItem {
  titleKey: string
  icon?: Component
  url: string
}

export interface NavItem {
  titleKey: string
  icon?: Component
  items: NavSubItem[]
}

export const WEB_NAV_ITEMS: NavItem[] = [
  {
    titleKey: "navigation.groups.friendshipRecommendation",
    icon: LucideNavigation,
    items: [
      { titleKey: "navigation.items.friendGroups", icon: LucideUsers, url: "/friend-groups" },
      { titleKey: "navigation.items.friendLinks", icon: LucideUsers, url: "/friend-links" },
      { titleKey: "navigation.items.sponsors", icon: LucideHeartHandshake, url: "/sponsors" },
    ],
  },
  {
    titleKey: "navigation.groups.sekaiCatalog",
    icon: LucideLibrary,
    items: [
      { titleKey: "navigation.items.musicLibrary", icon: LucideMusic, url: "/music" },
      { titleKey: "navigation.items.cards", icon: LucideWalletCards, url: "/cards" },
      { titleKey: "navigation.items.events", icon: LucideCalendarDays, url: "/events" },
      { titleKey: "navigation.items.gachas", icon: LucideGift, url: "/gachas" },
    ],
  },
  {
    titleKey: "navigation.groups.sekaiPlayer",
    icon: LucideUserRound,
    items: [
      { titleKey: "navigation.items.playerProfile", icon: LucideIdCard, url: "/profile/me" },
      { titleKey: "navigation.items.cardBox", icon: LucideBox, url: "/cards/box" },
      { titleKey: "navigation.items.musicProgress", icon: LucideListChecks, url: "/music/progress" },
      { titleKey: "navigation.items.eventRecords", icon: LucideHistory, url: "/events/records" },
      { titleKey: "navigation.items.training", icon: LucideSprout, url: "/training" },
    ],
  },
  {
    titleKey: "navigation.groups.tools",
    icon: LucideWrench,
    items: [
      { titleKey: "navigation.items.ptCalculator", icon: LucideCalculator, url: "/pt-calculator" },
      { titleKey: "navigation.items.deckRecommend", icon: LucideGamepad2, url: "/deck-recommend" },
      { titleKey: "navigation.items.eventPlanner", icon: LucideCalendarClock, url: "/event-planner" },
      { titleKey: "navigation.items.rankBorder", icon: LucideTrophy, url: "/rank-border" },
    ],
  },
  {
    titleKey: "navigation.groups.dataUpload",
    icon: LucideCloudUpload,
    items: [
      { titleKey: "navigation.items.uploadData", icon: LucideCloudUpload, url: "/upload-data" },
      { titleKey: "navigation.items.iosModules", icon: LucideArrowDownToLine, url: "/ios-modules" },
    ],
  },
]

export interface AdminNavItem {
  value: string
  labelKey: string
  icon: Component
  segment: string
  routeName: string
  titleKey: string
  superOnly?: boolean
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    value: "dashboard",
    labelKey: "admin.nav.dashboard",
    icon: LucideLayoutDashboard,
    segment: "dashboard",
    routeName: "admin.dashboard",
    titleKey: "route.admin.dashboard",
  },
  {
    value: "users",
    labelKey: "admin.nav.users",
    icon: LucideUsers,
    segment: "users",
    routeName: "admin.users",
    titleKey: "route.admin.users",
  },
  {
    value: "oauth",
    labelKey: "admin.nav.oauthClients",
    icon: LucideKeyRound,
    segment: "oauth-clients",
    routeName: "admin.oauthClients",
    titleKey: "route.admin.oauthClients",
  },
  {
    value: "webhooks",
    labelKey: "admin.nav.webhooks",
    icon: LucideWebhook,
    segment: "webhooks",
    routeName: "admin.webhooks",
    titleKey: "route.admin.webhooks",
  },
  {
    value: "logs",
    labelKey: "admin.nav.logs",
    icon: LucideScrollText,
    segment: "logs",
    routeName: "admin.logs",
    titleKey: "route.admin.logs",
  },
  {
    value: "upload-logs",
    labelKey: "admin.nav.uploadLogs",
    icon: LucideCloudUpload,
    segment: "upload-logs",
    routeName: "admin.uploadLogs",
    titleKey: "route.admin.uploadLogs",
  },
  {
    value: "content",
    labelKey: "admin.nav.content",
    icon: LucideFileEdit,
    segment: "content",
    routeName: "admin.content",
    titleKey: "route.admin.content",
  },
  {
    value: "sponsors",
    labelKey: "admin.nav.sponsors",
    icon: LucideHeartHandshake,
    segment: "sponsors",
    routeName: "admin.sponsors",
    titleKey: "route.admin.sponsors",
  },
  {
    value: "config",
    labelKey: "admin.nav.config",
    icon: LucideCog,
    segment: "config",
    routeName: "admin.config",
    titleKey: "route.admin.config",
    superOnly: true,
  },
  {
    value: "game-bindings",
    labelKey: "admin.nav.gameBindings",
    icon: LucideGamepad2,
    segment: "game-bindings",
    routeName: "admin.gameBindings",
    titleKey: "route.admin.gameBindings",
  },
  {
    value: "risk",
    labelKey: "admin.nav.risk",
    icon: LucideShieldAlert,
    segment: "risk",
    routeName: "admin.risk",
    titleKey: "route.admin.risk",
  },
  {
    value: "tickets",
    labelKey: "admin.nav.tickets",
    icon: LucideTicket,
    segment: "tickets",
    routeName: "admin.tickets",
    titleKey: "route.admin.tickets",
  },
]
