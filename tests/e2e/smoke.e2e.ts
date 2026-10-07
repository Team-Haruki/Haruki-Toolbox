import { expect, test } from "@playwright/test"

test("settings dialog renders i18n controls", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: /^(设置|Settings)$/ }).click()

  const settingsDialog = page.getByRole("dialog", { name: /Haruki工具箱设置|Haruki Toolbox Settings/ })

  await expect(settingsDialog.getByRole("heading", { name: /Haruki工具箱设置|Haruki Toolbox Settings/ })).toBeVisible()
  await expect(
    settingsDialog.getByText("工具箱服务器端点", { exact: true }).or(settingsDialog.getByText("Toolbox server endpoint", { exact: true })),
  ).toBeVisible()
  await expect(settingsDialog.getByText("界面语言", { exact: true }).or(settingsDialog.getByText("Language", { exact: true }))).toBeVisible()
})

test("oidc logout route renders the invalid-challenge fallback", async ({ page }) => {
  await page.goto("/logout")

  await expect(page.getByText(/无效的退出请求|Invalid sign-out request/)).toBeVisible()
  await expect(page.getByRole("button", { name: /返回首页|Back to home/ })).toBeVisible()
})

test("app mounts while the session bootstrap is still pending", async ({ page }) => {
  // A backend that accepts the connection and then stalls must cost a late
  // session sync, not a splash that outlives the test.
  await page.route("**/api/user/me*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 20_000))
    await route.abort().catch(() => undefined)
  })

  await page.goto("/")

  await expect(page.getByRole("heading", { name: /欢迎使用 Haruki 工具箱|Welcome to Haruki Toolbox/ })).toBeVisible({ timeout: 10_000 })
})

test("unknown route shows 404 page with a way back home", async ({ page }) => {
  await page.goto("/this/route/does/not/exist")

  await expect(page.getByRole("heading", { name: /页面不存在|Page not found/ })).toBeVisible()

  await page.getByRole("link", { name: /返回首页|Back to home/ }).click()
  await expect(page.getByRole("heading", { name: /欢迎使用 Haruki 工具箱|Welcome to Haruki Toolbox/ })).toBeVisible()
})

// Kratos (VITE_HARUKI_TOOLBOX_AUTH_URL in .env.e2e) is mocked below: its
// browser endpoint answers like Kratos does, by sending the browser back to
// the auth page with only ?flow=, and the flow it serves echoes return_to.
const KRATOS_HOST = "127.0.0.1:9"
const APP_HOST = "127.0.0.1:4173"
const DEVICE_REDIRECT = "/device?user_code=BCDF-GHJK"

type KratosAuthFlowType = "login" | "registration"

function kratosFlowBody(flowType: KratosAuthFlowType, returnTo: string) {
  return JSON.stringify({
    id: `e2e-${flowType}-flow`,
    type: "browser",
    return_to: returnTo,
    ui: {
      action: `http://${KRATOS_HOST}/self-service/${flowType}?flow=e2e-${flowType}-flow`,
      method: "POST",
      nodes: [
        {
          type: "input",
          group: "default",
          attributes: { name: "csrf_token", type: "hidden", value: "e2e-csrf", required: true },
          messages: [],
          meta: {},
        },
        {
          type: "input",
          group: "default",
          attributes: { name: "identifier", type: "email", value: "", required: true },
          messages: [],
          meta: { label: { text: "Email" } },
        },
        {
          type: "input",
          group: "password",
          attributes: { name: "method", type: "submit", value: "password" },
          messages: [],
          meta: { label: { text: "Continue" } },
        },
      ],
    },
  })
}

const KRATOS_CSRF_NODE = {
  type: "input",
  group: "default",
  attributes: { name: "csrf_token", type: "hidden", value: "e2e-csrf", required: true, node_type: "input" },
  messages: [],
  meta: {},
}

// A verification flow as Kratos v25 serves it after the sign-up's
// show_verification_ui hook: it inherits the registration flow's return_to.
// Once the code is accepted (passed_challenge) the form turns into a GET to
// that URL and Kratos adds a "continue" link to it.
function kratosVerificationFlow(state: "sent_email" | "passed_challenge", returnTo: string) {
  const base = { id: "e2e-verification-flow", type: "browser", state, return_to: returnTo }
  if (state === "passed_challenge") {
    const continueLabel = { id: 1070009, text: "Continue", type: "info" }
    return {
      ...base,
      ui: {
        action: returnTo,
        method: "GET",
        messages: [{ id: 1080002, text: "You successfully verified your email address.", type: "success" }],
        nodes: [
          KRATOS_CSRF_NODE,
          {
            type: "a",
            group: "code",
            attributes: { href: returnTo, title: continueLabel, id: "continue", node_type: "a" },
            messages: [],
            meta: { label: continueLabel },
          },
        ],
      },
    }
  }

  return {
    ...base,
    ui: {
      action: `http://${KRATOS_HOST}/self-service/verification?flow=e2e-verification-flow`,
      method: "POST",
      messages: [{ id: 1080003, text: "An email containing a verification code has been sent.", type: "info" }],
      nodes: [
        KRATOS_CSRF_NODE,
        {
          type: "input",
          group: "code",
          attributes: { name: "code", type: "text", required: true, node_type: "input" },
          messages: [],
          meta: { label: { id: 1070012, text: "Verification code", type: "info" } },
        },
        {
          type: "input",
          group: "code",
          attributes: { name: "method", type: "submit", value: "code", node_type: "input" },
          messages: [],
          meta: { label: { id: 1070005, text: "Submit", type: "info" } },
        },
      ],
    },
  }
}

