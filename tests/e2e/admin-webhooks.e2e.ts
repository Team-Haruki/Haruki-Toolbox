import { expect, test, type Page } from "@playwright/test"

// The admin webhook page against a mocked backend that answers like
// adminwebhook does: GET /api/admin/webhooks lists the endpoints (with their
// bearer token in clear text and a subscriptionCount), GET …/settings the
// global switch and whether a JWT secret is set, GET …/:id/subscribers the
// subscriptions of one endpoint. There is no delivery log on the backend, so
// the page's figures are all counted from these three responses.
const APP_HOST = "127.0.0.1:4173"
const WEBHOOKS_PATH = "/api/admin/webhooks"
const ADMIN_USER_ID = "admin-webhooks"
const BEARER_SECRET = "bearer-value-that-must-never-be-rendered"

type MockEndpoint = {
  id: string
  credential: string
  callbackUrl: string
  bearer?: string
  enabled: boolean
  subscriptionCount: number
  createdAt: string
}

type ApiCall = { method: string; path: string; body: unknown }
type MockReply = { status: number; message: string; updatedData?: unknown }

const ENDPOINTS: MockEndpoint[] = [
  { id: "1", credential: "cred-one", callbackUrl: "https://bot.example.com/webhook/haruki", bearer: BEARER_SECRET, enabled: true, subscriptionCount: 412, createdAt: "2026-01-12T08:00:00Z" },
  {
    id: "2",
    credential: "cred-two",
    callbackUrl: "https://hooks.example.org/sekai/update/with/a/very/long/path/that/should/wrap/instead/of/overflowing/the/row?token=abc&mode=full",
    enabled: true,
    subscriptionCount: 96,
    createdAt: "2026-03-02T08:00:00Z",
  },
  { id: "mysekai-notifier", credential: "notifier", callbackUrl: "https://notify.example.net/mysekai", enabled: false, subscriptionCount: 23, createdAt: "2026-05-20T08:00:00Z" },
  { id: "4", credential: "cred-four", callbackUrl: "http://10.0.0.8:8080/hook", enabled: true, subscriptionCount: 0, createdAt: "2026-10-30T08:00:00Z" },
]

const SUBSCRIBERS = [
  ["10001", "jp", "suite"],
  ["10001", "jp", "mysekai"],
  ["10002", "jp", "suite"],
  ["10003", "cn", "suite"],
  ["10004", "tw", "mysekai"],
].map(([userId, server, dataType], index) => ({
  userId,
  server,
  dataType,
  createdAt: `2026-10-0${index + 1}T03:14:00Z`,
}))

type MockState = {
  endpoints: MockEndpoint[]
  settings: { enabled: boolean; jwtSecretConfigured: boolean }
  /** Fails the endpoint list with a 500 while true. */
  failEndpoints?: boolean
}

async function openWebhookAdmin(
  page: Page,
  state: MockState,
  reply: (call: ApiCall) => MockReply | undefined = () => undefined,
  role: "super_admin" | "admin" = "super_admin",
) {
  const calls: ApiCall[] = []
  await page.addInitScript(({ userId, role }) => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Webhook admin",
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
    const fulfill = (answer: MockReply) => route.fulfill({ status: answer.status, contentType: "application/json", body: JSON.stringify(answer) })
    if (url.pathname === `/api/user/${ADMIN_USER_ID}/get-settings`) {
      return fulfill({ status: 200, message: "ok", updatedData: { userId: ADMIN_USER_ID, name: "Webhook admin", role } })
    }
    if (!url.pathname.startsWith(WEBHOOKS_PATH)) {
      return route.abort()
    }
    const call: ApiCall = { method: request.method(), path: url.pathname, body: request.postDataJSON() }
    calls.push(call)
    if (call.method === "GET" && call.path === `${WEBHOOKS_PATH}/settings`) {
      return fulfill({ status: 200, message: "success", updatedData: state.settings })
    }
    if (call.method === "GET" && call.path === WEBHOOKS_PATH) {
      if (state.failEndpoints) {
        return fulfill({ status: 500, message: "failed to query webhooks" })
      }
      return fulfill({
        status: 200,
        message: "success",
        updatedData: { generatedAt: "2026-11-10T00:00:00Z", total: state.endpoints.length, items: state.endpoints },
      })
    }
    if (call.method === "GET" && call.path.endsWith("/subscribers")) {
      return fulfill({
        status: 200,
        message: "success",
        updatedData: { generatedAt: "2026-11-10T00:00:00Z", webhookId: "1", total: SUBSCRIBERS.length, items: SUBSCRIBERS },
      })
    }
    const answer = reply(call)
    return answer ? fulfill(answer) : route.abort()
  })

  await page.goto("/admin/webhooks")
  return calls
}

