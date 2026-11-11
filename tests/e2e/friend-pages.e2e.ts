import { expect, test, type Page } from "@playwright/test"

// The public friend links and recommended groups pages, against a mocked
// /api/misc backend. Images are not served: the tiles must hold up without
// their avatar and banner.
const APP_HOST = "127.0.0.1:4173"

const LINKS = [
  { id: 2, name: "Sekai Viewer", description: "查卡、查活动等相关功能", avatar: "https://img.example/a.png", url: "https://sekai.best", tags: ["Viewer", "工具类"] },
  { id: 3, name: "A site with a very long unbroken name ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ", description: "", avatar: "", url: "https://www.example.org/some/path", tags: [] },
]

const GROUPS = [
  {
    group: "HarukiBot附属群",
    groupList: [
      { name: "Haruki 游乐园①", avatar: "https://img.example/a.png", bg: "https://img.example/bg.png", groupInfo: "QQ 730020933", detail: "这是HarukiBot主群1群" },
      { name: "没有群号的群", avatar: "", bg: "", groupInfo: "Discord", detail: "A long description without breaks ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ", url: "https://discord.example/invite" },
    ],
  },
  { group: "空分组", groupList: [] },
  { group: "星云友链", groupList: [{ name: "MMJ推们的摸摸豪斯", avatar: "", bg: "", groupInfo: "QQ 954385726", detail: "" }] },
]

type Reply = { status: number; body: unknown }

async function mockMisc(page: Page, replies: { links?: Reply[]; groups?: Reply[] } = {}) {
  await page.addInitScript(() => localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN" })))
  const queues = { friend_links: [...(replies.links ?? [])], friend_groups: [...(replies.groups ?? [])] }
  const defaults: Record<string, unknown> = { friend_links: LINKS, friend_groups: GROUPS }
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    if (url.host === APP_HOST) return route.continue()
    const name = url.pathname.replace("/api/misc/", "") as keyof typeof queues
    if (name in queues) {
      const queued = queues[name].shift()
      const reply = queued ?? { status: 200, body: { status: 200, message: "ok", updatedData: defaults[name] } }
      return route.fulfill({ status: reply.status, contentType: "application/json", body: JSON.stringify(reply.body) })
    }
    return route.abort()
  })
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
}

test("friend links are one link per site with its host, description and tags", async ({ page }) => {
  await mockMisc(page)
  await page.goto("/friend-links")

  const cards = page.locator("[data-slot='friend-link-card']")
  await expect(cards).toHaveCount(2)
  const first = cards.nth(0)
  await expect(first).toHaveAttribute("href", "https://sekai.best/")
  await expect(first).toHaveAttribute("target", "_blank")
  await expect(first).toHaveAttribute("rel", /noopener/)
  await expect(first).toContainText("Sekai Viewer")
  await expect(first).toContainText("sekai.best")
  await expect(first).toContainText("查卡、查活动等相关功能")
  await expect(first.getByRole("listitem")).toHaveText(["Viewer", "工具类"])
  // The leading "www." is dropped from the host line.
  await expect(cards.nth(1)).toContainText("example.org")
  await expect(cards.nth(1).getByRole("listitem")).toHaveCount(0)

  await page.setViewportSize({ width: 320, height: 700 })
  await expectNoHorizontalOverflow(page)
})

test("recommended groups list each category with its count and copy the group number", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await mockMisc(page)
  await page.goto("/friend-groups")

  // The empty category is left out.
  const sections = page.getByTestId("friend-group-section")
  await expect(sections).toHaveCount(2)
  await expect(sections.nth(0).getByRole("heading", { level: 2 })).toContainText("HarukiBot附属群")
  await expect(sections.nth(0).getByRole("heading", { level: 2 })).toContainText(/2 个群|2 groups/)

  const cards = sections.nth(0).locator("[data-slot='friend-group-card']")
  await expect(cards).toHaveCount(2)
  // Everything is on the tile at rest: nothing waits for a hover.
  await expect(cards.nth(0)).toContainText("QQ 730020933")
  await expect(cards.nth(0).getByText("这是HarukiBot主群1群")).toBeVisible()

  await cards.nth(0).getByTestId("friend-group-copy").click()
  await expect(page.getByText(/已复制群号 730020933|Copied group number 730020933/)).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("730020933")

  // Info without a group number offers no copy button; a group with a link names it as one.
  await expect(cards.nth(1).getByTestId("friend-group-copy")).toHaveCount(0)
  await expect(cards.nth(1).getByRole("link", { name: /没有群号的群/ })).toHaveAttribute("href", "https://discord.example/invite")

  await page.setViewportSize({ width: 320, height: 700 })
  await expectNoHorizontalOverflow(page)
})

test("a failed load offers a retry and an empty list says so", async ({ page }) => {
  await mockMisc(page, {
    // A GET is retried once on a 5xx, so the error state needs two failures.
    groups: [{ status: 500, body: { status: 500, message: "boom" } }, { status: 500, body: { status: 500, message: "boom" } }],
    links: [{ status: 200, body: { status: 200, message: "ok", updatedData: [] } }],
  })
  await page.goto("/friend-groups")
  await expect(page.getByTestId("friend-group-section")).toHaveCount(0)
  await page.getByRole("button", { name: /重试|Retry/ }).click()
  await expect(page.getByTestId("friend-group-section")).toHaveCount(2)

  await page.goto("/friend-links")
  await expect(page.getByText(/暂无友情链接|No friend links yet/)).toBeVisible()
  await expect(page.locator("[data-slot='friend-link-card']")).toHaveCount(0)
})
