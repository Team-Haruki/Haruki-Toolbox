import { expect, test, type Page } from "@playwright/test"

// The content page (friend links and recommended group chats) against a
// mocked backend. Both lists come from the backend in one piece
// (GET /api/admin/content/friend-links and /friend-groups), so the stat tiles
// and the breakdowns count everything; edits go through the dialogs.
const APP_HOST = "127.0.0.1:4173"
const BASE = "/api/admin/content"

type Link = { id: number; name: string; description: string; avatar: string; url: string; tags: string[]; sortOrder: number }
type Item = { id: number; name: string; avatar?: string; bg?: string; groupInfo: string; detail: string; sortOrder: number }
type Group = { id: number; group: string; sortOrder: number; groupList: Item[] }

type ApiCall = { method: string; path: string; body: unknown }

async function setup(page: Page, options: { failLinks?: boolean; empty?: boolean } = {}) {
  const links: Link[] = options.empty ? [] : [
    { id: 1, name: "Haruki 文档站", description: "使用文档", avatar: "", url: "https://docs.example.test/guide", tags: ["文档", "官方"], sortOrder: 1 },
    { id: 2, name: "某位朋友的博客", description: "", avatar: "", url: "https://blog.a-really-long-subdomain-for-wrapping-checks.example.test/posts/2026/why-i-like-rhythm-games/", tags: ["博客"], sortOrder: 2 },
    { id: 3, name: "另一位朋友", description: "摄影", avatar: "", url: "https://friend.example.test/", tags: ["博客", "摄影"], sortOrder: 3 },
    { id: 4, name: "无标签站点", description: "", avatar: "", url: "https://untagged.example.test/", tags: [], sortOrder: 9 },
  ]
  const groups: Group[] = options.empty ? [] : [
    { id: 1, group: "官方交流群", sortOrder: 1, groupList: [
      { id: 11, name: "工具箱 1 群", bg: "https://bg.example.test/1.jpg", groupInfo: "QQ 群 · 1987 人", detail: "综合交流", sortOrder: 1 },
      { id: 12, name: "工具箱 2 群", groupInfo: "QQ 群", detail: "", sortOrder: 2 },
      { id: 13, name: "一个名字特别特别特别特别特别特别特别特别特别特别特别特别长的群聊项目", groupInfo: "", detail: "说明文字也很长".repeat(8), sortOrder: 3 },
    ] },
    { id: 2, group: "地区同好群", sortOrder: 2, groupList: [
      { id: 21, name: "华东同好会", groupInfo: "QQ 群", detail: "", sortOrder: 1 },
    ] },
    { id: 3, group: "尚未填充的分组", sortOrder: 5, groupList: [] },
  ]
  const calls: ApiCall[] = []
  let failLinks = options.failLinks ?? false

  await page.addInitScript(() => {
    sessionStorage.setItem("user", JSON.stringify({ userId: "admin-1", name: "Admin", role: "admin", sessionToken: "test-token", tokenExpiration: 4_102_444_800 }))
    localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN" }))
  })
  await page.route("**/*", (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.host === APP_HOST) return route.continue()
    const reply = (data: unknown, code = 200) => route.fulfill({
      status: code,
      contentType: "application/json",
      body: JSON.stringify({ status: code, message: code === 200 ? "success" : "temporary failure", updatedData: data }),
    })
    if (url.pathname === "/api/user/admin-1/get-settings") return reply({ userId: "admin-1", name: "Admin", role: "admin" })
    if (url.pathname === "/api/admin/tickets") return reply({ items: [], total: 0 })
    if (!url.pathname.startsWith(BASE)) return route.abort()

    const method = request.method()
    if (method !== "GET") calls.push({ method, path: url.pathname, body: request.postDataJSON() })
    if (url.pathname === `${BASE}/friend-links`) {
      if (failLinks) return reply(null, 503)
      return reply({ generatedAt: "2026-11-10T00:00:00Z", total: links.length, items: links })
    }
    if (url.pathname === `${BASE}/friend-groups`) {
      return reply({
        generatedAt: "2026-11-10T00:00:00Z",
        totalGroups: groups.length,
        totalItems: groups.reduce((sum, group) => sum + group.groupList.length, 0),
        items: groups,
      })
    }
    const linkId = url.pathname.match(/\/friend-links\/(\d+)$/)?.[1]
    if (linkId && method === "PUT") {
      Object.assign(links.find((link) => link.id === Number(linkId))!, request.postDataJSON())
      return reply(null)
    }
    if (linkId && method === "DELETE") {
      links.splice(links.findIndex((link) => link.id === Number(linkId)), 1)
      return reply(null)
    }
    return route.abort()
  })
  return { calls, recoverLinks: () => { failLinks = false } }
}

function tile(page: Page, label: string) {
  return page.getByTestId("content-stats").locator("[data-slot=admin-stat-tile]").filter({ hasText: label })
}

