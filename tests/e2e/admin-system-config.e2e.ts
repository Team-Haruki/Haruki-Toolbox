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
      return reply({ publicApiAllowedKeys: [] })
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
    await dialog.getByLabel(/当前密码|Current password/).fill("typed then abandoned")
    await dialog.getByRole("button", { name: /^(取消|Cancel)$/ }).click()
    await expect(dialog).toBeHidden()

    await expect(page.locator("[data-sonner-toast][data-type=\"error\"]").filter({ hasText: /需要重新验证密码|Password re-verification required/ })).toBeVisible()
    await expect(deviceFlowSwitch(page)).toHaveAttribute("aria-checked", "false")
    expect(calls.filter((call) => call.method !== "GET")).toEqual([
      { method: "PUT", path: `${CONFIG_PATH}/runtime`, body: { oauth2DeviceFlowEnabled: true } },
    ])
  })
})
