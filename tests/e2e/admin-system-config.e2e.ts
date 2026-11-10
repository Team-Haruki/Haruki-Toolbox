import { expect, test, type Page } from "@playwright/test"

// The runtime switch for the OAuth2 device flow on the system config page,
// against a mocked backend. GET /api/admin/config/runtime reports the
// effective switch value once the backend knows it; before that the member is
// missing, which the page shows as off. A switch is changed with a PUT that
// carries only that member, behind the same confirmation as the editor.
const APP_HOST = "127.0.0.1:4173"
const CONFIG_PATH = "/api/admin/config"
const ADMIN_USER_ID = "admin-1"
const REAUTH_PATH = "/api/admin/me/reauth"
const ADMIN_PASSWORD = "correct horse battery staple"

// Backend side of RequireRecentAdminReauth: the guarded PUT answers 403
// "reauthentication required" until POST /api/admin/me/reauth succeeds.
type ReauthState = { required: boolean }

type ApiCall = {
  method: string
  path: string
  body: unknown
}

async function openSystemConfig(
  page: Page,
  runtime: { current: Record<string, unknown> },
  applyPut: (body: Record<string, unknown>) => void,
  reauth: ReauthState = { required: false },
  // The public API allowlist: GET reports it, PUT replaces it and answers with what was stored.
  apiKeys: { current: string[] } = { current: [] },
) {
  const calls: ApiCall[] = []
  await page.addInitScript((userId) => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Super admin",
      userId,
      role: "super_admin",
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
      return reply({ userId: ADMIN_USER_ID, name: "Super admin", role: "super_admin" })
    }
    const fail = (status: number, message: string) => route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ status, message }),
    })
    if (url.pathname === REAUTH_PATH && request.method() === "POST") {
      const body = request.postDataJSON() as { password?: string }
      calls.push({ method: "POST", path: REAUTH_PATH, body: { passwordMatches: body.password === ADMIN_PASSWORD } })
      if (body.password !== ADMIN_PASSWORD) {
        return fail(403, "password mismatch")
      }
      reauth.required = false
      return reply({ reauthenticatedAt: "2026-10-07T00:00:00Z" })
    }
    if (!url.pathname.startsWith(CONFIG_PATH)) {
      // Includes the Monaco editor's CDN: the switch does not depend on it.
      return route.abort()
    }
    const call: ApiCall = { method: request.method(), path: url.pathname, body: request.postDataJSON() }
    calls.push(call)
    if (call.path === `${CONFIG_PATH}/public-api-keys`) {
      if (call.method === "PUT") {
        if (reauth.required) {
          return fail(403, "reauthentication required")
        }
        apiKeys.current = (call.body as { publicApiAllowedKeys: string[] }).publicApiAllowedKeys
      }
      return reply({ publicApiAllowedKeys: apiKeys.current })
    }
    if (call.path === `${CONFIG_PATH}/runtime` && call.method === "GET") {
      return reply(runtime.current)
    }
    if (call.path === `${CONFIG_PATH}/runtime` && call.method === "PUT") {
      if (reauth.required) {
        return fail(403, "reauthentication required")
      }
      applyPut(call.body as Record<string, unknown>)
      return reply(null)
    }
    return route.abort()
  })

  await page.goto("/admin/config")
  return calls
}

function deviceFlowSwitch(page: Page) {
  return page.getByRole("switch", { name: /OAuth2 设备授权|OAuth2 device authorization/ })
}