function kratosJsonResponse(body: string) {
  return {
    status: 200,
    contentType: "application/json",
    headers: {
      "access-control-allow-origin": `http://${APP_HOST}`,
      "access-control-allow-credentials": "true",
    },
    body,
  }
}

interface KratosMockOptions {
  /** Served for /self-service/verification/flows. */
  verificationFlow?: ReturnType<typeof kratosVerificationFlow>
}

// Records the return_to each browser flow was started with and serves it back
// on the flow, as Kratos would.
async function mockKratosAuthFlows(page: import("@playwright/test").Page, options: KratosMockOptions = {}) {
  const startedReturnTo: Partial<Record<KratosAuthFlowType, string | null>> = {}
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    if (url.host === APP_HOST) {
      return route.continue()
    }
    if (url.host !== KRATOS_HOST) {
      return route.abort()
    }

    const browserMatch = url.pathname.match(/^\/self-service\/(login|registration)\/browser$/)
    if (browserMatch) {
      const flowType = browserMatch[1] as KratosAuthFlowType
      startedReturnTo[flowType] = url.searchParams.get("return_to")
      const uiPath = flowType === "login" ? "/user/login" : "/user/register"
      return route.fulfill({
        status: 303,
        headers: { location: `http://${APP_HOST}${uiPath}?flow=e2e-${flowType}-flow` },
      })
    }

    const flowMatch = url.pathname.match(/^\/self-service\/(login|registration)\/flows$/)
    if (flowMatch) {
      const flowType = flowMatch[1] as KratosAuthFlowType
      return route.fulfill(kratosJsonResponse(kratosFlowBody(flowType, startedReturnTo[flowType] ?? "")))
    }

    if (url.pathname === "/self-service/verification/flows" && options.verificationFlow) {
      return route.fulfill(kratosJsonResponse(JSON.stringify(options.verificationFlow)))
    }

    return route.abort()
  })
  return startedReturnTo
}

function expectSameOriginTarget(returnTo: string | null | undefined, target: string) {
  expect(returnTo).toBeTruthy()
  const url = new URL(returnTo ?? "")
  expect(url.host).toBe(APP_HOST)
  expect(`${url.pathname}${url.search}`).toBe(target)
}

test("register link on the sign-in page keeps the redirect target", async ({ page }) => {
  const startedReturnTo = await mockKratosAuthFlows(page)

  await page.goto(`/user/login?redirect=${encodeURIComponent(DEVICE_REDIRECT)}`)
  await page.waitForURL(/\/user\/login\?flow=e2e-login-flow/)

  // Compare the decoded parameter: vue-router leaves `/ ? =` unescaped in the href.
  const registerLink = page.getByRole("link", { name: /^(注册|Register)$/ })
  await expect(registerLink).toBeVisible()
  const href = await registerLink.getAttribute("href")
  expect(new URL(href ?? "", page.url()).searchParams.get("redirect")).toBe(DEVICE_REDIRECT)

  // Following it starts the registration flow with the same target.
  await registerLink.click()
  await page.waitForURL(/\/user\/register\?flow=e2e-registration-flow/)
  expectSameOriginTarget(startedReturnTo.registration, DEVICE_REDIRECT)
})

test("register link on a plain sign-in page carries no redirect", async ({ page }) => {
  const startedReturnTo = await mockKratosAuthFlows(page)

  await page.goto("/user/login")
  await page.waitForURL(/\/user\/login\?flow=e2e-login-flow/)
  // The sign-in flow returns to its own fallback, which is not a target to forward.
  expectSameOriginTarget(startedReturnTo.login, "/?_login_success=1")

  const registerLink = page.getByRole("link", { name: /^(注册|Register)$/ })
  await expect(registerLink).toBeVisible()
  expect(await registerLink.getAttribute("href")).toBe("/user/register")

  // So the registration flow keeps the Kratos default return URL.
  await registerLink.click()
  await page.waitForURL(/\/user\/register\?flow=e2e-registration-flow/)
  expect(startedReturnTo.registration).toBeNull()
})

test("register page passes the redirect target to Kratos as return_to", async ({ page }) => {
  const startedReturnTo = await mockKratosAuthFlows(page)

  await page.goto(`/user/register?redirect=${encodeURIComponent(DEVICE_REDIRECT)}`)
  await page.waitForURL(/\/user\/register\?flow=e2e-registration-flow/)
  expectSameOriginTarget(startedReturnTo.registration, DEVICE_REDIRECT)

  // The sign-in link recovers the target from the loaded flow.
  const loginLink = page.getByRole("link", { name: /^(去登录|Sign in)$/ })
  await expect(loginLink).toBeVisible()
  const href = await loginLink.getAttribute("href")
  expect(new URL(href ?? "", page.url()).searchParams.get("redirect")).toBe(DEVICE_REDIRECT)
})

