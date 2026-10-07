import { expect, test, type Page } from "@playwright/test"

// The authorized-apps list with device grants (backend design §6.6 / §6.8)
// against a mocked backend: list items carry flowType ("device" | "browser")
// and deviceLabel ("" for browser grants); one device is revoked with
// DELETE …/authorizations/:client_id/consents/:consent_request_id, which
// answers 200 {revoked: true}, 404 authorization_not_found or 502
// revoke_failed (codes in updatedData.code).
const APP_HOST = "127.0.0.1:4173"
const USER_ID = "toolbox-authz"
const LIST_PATH = `/api/user/${USER_ID}/oauth2/authorizations`

type Authorization = {
  consentRequestId: string
  clientId: string
  clientName: string
  clientType: string
  scopes: string[]
  createdAt: string
  flowType: "device" | "browser"
  deviceLabel: string
}
type Reply = { status: number; body: unknown }
type Call = { method: string; path: string }

const HARUKI_BROWSER: Authorization = {
  consentRequestId: "consent-browser",
  clientId: "haruki-client",
  clientName: "Haruki Client",
  clientType: "public",
  scopes: ["user:read", "game-data:read"],
  createdAt: "2026-10-01T08:00:00Z",
  flowType: "browser",
  deviceLabel: "",
}
const HARUKI_NAS: Authorization = {
  ...HARUKI_BROWSER,
  consentRequestId: "consent-nas",
  scopes: ["user:read", "station:room:write"],
  createdAt: "2026-10-05T08:00:00Z",
  flowType: "device",
  deviceLabel: "<b>NAS</b> @ home",
}
const HARUKI_UNNAMED: Authorization = {
  ...HARUKI_NAS,
  consentRequestId: "consent-unnamed",
  createdAt: "2026-10-03T08:00:00Z",
  deviceLabel: "",
}
const OTHER_BOT: Authorization = {
  consentRequestId: "consent-bot",
  clientId: "other-bot",
  clientName: "Other Bot",
  clientType: "confidential",
  scopes: ["user:read"],
  createdAt: "2026-09-20T08:00:00Z",
  flowType: "browser",
  deviceLabel: "",
}

function envelope(status: number, message: string, updatedData?: unknown): Reply {
  return { status, body: updatedData === undefined ? { status, message } : { status, message, updatedData } }
}

/**
 * Serves the list from `state.list` and answers DELETEs from per-path reply
 * queues (default: success, which also drops the grant from the list).
 */
async function mockAuthorizations(page: Page, options: { list: Authorization[]; deletes?: Record<string, Reply[]> }) {
  const state = { list: [...options.list] }
  const calls: Call[] = []
  const deletes = options.deletes ?? {}
  const duplicateKeyWarnings: string[] = []
  page.on("console", (message) => {
    if (message.text().includes("Duplicate keys")) {
      duplicateKeyWarnings.push(message.text())
    }
  })
  await page.addInitScript((userId) => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Authorizations test",
      userId,
      gameAccountBindings: [],
      sessionToken: "test-token",
      tokenExpiration: 4_102_444_800,
    }))
  }, USER_ID)
  await page.route("**/*", (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.host === APP_HOST) {
      return route.continue()
    }
    if (!url.pathname.startsWith(LIST_PATH)) {
      return route.abort()
    }
    const method = request.method()
    calls.push({ method, path: url.pathname })
    const fulfill = (reply: Reply) => route.fulfill({
      status: reply.status,
      contentType: "application/json",
      body: JSON.stringify(reply.body),
    })
    if (method === "GET" && url.pathname === LIST_PATH) {
      return fulfill(envelope(200, "ok", state.list))
    }
    if (method === "DELETE") {
      const queued = deletes[url.pathname]?.shift()
      if (queued) {
        return fulfill(queued)
      }
      const rest = decodeURIComponent(url.pathname.slice(LIST_PATH.length + 1)).split("/")
      const [clientId, segment, consentRequestId] = rest
      if (segment === "consents") {
        state.list = state.list.filter((item) => !(item.clientId === clientId && item.consentRequestId === consentRequestId))
        return fulfill(envelope(200, "authorization revoked", { revoked: true }))
      }
      state.list = state.list.filter((item) => item.clientId !== clientId)
      return fulfill(envelope(200, "authorization revoked"))
    }
    return route.abort()
  })
  return { state, calls, duplicateKeyWarnings }
}

