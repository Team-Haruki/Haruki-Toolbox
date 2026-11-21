import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test, type Page } from "@playwright/test"

// The second factor the admin area needs: where an admin is sent for it and
// how they come back. Kratos is answered from captured responses here; the
// same paths run against a real Kratos, with real sessions and a virtual
// authenticator, in tests/kratos (`bun run e2e:kratos`).

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "kratos")
const APP_HOST = "127.0.0.1:4173"
const APP_ORIGIN = `http://${APP_HOST}`
// `.env.e2e` points the identity service and the backend at the same closed port.
const SERVICE_HOST = "127.0.0.1:9"
const USER_ID = "second-factor-e2e"
const ADMIN_TARGET = "/admin/dashboard"
const SECOND_FACTOR_REFUSAL = "administrator access requires two-factor authentication"

/** What Kratos' whoami answers: a level, the half-way state, no session, or nothing at all. */
type SessionAnswer = "aal1" | "aal2" | "second-factor-required" | "none" | "unreachable"

interface MockOptions {
  /** Toolbox role of the signed-in user; null for a browser the app knows nothing about. */
  role?: "user" | "admin" | null
  /** One answer per whoami call; the last one repeats. */
  session: SessionAnswer[]
  loginFixture?: string
  settingsFixture?: string
  /** Rewrites the settings flow before it is served. */
  editSettingsFlow?: (flow: KratosFlow) => void
  /** Admin API calls are refused for lack of a second factor. */
  adminRefused?: boolean
}

interface KratosNode {
  group: string
  attributes: { name?: string }
}

interface KratosFlow {
  return_to?: string
  ui: { nodes: KratosNode[] }
}

interface MockRecord {
  /** Query of each Kratos browser flow the page started, in order. */
  started: Array<{ flow: "login" | "settings"; params: URLSearchParams }>
  whoamiCalls: number
  /** Method, path and query of every admin API request. */
  adminCalls: string[]
  logoutCalls: string[]
}

function fixture(name: string): KratosFlow {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, `${name}.json`), "utf8")) as KratosFlow
}

function whoamiResponse(answer: Exclude<SessionAnswer, "unreachable">) {
  if (answer === "none") {
    return { status: 401, body: { error: { id: "session_inactive", code: 401 } } }
  }
  if (answer === "second-factor-required") {
    return {
      status: 403,
      body: {
        error: { id: "session_aal2_required", code: 403 },
        redirect_browser_to: `http://${SERVICE_HOST}/self-service/login/browser?aal=aal2`,
      },
    }
  }
  return {
    status: 200,
    body: {
      id: "e2e-session",
      active: true,
      authenticator_assurance_level: answer,
      identity: { id: "e2e-identity", traits: { email: "kanade@example.com", name: "Kanade" } },
    },
  }
}