function statTile(page: Page, name: string) {
  return page.getByTestId("admin-webhook-overview").locator(`[data-stat="${name}"]`)
}

function endpointRow(page: Page, id: string) {
  return page.locator(`[data-testid="admin-webhook-row"][data-webhook-id="${id}"]`)
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
}

test.describe("admin webhooks", () => {
  test.describe.configure({ timeout: 60_000 })

  test("counts the stat panel from the endpoint list and the settings", async ({ page }) => {
    await openWebhookAdmin(page, { endpoints: ENDPOINTS, settings: { enabled: true, jwtSecretConfigured: true } })
    // First visit to the admin chunk on a cold dev server: allow for the transform.
    await expect(endpointRow(page, "1")).toBeVisible({ timeout: 30_000 })

    // The numbers count up; the final text is the exact figure.
    await expect(statTile(page, "total")).toContainText("4")
    await expect(statTile(page, "total")).toContainText(/启用 3 · 禁用 1|3 enabled · 1 disabled/)
    await expect(statTile(page, "delivering")).toContainText("3")
    await expect(statTile(page, "subscriptions")).toContainText("531")
    await expect(statTile(page, "subscriptions")).toContainText(/3 个 endpoint 有订阅者|3 endpoints have subscribers/)
    await expect(statTile(page, "jwtSecret")).toContainText(/已配置|Configured/)
    await expect(statTile(page, "jwtSecret")).toContainText(/1 个带 Bearer|1 with a bearer token/)

    // The ranking lists only endpoints with subscribers, most subscribed first.
    const ranking = page.getByTestId("admin-webhook-ranking").getByRole("listitem")
    await expect(ranking).toHaveCount(3)
    await expect(ranking.nth(0)).toContainText("bot.example.com")
    await expect(ranking.nth(0)).toContainText(/412 · 78%/)

    // The list response carries the bearer token itself; the page only says one is set.
    await expect(endpointRow(page, "1").getByText("Bearer", { exact: true })).toBeVisible()
    await expect(endpointRow(page, "2").getByText("Bearer", { exact: true })).toHaveCount(0)
    expect(await page.content()).not.toContain(BEARER_SECRET)

    await expectNoHorizontalOverflow(page)
  })

  test("counts no endpoint as delivering while global delivery is off", async ({ page }) => {
    await openWebhookAdmin(page, { endpoints: ENDPOINTS, settings: { enabled: false, jwtSecretConfigured: false } })
    await expect(endpointRow(page, "1")).toBeVisible({ timeout: 30_000 })

    await expect(statTile(page, "delivering")).toContainText("0")
    await expect(statTile(page, "delivering")).toContainText(/全局投递已关闭|Global delivery is off/)
    await expect(statTile(page, "jwtSecret")).toContainText(/未配置|Not configured/)
    // Nothing to save until something changes.
    const settings = page.getByTestId("admin-webhook-settings")
    await expect(settings.getByRole("button", { name: /^(保存|Save)$/ })).toBeDisabled()
    await settings.getByRole("switch", { name: /全局启用 webhook 投递|Enable webhook delivery globally/ }).click()
    await expect(settings.getByRole("button", { name: /^(保存|Save)$/ })).toBeEnabled()
  })

  test("keeps the page readable on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openWebhookAdmin(page, { endpoints: ENDPOINTS, settings: { enabled: true, jwtSecretConfigured: true } })
    await expect(endpointRow(page, "2")).toBeVisible({ timeout: 30_000 })

    // The long callback URL wraps inside its row instead of widening the page.
    await expect(endpointRow(page, "2")).toContainText("overflowing/the/row")
    await expectNoHorizontalOverflow(page)
    await expect(endpointRow(page, "2").getByRole("button", { name: /^(编辑|Edit)$/ })).toBeVisible()
  })

  test("shows a failed endpoint load as an error with dashes, not as an empty list", async ({ page }) => {
    const state: MockState = { endpoints: ENDPOINTS, settings: { enabled: true, jwtSecretConfigured: true }, failEndpoints: true }
    await openWebhookAdmin(page, state)

    const error = page.locator("[data-slot=load-error-state]")
    await expect(error).toBeVisible({ timeout: 30_000 })
    await expect(error).toContainText(/加载 webhook endpoint 失败|Failed to load webhook endpoints/)
    await expect(page.getByText(/暂无 webhook endpoint|No webhook endpoints/)).toHaveCount(0)
    await expect(statTile(page, "total")).toContainText("—")
    await expect(statTile(page, "subscriptions")).toContainText("—")
    // The settings loaded on their own request and still show.
    await expect(statTile(page, "jwtSecret")).toContainText(/已配置|Configured/)
    await expect(page.getByTestId("admin-webhook-ranking")).toHaveCount(0)

    state.failEndpoints = false
    await error.getByRole("button", { name: /重试|Retry/ }).click()
    await expect(endpointRow(page, "1")).toBeVisible()
    await expect(statTile(page, "total")).toContainText("4")
  })

  test("breaks an endpoint's subscribers down by region and data type", async ({ page }) => {
    await openWebhookAdmin(page, { endpoints: ENDPOINTS, settings: { enabled: true, jwtSecretConfigured: true } })
    await expect(endpointRow(page, "1")).toBeVisible({ timeout: 30_000 })

    await endpointRow(page, "1").getByRole("button", { name: /^(查看订阅者|Subscribers)$/ }).click()
    const dialog = page.getByRole("dialog", { name: /1 的订阅者|Subscribers for 1/ })
    await expect(dialog.getByTestId("admin-webhook-subscriber-row")).toHaveCount(5)

    const summary = dialog.getByTestId("admin-webhook-subscriber-summary")
    // 5 subscriptions from 4 distinct users.
    await expect(summary.locator("dd").nth(0)).toHaveText("5")
    await expect(summary.locator("dd").nth(1)).toHaveText("4")
    await expect(summary.getByRole("listitem").filter({ hasText: /日服|JP/ })).toContainText(/3 · 60%/)
    await expect(summary.getByRole("listitem").filter({ hasText: /^Suite/ })).toContainText(/3 · 60%/)
  })

  test("saves an edit and shows the returned token once", async ({ page }) => {
    const state: MockState = { endpoints: ENDPOINTS, settings: { enabled: true, jwtSecretConfigured: true } }
    const calls = await openWebhookAdmin(page, state, (call) => {
      if (call.method === "PUT" && call.path === `${WEBHOOKS_PATH}/4`) {
        const updated = { ...ENDPOINTS[3]!, enabled: false }
        state.endpoints = [...ENDPOINTS.slice(0, 3), updated]
        return {
          status: 200,
          message: "webhook updated",
          updatedData: { webhook: updated, token: "signed.webhook.token", tokenHeaderName: "X-Haruki-Suite-Webhook-Token" },
        }
      }
      return undefined
    })
    await expect(endpointRow(page, "4")).toBeVisible({ timeout: 30_000 })

    await endpointRow(page, "4").getByRole("button", { name: /^(编辑|Edit)$/ }).click()
    const dialog = page.getByRole("dialog", { name: /编辑 webhook endpoint|Edit webhook endpoint/ })
    // Nothing changed yet: there is nothing to save.
    await expect(dialog.getByRole("button", { name: /^(保存|Save)$/ })).toBeDisabled()
    await dialog.getByRole("switch", { name: /启用当前 endpoint|Enable this endpoint/ }).click()
    await dialog.getByRole("button", { name: /^(保存|Save)$/ }).click()

    const tokenDialog = page.getByRole("alertdialog", { name: /Webhook Token|Webhook token/ })
    await expect(tokenDialog).toContainText("signed.webhook.token")
    await expect(tokenDialog).toContainText("X-Haruki-Suite-Webhook-Token")
    expect(calls.find((call) => call.method === "PUT")?.body).toEqual({ callbackUrl: "http://10.0.0.8:8080/hook", credential: "cred-four", enabled: false })

    // The reloaded list and the figures follow the change.
    await expect(endpointRow(page, "4")).toContainText(/禁用|Disabled/)
    await expect(statTile(page, "delivering")).toContainText("2")
  })

  test("hides the mutating actions from a plain admin", async ({ page }) => {
    await openWebhookAdmin(page, { endpoints: ENDPOINTS, settings: { enabled: true, jwtSecretConfigured: true } }, () => undefined, "admin")
    await expect(endpointRow(page, "1")).toBeVisible({ timeout: 30_000 })

    await expect(endpointRow(page, "1").getByRole("button", { name: /^(查看订阅者|Subscribers)$/ })).toBeVisible()
    await expect(endpointRow(page, "1").getByRole("button", { name: /^(编辑|Edit)$/ })).toHaveCount(0)
    await expect(page.getByRole("button", { name: /创建 endpoint|Create endpoint/ })).toHaveCount(0)
    await expect(page.getByTestId("admin-webhook-settings").getByRole("switch")).toBeDisabled()
    await expect(page.getByTestId("admin-webhook-settings").getByRole("button", { name: /^(保存|Save)$/ })).toHaveCount(0)
  })
})
