import { expect, test, type Page, type Route } from "@playwright/test"

// The public sponsor wall and the admin sponsor manager against a mocked
// backend. The mock answers like the backend: the category is decided there
// (current / former / one_time) and the admin detail carries the Afdian part,
// the manual entries and the effective expiry.
const APP_HOST = "127.0.0.1:4173"
const ADMIN_USER_ID = "admin-1"
const DAY_MS = 24 * 60 * 60 * 1000

type ApiCall = { method: string, path: string, body: unknown }

function reply(route: Route, updatedData: unknown) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ status: 200, message: "success", updatedData }),
  })
}

const publicSupporters = [
  { id: "afdian_current", name: "Current Fan", planName: "支持一下", source: "afdian", category: "current", isActive: true, planExpiresAt: "2099-01-01T00:00:00Z", supportCount: 1 },
  // A lapsed plan the old wall listed as one-time because of its stored label.
  { id: "afdian_lapsed", name: "Lapsed Fan", planName: "支持一下", source: "afdian", category: "former", isActive: false, planExpiresAt: "2026-01-01T00:00:00Z", supportCount: 1 },
  { id: "afdian_shop", name: "Shop Fan", planName: "一次性赞助", source: "afdian", category: "one_time", isActive: false, supportCount: 1 },
]

test.describe("public sponsor wall", () => {
  test("sorts supporters into the backend's categories", async ({ page }) => {
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url())
      if (url.host === APP_HOST) return route.continue()
      if (url.pathname === "/api/misc/sponsors") {
        return reply(route, {
          summary: { supporterCount: 3, activeCount: 1, pastCount: 1, oneTimeCount: 1, generatedAt: "2026-10-10T00:00:00Z" },
          supporters: publicSupporters,
        })
      }
      return route.abort()
    })
    await page.goto("/sponsors")

    const section = (title: RegExp) => page.locator("div.space-y-3").filter({ has: page.getByRole("heading", { level: 3, name: title }) })
    await expect(section(/当前赞助|Current sponsors/)).toContainText("Current Fan", { timeout: 30_000 })
    await expect(section(/曾经赞助|Past sponsors/)).toContainText("Lapsed Fan")
    await expect(section(/一次性赞助|One-time support/)).toContainText("Shop Fan")
    await expect(section(/一次性赞助|One-time support/)).not.toContainText("Lapsed Fan")
  })
})

type MockEntry = {
  id: number
  amount: number
  unit: "day" | "month"
  startsAt: string
  note: string
  origin: "admin" | "migration"
  createdBy: string
  createdAt: string
  updatedBy?: string
  updatedAt?: string
}

function createAdminMock() {
  const afdianEnd = "2026-09-01T00:00:00.000Z"
  const sponsor = {
    id: "afdian_mixed",
    name: "Mixed Fan",
    avatar: "",
    planName: "支持一下",
    message: "",
    source: "afdian",
    category: "current",
    isActive: true,
    afdianSyncDisabled: false,
    totalAmount: 15,
    month: 1,
    paidAt: "2026-07-01T00:00:00Z",
    planExpiresAt: "",
    afdianExpiresAt: afdianEnd,
    afdianMonths: 2,
    durationMigrationPending: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
  }
  const entries: MockEntry[] = [
    { id: 1, amount: 60, unit: "day", startsAt: afdianEnd, note: "迁移自旧版手动调整", origin: "migration", createdBy: "system:migration", createdAt: "2026-10-10T00:00:00Z" },
  ]
  let nextId = 2

  function effective() {
    let end = Date.parse(afdianEnd)
    for (const entry of entries) {
      end = Math.max(end, Date.parse(entry.startsAt)) + entry.amount * (entry.unit === "month" ? 31 : 1) * DAY_MS
    }
    return new Date(end).toISOString()
  }

  function detail() {
    sponsor.planExpiresAt = effective()
    return {
      sponsor,
      afdian: {
        expiresAt: afdianEnd,
        months: 2,
        orders: [
          { outTradeNo: "o2", planId: "", planTitle: "", productType: 0, month: 1, kind: "duration", totalAmount: 5, paidAt: "2026-07-01T00:00:00Z" },
          { outTradeNo: "o1", planId: "plan", planTitle: "支持一下", productType: 0, month: 1, kind: "duration", totalAmount: 5, paidAt: "2026-06-01T00:00:00Z" },
          { outTradeNo: "o0", planId: "item", planTitle: "周边", productType: 1, month: 1, kind: "one_time", totalAmount: 5, paidAt: "2026-05-01T00:00:00Z" },
        ],
      },
      manualDurations: entries,
      effectiveExpiresAt: sponsor.planExpiresAt,
    }
  }

  function add(body: { amount: number, unit: "day" | "month", note: string, startsAt?: string }) {
    entries.push({ id: nextId++, amount: body.amount, unit: body.unit, note: body.note, startsAt: body.startsAt ?? "2026-10-10T00:00:00Z", origin: "admin", createdBy: ADMIN_USER_ID, createdAt: "2026-10-10T00:00:00Z" })
  }

  function remove(id: number) {
    const index = entries.findIndex((entry) => entry.id === id)
    if (index >= 0) entries.splice(index, 1)
  }

  return { sponsor, detail, add, remove }
}