async function mockServices(page: Page, options: MockOptions): Promise<MockRecord> {
  const record: MockRecord = { started: [], whoamiCalls: 0, adminCalls: [], logoutCalls: [] }
  const role = options.role === undefined ? "admin" : options.role
  const user = role ? { name: "Kanade", userId: USER_ID, role, gameAccountBindings: [] } : null

  await page.addInitScript((signedInUser) => {
    localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN", theme: "light" }))
    if (signedInUser) {
      sessionStorage.setItem("user", JSON.stringify({
        ...signedInUser,
        sessionToken: "e2e-token",
        tokenExpiration: 4_102_444_800,
      }))
    }
  }, user)

  const json = (status: number, body: unknown) => ({
    status,
    contentType: "application/json",
    headers: {
      "access-control-allow-origin": APP_ORIGIN,
      "access-control-allow-credentials": "true",
    },
    body: JSON.stringify(body),
  })
  const returnToOf = (flow: "login" | "settings") =>
    record.started.findLast((entry) => entry.flow === flow)?.params.get("return_to") ?? ""

  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    if (url.host === APP_HOST) {
      return route.continue()
    }
    if (url.host !== SERVICE_HOST) {
      return route.abort()
    }

    if (url.pathname === "/sessions/whoami") {
      const answer = options.session[Math.min(record.whoamiCalls, options.session.length - 1)]!
      record.whoamiCalls += 1
      if (answer === "unreachable") {
        return route.abort()
      }
      const { status, body } = whoamiResponse(answer)
      return route.fulfill(json(status, body))
    }
    if (url.pathname === "/health/alive") {
      return route.fulfill({ status: 200, body: "" })
    }

    const browserMatch = url.pathname.match(/^\/self-service\/(login|settings)\/browser$/)
    if (browserMatch) {
      const flow = browserMatch[1] as "login" | "settings"
      record.started.push({ flow, params: url.searchParams })
      return route.fulfill({
        status: 303,
        headers: { location: `${APP_ORIGIN}${flow === "login" ? "/user/login" : "/user/settings"}?flow=e2e-flow` },
      })
    }
    if (url.pathname === "/self-service/login/flows") {
      const flow = fixture(options.loginFixture ?? "login-aal2-webauthn")
      flow.return_to = returnToOf("login")
      return route.fulfill(json(200, flow))
    }
    if (url.pathname === "/self-service/settings/flows") {
      const flow = fixture(options.settingsFixture ?? "settings-initial")
      flow.return_to = returnToOf("settings")
      options.editSettingsFlow?.(flow)
      return route.fulfill(json(200, flow))
    }
    if (url.pathname === "/self-service/logout/browser") {
      record.logoutCalls.push(url.pathname)
      return route.fulfill(json(200, { logout_url: `http://${SERVICE_HOST}/self-service/logout?token=e2e` }))
    }
    if (url.pathname === "/self-service/logout") {
      record.logoutCalls.push(url.pathname)
      return route.fulfill({ status: 204, headers: { "access-control-allow-origin": APP_ORIGIN, "access-control-allow-credentials": "true" } })
    }

    if (url.pathname === "/api/user/me") {
      return user
        ? route.fulfill(json(200, { status: 200, message: "ok", updatedData: user }))
        : route.fulfill(json(401, { status: 401, message: "missing auth proxy identity" }))
    }
    if (url.pathname === `/api/user/${USER_ID}/get-settings`) {
      return route.fulfill(json(200, { status: 200, message: "ok", updatedData: user ?? {} }))
    }
    if (url.pathname.startsWith("/api/admin/")) {
      record.adminCalls.push(`${route.request().method()} ${url.pathname}${url.search}`)
      return options.adminRefused
        ? route.fulfill(json(403, { status: 403, message: SECOND_FACTOR_REFUSAL }))
        : route.fulfill(json(200, { status: 200, message: "ok", updatedData: {} }))
    }
    return route.abort()
  })
  return record
}

function expectAppTarget(returnTo: string | null | undefined, path: string, params: Record<string, string>) {
  expect(returnTo).toBeTruthy()
  const url = new URL(returnTo ?? "")
  expect(url.origin).toBe(APP_ORIGIN)
  expect(url.pathname).toBe(path)
  expect(Object.fromEntries(url.searchParams)).toEqual(params)
}

const group = (page: Page, name: string) => page.locator(`[data-kratos-group="${name}"]`)

