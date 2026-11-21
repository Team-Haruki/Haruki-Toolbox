import { expect, test, type Page } from "@playwright/test"
import {
  addVirtualAuthenticator,
  countCredentials,
  createIdentity,
  deleteIdentity,
  mockBackend,
  probeSession,
  removeVirtualAuthenticator,
  signInWithPassword,
  signOut,
  submitPassword,
  totpCode,
  type TestIdentity,
} from "./helpers"

// Password sign-in with a second factor, against a real Kratos (see
// playwright.kratos.config.ts). Every session here is one Kratos issued to
// this browser, and every WebAuthn ceremony runs in Chromium against its
// virtual authenticator; only the toolbox backend is answered by the spec.
// Where a step is simulated instead, the test says so.

const APP_ORIGIN = "http://localhost:4183"

test.use({ locale: "zh-CN" })

let identity: TestIdentity

test.afterEach(async ({ request }) => {
  if (identity) {
    await deleteIdentity(request, identity)
  }
})

function group(page: Page, name: string) {
  return page.locator(`[data-kratos-group="${name}"]`)
}

async function expectOnApp(page: Page, path: string) {
  await page.waitForURL((url) => url.origin === APP_ORIGIN && url.pathname === path, { timeout: 20_000 })
}

/**
 * A settings change was saved: Kratos sent the browser back and the account
 * settings page is showing. (While the flow is open the address is
 * `/user/settings?flow=…` as well, so the path alone does not tell.)
 */
async function expectSettingsSaved(page: Page) {
  await expect(page.getByTestId("account-security")).toBeVisible()
  await expectOnApp(page, "/user/settings")
}

/** Opens the two-step settings page and waits for the Kratos settings flow to render. */
async function openTwoStepSettings(page: Page) {
  await page.goto("/user/identity-settings/mfa")
  await expect(group(page, "webauthn")).toBeVisible()
}

/** Registers the virtual authenticator as a device for the second step, from the open settings flow. */
async function registerSecondStepDevice(page: Page, name: string) {
  await group(page, "webauthn").locator('input[name="webauthn_register_displayname"]').fill(name)
  await group(page, "webauthn").locator('button[name="webauthn_register_trigger"]').click()
}

test("a passkey signs in at the first level and does not switch on the WebAuthn second step", async ({ page, request }) => {
  identity = await createIdentity(request)
  await mockBackend(page)
  const authenticator = await addVirtualAuthenticator(page, "platform")

  await signInWithPassword(page, identity)
  await openTwoStepSettings(page)
  await expect(group(page, "passkey")).toContainText("未启用")
  await expect(group(page, "webauthn")).toContainText("未启用")

  await group(page, "passkey").locator('button[name="passkey_register_trigger"]').click()
  await expectSettingsSaved(page)
  expect(await countCredentials(authenticator)).toBe(1)

  // The two methods are separate credentials in Kratos: only the passkey is on.
  await openTwoStepSettings(page)
  await expect(group(page, "passkey")).toContainText("已启用")
  await expect(group(page, "passkey")).toContainText("通行密钥登录")
  await expect(group(page, "webauthn")).toContainText("未启用")
  await expect(group(page, "webauthn")).toContainText("硬件安全密钥")
  await expect(group(page, "webauthn").locator('button[name="webauthn_remove"]')).toHaveCount(0)

  await signOut(page)
  await page.goto("/user/login")
  // Kratos starts a passkey request as the sign-in page loads (the browser's
  // autofill offer). A person picks the passkey from that offer; the virtual
  // authenticator answers it unasked. The button is the same sign-in for a
  // browser that made no offer.
  const signedIn = await expectOnApp(page, "/").then(() => true, () => false)
  if (!signedIn) {
    await page.locator('button[name="passkey_login_trigger"]').click()
    await expectOnApp(page, "/")
  }

  const session = await probeSession(page)
  expect(session.status).toBe(200)
  expect(session.aal).toBe("aal1")
  expect(session.methods).toEqual(["passkey"])
})

