import { expect, test, type Page } from "@playwright/test"

// The risk management page against a mocked backend that answers like
// /api/admin/risk does: events newest first inside a time window (`from`),
// `status` / `severity` as filters, `eventTime` as the event's time, and
// rules as `{ items: [{ key, description, config, updatedAt, updatedBy }] }`
// that PUT upserts from `{ rules: [...] }`.
const APP_HOST = "127.0.0.1:4173"
const BASE_PATH = "/api/admin/risk"
const ADMIN_USER_ID = "risk-admin"

type ApiCall = {
  method: string
  path: string
  query: Record<string, string>
  body: unknown
}

type MockEvent = Record<string, unknown> & { id: number; status: string; severity: string }

function createEvents(): MockEvent[] {
  return [
    {
      id: 12,
      eventTime: "2026-11-09T08:30:00Z",
      status: "open",
      severity: "critical",
      source: "automated",
      actorUserId: "2001",
      targetUserId: "8532047001",
      ip: "198.51.100.7",
      action: "suspicious_login",
      reason: "14 failed logins in 10 minutes",
      metadata: { attempts: 14 },
    },
    {
      id: 11,
      eventTime: "2026-11-08T20:00:00Z",
      status: "open",
      severity: "medium",
      source: "manual",
      action: "manual_review",
      // No break opportunity: the row must wrap it, not widen the page.
      reason: `Reported for ${"averyveryverylonghostname".repeat(8)}.example.com`,
    },
    {
      id: 10,
      eventTime: "2026-11-07T10:00:00Z",
      status: "resolved",
      severity: "high",
      source: "automated",
      targetUserId: "8532047002",
      action: "upload_burst",
      reason: "Upload rate 20x the 7-day average",
      resolvedAt: "2026-11-07T11:00:00Z",
      resolvedBy: "1001",
      metadata: { resolutionReason: "confirmed with the user" },
    },
  ]
}

type MockRule = { key: string; description?: string; config: Record<string, unknown>; updatedAt: string; updatedBy?: string }

function createRules(): MockRule[] {
  return [
    { key: "login.failed_burst", description: "Too many failed logins", config: { threshold: 10 }, updatedAt: "2026-10-21T08:12:00Z", updatedBy: "1001" },
    { key: "upload.rate_spike", config: {}, updatedAt: "2026-09-02T03:40:00Z" },
  ]
}

async function openRisk(page: Page, role: "admin" | "super_admin" = "super_admin") {
  const events = createEvents()
  let rules = createRules()
  const calls: ApiCall[] = []
  await page.addInitScript(({ userId, role }) => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Admin",
      userId,
      role,
      sessionToken: "test-token",
      tokenExpiration: 4_102_444_800,
    }))
    localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN", theme: "light" }))
  }, { userId: ADMIN_USER_ID, role })
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
      return reply({ userId: ADMIN_USER_ID, name: "Admin", role })
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

    if (call.path === `${BASE_PATH}/events` && call.method === "GET") {
      const page = Number(call.query.page ?? 1)
      const pageSize = Number(call.query.page_size ?? 50)
      const items = events
        .filter((event) => !call.query.status || event.status === call.query.status)
        .filter((event) => !call.query.severity || event.severity === call.query.severity)
      return reply({
        generatedAt: "2026-11-09T09:00:00Z",
        from: call.query.from,
        to: "2026-11-09T09:00:00Z",
        page,
        pageSize,
        total: items.length,
        totalPages: Math.ceil(items.length / pageSize),
        hasMore: false,
        sort: "event_time_desc",
        items: items.slice((page - 1) * pageSize, page * pageSize),
      })
    }
    const resolve = call.path.match(/^\/api\/admin\/risk\/events\/(\d+)\/resolve$/)
    if (resolve && call.method === "POST") {
      const event = events.find((item) => item.id === Number(resolve[1]))
      if (!event) return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ status: 404, message: "risk event not found" }) })
      event.status = "resolved"
      event.resolvedAt = "2026-11-09T09:01:00Z"
      event.resolvedBy = ADMIN_USER_ID
      return reply(event)
    }
    if (call.path === `${BASE_PATH}/rules` && call.method === "GET") {
      return reply({ generatedAt: "2026-11-09T09:00:00Z", items: rules })
    }
    if (call.path === `${BASE_PATH}/rules` && call.method === "PUT") {
      const body = call.body as { rules: Array<{ key: string; description?: string; config?: Record<string, unknown> }> }
      const updated = body.rules.map((rule) => ({
        key: rule.key,
        ...(rule.description ? { description: rule.description } : {}),
        config: rule.config ?? {},
        updatedAt: "2026-11-09T09:02:00Z",
        updatedBy: ADMIN_USER_ID,
      }))
      rules = [...rules.filter((rule) => !updated.some((item) => item.key === rule.key)), ...updated]
        .sort((a, b) => a.key.localeCompare(b.key))
      return reply({ generatedAt: "2026-11-09T09:02:00Z", items: updated })
    }
    return route.abort()
  })

  await page.goto("/admin/risk")
  return calls
}