test.describe("an admin page without a passed second factor", () => {
  test("no second factor set up: opens the setup, which remembers the page", async ({ page }) => {
    const record = await mockServices(page, { session: ["aal1"] })

    await page.goto(ADMIN_TARGET)
    await page.waitForURL(/\/user\/settings\?flow=e2e-flow/)

    expect(record.started.map((entry) => entry.flow)).toEqual(["settings"])
    expectAppTarget(record.started[0]?.params.get("return_to"), "/user/settings", {
      section: "mfa",
      _identity_saved: "1",
      aal2_redirect: ADMIN_TARGET,
    })
    const notice = page.getByTestId("kratos-second-factor-notice")
    await expect(notice).toHaveAttribute("data-ready", "false")
    await expect(notice).toContainText("继续之前需要两步验证")
    await expect(notice.getByRole("link")).toHaveCount(0)
    expect(record.adminCalls).toEqual([])
  })

  test("a second factor that was not passed: asks for it and returns to the page", async ({ page }) => {
    const record = await mockServices(page, { session: ["second-factor-required"] })

    await page.goto(`${ADMIN_TARGET}?range=7d`)
    await page.waitForURL(/\/user\/login\?flow=e2e-flow/)

    expect(record.started.map((entry) => entry.flow)).toEqual(["login"])
    expect(record.started[0]?.params.get("aal")).toBe("aal2")
    expectAppTarget(record.started[0]?.params.get("return_to"), ADMIN_TARGET, {
      range: "7d",
      _login_success: "1",
      _aal2: "1",
    })

    await expect(page.getByRole("heading", { name: "两步验证" })).toBeVisible()
    const verify = page.locator('button[name="webauthn_login_trigger"]')
    await expect(verify).toHaveText("使用设备或安全密钥验证")
    // Nothing starts the device prompt but the person's click.
    await expect(page.locator('input[name="webauthn_login"]')).toHaveValue("")
    await expect(page.locator('input[name="totp_code"]')).toBeVisible()
    // One line says why: the page's reason stands in for Kratos' own prompt.
    await expect(page.getByText("该页面需要两步验证，验证后自动返回")).toBeVisible()
    await expect(page.getByText("请完成第二步验证后继续")).toHaveCount(0)
    await expect(page.getByTestId("login-second-factor-cancel")).toBeVisible()
    // Not a sign-in: no way to register or to recover a password here.
    await expect(page.getByRole("link", { name: "注册" })).toHaveCount(0)
  })

  test("a passed second factor: opens, and the return marker leaves the address", async ({ page }) => {
    const record = await mockServices(page, { session: ["aal2"] })

    await page.goto(`${ADMIN_TARGET}?_aal2=1`)
    await expect(page).toHaveURL(`${APP_ORIGIN}${ADMIN_TARGET}`)
    await expect.poll(() => record.adminCalls.length).toBeGreaterThan(0)
    expect(record.started).toEqual([])
  })

  test("a round trip that changed nothing stops instead of going round again", async ({ page }) => {
    const record = await mockServices(page, { session: ["second-factor-required"] })

    await page.goto(`${ADMIN_TARGET}?_aal2=1`)
    await expect(page).toHaveURL(`${APP_ORIGIN}/`)
    await expect(page.getByText("两步验证未完成")).toBeVisible()
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(`${APP_ORIGIN}/`)
    expect(record.started).toEqual([])
    expect(record.adminCalls).toEqual([])
  })

  test("a normal user is refused as before and is not asked for a second factor", async ({ page }) => {
    const record = await mockServices(page, { role: "user", session: ["aal1"] })

    await page.goto(ADMIN_TARGET)
    await expect(page).toHaveURL(`${APP_ORIGIN}/`)
    await expect(page.getByText("需要管理员权限")).toBeVisible()
    expect(record.started).toEqual([])
    expect(record.adminCalls).toEqual([])
  })

  test("the backend's refusal leads to the setup, and nothing is sent again", async ({ page }) => {
    // Kratos does not answer the guard, so the page opens; it answers afterwards.
    const record = await mockServices(page, { session: ["unreachable", "aal1"], adminRefused: true })

    await page.goto(ADMIN_TARGET)
    await page.waitForURL(/\/user\/settings\?flow=e2e-flow/)

    await expect(page.getByTestId("kratos-second-factor-notice")).toContainText("继续之前需要两步验证")
    expectAppTarget(record.started[0]?.params.get("return_to"), "/user/settings", {
      section: "mfa",
      _identity_saved: "1",
      aal2_redirect: ADMIN_TARGET,
    })
    // Each refused request went out once.
    expect(record.adminCalls.length).toBeGreaterThan(0)
    expect(new Set(record.adminCalls).size).toBe(record.adminCalls.length)
  })

  test("a refusal Kratos does not explain is reported once and does not move the page", async ({ page }) => {
    const record = await mockServices(page, { session: ["aal2"], adminRefused: true })

    await page.goto(ADMIN_TARGET)
    await expect(page.getByText("需要两步验证", { exact: true })).toHaveCount(1)
    await expect(page.getByText("完成验证后请重新操作")).toHaveCount(1)
    await expect(page).toHaveURL(`${APP_ORIGIN}${ADMIN_TARGET}`)
    expect(record.started).toEqual([])
    expect(new Set(record.adminCalls).size).toBe(record.adminCalls.length)
  })
})

