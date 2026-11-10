import { expect, test, type Page } from "@playwright/test"

type SponsorUser = {
  userId: string; name: string; email: string; banned: boolean
  eligible: boolean; accessOverride: string; verificationMethod: string
  afdianUserId: string | null; category: string; note: string; updatedBy: string; updatedAt: string | null
}
const BASE = "/api/admin/sponsors/toolbox-users"

// One row of GET /api/admin/sponsors, in the backend's shape (adminSponsorItem).
function sponsorRow(index: number, overrides: Record<string, unknown> = {}) {
  return {
    toolboxBound: false, id: `sponsor-${String(index).padStart(2, "0")}`, name: `Fan ${index}`, avatar: "", planName: "", message: "",
    source: "afdian", category: "former", isActive: false, afdianSyncDisabled: false, afdianMonths: 0, durationMigrationPending: false,
    createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", ...overrides,
  }
}

async function setup(page: Page, options: { listFail?: boolean; saveFail?: boolean; sponsors?: ReturnType<typeof sponsorRow>[] } = {}) {
  const orderUser: SponsorUser = { userId: "order-user", name: "订单赞助用户", email: "order@example.test", banned: false, eligible: true, accessOverride: "", verificationMethod: "order", afdianUserId: "afdian-verified-user", category: "former", note: "", updatedBy: "", updatedAt: null }
  const candidate: SponsorUser = { ...orderUser, userId: "offline-user", name: "线下赞助用户", email: "offline@example.test", eligible: false, verificationMethod: "", afdianUserId: null, category: "none" }
  const users = [orderUser, candidate]
  const writes: { access: string; note: string }[] = []
  const sponsors = options.sponsors ?? []
  const sponsorWrites: { id: string; body: unknown }[] = []
  let listFail = options.listFail ?? false
  let saveFail = options.saveFail ?? false
  await page.addInitScript(() => {
    sessionStorage.setItem("user", JSON.stringify({ userId: "admin-1", name: "Admin", role: "admin", sessionToken: "test-token", tokenExpiration: 4_102_444_800 }))
    localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN" }))
  })
  await page.route("**/*", route => {
    const req = route.request()
    const url = new URL(req.url())
    if (url.host === "127.0.0.1:4173") return route.continue()
    const reply = (data: unknown, code = 200) => route.fulfill({ status: code, contentType: "application/json", body: JSON.stringify({ status: code, message: code === 200 ? "success" : "temporary failure", updatedData: data }) })
    if (url.pathname === "/api/user/admin-1/get-settings") return reply({ userId: "admin-1", name: "Admin", role: "admin" })
    if (url.pathname === "/api/admin/tickets") return reply({ items: [], total: 0 })
    if (url.pathname === "/api/admin/sponsors") {
      return reply({ boundCount: sponsors.filter(row => row.toolboxBound).length, generatedAt: "2026-11-10T00:00:00Z", items: sponsors, total: sponsors.length })
    }
    if (url.pathname.startsWith("/api/admin/sponsors/sponsor-") && req.method() === "PUT") {
      const row = sponsors.find(row => url.pathname.endsWith("/" + row.id))!
      const body = req.postDataJSON() as Record<string, unknown>
      sponsorWrites.push({ id: row.id, body })
      Object.assign(row, body)
      return reply({ sponsor: row })
    }
    if (url.pathname === BASE) {
      if (listFail) return reply(null, 503)
      const scope = url.searchParams.get("scope")
      const keyword = url.searchParams.get("q")?.toLowerCase() ?? ""
      const filtered = users.filter(user => (scope === "all" || user.eligible || user.accessOverride || user.afdianUserId) && `${user.userId} ${user.name} ${user.email}`.toLowerCase().includes(keyword))
      const page = Number(url.searchParams.get("page") || 1)
      return reply({ items: filtered.slice((page - 1) * 20, page * 20), total: filtered.length, page, pageSize: 20 })
    }
    if (url.pathname.startsWith(BASE + "/") && req.method() === "PUT") {
      const payload = req.postDataJSON() as { access: string; note: string }
      writes.push(payload)
      if (saveFail) return reply(null, 503)
      const user = users.find(user => url.pathname.endsWith("/" + user.userId))!
      user.accessOverride = payload.access === "automatic" ? "" : payload.access
      user.eligible = payload.access === "granted" || (payload.access === "automatic" && !!user.afdianUserId)
      user.note = payload.note
      user.updatedBy = "admin-1"
      user.updatedAt = "2026-10-26T08:30:00Z"
      return reply(null)
    }
    return route.abort()
  })
  return { users, candidate, orderUser, writes, sponsorWrites, recoverList: () => { listFail = false }, recoverSave: () => { saveFail = false } }
}

