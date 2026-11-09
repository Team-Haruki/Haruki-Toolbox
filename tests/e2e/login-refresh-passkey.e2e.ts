import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test, type Page, type Request } from "@playwright/test"

// A Kratos refresh (re-authentication) flow for a passkey-only account. The
// flow is the real login-initial fixture with the passkey nodes kept and the
// challenge pinned to the account's credential, as Kratos v26's
// PopulateLoginMethodFirstFactorRefresh does. The authenticator is a stub on
// navigator.credentials.get that records the request it received.

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "kratos")
const KRATOS_HOST = "127.0.0.1:9"
const KRATOS_ORIGIN = `http://${KRATOS_HOST}`

const SIGNED_IN_USER = {
  name: "Kanade",
  userId: "toolbox-e2e",
  gameAccountBindings: [],
  sessionToken: "e2e-token",
  tokenExpiration: 4_102_444_800,
}

interface RefreshFlowOptions {
  appOrigin: string
  /** Kratos ui.messages, e.g. the 4000015 failure. */
  messages?: Array<{ id: number; text: string; type: string }>
}

function buildRefreshFlow({ appOrigin, messages }: RefreshFlowOptions) {
  const flow = JSON.parse(readFileSync(join(FIXTURE_DIR, "login-initial.json"), "utf8"))
  flow.id = "e2e-flow"
  flow.refresh = true
  flow.request_url = `${KRATOS_ORIGIN}/self-service/login/browser?refresh=true`
  flow.return_to = `${appOrigin}/user/identity-settings/password?flow=old-settings-flow`
  flow.ui.action = `${KRATOS_ORIGIN}/self-service/login?flow=e2e-flow`
  flow.ui.messages = messages ?? [
    { id: 1010003, text: "Please confirm this action by verifying that it is you.", type: "info" },
  ]
  const keep = new Set(["csrf_token", "passkey_login_trigger", "passkey_login", "passkey_challenge"])
  flow.ui.nodes = flow.ui.nodes.filter(
    (node: { attributes: { name?: string; node_type: string } }) =>
      node.attributes.node_type === "script" || keep.has(node.attributes.name ?? "")
  )
  for (const node of flow.ui.nodes) {
    if (node.attributes.name === "passkey_challenge") {
      node.attributes.value = JSON.stringify({
        publicKey: {
          challenge: "cmVmcmVzaC1jaGFsbGVuZ2U",
          timeout: 300000,
          rpId: "127.0.0.1",
          userVerification: "preferred",
          allowCredentials: [{ type: "public-key", id: "Y3JlZC1pZA" }],
        },
      })
    }
    if (node.attributes.name === "passkey_login") {
      // The refresh flow has no conditional UI, so no onload trigger.
      delete node.attributes.onload
      delete node.attributes.onloadTrigger
    }
  }
  flow.ui.nodes.push({
    type: "input",
    group: "default",
    attributes: { name: "identifier", type: "hidden", value: "kanade@example.com", disabled: false, node_type: "input" },
    messages: [],
    meta: {},
  })
  return flow
}

interface AuthenticatorStubOptions {
  /** Whether the stub returns a user handle; a non-discoverable request may omit it. */
  withUserHandle: boolean
}

async function installAuthenticatorStub(page: Page, options: AuthenticatorStubOptions) {
  await page.addInitScript(({ withUserHandle }) => {
    const win = window as unknown as Record<string, unknown>
    if (!win.PublicKeyCredential) {
      win.PublicKeyCredential = function PublicKeyCredential() {}
    }
    const encoder = new TextEncoder()
    const stub = async (request: { publicKey?: Record<string, unknown> }) => {
      const publicKey = request.publicKey ?? {}
      const challenge = publicKey.challenge as ArrayBuffer | Uint8Array
      win.__e2ePasskeyRequest = {
        hasAllowCredentials: "allowCredentials" in publicKey,
        rpId: publicKey.rpId,
        userVerification: publicKey.userVerification,
        challenge: new TextDecoder().decode(challenge instanceof Uint8Array ? challenge : new Uint8Array(challenge)),
      }
      return {
        id: "Y3JlZC1pZA",
        rawId: encoder.encode("cred-id").buffer,
        type: "public-key",
        response: {
          authenticatorData: encoder.encode("auth-data").buffer,
          clientDataJSON: encoder.encode("client-data").buffer,
          signature: encoder.encode("signature").buffer,
          userHandle: withUserHandle ? encoder.encode("user-handle").buffer : null,
        },
      }
    }
    Object.defineProperty(navigator, "credentials", {
      configurable: true,
      value: { get: stub, create: async () => null },
    })
  }, options)
}

