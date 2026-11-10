import { expect, test, type Page } from "@playwright/test"

const targetId = "1234500001"

// The detail page loads every section with the user, and the list reads the
// site-wide counters from the dashboard statistics; both are mocked so the
// pages under test look like they do against the backend.
async function setup(page: Page, options: { failGameBindings?: boolean } = {}) {
  const writes: unknown[] = []
  const searches: string[] = []
  let deleted = false
  let failDelete = true
  let failGameBindings = options.failGameBindings === true
  await page.addInitScript(() => {
    sessionStorage.setItem("user", JSON.stringify({ userId: "admin-1", name: "Admin", role: "super_admin", sessionToken: "test-token", tokenExpiration: 4_102_444_800 }))
    localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN" }))
  })
  await page.route("**/*", route => {
    const req = route.request()
    const url = new URL(req.url())
    if (url.host === "127.0.0.1:4173") return route.continue()
    const reply = (data: unknown, status = 200, message = "success") => route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ status, message, updatedData: data }) })
    if (url.pathname === "/api/user/admin-1/get-settings") return reply({ userId: "admin-1", name: "Admin", role: "super_admin" })
    if (url.pathname === "/api/admin/tickets") return reply({ items: [], total: 0 })
    if (url.pathname === "/api/admin/statistics/dashboard") {
      return reply({
        generatedAt: "2026-11-10T00:00:00Z",
        users: { total: 51234, banned: 12, admin: 3, superAdmin: 1 },
        bindings: { total: 0, verified: 0, byServer: [] },
        uploads: { windowHours: 24, total: 0, success: 0, failed: 0, totalAllTime: 0, byMethod: [], byDataType: [], byMethodAndDataType: [] },
      })
    }
    if (url.pathname === "/api/admin/statistics/timeseries") {
      const points = Array.from({ length: 14 }, (_, i) => ({ time: `2026-10-${String(28 + i).padStart(2, "0")}T00:00:00Z`, registrations: i + 1, uploads: 0, uploadSuccesses: 0, uploadFailures: 0 }))
      return reply({ generatedAt: "2026-11-10T00:00:00Z", from: points[0]!.time, to: points[13]!.time, bucket: "day", points })
    }
    if (url.pathname === "/api/admin/users") {
      searches.push(url.searchParams.get("q") ?? "")
      const items = deleted ? [] : [{ userId: targetId, name: "社交绑定旧账号", email: "old@example.test", role: "user", banned: false, createdAt: "2026-01-01T00:00:00Z" }]
      return reply({ items, total: items.length, page: 1, pageSize: 20, totalPages: 1, hasMore: false })
    }
    if (url.pathname === `/api/admin/users/${targetId}/detail`) {
      return deleted ? reply(null, 404, "user not found") : reply({
        userData: {
          userId: targetId, name: "社交绑定旧账号", role: "user", emailInfo: { email: "old@example.test", verified: true },
          gameAccountBindings: [{ server: "jp", userId: "7412589630147852", verified: true, isDefault: true }],
          authorizeSocialPlatformInfo: [],
        },
        banned: false,
        createdAt: "2026-01-01T00:00:00Z",
        activitySummary: { windowHours: 24, from: "2026-11-09T00:00:00Z", to: "2026-11-10T00:00:00Z", systemLogTotal: 7, uploadLogTotal: 8, uploadSuccess: 6, uploadFailure: 2, lastSystemLog: "2026-11-09T22:00:00Z" },
      })
    }
    if (url.pathname === `/api/admin/users/${targetId}/activity`) {
      return reply({
        generatedAt: "2026-11-10T00:00:00Z", userId: targetId, from: "2026-11-03T00:00:00Z", to: "2026-11-10T00:00:00Z", systemLogLimit: 50, uploadLogLimit: 50,
        summary: { systemLogTotal: 1, uploadLogTotal: 0, uploadSuccess: 0, uploadFailure: 0 },
        systemLogs: [{ id: 1, eventTime: "2026-11-09T22:00:00Z", action: "user.login", result: "success", actorUserId: targetId, method: "POST", path: "/api/user/login" }],
        uploadLogs: [],
      })
    }
    if (url.pathname === `/api/admin/users/${targetId}/oauth-authorizations`) return reply({ total: 0, items: [] })
    if (url.pathname === `/api/admin/users/${targetId}/game-account-bindings`) {
      if (failGameBindings) return reply(null, 500, "failed to query bindings")
      return reply({ total: 2, items: [{ server: "jp", userId: "7412589630147852", verified: true, isDefault: true }, { server: "cn", userId: "1002003004", verified: false, isDefault: false }] })
    }
    if (url.pathname === `/api/admin/users/${targetId}/social-platform`) return reply({ exists: false })
    if (url.pathname === `/api/admin/users/${targetId}/authorized-social-platforms`) return reply({ total: 0, items: [] })
    if (url.pathname === `/api/admin/users/${targetId}/permanent` && req.method() === "DELETE") {
      writes.push(req.postDataJSON())
      if (failDelete) return reply(null, 503, "identity cleanup unavailable; retry deletion")
      deleted = true
      return reply({ userId: targetId, deleted: true })
    }
    return route.abort()
  })
  return { writes, searches, recover: () => { failDelete = false }, recoverGameBindings: () => { failGameBindings = false } }
}

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
}

