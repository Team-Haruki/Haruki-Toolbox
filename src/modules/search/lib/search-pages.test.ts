import { describe, expect, test } from "bun:test"
import { buildSearchPageSources, type SearchRouteRecord } from "./search-pages"

const TITLES: Record<string, string> = {
  "route.home": "主页",
  "route.deckRecommend": "组卡推荐",
  "route.cards.detail": "卡牌详情",
  "route.login": "登录",
  "route.oauthConsent": "授权第三方应用",
  "route.error": "身份错误",
  "route.userSettings": "账号设置",
  "route.admin.layout": "管理后台",
  "route.admin.users": "用户管理",
  "route.admin.config": "系统配置",
  "route.rankBorderDetail": "榜线详情",
}

const ROUTES: SearchRouteRecord[] = [
  { path: "/", meta: { titleKey: "route.home" } },
  { path: "/deck-recommend", meta: { titleKey: "route.deckRecommend", requiresAuth: true } as SearchRouteRecord["meta"] },
  { path: "/deck-recommend", meta: { titleKey: "route.deckRecommend" } },
  { path: "/cards/:cardId", meta: { titleKey: "route.cards.detail" } },
  { path: "/:pathMatch(.*)*", meta: { titleKey: "route.home" } },
  { path: "/training", redirect: "/training/challenge", meta: { titleKey: "route.home" } },
  { path: "/user/login", meta: { titleKey: "route.login", guestOnly: true } },
  { path: "/oauth2/consent", meta: { titleKey: "route.oauthConsent" } },
  { path: "/user/error", meta: { titleKey: "route.error" } },
  { path: "/rank-border/detail", meta: { titleKey: "route.rankBorderDetail" } },
  { path: "/user/settings", meta: { titleKey: "route.userSettings" } },
  // The router's own record for `alias: "/deck_recommend"`.
  { path: "/deck_recommend", aliasOf: { path: "/deck-recommend" }, meta: { titleKey: "route.deckRecommend" } },
  { path: "/untitled" },
  { path: "/unknown-title", meta: { titleKey: "route.missing" } },
  { path: "/admin", meta: { titleKey: "route.admin.layout", requiresAdmin: true } },
  { path: "/admin/users", meta: { titleKey: "route.admin.users", requiresAdmin: true } },
  { path: "/admin/config", meta: { titleKey: "route.admin.config", requiresAdmin: true, requiresSuperAdmin: true } },
]

const translate = (key: string) => TITLES[key] ?? key

function paths(context: { isAdmin?: boolean; isSuperAdmin?: boolean } = {}) {
  return buildSearchPageSources(ROUTES, {
    isAdmin: context.isAdmin ?? false,
    isSuperAdmin: context.isSuperAdmin ?? false,
    translate,
  }).map((page) => page.path)
}

describe("buildSearchPageSources", () => {
  test("lists pages one can go to by name, once each", () => {
    expect(paths()).toEqual(["/", "/deck-recommend", "/user/settings"])
  })

  test("admin pages are for admins, and the super-admin page for super admins", () => {
    expect(paths({ isAdmin: true })).toEqual(["/", "/deck-recommend", "/user/settings", "/admin/users"])
    expect(paths({ isAdmin: true, isSuperAdmin: true })).toEqual([
      "/",
      "/deck-recommend",
      "/user/settings",
      "/admin/users",
      "/admin/config",
    ])
  })

  test("carries the translated title and the sidebar section", () => {
    const pages = buildSearchPageSources(ROUTES, {
      isAdmin: false,
      isSuperAdmin: false,
      translate,
      sectionOf: (path) => (path === "/deck-recommend" ? "活动与榜线工具" : null),
    })
    expect(pages[1]).toEqual({ path: "/deck-recommend", title: "组卡推荐", section: "活动与榜线工具" })
    expect(pages[0].section).toBeNull()
  })
})