function kratosJson(appOrigin: string, body: unknown) {
  return {
    status: 200,
    contentType: "application/json",
    headers: {
      "access-control-allow-origin": appOrigin,
      "access-control-allow-credentials": "true",
    },
    body: JSON.stringify(body),
  }
}

interface MockedKratos {
  loginPosts: Request[]
  logoutCalls: string[]
  browserFlowStarts: string[]
}

async function mockKratos(page: Page, appOrigin: string, flow: unknown): Promise<MockedKratos> {
  const mocked: MockedKratos = { loginPosts: [], logoutCalls: [], browserFlowStarts: [] }
  await page.route("**/*", (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.origin === appOrigin) {
      return route.continue()
    }
    if (url.host !== KRATOS_HOST) {
      return route.abort()
    }
    if (url.pathname === "/self-service/login/flows") {
      return route.fulfill(kratosJson(appOrigin, flow))
    }
    if (url.pathname === "/self-service/login" && request.method() === "POST") {
      mocked.loginPosts.push(request)
      return route.fulfill({ status: 200, contentType: "text/html", body: "<title>kratos-login-posted</title>" })
    }
    if (url.pathname === "/self-service/login/browser") {
      mocked.browserFlowStarts.push(request.url())
      return route.fulfill({ status: 200, contentType: "text/html", body: "<title>kratos-login-browser</title>" })
    }
    if (url.pathname === "/self-service/logout/browser") {
      mocked.logoutCalls.push("flow")
      return route.fulfill(
        kratosJson(appOrigin, { logout_url: `${KRATOS_ORIGIN}/self-service/logout?token=e2e-logout`, logout_token: "e2e-logout" })
      )
    }
    if (url.pathname === "/self-service/logout") {
      mocked.logoutCalls.push("logout")
      return route.fulfill({
        status: 204,
        headers: { "access-control-allow-origin": appOrigin, "access-control-allow-credentials": "true" },
      })
    }
    if (url.pathname.endsWith(".js")) {
      return route.fulfill({ status: 200, contentType: "text/javascript", body: "" })
    }
    return route.abort()
  })
  return mocked
}

function appOriginOf() {
  return new URL(test.info().project.use.baseURL ?? "http://127.0.0.1:4173").origin
}

// Seeded once per browser context: after "sign out and sign in again" the
// store has cleared the user, and re-seeding on the next document would make
// the guest-only login route bounce back to the settings page.
test.beforeEach(async ({ page }) => {
  await page.addInitScript((user) => {
    if (sessionStorage.getItem("__e2e_seeded") === null) {
      sessionStorage.setItem("__e2e_seeded", "1")
      sessionStorage.setItem("user", JSON.stringify(user))
    }
  }, SIGNED_IN_USER)
})

