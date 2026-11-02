import { expect, test, type Page } from "@playwright/test"

const targetId = "1234500001"

async function setup(page: Page) {
  const writes: unknown[] = []
  const searches: string[] = []
  let deleted = false
  let failDelete = true
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
    if (url.pathname === "/api/admin/users") {
      searches.push(url.searchParams.get("q") ?? "")
      const items = deleted ? [] : [{ userId: targetId, name: "社交绑定旧账号", email: "old@example.test", role: "user", banned: false, createdAt: "2026-01-01T00:00:00Z" }]
      return reply({ items, total: items.length, page: 1, pageSize: 20, totalPages: 1, hasMore: false })
    }
    if (url.pathname === `/api/admin/users/${targetId}/detail`) {
      return deleted ? reply(null, 404, "user not found") : reply({ userData: { userId: targetId, name: "社交绑定旧账号", role: "user", emailInfo: { email: "old@example.test", verified: true } }, banned: false, createdAt: "2026-01-01T00:00:00Z" })
    }
    if (url.pathname === `/api/admin/users/${targetId}/permanent` && req.method() === "DELETE") {
      writes.push(req.postDataJSON())
      if (failDelete) return reply(null, 503, "identity cleanup unavailable; retry deletion")
      deleted = true
      return reply({ userId: targetId, deleted: true })
    }
    return route.abort()
  })
  return { writes, searches, recover: () => { failDelete = false } }
}

test.describe("admin account deletion", () => {
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
})