test("register page ignores an off-origin redirect", async ({ page }) => {
  const startedReturnTo = await mockKratosAuthFlows(page)

  await page.goto(`/user/register?redirect=${encodeURIComponent("/\\evil.example/")}`)
  await page.waitForURL(/\/user\/register\?flow=e2e-registration-flow/)
  expect(startedReturnTo.registration).toBeNull()

  const loginLink = page.getByRole("link", { name: /^(去登录|Sign in)$/ })
  await expect(loginLink).toBeVisible()
  expect(await loginLink.getAttribute("href")).toBe("/user/login")
})

test("register page restarts a flow whose return_to leaves the allowed origins", async ({ page }) => {
  const startedReturnTo = await mockKratosAuthFlows(page)
  // A registration flow someone else started, pointing off-site.
  startedReturnTo.registration = "https://evil.example/"

  await page.goto("/user/register?flow=e2e-registration-flow")

  // The page starts a fresh flow, which carries no return_to.
  await expect.poll(() => startedReturnTo.registration).toBeNull()
})

test("verification page continues to the sign-up target once the code is accepted", async ({ page }) => {
  const returnTo = `http://${APP_HOST}${DEVICE_REDIRECT}`
  await mockKratosAuthFlows(page, { verificationFlow: kratosVerificationFlow("passed_challenge", returnTo) })

  await page.goto("/user/verification?flow=e2e-verification-flow")

  await expect(page.getByText("You successfully verified your email address.")).toBeVisible()
  const continueLink = page.getByRole("link", { name: /^(继续|Continue)$/ })
  await expect(continueLink).toBeVisible()
  expect(await continueLink.getAttribute("href")).toBe(DEVICE_REDIRECT)
  // Submitting Kratos' GET form would replace the query and drop ?user_code=.
  await expect(page.locator(`form[action="${returnTo}"]`)).toHaveCount(0)

  await continueLink.click()
  await page.waitForURL((url) => `${url.pathname}${url.search}` === DEVICE_REDIRECT)
})

test("verification page never continues off the app origin", async ({ page }) => {
  // The API origin is an allowed Kratos return URL, but not a page to land on.
  const returnTo = "https://toolbox-api.example.com/"
  await mockKratosAuthFlows(page, { verificationFlow: kratosVerificationFlow("passed_challenge", returnTo) })

  await page.goto("/user/verification?flow=e2e-verification-flow")

  const continueLink = page.getByRole("link", { name: /^(继续|Continue)$/ })
  await expect(continueLink).toBeVisible()
  expect(await continueLink.getAttribute("href")).toBe("/")
})

test("verification page keeps the code form until the flow has passed", async ({ page }) => {
  await mockKratosAuthFlows(page, {
    verificationFlow: kratosVerificationFlow("sent_email", `http://${APP_HOST}${DEVICE_REDIRECT}`),
  })

  await page.goto("/user/verification?flow=e2e-verification-flow")

  await expect(page.getByRole("textbox", { name: "Verification code" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Submit" })).toBeVisible()
  await expect(page.getByRole("link", { name: /^(继续|Continue)$/ })).toHaveCount(0)
})

test("authorized apps list one row per consent of the same client", async ({ page }) => {
  // A rendering smoke check, not a guard for the v-for key: Vue reports
  // duplicate keys only while it patches a keyed list in place, and this list
  // is remounted (skeleton first) on every fetch, so the warning check below
  // also passes with the old clientId key. The key itself is covered by
  // oauth-authorizations.test.ts; an in-place update assertion belongs with
  // FE-4, which groups and patches the rows.
  const duplicateKeyWarnings: string[] = []
  page.on("console", (message) => {
    if (message.text().includes("Duplicate keys")) {
      duplicateKeyWarnings.push(message.text())
    }
  })
  await page.addInitScript(() => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Authorizations test",
      userId: "toolbox-test",
      gameAccountBindings: [],
      sessionToken: "test-token",
      tokenExpiration: 4_102_444_800,
    }))
  })
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    if (url.host === APP_HOST) {
      return route.continue()
    }
    if (url.pathname.endsWith("/api/user/toolbox-test/oauth2/authorizations")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "ok",
          updatedData: [
            { consentRequestId: "consent-1", clientId: "client-a", clientName: "E2E Client", clientType: "public", scopes: ["user:read"], createdAt: "2026-10-01T00:00:00Z" },
            { consentRequestId: "consent-2", clientId: "client-a", clientName: "E2E Client", clientType: "public", scopes: ["user:read"], createdAt: "2026-10-02T00:00:00Z" },
          ],
        }),
      })
    }
    return route.abort()
  })

  await page.goto("/user/oauth-authorizations")

  await expect(page.getByRole("listitem").filter({ hasText: "E2E Client" })).toHaveCount(2)
  expect(duplicateKeyWarnings).toEqual([])
})