test.describe("Toolbox sponsor access management", () => {
  test.describe.configure({ timeout: 60_000 })

  test("searches an account and requires a note; a failed grant stays open for retry", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1050 })
    const env = await setup(page, { saveFail: true })
    await page.goto("/admin/sponsors")
    await expect(page.getByText("订单赞助用户", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "添加赞助用户", exact: true }).click()
    await page.getByRole("textbox", { name: "查找工具箱用户", exact: true }).fill("offline@example.test")
    await page.getByRole("dialog").getByRole("button", { name: "查询用户", exact: true }).click()
    await page.getByRole("button", { name: "选择用户", exact: true }).click()
    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText("线下赞助用户")
    await expect(page.getByLabel("资格设置")).toHaveValue("granted")
    await dialog.getByRole("button", { name: "保存资格" }).click()
    await expect(dialog.getByRole("alert")).toContainText("请填写操作备注")
    expect(env.writes).toHaveLength(0)
    await page.getByLabel("操作备注（必填）").fill("银行转账赞助已核对")
    await dialog.getByRole("button", { name: "保存资格" }).click()
    await expect(dialog.getByRole("alert")).toBeVisible()
    await expect(dialog).toBeVisible()
    env.recoverSave()
    await dialog.getByRole("button", { name: "保存资格" }).click()
    await expect(dialog).toHaveCount(0)
    const row = page.getByTestId("sponsor-user-offline-user")
    await expect(row).toContainText("手动认证")
    await expect(row).toContainText("银行转账赞助已核对")
    await page.screenshot({ path: testInfo.outputPath("admin-toolbox-sponsors-desktop.png"), fullPage: true, animations: "disabled" })
    expect(env.candidate.afdianUserId).toBeNull()
    expect(env.writes).toEqual([{ access: "granted", note: "银行转账赞助已核对" }, { access: "granted", note: "银行转账赞助已核对" }])
  })

  test("revokes a verified order user and restores automatic access", async ({ page }) => {
    const env = await setup(page)
    await page.goto("/admin/sponsors")
    const row = page.getByTestId("sponsor-user-order-user")
    for (const [mode, label] of [["blocked", "未启用"], ["automatic", "已认证"]]) {
      await row.getByRole("button", { name: "管理赞助资格" }).click()
      await page.getByLabel("资格设置").selectOption(mode!)
      await page.getByLabel("操作备注（必填）").fill("核对后调整资格")
      await page.getByRole("alertdialog").getByRole("button", { name: "保存资格" }).click()
      await expect(page.getByRole("alertdialog")).toHaveCount(0)
      await expect(row).toContainText(label!)
      await expect(row).toContainText("订单号验证")
    }
    expect(env.orderUser.afdianUserId).toBe("afdian-verified-user")
    expect(env.writes.map(write => write.access)).toEqual(["blocked", "automatic"])
  })

  test("shows read failures with a working retry, search and pagination", async ({ page }) => {
    const env = await setup(page, { listFail: true })
    for (let i = 0; i < 21; i++) env.users.push({ ...env.orderUser, userId: `paged-${i.toString().padStart(2, "0")}`, name: `Paged Fan ${i}` })
    await page.goto("/admin/sponsors")
    const panel = page.getByTestId("toolbox-sponsors")
    await expect(panel.getByRole("alert")).toBeVisible()
    env.recoverList()
    await panel.getByRole("button", { name: /重试/ }).click()
    await expect(panel).toContainText("共 22 条")
    await panel.getByRole("button", { name: "下一页" }).click()
    await expect(page.getByTestId("sponsor-user-paged-20")).toBeVisible()
    await panel.getByRole("textbox", { name: "查询用户", exact: true }).fill("Paged Fan 20")
    await panel.getByRole("button", { name: "查询用户", exact: true }).click()
    await expect(panel).toContainText("共 1 条")
    // One page of results needs no pager.
    await expect(panel.getByRole("button", { name: "上一页" })).toHaveCount(0)
  })

  test("mobile manager and editor fit long identifiers", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const env = await setup(page)
    env.orderUser.email = "very-long-sponsor-address-for-layout-check@example.test"
    env.orderUser.afdianUserId = "a".repeat(128)
    env.orderUser.note = "历史赞助已核对，永久开放头像框。"
    env.orderUser.updatedBy = "admin-1"
    env.orderUser.updatedAt = "2026-10-26T08:30:00Z"
    await page.goto("/admin/sponsors")
    await expect(page.getByTestId("sponsor-user-order-user")).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath("admin-toolbox-sponsors-mobile.png"), fullPage: true, animations: "disabled" })
    await page.getByRole("button", { name: "管理赞助资格", exact: true }).click()
    await expect(page.getByRole("alertdialog")).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath("admin-toolbox-sponsors-editor.png"), fullPage: true, animations: "disabled" })
  })
})