test.describe("admin content management", () => {
  test.describe.configure({ timeout: 60_000 })

  test("counts both lists in the tiles and breaks the links down by tag", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1050 })
    await setup(page)
    await page.goto("/admin/content")

    // The numbers count up; the assertions wait for them to settle.
    await expect(tile(page, "友情链接").locator("[data-slot=admin-animated-number]")).toHaveText("4", { timeout: 30_000 })
    await expect(tile(page, "友情链接")).toContainText("1 个未加标签")
    await expect(tile(page, "链接标签").locator("[data-slot=admin-animated-number]")).toHaveText("4")
    await expect(tile(page, "链接标签")).toContainText("最常用：博客（2）")
    await expect(tile(page, "群聊分组").locator("[data-slot=admin-animated-number]")).toHaveText("3")
    await expect(tile(page, "群聊分组")).toContainText("1 个空分组")
    await expect(tile(page, "群聊项目").locator("[data-slot=admin-animated-number]")).toHaveText("4")
    await expect(tile(page, "群聊项目")).toContainText("最多：官方交流群（3）")

    const list = page.getByTestId("content-links")
    await expect(list.locator("[data-link]")).toHaveCount(4)
    await expect(list.locator("[data-link='1']").getByRole("link")).toHaveAttribute("href", "https://docs.example.test/guide")
    const tags = page.getByTestId("content-link-tags")
    await expect(tags.locator("li").first()).toContainText("博客")
    await expect(tags.locator("li").first()).toContainText("2 · 50%")
    await expect(tags.locator("li")).toHaveCount(4)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath("admin-content-links.png"), fullPage: true, animations: "disabled" })

    await page.getByRole("tab", { name: /推荐群聊管理/ }).click()
    const groups = page.getByTestId("content-groups")
    await expect(groups.locator("[data-group]")).toHaveCount(3)
    await expect(groups.locator("[data-group='1']")).toContainText("排序 1 · 3 个项目")
    await expect(groups.locator("[data-group='1'] [data-item]")).toHaveCount(3)
    await expect(groups.locator("[data-group='3']")).toContainText("暂无群聊项目")
    await expect(page.getByTestId("content-group-sizes").locator("li")).toHaveCount(3)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath("admin-content-groups.png"), fullPage: true, animations: "disabled" })
  })

  test("edits a link through the dialog and validates its address", async ({ page }) => {
    const env = await setup(page)
    await page.goto("/admin/content")
    const row = page.getByTestId("content-links").locator("[data-link='3']")
    await row.getByRole("button", { name: "编辑" }).click()
    const dialog = page.getByRole("dialog", { name: "编辑友情链接" })
    await expect(dialog.getByLabel("名称")).toHaveValue("另一位朋友")
    await expect(dialog.getByLabel("标签（逗号分隔）")).toHaveValue("博客, 摄影")

    await dialog.getByLabel("链接URL").fill("not a url")
    await dialog.getByRole("button", { name: "保存" }).click()
    await expect(dialog.getByRole("alert")).toHaveText("请输入有效的 http(s) 链接")
    expect(env.calls).toHaveLength(0)

    await dialog.getByLabel("链接URL").fill("https://friend.example.test/new")
    await dialog.getByLabel("标签（逗号分隔）").fill("博客, 旅行")
    await dialog.getByRole("button", { name: "保存" }).click()
    await expect(dialog).toHaveCount(0)
    expect(env.calls).toEqual([{
      method: "PUT",
      path: `${BASE}/friend-links/3`,
      body: { name: "另一位朋友", description: "摄影", avatar: "", url: "https://friend.example.test/new", tags: ["博客", "旅行"], sortOrder: 3 },
    }])
    await expect(row).toContainText("旅行")
    await expect(tile(page, "链接标签").locator("[data-slot=admin-animated-number]")).toHaveText("4")
  })

  test("deletes a link after confirmation and updates the count", async ({ page }) => {
    const env = await setup(page)
    await page.goto("/admin/content")
    await page.getByTestId("content-links").locator("[data-link='4']").getByRole("button", { name: "删除" }).click()
    const confirm = page.getByRole("alertdialog", { name: "确认删除" })
    await expect(confirm).toContainText("无标签站点")
    await confirm.getByRole("button", { name: "确认" }).click()
    await expect(confirm).toHaveCount(0)
    expect(env.calls).toEqual([{ method: "DELETE", path: `${BASE}/friend-links/4`, body: null }])
    await expect(page.getByTestId("content-links").locator("[data-link]")).toHaveCount(3)
    await expect(tile(page, "友情链接").locator("[data-slot=admin-animated-number]")).toHaveText("3")
    await expect(tile(page, "友情链接")).toContainText("全部已加标签")
  })

  test("a failed list shows a retry instead of zeros; empty lists offer the first entry", async ({ page }) => {
    const env = await setup(page, { failLinks: true, empty: true })
    await page.goto("/admin/content")
    const list = page.getByTestId("content-links")
    await expect(list.getByRole("alert")).toBeVisible({ timeout: 30_000 })
    // A failed load is not "0 links".
    await expect(tile(page, "友情链接")).toContainText("—")
    await expect(page.getByTestId("content-link-tags")).toHaveCount(0)
    env.recoverLinks()
    await list.getByRole("button", { name: /重试/ }).click()
    await expect(list).toContainText("暂无友情链接")
    await expect(tile(page, "友情链接").locator("[data-slot=admin-animated-number]")).toHaveText("0")
    await page.getByRole("tab", { name: /推荐群聊管理/ }).click()
    await expect(page.getByTestId("content-groups")).toContainText("暂无群聊分组")
  })

  test("mobile lists wrap long names and addresses", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await setup(page)
    await page.goto("/admin/content")
    await expect(page.getByTestId("content-links").locator("[data-link]")).toHaveCount(4, { timeout: 30_000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath("admin-content-mobile-links.png"), fullPage: true, animations: "disabled" })
    await page.getByRole("tab", { name: /推荐群聊管理/ }).click()
    await expect(page.getByTestId("content-groups").locator("[data-item]")).toHaveCount(4)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.getByTestId("content-groups").locator("[data-item='13']").getByRole("button", { name: "编辑" }).click()
    await expect(page.getByRole("dialog", { name: "编辑项目" })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath("admin-content-mobile-item-dialog.png"), animations: "disabled" })
  })
})