test("registering a device, then password sign-in and the second factor, ends at aal2 on the page that asked", async ({ page, request }) => {
  identity = await createIdentity(request, { role: "admin" })
  await mockBackend(page)
  const authenticator = await addVirtualAuthenticator(page, "security-key")

  await signInWithPassword(page, identity)
  expect((await probeSession(page)).aal).toBe("aal1")

  // An admin without a second factor is taken to where one is set up.
  await page.goto("/admin/dashboard")
  await expectOnApp(page, "/user/settings")
  const notice = page.getByTestId("kratos-second-factor-notice")
  await expect(notice).toHaveAttribute("data-ready", "false")
  await expect(notice).toContainText("继续之前需要两步验证")

  await registerSecondStepDevice(page, "虚拟安全密钥")
  // Saved: Kratos raises the session, and the app goes on to the admin page.
  await expectOnApp(page, "/admin/dashboard")
  expect(await countCredentials(authenticator)).toBe(1)
  const afterSetup = await probeSession(page)
  expect(afterSetup.aal).toBe("aal2")
  expect(afterSetup.methods).toEqual(["password", "webauthn"])

  // A new sign-in: password first, then Kratos asks for the second factor.
  await signOut(page)
  await page.goto("/admin/dashboard")
  await expectOnApp(page, "/user/login")
  await submitPassword(page, identity)

  const verify = page.locator('button[name="webauthn_login_trigger"]')
  await expect(verify).toBeVisible()
  await expect(verify).toHaveText("使用安全密钥验证")
  await expect(page.getByRole("heading", { name: "两步验证" })).toBeVisible()
  // Half-way: Kratos does not accept the session yet.
  expect((await probeSession(page)).errorId).toBe("session_aal2_required")

  await verify.click()
  await expectOnApp(page, "/admin/dashboard")
  const session = await probeSession(page)
  expect(session.status).toBe(200)
  expect(session.aal).toBe("aal2")
  expect(session.methods).toEqual(["password", "webauthn"])

  await removeVirtualAuthenticator(authenticator)
})

test("an abandoned second factor is asked for again, and cancelling it signs out without a loop", async ({ page, request }) => {
  identity = await createIdentity(request, { role: "admin" })
  await mockBackend(page)
  await addVirtualAuthenticator(page, "security-key")

  await signInWithPassword(page, identity)
  await openTwoStepSettings(page)
  await registerSecondStepDevice(page, "虚拟安全密钥")
  await expectSettingsSaved(page)
  await signOut(page)

  // Password only, then the page is left: the session stays at the first level.
  await page.goto("/user/login")
  await submitPassword(page, identity)
  await expect(page.locator('button[name="webauthn_login_trigger"]')).toBeVisible()
  await page.goto("/")
  expect((await probeSession(page)).errorId).toBe("session_aal2_required")

  // Kratos answers a plain sign-in on that session with "already signed in";
  // the page asks for the second factor instead.
  await page.goto("/admin/dashboard")
  await expectOnApp(page, "/user/login")
  await expect(page.locator('button[name="webauthn_login_trigger"]')).toBeVisible()
  expect(new URL(page.url()).searchParams.get("flow")).toBeTruthy()

  await page.getByTestId("login-second-factor-cancel").click()
  await expectOnApp(page, "/")
  expect((await probeSession(page)).status).toBe(401)
  // Settled on the home page: nothing sends the browser on from here.
  await page.waitForTimeout(1500)
  expect(new URL(page.url()).pathname).toBe("/")
})