async function openAdminSponsors(page: Page) {
  const mock = createAdminMock()
  const calls: ApiCall[] = []
  await page.addInitScript((userId) => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Admin",
      userId,
      role: "admin",
      sessionToken: "test-token",
      tokenExpiration: 4_102_444_800,
    }))
  }, ADMIN_USER_ID)
  await page.route("**/*", (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.host === APP_HOST) return route.continue()
    if (url.pathname === `/api/user/${ADMIN_USER_ID}/get-settings`) {
      return reply(route, { userId: ADMIN_USER_ID, name: "Admin", role: "admin" })
    }
    if (url.pathname === "/api/admin/tickets") {
      return reply(route, { items: [], total: 0 })
    }
    if (!url.pathname.startsWith("/api/admin/sponsors")) return route.abort()
    const call = { method: request.method(), path: url.pathname, body: request.postDataJSON() }
    calls.push(call)

    if (call.path === "/api/admin/sponsors" && call.method === "GET") {
      mock.detail()
      return reply(route, { generatedAt: "2026-10-10T00:00:00Z", total: 1, items: [mock.sponsor] })
    }
    if (call.path === "/api/admin/sponsors/afdian_mixed" && call.method === "GET") {
      return reply(route, mock.detail())
    }
    if (call.path === "/api/admin/sponsors/afdian_mixed/manual-durations" && call.method === "POST") {
      mock.add(call.body as Parameters<typeof mock.add>[0])
      return reply(route, mock.detail())
    }
    const entry = call.path.match(/^\/api\/admin\/sponsors\/afdian_mixed\/manual-durations\/(\d+)$/)
    if (entry && call.method === "DELETE") {
      mock.remove(Number(entry[1]))
      return reply(route, mock.detail())
    }
    return route.abort()
  })
  await page.goto("/admin/sponsors")
  return calls
}

test.describe("admin sponsor durations", () => {
  test.describe.configure({ timeout: 60_000 })

  test("shows the Afdian part, the manual entries and the effective expiry", async ({ page }) => {
    const calls = await openAdminSponsors(page)
    const row = page.getByRole("row").filter({ hasText: "Mixed Fan" })
    await expect(row).toContainText(/当前赞助|Current/, { timeout: 30_000 })

    await row.getByRole("button", { name: /编辑资料|Edit profile/ }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toContainText(/爱发电订单|Afdian orders/)
    await expect(dialog).toContainText(/自选方案|Custom plan/)
    await expect(dialog).toContainText(/一次性|One-time/)
    await expect(dialog).toContainText("迁移自旧版手动调整")
    // The expiry is no longer an editable field.
    await expect(dialog.getByLabel(/赞助到期时间|Support expires at/)).toHaveCount(0)

    await dialog.getByRole("button", { name: /添加手动时长|Add manual time/ }).click()
    await dialog.getByLabel(/^(数量|Amount)$/).fill("1")
    await dialog.getByLabel(/备注|Note/).fill("  微信转账 30 元  ")
    await dialog.locator("form").getByRole("button", { name: /添加手动时长|Add manual time/ }).click()
    await expect(dialog).toContainText("微信转账 30 元")
    await expect(dialog).toContainText(/2 条记录|2 entries/)

    expect(calls.filter((call) => call.method === "POST")).toEqual([
      { method: "POST", path: "/api/admin/sponsors/afdian_mixed/manual-durations", body: { amount: 1, unit: "month", note: "微信转账 30 元" } },
    ])
  })

  test("deletes a manual entry after confirmation", async ({ page }) => {
    const calls = await openAdminSponsors(page)
    const row = page.getByRole("row").filter({ hasText: "Mixed Fan" })
    await expect(row).toBeVisible({ timeout: 30_000 })
    await row.getByRole("button", { name: /编辑资料|Edit profile/ }).click()
    const dialog = page.getByRole("dialog").filter({ hasText: /赞助时长|Sponsorship time/ })
    await expect(dialog).toContainText("迁移自旧版手动调整")

    await dialog.getByRole("button", { name: /^(删除|Delete)$/ }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: /^(删除|Delete)$/ }).click()
    await expect(dialog).toContainText(/还没有手动时长|No manual time yet/)
    expect(calls.filter((call) => call.method === "DELETE").map((call) => call.path)).toEqual([
      "/api/admin/sponsors/afdian_mixed/manual-durations/1",
    ])
  })
})