test.describe("admin user pages", () => {
  test.describe.configure({ timeout: 60_000 })
  for (const width of [390, 1440]) {
    test(`requires the exact ID and preserves failed confirmation at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 950 })
      const env = await setup(page)
      await page.goto(`/admin/users/${targetId}`)
      await page.getByRole("button", { name: "永久删除", exact: true }).click()
      const dialog = page.getByRole("alertdialog")
      await expect(dialog).toContainText("此操作无法恢复")
      const confirm = dialog.getByRole("button", { name: "永久删除", exact: true })
      await expect(confirm).toBeDisabled()
      const input = dialog.getByLabel(`输入用户 ID ${targetId} 以确认`)
      await input.fill("wrong-id")
      await expect(confirm).toBeDisabled()
      expect(env.writes).toHaveLength(0)
      await input.fill(targetId)
      await confirm.click()
      await expect(dialog.getByRole("alert")).toBeVisible()
      await expect(dialog).toBeVisible()
      expect(env.writes).toEqual([{ confirmUserId: targetId }])
      env.recover()
      await confirm.click()
      await expect(page).toHaveURL(/\/admin\/users$/)
      await expect(page.getByText("暂无用户数据")).toBeVisible()
      expect(env.writes).toHaveLength(2)
    })
  }

  test("passes a social account search to the user list API", async ({ page }) => {
    const env = await setup(page)
    await page.goto("/admin/users")
    const search = page.getByPlaceholder("搜索用户名、邮箱、用户 ID 或社交账号…")
    await search.fill("123456789")
    await search.press("Enter")
    await expect.poll(() => env.searches.includes("123456789")).toBe(true)
    await expect(page.getByText("社交绑定旧账号", { exact: true })).toBeVisible()
    expect(env.writes).toHaveLength(0)
  })

  test("leads the list with site-wide counters and the list's own total", async ({ page }) => {
    await setup(page)
    await page.goto("/admin/users")
    const stats = page.getByTestId("admin-users-stats")
    // Site-wide, from the dashboard statistics: 51,234 accounts, 3 admins + 1 super admin, 12 banned.
    await expect(stats.locator("[data-stat=total]")).toContainText("51,234")
    await expect(stats.locator("[data-stat=staff]")).toContainText("超级管理员 1 · 管理员 3")
    await expect(stats.locator("[data-stat=banned]")).toContainText("12")
    await expect(stats.locator("[data-stat=banned]")).toContainText("<0.1%")
    // The list's total, and what it leaves out.
    await expect(stats.locator("[data-stat=list]")).toContainText("不含你自己的账号")
    await expect(stats.locator("[data-stat=list] [data-slot=admin-animated-number]")).toHaveText("1")
    // Counted from the rows on screen, and labelled so.
    await expect(page.getByTestId("admin-users-page-summary")).toContainText("本页 1 人")
  })

  for (const width of [390, 1440]) {
    test(`shows every section of a user without overflowing at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 950 })
      const env = await setup(page, { failGameBindings: true })
      await page.goto(`/admin/users/${targetId}`)
      await expect(page.getByTestId("admin-user-header")).toContainText("社交绑定旧账号")

      // A section that failed to load says so in place and can be retried on its own.
      const gameBindings = page.getByTestId("admin-user-game-bindings")
      await expect(gameBindings.getByRole("alert")).toBeVisible()
      // Until the section answers, the tile counts what the detail response listed.
      const gameTile = page.locator("[data-stat=game-bindings] [data-slot=admin-animated-number]")
      await expect(gameTile).toHaveText("1")
      env.recoverGameBindings()
      await gameBindings.getByRole("button", { name: "重试" }).click()
      await expect(gameBindings.locator("[data-binding]")).toHaveCount(2)
      await expect(gameTile).toHaveText("2")

      // The activity window of the detail response: 8 uploads, 6 of them successful.
      await expect(page.locator("[data-stat=uploads]")).toContainText("成功 6 · 失败 2")
      await expect(page.getByTestId("admin-user-activity")).toContainText("user.login")
      expect(await horizontalOverflow(page)).toBe(0)

      await page.goto("/admin/users")
      await expect(page.getByText("社交绑定旧账号", { exact: true })).toBeVisible()
      expect(await horizontalOverflow(page)).toBe(0)
    })
  }
})