test.describe("admin runtime switches", () => {
  test.describe.configure({ timeout: 60_000 })

  test("shows a missing device flow switch as off and turns it on", async ({ page }) => {
    // A backend snapshot without the member: the gate is closed.
    const runtime = { current: { publicApiAllowedKeys: [], webhookEnabled: true } as Record<string, unknown> }
    const calls = await openSystemConfig(page, runtime, (body) => {
      runtime.current = { ...runtime.current, ...body }
    })

    const toggle = deviceFlowSwitch(page)
    // First visit to the admin chunk on a cold dev server: allow for the transform.
    await expect(toggle).toBeVisible({ timeout: 30_000 })
    await expect(toggle).toHaveAttribute("aria-checked", "false")

    await toggle.click()
    const confirm = page.getByRole("alertdialog", { name: /开启 OAuth2 设备授权|Turn on OAuth2 device authorization/ })
    await confirm.getByRole("button", { name: /^(开启|Turn on)$/ }).click()

    await expect(page.locator("[data-sonner-toast][data-type=\"success\"]").filter({ hasText: /OAuth2 设备授权已开启|OAuth2 device authorization turned on/ })).toBeVisible()
    await expect(deviceFlowSwitch(page)).toHaveAttribute("aria-checked", "true")
    expect(calls.filter((call) => call.method === "PUT")).toEqual([
      { method: "PUT", path: `${CONFIG_PATH}/runtime`, body: { oauth2DeviceFlowEnabled: true } },
    ])
  })

  test("cancelling the confirmation changes nothing", async ({ page }) => {
    const runtime = { current: { oauth2DeviceFlowEnabled: true } as Record<string, unknown> }
    const calls = await openSystemConfig(page, runtime, () => undefined)

    const toggle = deviceFlowSwitch(page)
    await expect(toggle).toBeVisible({ timeout: 30_000 })
    await expect(toggle).toHaveAttribute("aria-checked", "true")

    await toggle.click()
    const confirm = page.getByRole("alertdialog", { name: /关闭 OAuth2 设备授权|Turn off OAuth2 device authorization/ })
    await confirm.getByRole("button", { name: /^(取消|Cancel)$/ }).click()

    await expect(confirm).toBeHidden()
    await expect(toggle).toHaveAttribute("aria-checked", "true")
    expect(calls.filter((call) => call.method === "PUT")).toEqual([])
  })

  test("warns when the backend ignores the switch", async ({ page }) => {
    // A backend that predates the switch accepts the PUT and keeps omitting the member.
    const runtime = { current: { webhookEnabled: true } as Record<string, unknown> }
    await openSystemConfig(page, runtime, () => undefined)

    const toggle = deviceFlowSwitch(page)
    await expect(toggle).toBeVisible({ timeout: 30_000 })
    await toggle.click()
    await page.getByRole("alertdialog").getByRole("button", { name: /^(开启|Turn on)$/ }).click()

    await expect(page.locator("[data-sonner-toast][data-type=\"warning\"]").filter({ hasText: /后端没有应用该开关|did not apply the switch/ })).toBeVisible()
    await expect(deviceFlowSwitch(page)).toHaveAttribute("aria-checked", "false")
  })
})