test("the refresh passkey button sends a discoverable request and posts the assertion", async ({ page }) => {
  const appOrigin = appOriginOf()
  await installAuthenticatorStub(page, { withUserHandle: true })
  const mocked = await mockKratos(page, appOrigin, buildRefreshFlow({ appOrigin }))

  await page.goto("/user/login?flow=e2e-flow")
  await expect(page.getByText("为确认是你本人，请再次验证身份")).toBeVisible()

  const posted = page.waitForRequest((request) => request.method() === "POST" && request.url().startsWith(`${KRATOS_ORIGIN}/self-service/login`))
  await page.getByRole("button", { name: "使用通行密钥登录", exact: true }).click()
  const request = await posted
  await expect(page).toHaveTitle("kratos-login-posted")

  const passkeyRequest = await page.evaluate(() => (window as unknown as Record<string, unknown>).__e2ePasskeyRequest).catch(() => null)
  // The stub ran on the previous document; read it from the captured post instead when gone.
  const body = new URLSearchParams(request.postData() ?? "")
  const assertion = JSON.parse(body.get("passkey_login") ?? "{}")
  expect(assertion.id).toBe("Y3JlZC1pZA")
  expect(assertion.response.userHandle).toBe("dXNlci1oYW5kbGU")
  expect(body.get("csrf_token")).toBe("e2e-csrf")
  expect(body.get("passkey_challenge")).toContain("allowCredentials")
  expect(mocked.loginPosts).toHaveLength(1)
  if (passkeyRequest) {
    expect(passkeyRequest).toMatchObject({ hasAllowCredentials: false, rpId: "127.0.0.1", challenge: "refresh-challenge" })
  }
})

test("the authenticator request recorded by the stub carries no allowCredentials", async ({ page }) => {
  const appOrigin = appOriginOf()
  await installAuthenticatorStub(page, { withUserHandle: true })
  await mockKratos(page, appOrigin, buildRefreshFlow({ appOrigin }))
  // Keep the document alive: swallow the native submit so the recorded request survives.
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      HTMLFormElement.prototype.submit = function submit() {
        ;(window as unknown as Record<string, unknown>).__e2eSubmitted = new FormData(this).get("passkey_login")
      }
    })
  })

  await page.goto("/user/login?flow=e2e-flow")
  await page.getByRole("button", { name: "使用通行密钥登录", exact: true }).click()

  await expect
    .poll(() => page.evaluate(() => (window as unknown as Record<string, unknown>).__e2ePasskeyRequest))
    .toEqual({ hasAllowCredentials: false, rpId: "127.0.0.1", userVerification: "preferred", challenge: "refresh-challenge" })
  const submitted = await page.evaluate(() => (window as unknown as Record<string, unknown>).__e2eSubmitted)
  expect(JSON.parse(String(submitted)).response.userHandle).toBe("dXNlci1oYW5kbGU")
})

test("a refresh that lost the user handle offers to sign out and sign in again", async ({ page }) => {
  const appOrigin = appOriginOf()
  await installAuthenticatorStub(page, { withUserHandle: false })
  const mocked = await mockKratos(
    page,
    appOrigin,
    buildRefreshFlow({
      appOrigin,
      messages: [{ id: 4000015, text: "This account does not exist or has no security key set up.", type: "error" }],
    })
  )

  await page.goto("/user/login?flow=e2e-flow")
  const hint = page.getByTestId("login-refresh-passkey-mismatch")
  await expect(hint).toBeVisible()
  await expect(hint).toContainText("再次验证没有完成")
  await expect(page.getByText("这个账号不存在")).toHaveCount(0)
  if (process.env.E2E_SHOT_DIR) {
    await page.locator("[data-slot='card']").first().screenshot({ path: `${process.env.E2E_SHOT_DIR}/refresh-passkey-mismatch-light.png` })
    await page.emulateMedia({ colorScheme: "dark" })
    await page.waitForTimeout(400)
    await page.locator("[data-slot='card']").first().screenshot({ path: `${process.env.E2E_SHOT_DIR}/refresh-passkey-mismatch-dark.png` })
    await page.emulateMedia({ colorScheme: "light" })
  }

  await hint.getByRole("button", { name: "退出并重新登录" }).click()
  await expect(page).toHaveTitle("kratos-login-browser")

  expect(mocked.logoutCalls).toEqual(["flow", "logout"])
  expect(mocked.browserFlowStarts).toHaveLength(1)
  const returnTo = new URL(mocked.browserFlowStarts[0]).searchParams.get("return_to") ?? ""
  const returnToUrl = new URL(returnTo)
  expect(returnToUrl.origin).toBe(appOrigin)
  expect(returnToUrl.pathname).toBe("/user/identity-settings/password")
  expect(returnToUrl.searchParams.get("flow")).toBeNull()
  expect(returnToUrl.searchParams.get("_login_success")).toBe("1")
})