test.describe("the sign-in page and the second factor", () => {
  test("a session that only passed its first factor starts the second factor, not a new sign-in", async ({ page }) => {
    const record = await mockServices(page, { role: null, session: ["second-factor-required"] })

    await page.goto(ADMIN_TARGET)
    await page.waitForURL(/\/user\/login\?flow=e2e-flow/)

    expect(record.started.map((entry) => entry.flow)).toEqual(["login"])
    expect(record.started[0]?.params.get("aal")).toBe("aal2")
    expectAppTarget(record.started[0]?.params.get("return_to"), ADMIN_TARGET, { _login_success: "1" })
  })

  test("a browser without a session starts a plain sign-in", async ({ page }) => {
    const record = await mockServices(page, { role: null, session: ["none"], loginFixture: "login-initial" })

    await page.goto("/user/login")
    await page.waitForURL(/\/user\/login\?flow=e2e-flow/)

    expect(record.started[0]?.params.has("aal")).toBe(false)
    expectAppTarget(record.started[0]?.params.get("return_to"), "/", { _login_success: "1" })
    await expect(page.getByTestId("login-second-factor-cancel")).toHaveCount(0)
  })

  test("a target on another site is dropped", async ({ page }) => {
    const record = await mockServices(page, { session: ["aal1"] })

    await page.goto(`/user/login?aal=aal2&redirect=${encodeURIComponent("https://evil.example/steal")}`)
    await page.waitForURL(/\/user\/login\?flow=e2e-flow/)

    expect(record.started[0]?.params.get("aal")).toBe("aal2")
    expectAppTarget(record.started[0]?.params.get("return_to"), "/", { _login_success: "1", _aal2: "1" })
  })

  test("an account with no second factor is pointed at the setup, with the page it came for", async ({ page }) => {
    await mockServices(page, { session: ["aal1"], loginFixture: "login-aal2-no-method" })

    await page.goto(`/user/login?aal=aal2&redirect=${encodeURIComponent(ADMIN_TARGET)}`)
    await page.waitForURL(/\/user\/login\?flow=e2e-flow/)

    const missing = page.getByTestId("login-second-factor-missing")
    await expect(missing).toContainText("还没有可用的两步验证方式")
    const link = new URL(await missing.getByRole("link").getAttribute("href") ?? "", APP_ORIGIN)
    expect(link.pathname).toBe("/user/identity-settings/mfa")
    expect(link.searchParams.get("aal2_redirect")).toBe(ADMIN_TARGET)
    // The empty form is not offered as a sign-in.
    await expect(page.locator("form")).toHaveCount(0)
  })

  test("cancelling leaves a signed-in session as it is", async ({ page }) => {
    const record = await mockServices(page, { session: ["aal1"] })

    await page.goto(`/user/login?aal=aal2&redirect=${encodeURIComponent(ADMIN_TARGET)}`)
    await page.waitForURL(/\/user\/login\?flow=e2e-flow/)
    await page.getByTestId("login-second-factor-cancel").click()

    await expect(page).toHaveURL(`${APP_ORIGIN}/`)
    expect(record.logoutCalls).toEqual([])
  })

  test("cancelling ends a session that only passed its first factor", async ({ page }) => {
    const record = await mockServices(page, { role: null, session: ["second-factor-required"] })

    await page.goto("/user/login")
    await page.waitForURL(/\/user\/login\?flow=e2e-flow/)
    await page.getByTestId("login-second-factor-cancel").click()

    await expect(page).toHaveURL(`${APP_ORIGIN}/`)
    expect(record.logoutCalls).toEqual(["/self-service/logout/browser", "/self-service/logout"])
  })
})