test.describe("admin re-authentication", () => {
  test.describe.configure({ timeout: 60_000 })

  function reauthDialog(page: Page) {
    return page.getByRole("dialog", { name: /验证管理员密码|Confirm your password/ })
  }

  test("asks for the password and retries the runtime switch", async ({ page }) => {
    const runtime = { current: { oauth2DeviceFlowEnabled: false } as Record<string, unknown> }
    const calls = await openSystemConfig(page, runtime, (body) => {
      runtime.current = { ...runtime.current, ...body }
    }, { required: true })

    const toggle = deviceFlowSwitch(page)
    await expect(toggle).toBeVisible({ timeout: 30_000 })
    await toggle.click()
    await page.getByRole("alertdialog").getByRole("button", { name: /^(开启|Turn on)$/ }).click()

    const dialog = reauthDialog(page)
    await expect(dialog).toBeVisible()
    const password = dialog.getByLabel(/当前密码|Current password/)
    await expect(password).toHaveAttribute("type", "password")
    await expect(password).toHaveAttribute("autocomplete", "current-password")
    const submit = dialog.getByRole("button", { name: /验证并继续|Confirm and continue/ })

    await password.fill("wrong password")
    await submit.click()
    await expect(dialog.getByRole("alert")).toHaveText(/密码不正确|Incorrect password/)
    await expect(dialog).toBeVisible()
    await expect(password).toHaveValue("")

    await password.fill(ADMIN_PASSWORD)
    await submit.click()
    await expect(dialog).toBeHidden()

    await expect(page.locator("[data-sonner-toast][data-type=\"success\"]").filter({ hasText: /OAuth2 设备授权已开启|OAuth2 device authorization turned on/ })).toBeVisible()
    await expect(deviceFlowSwitch(page)).toHaveAttribute("aria-checked", "true")
    expect(calls.filter((call) => call.method !== "GET")).toEqual([
      { method: "PUT", path: `${CONFIG_PATH}/runtime`, body: { oauth2DeviceFlowEnabled: true } },
      { method: "POST", path: REAUTH_PATH, body: { passwordMatches: false } },
      { method: "POST", path: REAUTH_PATH, body: { passwordMatches: true } },
      { method: "PUT", path: `${CONFIG_PATH}/runtime`, body: { oauth2DeviceFlowEnabled: true } },
    ])
  })

  test("cancelling the password prompt leaves the switch unchanged", async ({ page }) => {
    // Giving up on the password prompt is the admin's own choice, not a
    // failure: nothing ran, so there is no toast and no inline error. The
    // switch confirmation stays open and idle, ready to retry or cancel.
    const runtime = { current: { oauth2DeviceFlowEnabled: false } as Record<string, unknown> }
    const calls = await openSystemConfig(page, runtime, (body) => {
      runtime.current = { ...runtime.current, ...body }
    }, { required: true })

    const toggle = deviceFlowSwitch(page)
    await expect(toggle).toBeVisible({ timeout: 30_000 })
    await toggle.click()
    const confirm = page.getByRole("alertdialog", { name: /开启 OAuth2 设备授权|Turn on OAuth2 device authorization/ })
    const confirmButton = confirm.getByRole("button", { name: /^(开启|Turn on)$/ })
    await confirmButton.click()

    // While the modal password prompt is on top, the confirmation underneath
    // is hidden from the accessibility tree, so it is only checked afterwards.
    const dialog = reauthDialog(page)
    await expect(dialog).toBeVisible()
    await dialog.getByLabel(/当前密码|Current password/).fill("typed then abandoned")
    await dialog.getByRole("button", { name: /^(取消|Cancel)$/ }).click()
    await expect(dialog).toBeHidden()

    // The pending state ends without a report: the confirm button is usable
    // again, no alert line appears and no toast of any kind fires.
    await expect(confirm).toBeVisible()
    await expect(confirmButton).toBeEnabled()
    await expect(confirmButton).not.toHaveAttribute("aria-busy", /.*/)
    await expect(confirm.getByRole("alert")).toHaveCount(0)
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0)
    expect(calls.filter((call) => call.method !== "GET")).toEqual([
      { method: "PUT", path: `${CONFIG_PATH}/runtime`, body: { oauth2DeviceFlowEnabled: true } },
    ])

    // Backing out of the confirmation closes it and still changes nothing.
    await confirm.getByRole("button", { name: /^(取消|Cancel)$/ }).click()
    await expect(confirm).toBeHidden()
    await expect(deviceFlowSwitch(page)).toHaveAttribute("aria-checked", "false")
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0)
    expect(calls.filter((call) => call.method !== "GET")).toHaveLength(1)
  })
})

