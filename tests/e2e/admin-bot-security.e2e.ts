import { expect, test, type Page } from "@playwright/test"

// The bot security alert page against a mocked backend that answers like
// /api/admin/bot-security does: newest first, filters as query params, a
// PATCH that returns the updated item (handledBy/handledAt set when leaving
// open, cleared on reopen) and a summary whose byKind counts open alerts.
const APP_HOST = "127.0.0.1:4173"
const BASE_PATH = "/api/admin/bot-security"
const ADMIN_USER_ID = "admin-1"

type MockAlert = Record<string, unknown> & {
  id: number
  kind: string
  status: "open" | "resolved" | "ignored"
  note: string
  alertTime: string
}

type ApiCall = {
  method: string
  path: string
  query: Record<string, string>
  body: unknown
}

function createAlerts(): MockAlert[] {
  return [
    {
      id: 42,
      kind: "auth_failed",
      botId: "30042042",
      ownerQq: "1234567890",
      sourceIp: "203.0.113.7",
      buildId: "build-7f3a",
      clientVersion: "3.2.1",
      reason: "invalid credential",
      enforced: true,
      count: 5,
      threshold: 5,
      windowSeconds: 600,
      node: "node-a",
      alertTime: "2026-09-02T09:00:00Z",
      receivedAt: "2026-09-02T09:00:00.412Z",
      status: "open",
      note: "",
      handledBy: null,
      handledAt: null,
    },
    {
      id: 41,
      kind: "rate_limited",
      botId: null,
      ownerQq: null,
      sourceIp: "198.51.100.9",
      buildId: "",
      clientVersion: "",
      reason: "",
      enforced: false,
      count: 5,
      threshold: 5,
      windowSeconds: 600,
      node: "node-b",
      alertTime: "2026-09-02T08:55:00Z",
      receivedAt: "2026-09-02T08:55:00.120Z",
      status: "open",
      note: "",
      handledBy: null,
      handledAt: null,
    },
    {
      id: 40,
      // A kind this build does not know: shown as its raw value.
      kind: "quantum_tunnel",
      botId: "30042043",
      ownerQq: null,
      sourceIp: "",
      // Client-controlled text: rendered as text, never as markup.
      buildId: `<img src=x onerror="window.__xss=1">${"b".repeat(200)}`,
      clientVersion: "9.9.9-dev",
      reason: `client sent ${"a very long reason ".repeat(20)}`,
      enforced: true,
      count: 12,
      threshold: 10,
      windowSeconds: 3_600,
      node: "node-a",
      alertTime: "2026-09-02T08:00:00Z",
      receivedAt: "2026-09-02T08:00:01.000Z",
      status: "open",
      note: "watching",
      handledBy: null,
      handledAt: null,
    },
    {
      id: 39,
      kind: "build_rejected",
      botId: "30042044",
      ownerQq: "1234567891",
      sourceIp: "203.0.113.8",
      buildId: "build-0001",
      clientVersion: "3.1.0",
      reason: "unsigned build",
      enforced: true,
      count: 1,
      threshold: 1,
      windowSeconds: 60,
      node: "node-b",
      alertTime: "2026-09-01T12:00:00Z",
      receivedAt: "2026-09-01T12:00:00.050Z",
      status: "resolved",
      note: "credential reset",
      handledBy: { userId: "1001", name: "" },
      handledAt: "2026-09-01T13:00:00Z",
    },
  ]
}

async function openBotSecurity(page: Page, options: { failingListCalls?: number } = {}) {
  const alerts = createAlerts()
  let failingListCalls = options.failingListCalls ?? 0
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
    if (url.host === APP_HOST) {
      return route.continue()
    }
    const reply = (updatedData: unknown) => route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: 200, message: "success", updatedData }),
    })
    if (url.pathname === `/api/user/${ADMIN_USER_ID}/get-settings`) {
      return reply({ userId: ADMIN_USER_ID, name: "Admin", role: "admin" })
    }
    if (url.pathname === "/api/admin/tickets") {
      return reply({ items: [], total: 0 })
    }
    if (!url.pathname.startsWith(BASE_PATH)) {
      return route.abort()
    }
    const call: ApiCall = {
      method: request.method(),
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      body: request.postDataJSON(),
    }
    calls.push(call)

    if (call.path === `${BASE_PATH}/summary`) {
      const open = alerts.filter((alert) => alert.status === "open")
      const byKind = new Map<string, number>()
      for (const alert of open) byKind.set(alert.kind, (byKind.get(alert.kind) ?? 0) + 1)
      return reply({
        open: open.length,
        byKind: [...byKind].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count || a.kind.localeCompare(b.kind)),
        last24h: 3,
        last7d: alerts.length,
      })
    }
    if (call.path === `${BASE_PATH}/alerts` && call.method === "GET") {
      if (failingListCalls > 0) {
        failingListCalls -= 1
        return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ status: 500, message: "failed to query bot security alerts" }) })
      }
      const page = Number(call.query.page ?? 1)
      const pageSize = Number(call.query.pageSize ?? 20)
      const items = alerts
        .filter((alert) => !call.query.status || alert.status === call.query.status)
        .filter((alert) => !call.query.kind || alert.kind === call.query.kind)
        .filter((alert) => !call.query.botId || alert.botId === call.query.botId)
      return reply({ items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize })
    }
    const patch = call.path.match(/^\/api\/admin\/bot-security\/alerts\/(\d+)$/)
    if (patch && call.method === "PATCH") {
      const alert = alerts.find((item) => item.id === Number(patch[1]))
      if (!alert) return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ status: 404, message: "bot security alert not found" }) })
      const body = call.body as { status: MockAlert["status"]; note?: string }
      if (body.status === "open") {
        alert.handledBy = null
        alert.handledAt = null
      } else if (body.status !== alert.status) {
        alert.handledBy = { userId: ADMIN_USER_ID, name: "Admin" }
        alert.handledAt = "2026-09-02T10:00:00Z"
      }
      alert.status = body.status
      if (body.note !== undefined) alert.note = body.note.trim()
      return reply(alert)
    }
    return route.abort()
  })

  await page.goto("/admin/bot-security")
  return calls
}