test.describe("the two-step settings page", () => {
  /** Leaves the passkey of settings-keys-registered and removes every second factor. */
  function passkeyOnly(flow: KratosFlow) {
    const secondFactorNodes = new Set(["webauthn_remove", "totp_unlink", "lookup_secret_reveal", "lookup_secret_disable"])
    flow.ui.nodes = flow.ui.nodes.filter((node) => !secondFactorNodes.has(node.attributes.name ?? ""))
  }

  test("a passkey switches on passkey sign-in only, not the WebAuthn second step", async ({ page }) => {
    await mockServices(page, { session: ["aal1"], settingsFixture: "settings-keys-registered", editSettingsFlow: passkeyOnly })

    await page.goto(`/user/identity-settings/mfa?aal2_redirect=${encodeURIComponent(ADMIN_TARGET)}`)
    await page.waitForURL(/\/user\/settings\?flow=e2e-flow/)

    await expect(group(page, "passkey")).toContainText("通行密钥登录")
    await expect(group(page, "passkey")).toContainText("已启用")
    await expect(group(page, "passkey")).toContainText("用于免密登录")
    await expect(group(page, "webauthn")).toContainText("WebAuthn 二次验证")
    await expect(group(page, "webauthn")).toContainText("未启用")
    await expect(group(page, "webauthn")).toContainText("免密登录的通行密钥不能直接用于这一步")
    await expect(group(page, "webauthn").getByRole("button", { name: "登记设备或安全密钥" })).toBeVisible()
    // The passkey does not count towards what the admin page needs.
    await expect(page.getByTestId("kratos-second-factor-notice")).toHaveAttribute("data-ready", "false")
  })

  test("a registered device shows as on and can be removed after a confirmation", async ({ page }) => {
    await mockServices(page, { session: ["aal2"], settingsFixture: "settings-keys-registered" })

    await page.goto("/user/identity-settings/mfa")
    await page.waitForURL(/\/user\/settings\?flow=e2e-flow/)

    await expect(group(page, "webauthn")).toContainText("已启用")
    await expect(page.getByTestId("kratos-second-factor-notice")).toHaveCount(0)
    await group(page, "webauthn").locator('button[name="webauthn_remove"]').click()
    await expect(page.getByRole("alertdialog")).toContainText("移除后不能再用它验证登录")
  })

  test("with a second factor set up, the setup offers the way on to the page that asked", async ({ page }) => {
    await mockServices(page, { session: ["aal2"], settingsFixture: "settings-keys-registered" })

    await page.goto(`/user/identity-settings/mfa?aal2_redirect=${encodeURIComponent(ADMIN_TARGET)}`)
    await page.waitForURL(/\/user\/settings\?flow=e2e-flow/)

    const notice = page.getByTestId("kratos-second-factor-notice")
    await expect(notice).toHaveAttribute("data-ready", "true")
    await notice.getByRole("link", { name: "继续" }).click()
    await expect(page).toHaveURL(`${APP_ORIGIN}${ADMIN_TARGET}`)
  })

  test("a saved second factor goes on to the page that asked", async ({ page }) => {
    const record = await mockServices(page, { session: ["aal2"] })

    await page.goto(`/user/settings?section=mfa&_identity_saved=1&aal2_redirect=${encodeURIComponent(ADMIN_TARGET)}`)
    await expect(page).toHaveURL(`${APP_ORIGIN}${ADMIN_TARGET}`)
    expect(record.started).toEqual([])
  })

  test("a saved change that is not a second factor opens the setup again", async ({ page }) => {
    const record = await mockServices(page, { session: ["aal1"] })

    await page.goto(`/user/settings?section=mfa&_identity_saved=1&aal2_redirect=${encodeURIComponent(ADMIN_TARGET)}`)
    await page.waitForURL(/\/user\/settings\?flow=e2e-flow/)

    expect(record.started.map((entry) => entry.flow)).toEqual(["settings"])
    expect(new URL(record.started[0]?.params.get("return_to") ?? "").searchParams.get("aal2_redirect")).toBe(ADMIN_TARGET)
    await expect(page.getByTestId("kratos-second-factor-notice")).toHaveAttribute("data-ready", "false")
  })

  test("a target on another site is not carried into the settings flow", async ({ page }) => {
    const record = await mockServices(page, { session: ["aal1"] })

    await page.goto(`/user/identity-settings/mfa?aal2_redirect=${encodeURIComponent("https://evil.example/steal")}`)
    await page.waitForURL(/\/user\/settings\?flow=e2e-flow/)

    expectAppTarget(record.started[0]?.params.get("return_to"), "/user/settings", { section: "mfa", _identity_saved: "1" })
    await expect(page.getByTestId("kratos-second-factor-notice")).toHaveCount(0)
  })
})