// The settings-style page around the switch: a status strip and a read-only
// credentials list fed by GET /api/admin/config/runtime, and the public API
// allowlist (GET/PUT /api/admin/config/public-api-keys, body
// { publicApiAllowedKeys: string[] }) edited as a list.
test.describe("admin system config lists", () => {
  test.describe.configure({ timeout: 60_000 })

  test("reports what the runtime configuration carries and nothing it does not", async ({ page }) => {
    const runtime = { current: {
      oauth2DeviceFlowEnabled: true,
      webhookEnabled: false,
      privateApiTokenConfigured: true,
      harukiProxySecretConfigured: false,
      harukiProxyVersion: "v3.2.1",
      privateApiUserAgent: "",
    } as Record<string, unknown> }
    await openSystemConfig(page, runtime, () => undefined, { required: false }, { current: ["userCards", "userDecks", "userAreas"] })

    const status = page.getByTestId("config-status")
    await expect(status).toContainText("v3.2.1", { timeout: 30_000 })
    const fact = (label: RegExp) => status.locator("dl > div").filter({ hasText: label }).locator("dd")
    await expect(fact(/设备授权|Device authorization/)).toHaveText(/已开启|On/)
    await expect(fact(/Webhook/)).toHaveText(/已关闭|Off/)
    await expect(fact(/允许的数据键|Allowed data keys/)).toHaveText("3")
    // Two of the four secrets are reported; the others are unknown, not "unset".
    await expect(fact(/密钥|Secrets/)).toHaveText(/^1 \/ 2 /)

    const credentials = page.getByTestId("config-credentials")
    await expect(credentials.locator("[data-secret=privateApiTokenConfigured]")).toContainText(/已配置|Set/)
    await expect(credentials.locator("[data-secret=harukiProxySecretConfigured]")).toContainText(/未配置|Not set/)
    await expect(credentials.locator("[data-secret=webhookJwtSecretConfigured]")).toContainText("—")
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })

  test("edits the allowlist as a list and sends it only on save", async ({ page }) => {
    const runtime = { current: { oauth2DeviceFlowEnabled: false } as Record<string, unknown> }
    const apiKeys = { current: ["userCards", "userDecks"] }
    const calls = await openSystemConfig(page, runtime, () => undefined, { required: false }, apiKeys)

    const group = page.getByTestId("config-allowed-keys")
    const row = (key: string) => group.locator(`[data-key="${key}"]`)
    await expect(group.locator("[data-key]")).toHaveCount(2, { timeout: 30_000 })
    const save = group.getByRole("button", { name: /^(保存|Save)$/ })
    await expect(save).toBeDisabled()

    // Removing strikes the key out in place; it can be brought back until saved.
    await group.getByRole("button", { name: /移除 userDecks|Remove userDecks/ }).click()
    await expect(row("userDecks")).toHaveAttribute("data-state", "removed")
    await group.getByRole("button", { name: /恢复 userDecks|Restore userDecks/ }).click()
    await expect(row("userDecks")).toHaveAttribute("data-state", "kept")
    await group.getByRole("button", { name: /移除 userDecks|Remove userDecks/ }).click()

    // Several keys at once; one already on the list is reported and left in the field.
    const input = group.getByRole("textbox", { name: /添加数据键|Add data keys/ })
    await input.fill("userAreas, userCards userHonors")
    await group.getByRole("button", { name: /^(添加|Add)$/ }).click()
    await expect(group.getByRole("alert")).toContainText("userCards")
    await expect(input).toHaveValue("userCards")
    await expect(row("userAreas")).toHaveAttribute("data-state", "added")
    await expect(row("userHonors")).toHaveAttribute("data-state", "added")
    await expect(group.getByRole("status")).toHaveText(/有未保存的更改|Unsaved changes/)
    expect(calls.filter((call) => call.method === "PUT")).toEqual([])

    await save.click()
    await expect(page.locator("[data-sonner-toast][data-type=\"success\"]").filter({ hasText: /允许的数据键已保存|Allowed data keys saved/ })).toBeVisible()
    expect(calls.filter((call) => call.method === "PUT")).toEqual([
      { method: "PUT", path: `${CONFIG_PATH}/public-api-keys`, body: { publicApiAllowedKeys: ["userCards", "userAreas", "userHonors"] } },
    ])
    await expect(group.locator("[data-key]")).toHaveCount(3)
    await expect(group.locator("[data-state=kept]")).toHaveCount(3)
    await expect(save).toBeDisabled()
  })

  test("reset drops the pending edits without a request", async ({ page }) => {
    const runtime = { current: {} as Record<string, unknown> }
    const calls = await openSystemConfig(page, runtime, () => undefined, { required: false }, { current: ["userCards"] })
    const group = page.getByTestId("config-allowed-keys")
    await expect(group.locator("[data-key]")).toHaveCount(1, { timeout: 30_000 })
    await group.getByRole("button", { name: /移除 userCards|Remove userCards/ }).click()
    await group.getByRole("textbox", { name: /添加数据键|Add data keys/ }).fill("userDecks")
    await group.getByRole("button", { name: /^(添加|Add)$/ }).click()
    await expect(group.locator("[data-key]")).toHaveCount(2)
    await group.getByRole("button", { name: /^(还原|Reset)$/ }).click()
    await expect(group.locator("[data-key]")).toHaveCount(1)
    await expect(group.locator("[data-key=userCards]")).toHaveAttribute("data-state", "kept")
    expect(calls.filter((call) => call.method === "PUT")).toEqual([])
  })

  test("mobile settings list fits without sideways scrolling", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const runtime = { current: { oauth2DeviceFlowEnabled: true, harukiProxyUserAgent: "HarukiProxy/3.2.1 (linux; amd64) with-a-long-suffix-for-wrapping" } as Record<string, unknown> }
    await openSystemConfig(page, runtime, () => undefined, { required: false }, { current: ["userChallengeLiveSoloHighScoreRewardsAndMoreKeysThanFit", "userCards"] })
    await expect(page.getByTestId("config-allowed-keys").locator("[data-key]")).toHaveCount(2, { timeout: 30_000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: testInfo.outputPath("admin-system-config-mobile.png"), fullPage: true, animations: "disabled" })
  })
})