function eventRow(page: Page, id: number) {
  return page.locator(`tr[data-event-id="${id}"]`)
}

function listCalls(calls: ApiCall[]) {
  return calls.filter((call) => call.path === `${BASE_PATH}/events` && call.method === "GET" && call.query.page_size !== "1")
}

test.describe("admin risk management", () => {
  test.describe.configure({ timeout: 60_000 })
  // Event times are shown in the browser's zone; pin it so the dates below hold anywhere.
  test.use({ timezoneId: "Asia/Shanghai" })

  test("lists the events of a time window with figures over the whole window", async ({ page }) => {
    const calls = await openRisk(page)

    // First visit to the admin chunk on a cold dev server: allow for the transform.
    await expect(eventRow(page, 12)).toBeVisible({ timeout: 30_000 })
    await expect(eventRow(page, 11)).toBeVisible()
    await expect(eventRow(page, 10)).toBeVisible()

    // The list asks for a window (the backend would only return 24 hours otherwise).
    const first = listCalls(calls)[0]
    expect(first?.query.page).toBe("1")
    expect(first?.query.page_size).toBe("20")
    expect(Date.parse(first?.query.from ?? "")).toBeLessThan(Date.now() - 29 * 86_400_000)

    // The backend's `eventTime` is the row's time, in the browser's zone.
    await expect(eventRow(page, 12)).toContainText(/2026\/11\/0?9 16:30/)
    await expect(eventRow(page, 12)).toContainText("suspicious_login")
    await expect(eventRow(page, 12)).toContainText(/严重|Critical/)

    // Tiles: 2 open (1 critical, 0 high), 1 resolved, 3 in all.
    const stats = page.getByTestId("risk-event-stats")
    await expect(stats).toContainText(/严重 1 · 高 0|1 critical · 0 high/)
    await expect(stats).toContainText(/解决率 33%|33% resolved/)
    // Sources of the rows shown: automated 2 of 3.
    await expect(stats).toContainText(/automated\s*2 · 67%/)
    const totals = calls.filter((call) => call.path === `${BASE_PATH}/events` && call.query.page_size === "1")
    expect(totals.map((call) => `${call.query.status}/${call.query.severity ?? ""}`).sort()).toEqual([
      "open/", "open/critical", "open/high", "open/low", "open/medium", "resolved/",
    ])

    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)

    // The status filter narrows the list only.
    await page.getByRole("combobox", { name: /^(状态|Status)$/ }).click()
    await page.getByRole("option", { name: /^(已解决|Resolved)$/ }).click()
    await expect(eventRow(page, 12)).toHaveCount(0)
    await expect(eventRow(page, 10)).toBeVisible()
    expect(listCalls(calls).at(-1)?.query.status).toBe("resolved")
  })

  test("shows the full event and resolves it after a confirmation", async ({ page }) => {
    const calls = await openRisk(page)
    await expect(eventRow(page, 12)).toBeVisible({ timeout: 30_000 })

    await eventRow(page, 12).getByRole("button", { name: /查看详情|View details/ }).click()
    const detail = page.getByRole("dialog")
    await expect(detail).toContainText("198.51.100.7")
    await expect(detail).toContainText("8532047001")
    await expect(detail).toContainText('"attempts": 14')

    // Resolving from the detail dialog closes it and asks first.
    await detail.getByRole("button", { name: /标记为已解决|Mark as resolved/ }).click()
    const confirm = page.getByRole("alertdialog")
    await expect(confirm).toContainText("suspicious_login")
    await confirm.getByRole("button", { name: /标记为已解决|Mark as resolved/ }).click()

    await expect(eventRow(page, 12)).toContainText(/已解决|Resolved/)
    expect(calls.filter((call) => call.method === "POST").map((call) => call.path)).toEqual([`${BASE_PATH}/events/12/resolve`])
  })

  test("edits the rules as JSON and saves only what changed", async ({ page }) => {
    const calls = await openRisk(page)
    await page.getByRole("tab", { name: /风控规则|Risk rules/ }).click()

    const editor = page.locator("#risk-rules-editor")
    await expect(editor).toBeVisible({ timeout: 30_000 })
    const state = page.getByTestId("risk-rules-state")
    await expect(state).toHaveAttribute("data-state", "saved")
    const save = page.getByRole("button", { name: /保存规则|Save rules/ })
    await expect(save).toBeDisabled()

    // The text is the editable part of each stored rule.
    const loaded = JSON.parse(await editor.inputValue()) as Array<Record<string, unknown>>
    expect(loaded).toEqual([
      { key: "login.failed_burst", description: "Too many failed logins", config: { threshold: 10 } },
      { key: "upload.rate_spike", description: "", config: {} },
    ])

    // An invalid text says so and cannot be saved.
    await editor.fill('[{ "key": "" }]')
    await expect(state).toHaveAttribute("data-state", "invalid")
    await expect(page.getByText(/第 1 条规则格式不正确|Rule #1 is malformed/)).toBeVisible()
    await expect(save).toBeDisabled()

    // Change one rule, add one, leave one out.
    await editor.fill(JSON.stringify([
      { key: "login.failed_burst", description: "Too many failed logins", config: { threshold: 12 } },
      { key: "binding.takeover", description: "", config: { cooldownHours: 24 } },
    ]))
    await expect(state).toHaveAttribute("data-state", "pending")
    await expect(page.locator('[data-rule="login.failed_burst"]')).toHaveAttribute("data-change", "changed")
    await expect(page.locator('[data-rule="binding.takeover"]')).toHaveAttribute("data-change", "new")
    await expect(page.getByTestId("risk-rules-omitted")).toContainText("upload.rate_spike")

    await save.click()
    await expect(state).toHaveAttribute("data-state", "saved")
    expect(calls.filter((call) => call.method === "PUT").map((call) => call.body)).toEqual([
      {
        rules: [
          { key: "login.failed_burst", description: "Too many failed logins", config: { threshold: 12 } },
          { key: "binding.takeover", description: "", config: { cooldownHours: 24 } },
        ],
      },
    ])
    // The editor now shows every stored rule again, the omitted one included.
    const saved = JSON.parse(await editor.inputValue()) as Array<{ key: string }>
    expect(saved.map((rule) => rule.key)).toEqual(["binding.takeover", "login.failed_burst", "upload.rate_spike"])
  })

  test("keeps the rules to super admins", async ({ page }) => {
    const calls = await openRisk(page, "admin")
    await expect(eventRow(page, 12)).toBeVisible({ timeout: 30_000 })

    await page.getByRole("tab", { name: /风控规则|Risk rules/ }).click()
    await expect(page.getByText(/风控规则仅超级管理员可见|only available to super admins/)).toBeVisible()
    await expect(page.locator("#risk-rules-editor")).toHaveCount(0)
    expect(calls.filter((call) => call.path === `${BASE_PATH}/rules`)).toEqual([])
  })
})