function alertRow(page: Page, id: number) {
  return page.locator(`tr[data-alert-id="${id}"]`)
}

async function chooseRowAction(page: Page, id: number, name: RegExp) {
  await alertRow(page, id).getByRole("button", { name: new RegExp(`告警 #${id} 的操作|Actions for alert #${id}`) }).click()
  await page.getByRole("menuitem", { name }).click()
}

test.describe("admin bot security alerts", () => {
  test.describe.configure({ timeout: 60_000 })

  test("lists open alerts with null members and unknown kinds", async ({ page }) => {
    const calls = await openBotSecurity(page)

    // First visit to the admin chunk on a cold dev server: allow for the transform.
    await expect(alertRow(page, 42)).toBeVisible({ timeout: 30_000 })
    await expect(alertRow(page, 41)).toBeVisible()
    await expect(alertRow(page, 40)).toBeVisible()
    await expect(alertRow(page, 39)).toHaveCount(0)

    const listCall = calls.find((call) => call.path === `${BASE_PATH}/alerts`)
    expect(listCall?.query).toEqual({ page: "1", pageSize: "20", status: "open" })

    await expect(alertRow(page, 42)).toContainText(/认证失败|Authentication failed/)
    await expect(alertRow(page, 41)).toContainText(/仅记录|Log only/)
    await expect(alertRow(page, 40)).toContainText("quantum_tunnel")
    // No bot: the bot column shows the placeholder, and the source IP below it.
    await expect(alertRow(page, 41).locator("td").nth(2)).toContainText("—")
    await expect(alertRow(page, 41).locator("td").nth(2)).toContainText("198.51.100.9")

    // Summary: open count and per-kind chips.
    await expect(page.getByRole("button", { name: /quantum_tunnel/ })).toBeVisible()
  })

  test("resolves an alert with a note and refreshes the row and summary", async ({ page }) => {
    const calls = await openBotSecurity(page)
    await expect(alertRow(page, 42)).toBeVisible({ timeout: 30_000 })
    const summaryCallsBefore = calls.filter((call) => call.path === `${BASE_PATH}/summary`).length

    await chooseRowAction(page, 42, /标记已处理|Resolve/)
    const dialog = page.getByRole("dialog")
    await dialog.getByLabel(/处理备注|Note/).fill("  rotated the credential  ")
    await dialog.getByRole("button", { name: /^(标记已处理|Resolve)$/ }).click()

    await expect(alertRow(page, 42)).toContainText(/已处理|Resolved/)
    expect(calls.filter((call) => call.method === "PATCH")).toEqual([
      { method: "PATCH", path: `${BASE_PATH}/alerts/42`, query: {}, body: { status: "resolved", note: "rotated the credential" } },
    ])
    await expect.poll(() => calls.filter((call) => call.path === `${BASE_PATH}/summary`).length).toBe(summaryCallsBefore + 1)
  })

  test("reopening keeps an unchanged note out of the request", async ({ page }) => {
    const calls = await openBotSecurity(page)
    await expect(alertRow(page, 42)).toBeVisible({ timeout: 30_000 })

    await page.getByRole("combobox", { name: /状态|Status/ }).click()
    await page.getByRole("option", { name: /已处理|Resolved/ }).click()
    await page.getByRole("button", { name: /^(查询|Search)$/ }).click()
    await expect(alertRow(page, 39)).toBeVisible()

    await chooseRowAction(page, 39, /重新打开|Reopen/)
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByLabel(/处理备注|Note/)).toHaveValue("credential reset")
    await dialog.getByRole("button", { name: /^(重新打开|Reopen)$/ }).click()

    await expect(alertRow(page, 39)).toContainText(/待处理|Open/)
    expect(calls.filter((call) => call.method === "PATCH").map((call) => call.body)).toEqual([{ status: "open" }])
  })

  test("shows the full detail as text", async ({ page }) => {
    await openBotSecurity(page)
    await expect(alertRow(page, 40)).toBeVisible({ timeout: 30_000 })

    await chooseRowAction(page, 40, /查看详情|View details/)
    const dialog = page.getByRole("dialog")
    await expect(dialog).toContainText("node-a")
    await expect(dialog).toContainText("a very long reason")
    await expect(dialog).toContainText("watching")
    await expect(dialog).toContainText("<img src=x onerror=")
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined()
    await expect(dialog.locator("img")).toHaveCount(0)
  })

  test("shows an error state and recovers on retry", async ({ page }) => {
    // GET is retried once by the HTTP client, so fail both attempts.
    await openBotSecurity(page, { failingListCalls: 2 })

    const retry = page.getByRole("button", { name: /^(重试|Retry)$/ })
    await expect(retry).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/告警列表加载失败|Could not load alerts/)).toBeVisible()

    await retry.click()
    await expect(alertRow(page, 42)).toBeVisible()
  })
})