const DEVICE_REVOKE = /^(撤销此设备|Revoke this device)$/

function group(page: Page, clientId: string) {
  return page.locator(`[data-testid="oauth-client-group"][data-client-id="${clientId}"]`)
}

function deviceRow(page: Page, label: string | RegExp) {
  return page.getByTestId("oauth-device-grant").filter({ has: page.getByTestId("oauth-device-label").getByText(label, { exact: true }) })
}

function deletes(calls: Call[]) {
  return calls.filter((call) => call.method === "DELETE").map((call) => call.path)
}

test.describe("Authorized apps with device grants", () => {
  test.describe.configure({ timeout: 60_000 })

  test("groups grants by client and lists each device on its own row", async ({ page }) => {
    await mockAuthorizations(page, { list: [OTHER_BOT, HARUKI_UNNAMED, HARUKI_BROWSER, HARUKI_NAS] })

    await page.goto("/user/oauth-authorizations")

    const groups = page.getByTestId("oauth-client-group")
    await expect(groups).toHaveCount(2, { timeout: 30_000 })
    // Newest grant first: the Haruki Client group holds the newest device.
    await expect(groups.nth(0)).toHaveAttribute("data-client-id", "haruki-client")
    await expect(groups.nth(1)).toHaveAttribute("data-client-id", "other-bot")

    const haruki = group(page, "haruki-client")
    await expect(haruki.getByTestId("oauth-browser-grant")).toHaveCount(1)
    await expect(haruki.getByTestId("oauth-browser-grant")).toContainText(/读取游戏数据|Read game data/)
    await expect(haruki.getByText(/已授权设备（2）|Authorized devices \(2\)/)).toBeVisible()

    const devices = haruki.getByTestId("oauth-device-grant")
    await expect(devices).toHaveCount(2)
    // The device's own label is plain text, never HTML.
    await expect(devices.nth(0).getByTestId("oauth-device-label")).toHaveText("<b>NAS</b> @ home")
    await expect(devices.nth(0).locator("b")).toHaveCount(0)
    await expect(devices.nth(1).getByTestId("oauth-device-label")).toHaveText(/^(未命名设备|Unnamed device)$/)
    for (const index of [0, 1]) {
      await expect(devices.nth(index).getByRole("button", { name: DEVICE_REVOKE })).toBeVisible()
      await expect(devices.nth(index)).toContainText(/授权于|Authorized at/)
    }

    const bot = group(page, "other-bot")
    await expect(bot.getByTestId("oauth-device-grant")).toHaveCount(0)
    await expect(bot.getByTestId("oauth-browser-grant")).toHaveCount(1)
    await expect(bot.getByRole("button", { name: DEVICE_REVOKE })).toHaveCount(0)
  })

  test("revokes one device after confirmation and patches the list in place", async ({ page }) => {
    const { calls, duplicateKeyWarnings } = await mockAuthorizations(page, { list: [HARUKI_BROWSER, HARUKI_NAS, HARUKI_UNNAMED] })
    await page.goto("/user/oauth-authorizations")

    const nas = deviceRow(page, "<b>NAS</b> @ home")
    await expect(nas).toBeVisible({ timeout: 30_000 })
    // Rows that stay must be the same elements after the refresh.
    await deviceRow(page, /^(未命名设备|Unnamed device)$/).evaluate((element) => {
      element.setAttribute("data-e2e-kept", "unnamed")
    })
    await page.getByTestId("oauth-browser-grant").evaluate((element) => {
      element.setAttribute("data-e2e-kept", "browser")
    })

    // Cancelling the confirmation sends nothing.
    await nas.getByRole("button", { name: DEVICE_REVOKE }).click()
    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText("<b>NAS</b> @ home")
    await expect(dialog).toContainText("Haruki Client")
    await dialog.getByRole("button", { name: /^(取消|Cancel)$/ }).click()
    await expect(dialog).toHaveCount(0)
    expect(deletes(calls)).toEqual([])

    await nas.getByRole("button", { name: DEVICE_REVOKE }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: DEVICE_REVOKE }).click()

    await expect(page.getByText(/已撤销设备|Device revoked/)).toBeVisible()
    await expect(page.getByTestId("oauth-device-grant")).toHaveCount(1)
    await expect(page.locator('[data-e2e-kept="unnamed"]')).toHaveCount(1)
    await expect(page.locator('[data-e2e-kept="browser"]')).toHaveCount(1)
    expect(deletes(calls)).toEqual([`${LIST_PATH}/haruki-client/consents/consent-nas`])
    await expect.poll(() => calls.filter((call) => call.method === "GET").length).toBe(2)
    expect(duplicateKeyWarnings).toEqual([])
  })

  test("a device that is already gone refreshes the list; a failed revoke keeps the row", async ({ page }) => {
    const nasPath = `${LIST_PATH}/haruki-client/consents/consent-nas`
    const unnamedPath = `${LIST_PATH}/haruki-client/consents/consent-unnamed`
    const { state, calls } = await mockAuthorizations(page, {
      list: [HARUKI_NAS, HARUKI_UNNAMED],
      deletes: {
        [nasPath]: [envelope(404, "authorization not found", { code: "authorization_not_found" })],
        [unnamedPath]: [envelope(502, "failed to revoke authorization", { code: "revoke_failed" })],
      },
    })
    await page.goto("/user/oauth-authorizations")
    const nas = deviceRow(page, "<b>NAS</b> @ home")
    await expect(nas).toBeVisible({ timeout: 30_000 })

    // Revoked elsewhere in the meantime: the backend no longer lists it either.
    state.list = [HARUKI_UNNAMED]
    await nas.getByRole("button", { name: DEVICE_REVOKE }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: DEVICE_REVOKE }).click()
    await expect(page.getByText(/该设备的授权已不存在|no longer exists/)).toBeVisible()
    await expect(page.getByTestId("oauth-device-grant")).toHaveCount(1)

    const unnamed = deviceRow(page, /^(未命名设备|Unnamed device)$/)
    await unnamed.getByRole("button", { name: DEVICE_REVOKE }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: DEVICE_REVOKE }).click()
    await expect(page.getByText(/撤销设备失败|Could not revoke the device/)).toBeVisible()
    await expect(page.getByText(/暂时无法撤销，请稍后重试|could not be revoked right now/)).toBeVisible()
    await expect(unnamed).toBeVisible()
    await expect(unnamed.getByRole("button", { name: DEVICE_REVOKE })).toBeEnabled()
    expect(deletes(calls)).toEqual([nasPath, unnamedPath])
  })

  test("revoking the app warns that its devices go too and uses the per-app endpoint", async ({ page }) => {
    const { calls } = await mockAuthorizations(page, { list: [HARUKI_BROWSER, HARUKI_NAS, HARUKI_UNNAMED, OTHER_BOT] })
    await page.goto("/user/oauth-authorizations")

    const haruki = group(page, "haruki-client")
    await expect(haruki).toBeVisible({ timeout: 30_000 })
    await haruki.getByRole("button", { name: /^(撤销此应用的全部授权|Revoke all access for this app)$/ }).click()

    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText("Haruki Client")
    await expect(dialog).toContainText(/这也会撤销它在 2 台设备上的授权|This also revokes it on 2 devices/)
    await dialog.getByRole("button", { name: /^(撤销|Revoke)$/ }).click()

    await expect(page.getByTestId("oauth-client-group")).toHaveCount(1)
    await expect(group(page, "other-bot")).toBeVisible()
    expect(deletes(calls)).toEqual([`${LIST_PATH}/haruki-client`])
  })
})