// The sponsor wall itself: GET /api/admin/sponsors sends the whole list at
// once, so the stat panel counts all of it while the table below is searched,
// filtered and paged in the browser.
test.describe("Sponsor list overview", () => {
  test.describe.configure({ timeout: 60_000 })

  const soon = new Date(Date.now() + 3 * 86_400_000).toISOString()
  const far = new Date(Date.now() + 200 * 86_400_000).toISOString()
  // 23 sponsors: 9 current (2 ending this week, 3 on the "Gold" plan), 14 former, 4 linked, 30 + 12.5 recorded.
  const list = () => Array.from({ length: 23 }, (_, i) => sponsorRow(i, {
    ...(i < 9 ? { category: "current", isActive: true, planExpiresAt: i < 2 ? soon : far } : {}),
    ...(i < 3 ? { planName: "Gold" } : {}),
    ...(i < 4 ? { toolboxBound: true } : {}),
    ...(i === 0 ? { totalAmount: 30, name: "Miku Fan" } : {}),
    ...(i === 1 ? { totalAmount: 12.5 } : {}),
    ...(i === 22 ? { source: "manual", name: "线下赞助者" } : {}),
  }))

  test("counts the whole list in the stat panel and breakdowns", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1050 })
    await setup(page, { sponsors: list() })
    await page.goto("/admin/sponsors")
    const stats = page.getByTestId("sponsor-stats")
    const tile = (label: string) => stats.locator("[data-slot=admin-stat-tile]").filter({ hasText: label })
    // The numbers count up; the assertions wait for them to settle.
    await expect(tile("赞助者总数").locator("[data-slot=admin-animated-number]")).toHaveText("23")
    await expect(tile("当前赞助").first().locator("[data-slot=admin-animated-number]")).toHaveText("9")
    await expect(tile("当前赞助").first()).toContainText("曾经赞助 14")
    await expect(tile("已绑定工具箱").locator("[data-slot=admin-animated-number]")).toHaveText("4")
    await expect(tile("记录金额合计").locator("[data-slot=admin-animated-number]")).toHaveText("¥42.5")
    await expect(tile("记录金额合计")).toContainText("2 位有金额记录")
    const panel = (title: string) => stats.locator("[data-slot=admin-panel]").filter({ hasText: title })
    await expect(panel("来源")).toContainText("爱发电")
    await expect(panel("来源")).toContainText("22 · 96%")
    await expect(panel("来源")).toContainText("手动录入")
    await expect(panel("赞助档位")).toContainText("Gold")
    await expect(panel("赞助档位")).toContainText("未设置档位")
    await expect(panel("当前赞助到期").locator("li").filter({ hasText: "7 天内" })).toContainText("2 · 22%")
    await expect(panel("当前赞助到期").locator("li").filter({ hasText: "90 天以上" })).toContainText("7 · 78%")
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath("admin-sponsors-overview.png"), fullPage: true, animations: "disabled" })
  })

  test("searches, filters and pages the table without changing the figures", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1050 })
    await setup(page, { sponsors: list() })
    await page.goto("/admin/sponsors")
    const table = page.getByTestId("sponsor-list")
    const rows = table.locator("[data-sponsor]")
    await expect(rows).toHaveCount(20)
    await expect(table).toContainText("共 23 位")
    await table.getByRole("button", { name: "下一页" }).click()
    await expect(rows).toHaveCount(3)

    await table.getByRole("button", { name: /^当前赞助/ }).click()
    await expect(rows).toHaveCount(9)
    await expect(table).toContainText("9 / 23 位")
    await table.getByRole("searchbox", { name: "搜索赞助者" }).fill("miku")
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText("Miku Fan")
    await expect(rows.first()).toContainText("¥30")
    await table.getByRole("searchbox", { name: "搜索赞助者" }).fill("no such sponsor")
    await expect(table).toContainText("没有符合条件的赞助者")
    await table.getByRole("button", { name: "清除筛选" }).click()
    await expect(rows).toHaveCount(20)
    // The panel above still describes all 23.
    await expect(page.getByTestId("sponsor-stats").locator("[data-slot=admin-stat-tile]").first().locator("[data-slot=admin-animated-number]")).toHaveText("23")
  })

  test("the row switch confirms before it protects a profile from Afdian updates", async ({ page }) => {
    const env = await setup(page, { sponsors: list() })
    await page.goto("/admin/sponsors")
    const row = page.locator("[data-sponsor=sponsor-00]")
    const toggle = row.getByRole("switch")
    await expect(toggle).toHaveAttribute("aria-checked", "false")
    await toggle.click()
    const confirm = page.getByRole("alertdialog", { name: "停止从爱发电更新？" })
    await expect(confirm).toContainText("Miku Fan")
    expect(env.sponsorWrites).toHaveLength(0)
    await confirm.getByRole("button", { name: "停止更新" }).click()
    await expect(confirm).toHaveCount(0)
    await expect(toggle).toHaveAttribute("aria-checked", "true")
    await expect(page.getByTestId("sponsor-list")).toContainText("1 位手动保护资料")
    expect(env.sponsorWrites).toEqual([{ id: "sponsor-00", body: { afdianSyncDisabled: true } }])
  })

  test("mobile folds the table rows without sideways scrolling", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const sponsors = list()
    sponsors[0] = sponsorRow(0, { ...sponsors[0], name: "a-very-long-display-name-".repeat(4), planName: "一个很长很长很长很长很长很长很长很长的档位名称" })
    await setup(page, { sponsors })
    await page.goto("/admin/sponsors")
    await expect(page.locator("[data-sponsor]").first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath("admin-sponsors-mobile.png"), fullPage: true, animations: "disabled" })
  })
})
