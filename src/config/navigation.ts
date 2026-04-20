import type { Component } from "vue"
import {
  LucideArrowDownToLine,
  LucideCalculator,
  LucideCloudUpload,
  LucideCog,
  LucideFileEdit,
  LucideGamepad2,
  LucideInfo,
  LucideKeyRound,
  LucideLayoutDashboard,
  LucideMap,
  LucideNavigation,
  LucideScrollText,
  LucideShieldAlert,
  LucideTicket,
  LucideUsers,
  LucideWebhook,
  LucideBot,
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
    titleKey: "navigation.groups.recommendAndAbout",
    icon: LucideNavigation,
    items: [
      { titleKey: "navigation.items.friendGroups", icon: LucideMap, url: "/friend-groups" },
      { titleKey: "navigation.items.friendLinks", icon: LucideMap, url: "/friend-links" },
      { titleKey: "navigation.items.about", icon: LucideInfo, url: "/about" },
    ],
  },
  {
    titleKey: "navigation.groups.tools",
    icon: LucideWrench,
    items: [
      { titleKey: "navigation.items.ptCalculator", icon: LucideCalculator, url: "/pt-calculator" },
      { titleKey: "navigation.items.uploadData", icon: LucideCloudUpload, url: "/upload-data" },
      { titleKey: "navigation.items.iosModules", icon: LucideArrowDownToLine, url: "/ios-modules" },
      { titleKey: "navigation.items.botNeoRegistration", icon: LucideBot, url: "/haruki-bot-neo" },
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