test("a failed device check leaves the authenticator app usable", async ({ page, request }) => {
  identity = await createIdentity(request, { role: "admin" })
  await mockBackend(page)
  const authenticator = await addVirtualAuthenticator(page, "security-key")

  await signInWithPassword(page, identity)
  await openTwoStepSettings(page)

  // The authenticator app first: its secret is on the page.
  const secret = (await group(page, "totp").locator("p.font-mono").first().innerText()).trim()
  await group(page, "totp").locator('input[name="totp_code"]').fill(totpCode(secret))
  await group(page, "totp").locator('button[type="submit"][name="method"][value="totp"]').click()
  await expectSettingsSaved(page)

  await openTwoStepSettings(page)
  await expect(group(page, "totp")).toContainText("已启用")
  await registerSecondStepDevice(page, "虚拟安全密钥")
  await expectSettingsSaved(page)
  await signOut(page)

  await page.goto("/admin/dashboard")
  await expectOnApp(page, "/user/login")
  await submitPassword(page, identity)
  const verify = page.locator('button[name="webauthn_login_trigger"]')
  await expect(verify).toBeVisible()
  await expect(page.locator('input[name="totp_code"]')).toBeVisible()

  // Simulated: the device the key was registered on is gone, so the browser
  // rejects the request the way it does for a dismissed or timed-out prompt.
  await removeVirtualAuthenticator(authenticator)
  await page.evaluate(() => {
    navigator.credentials.get = () => Promise.reject(new DOMException("The operation either timed out or was not allowed.", "NotAllowedError"))
  })
  await verify.click()
  await expect(page.getByText("操作已取消或超时。请重试，并在系统弹窗中完成确认。")).toBeVisible()
  await expect(verify).toBeEnabled()
  expect((await probeSession(page)).errorId).toBe("session_aal2_required")

  // Simulated: a browser without WebAuthn.
  await page.evaluate(() => {
    Object.defineProperty(window, "PublicKeyCredential", { value: undefined, configurable: true })
  })
  await verify.click()
  await expect(page.getByText(/当前浏览器不支持通行密钥或安全密钥/)).toBeVisible()

  // The other registered method still works, on the same flow.
  await page.locator('input[name="totp_code"]').fill(totpCode(secret))
  await page.locator('button[type="submit"][name="method"][value="totp"]').click()
  await expectOnApp(page, "/admin/dashboard")
  const session = await probeSession(page)
  expect(session.aal).toBe("aal2")
  expect(session.methods).toEqual(["password", "totp"])
})

test("a normal user is refused the admin area as before, with no second factor asked", async ({ page, request }) => {
  identity = await createIdentity(request)
  await mockBackend(page)

  await signInWithPassword(page, identity)
  await page.goto("/admin/dashboard")
  await expectOnApp(page, "/")
  await expect(page.getByText("需要管理员权限")).toBeVisible()
  expect((await probeSession(page)).aal).toBe("aal1")
})

test("a second-factor sign-in never returns to another site", async ({ page, request }) => {
  identity = await createIdentity(request, { role: "admin" })
  await mockBackend(page)

  await signInWithPassword(page, identity)
  await page.goto(`/user/login?aal=aal2&redirect=${encodeURIComponent("https://evil.example/steal")}`)
  await page.waitForURL((url) => url.pathname === "/user/login" && url.searchParams.has("flow"))

  const flowId = new URL(page.url()).searchParams.get("flow")
  const flow = await (await page.context().request.get(
    `http://localhost:4433/self-service/login/flows?id=${flowId}`,
    { headers: { Accept: "application/json" } },
  )).json() as { requested_aal: string; return_to: string }
  expect(flow.requested_aal).toBe("aal2")
  expect(new URL(flow.return_to).origin).toBe(APP_ORIGIN)
  expect(new URL(flow.return_to).pathname).toBe("/")

  // This account has no second factor: Kratos sends an empty form, and the
  // page points at where one is set up.
  await expect(page.getByTestId("login-second-factor-missing")).toBeVisible()
  await page.getByTestId("login-second-factor-missing").getByRole("link").click()
  await expectOnApp(page, "/user/settings")
  await expect(group(page, "webauthn")).toBeVisible()
})
