import { expect, test, type Page } from "@playwright/test"

// The /device verification page of the OAuth2 device authorization grant
// against a mocked backend that answers lookup / approve / deny like the
// browser endpoints of the backend design (§6.4, error codes in §6.5): an
// envelope {status, message, updatedData} whose updatedData.code carries the
// machine-readable error.
const APP_HOST = "127.0.0.1:4173"
const USER_ID = "toolbox-device"
const DEVICE_API = "/api/oauth2/device/"
const USER_CODE = "BCDF-GHJK"
const FLOW_HANDLE = "dfh_e2e-flow"

type Endpoint = "lookup" | "approve" | "deny"
type Reply = { status: number; updatedData?: unknown; message?: string } | "abort"
type DeviceCall = { endpoint: Endpoint; body: Record<string, unknown>; contentType: string | null }

function lookupReply(overrides: Record<string, unknown> = {}) {
  const now = Date.now()
  return {
    flowHandle: FLOW_HANDLE,
    userCode: USER_CODE,
    client: { clientId: "haruki-client", clientName: "Haruki Client", clientType: "public", firstParty: true, initiatorVerified: false },
    scopes: [
      { scope: "user:read", risk: "read" },
      { scope: "offline_access", risk: "offline" },
      { scope: "station:room:write", risk: "write" },
    ],
    deviceLabel: "<b>bold</b> @ home-server",
    requestedAt: new Date(now - 30_000).toISOString(),
    expiresAt: new Date(now + 9 * 60_000).toISOString(),
    account: { userId: USER_ID, name: "Seiun" },
    writeWarning: true,
    ...overrides,
  }
}

function errorReply(status: number, code?: string, extra: Record<string, unknown> = {}): Reply {
  return { status, message: "error", updatedData: code ? { code, ...extra } : undefined }
}

const DEFAULT_REPLIES: Record<Endpoint, () => Reply> = {
  lookup: () => ({ status: 200, updatedData: lookupReply() }),
  approve: () => ({
    status: 200,
    updatedData: { status: "approved", clientName: "Haruki Client", consentRequestId: "consent-1", accountName: "Seiun" },
  }),
  deny: () => ({ status: 200, updatedData: { status: "denied" } }),
}

/**
 * Serves the device endpoints from per-endpoint reply queues (the default
 * reply once a queue is empty) and records every call. With `signedIn` the
 * page starts with a cached Toolbox session, like the other user-page specs.
 */
async function mockDeviceBackend(
  page: Page,
  options: { signedIn?: boolean; replies?: Partial<Record<Endpoint, Reply[]>> } = {},
) {
  const calls: DeviceCall[] = []
  const queues: Record<Endpoint, Reply[]> = {
    lookup: [...(options.replies?.lookup ?? [])],
    approve: [...(options.replies?.approve ?? [])],
    deny: [...(options.replies?.deny ?? [])],
  }
  if (options.signedIn !== false) {
    await page.addInitScript((userId) => {
      sessionStorage.setItem("user", JSON.stringify({
        name: "Seiun",
        userId,
        gameAccountBindings: [],
        sessionToken: "test-token",
        tokenExpiration: 4_102_444_800,
      }))
    }, USER_ID)
  }
  await page.route("**/*", (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.host === APP_HOST) {
      return route.continue()
    }
    if (url.pathname === `/api/user/${USER_ID}/get-settings`) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", updatedData: { userId: USER_ID, name: "Seiun", role: "user" } }),
      })
    }
    if (!url.pathname.startsWith(DEVICE_API)) {
      return route.abort()
    }
    const endpoint = url.pathname.slice(DEVICE_API.length) as Endpoint
    if (!(endpoint in queues)) {
      return route.abort()
    }
    calls.push({ endpoint, body: request.postDataJSON() ?? {}, contentType: request.headers()["content-type"] ?? null })
    const reply = queues[endpoint].shift() ?? DEFAULT_REPLIES[endpoint]()
    if (reply === "abort") {
      return route.abort("connectionreset")
    }
    return route.fulfill({
      status: reply.status,
      contentType: "application/json",
      body: JSON.stringify({ status: reply.status, message: reply.message ?? "ok", updatedData: reply.updatedData ?? null }),
    })
  })
  return calls
}

function callsTo(calls: DeviceCall[], endpoint: Endpoint) {
  return calls.filter((call) => call.endpoint === endpoint)
}

const CODE_INPUT = /^(设备代码|Device code)$/
const CONTINUE = /^(继续|Continue)$/
const APPROVE = /^(允许|Allow)$/
const DENY = /^(拒绝|Deny)$/
const NOT_ME = /^(不是我发起的|I didn't start this)$/
const ACKNOWLEDGE = /我确认这是我本人刚刚在自己的设备或程序上发起的|I confirm that I started this myself/
const NEW_CODE = /^(输入新代码|Enter a new code)$/
const REVIEW_TITLE = /设备授权请求|Device authorization request/

/** Opens /device signed in, enters the code and waits for the review card. */
async function openReview(page: Page) {
  await page.goto(`/device?user_code=${USER_CODE}`)
  await expect(page.getByLabel(CODE_INPUT)).toHaveValue(USER_CODE, { timeout: 30_000 })
  await page.getByRole("button", { name: CONTINUE }).click()
  await expect(page.getByText(REVIEW_TITLE)).toBeVisible()
}

test.describe("OAuth2 device authorization page", () => {
  test.describe.configure({ timeout: 60_000 })

  test("signed-out visitors get a sign-in card that keeps the code for afterwards", async ({ page }) => {
    const calls = await mockDeviceBackend(page, { signedIn: false })

    await page.goto("/device?user_code=bcdf-ghjk")

    await expect(page.getByText(/登录以授权设备|Sign in to authorize a device/)).toBeVisible({ timeout: 30_000 })
    // The code leaves the address bar at once, even before sign-in.
    await expect(page).toHaveURL((url) => url.pathname === "/device" && url.search === "")
    await expect(page.getByLabel(CODE_INPUT)).toHaveCount(0)

    await page.getByRole("button", { name: /^(去登录|Sign in)$/ }).click()
    await page.waitForURL((url) => url.pathname === "/user/login" && url.searchParams.get("redirect") === `/device?user_code=${USER_CODE}`)
    expect(calls).toEqual([])
  })

  test("pre-fills the code from the link without submitting it", async ({ page }) => {
    const calls = await mockDeviceBackend(page)

    await page.goto(`/device?user_code=bcdf ghjk&device_challenge=ignored-challenge`)

    const input = page.getByLabel(CODE_INPUT)
    await expect(input).toHaveValue(USER_CODE, { timeout: 30_000 })
    await expect(page).toHaveURL((url) => url.pathname === "/device" && url.search === "")
    // Nothing is sent until the person presses Continue.
    await page.waitForTimeout(500)
    expect(calls).toEqual([])

    // A code of the wrong shape is caught locally and never sent.
    await input.fill("ab")
    await expect(input).toHaveValue("AB")
    await page.getByRole("button", { name: CONTINUE }).click()
    await expect(page.getByText(/代码格式不正确|doesn't look like a device code/)).toBeVisible()
    expect(calls).toEqual([])
  })

  test("the review card shows who asks for what, in plain text", async ({ page }) => {
    const calls = await mockDeviceBackend(page)

    await openReview(page)

    expect(callsTo(calls, "lookup")).toEqual([{ endpoint: "lookup", body: { userCode: USER_CODE }, contentType: "application/json" }])
    const client = page.getByTestId("device-client")
    await expect(client).toContainText("Haruki Client")
    await expect(client.locator("code")).toHaveText("haruki-client")
    // A public client is never "official", whatever the reply says.
    await expect(client.getByText(/^(公开应用|Public app)$/)).toBeVisible()
    await expect(client.getByText(/^(官方|Official)$/)).toHaveCount(0)
    await expect(client).toContainText(/任何人都可以以此应用的名义发起请求|Anyone can start a request/)

    const writeScope = page.locator('li[data-risk="write"]')
    await expect(writeScope).toHaveCount(1)
    await expect(writeScope).toContainText("以你的身份向 Sekai Station 提交车牌（房间号）")
    await expect(writeScope).toHaveClass(/text-destructive/)
    await expect(page.getByText(/此授权包含写入权限|includes write access/)).toBeVisible()

    // The device's own description is rendered as text, never as HTML.
    await expect(page.getByTestId("device-label")).toHaveText("<b>bold</b> @ home-server")
    await expect(page.getByTestId("device-label").locator("b")).toHaveCount(0)

    await expect(page.getByTestId("device-remaining")).toHaveText(/^\d+:\d{2}$/)
    await expect(page.getByTestId("device-account")).toHaveText("Seiun")
    await expect(page.getByRole("button", { name: /^(切换账号|Switch account)$/ })).toBeVisible()
    await expect(page.getByText(/只有在你本人刚刚发起时才继续；不要输入他人发给你的代码|Only continue if you started this yourself/)).toBeVisible()
    await expect(page.getByTestId("device-confirm-code")).toHaveText(USER_CODE)
    await expect(page.getByLabel(/设备名称|Device name/)).toBeVisible()
    await expect(page.getByRole("checkbox", { name: ACKNOWLEDGE })).not.toBeChecked()
    for (const name of [APPROVE, DENY, NOT_ME]) {
      await expect(page.getByRole("button", { name })).toBeVisible()
    }
  })

  test("approving needs the confirmation and sends a label only when one was chosen", async ({ page }) => {
    const calls = await mockDeviceBackend(page)
    await openReview(page)

    await page.getByRole("button", { name: APPROVE }).click()
    await expect(page.getByTestId("device-ack")).toHaveAttribute("data-highlighted", "true")
    await expect(page.getByText(/请先勾选下方的确认框|Tick the confirmation box/)).toBeVisible()
    expect(callsTo(calls, "approve")).toEqual([])

    await page.getByRole("checkbox", { name: ACKNOWLEDGE }).click()
    await page.getByLabel(/设备名称|Device name/).fill("  My   NAS ")
    await page.getByRole("button", { name: APPROVE }).click()

    await expect(page.getByText(/^(已授权|Authorized)$/)).toBeVisible()
    await expect(page.getByText(/请回到设备，它应显示『已授权为 Seiun』|It should show “Authorized as Seiun”/)).toBeVisible()
    await expect(page.getByRole("link", { name: /查看已授权应用|View authorized apps/ })).toHaveAttribute("href", "/user/oauth-authorizations")
    expect(callsTo(calls, "approve").map((call) => call.body)).toEqual([
      { flowHandle: FLOW_HANDLE, userCode: USER_CODE, acknowledged: true, label: "My NAS" },
    ])
  })

  test("\"not me\" denies the flow and a new code starts from scratch", async ({ page }) => {
    const calls = await mockDeviceBackend(page)
    await openReview(page)

    await page.getByRole("button", { name: NOT_ME }).click()

    await expect(page.getByText(/已拒绝授权|Authorization denied/)).toBeVisible()
    await expect(page.getByText(/请在设备上重新获取代码|Get a new code on your device/)).toBeVisible()
    expect(callsTo(calls, "deny").map((call) => call.body)).toEqual([{ flowHandle: FLOW_HANDLE, reason: "not_initiated_by_me" }])

    await page.getByRole("button", { name: NEW_CODE }).click()
    await expect(page.getByLabel(CODE_INPUT)).toHaveValue("")
  })

  test("an unusable code keeps the input, and Continue looks it up again", async ({ page }) => {
    const calls = await mockDeviceBackend(page, {
      replies: { lookup: [errorReply(400, "invalid_code"), errorReply(409, "flow_conflict")] },
    })
    await page.goto(`/device?user_code=${USER_CODE}`)
    const input = page.getByLabel(CODE_INPUT)
    await expect(input).toHaveValue(USER_CODE, { timeout: 30_000 })

    await page.getByRole("button", { name: CONTINUE }).click()
    await expect(page.getByText(/代码无效、已过期或已被其他账号使用；请在设备上重新获取|invalid, expired or already used by another account/)).toBeVisible()
    await expect(input).toHaveValue(USER_CODE)
    await expect(input).toHaveAttribute("aria-invalid", "true")

    await page.getByRole("button", { name: CONTINUE }).click()
    await expect(page.getByText(/授权状态已变化，请再次点击「继续」|The request changed/)).toBeVisible()
    await expect(input).toHaveValue(USER_CODE)

    await page.getByRole("button", { name: CONTINUE }).click()
    await expect(page.getByText(REVIEW_TITLE)).toBeVisible()
    expect(callsTo(calls, "lookup")).toHaveLength(3)
  })

  test("rate limiting disables the buttons for updatedData.retryAfter seconds", async ({ page }) => {
    await mockDeviceBackend(page, { replies: { lookup: [errorReply(429, "rate_limited", { retryAfter: 2 })] } })
    await page.goto(`/device?user_code=${USER_CODE}`)
    await expect(page.getByLabel(CODE_INPUT)).toHaveValue(USER_CODE, { timeout: 30_000 })

    const continueButton = page.getByRole("button", { name: CONTINUE })
    await continueButton.click()
    await expect(page.getByText(/操作过于频繁，请在 \d 秒后重试|Too many attempts. Try again in \d s/)).toBeVisible()
    await expect(continueButton).toBeDisabled()

    await expect(continueButton).toBeEnabled({ timeout: 5_000 })
    await continueButton.click()
    await expect(page.getByText(REVIEW_TITLE)).toBeVisible()
  })

  test("an approve without response is never retried and a later already_handled reads as unconfirmed", async ({ page }) => {
    const calls = await mockDeviceBackend(page, { replies: { approve: ["abort", errorReply(409, "already_handled")] } })
    await openReview(page)
    await page.getByRole("checkbox", { name: ACKNOWLEDGE }).click()

    await page.getByRole("button", { name: APPROVE }).click()
    await expect(page.getByText(/网络错误或未知错误|Network or unknown error/)).toBeVisible()
    await expect(page.getByText(/无法确认授权是否已经完成|could not confirm whether the authorization went through/)).toBeVisible()
    await page.waitForTimeout(500)
    expect(callsTo(calls, "approve")).toHaveLength(1)
    // The label is left out: nothing was typed.
    expect(callsTo(calls, "approve")[0]?.body).toEqual({ flowHandle: FLOW_HANDLE, userCode: USER_CODE, acknowledged: true })

    await page.getByRole("button", { name: APPROVE }).click()
    await expect(page.getByText(/授权结果待确认|Authorization not confirmed/)).toBeVisible()
    await expect(page.getByText(/授权可能已完成，请查看设备；若设备未显示成功，请重新获取代码|may have gone through/)).toBeVisible()
    expect(callsTo(calls, "approve")).toHaveLength(2)
  })

  test("error codes move the page to the state the code table names", async ({ page }) => {
    await mockDeviceBackend(page, {
      replies: {
        lookup: [errorReply(403, "feature_disabled"), { status: 200, updatedData: lookupReply() }, errorReply(401)],
        approve: [errorReply(502, "approval_failed", { retryable: true }), errorReply(410, "code_expired")],
      },
    })

    // Feature off: nothing more to do on this page.
    await page.goto(`/device?user_code=${USER_CODE}`)
    await expect(page.getByLabel(CODE_INPUT)).toHaveValue(USER_CODE, { timeout: 30_000 })
    await page.getByRole("button", { name: CONTINUE }).click()
    await expect(page.getByText(/^(设备登录暂未开放|Device sign-in is not available yet)$/)).toBeVisible()

    // A retryable approval failure returns to the review card; expiry ends the flow.
    await openReview(page)
    await page.getByRole("checkbox", { name: ACKNOWLEDGE }).click()
    await page.getByRole("button", { name: APPROVE }).click()
    await expect(page.getByText(/授权未能完成，请重试|could not be completed/)).toBeVisible()
    await expect(page.getByText(REVIEW_TITLE)).toBeVisible()
    await page.getByRole("button", { name: APPROVE }).click()
    await expect(page.getByText(/^(代码已过期|Code expired)$/)).toBeVisible()

    // The gateway's 401 means the session is gone: back to the sign-in card.
    await page.goto(`/device?user_code=${USER_CODE}`)
    await expect(page.getByLabel(CODE_INPUT)).toHaveValue(USER_CODE, { timeout: 30_000 })
    await page.getByRole("button", { name: CONTINUE }).click()
    await expect(page.getByText(/登录以授权设备|Sign in to authorize a device/)).toBeVisible()
  })

  test("refuses to work inside a frame and steers in-app browsers to a code-free link", async ({ page, browser }) => {
    const calls = await mockDeviceBackend(page)
    await page.route(`http://${APP_HOST}/e2e-frame-host`, (route) => route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><title>host</title><iframe src="/device?user_code=${USER_CODE}" width="800" height="600"></iframe>`,
    }))

    await page.goto("/e2e-frame-host")
    const frame = page.frameLocator("iframe")
    await expect(frame.getByText(/^(请在新窗口打开|Open this page in a new window)$/)).toBeVisible({ timeout: 30_000 })
    await expect(frame.getByRole("link", { name: /在新窗口打开|Open in a new window/ })).toHaveAttribute("href", "/device")
    await expect(frame.getByLabel(CODE_INPUT)).toHaveCount(0)
    await page.waitForTimeout(500)
    expect(calls).toEqual([])

    const context = await browser.newContext({
      baseURL: `http://${APP_HOST}`,
      userAgent: "Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 Telegram-Android/11.0",
      permissions: ["clipboard-read", "clipboard-write"],
    })
    try {
      const inApp = await context.newPage()
      await mockDeviceBackend(inApp)
      await inApp.goto(`/device?user_code=${USER_CODE}`)
      const notice = inApp.getByTestId("device-in-app-browser")
      await expect(notice).toBeVisible({ timeout: 30_000 })
      await notice.getByRole("button", { name: /复制页面地址|Copy page address/ }).click()
      await expect.poll(() => inApp.evaluate(() => navigator.clipboard.readText())).toBe(`http://${APP_HOST}/device`)
    } finally {
      await context.close()
    }
  })
})
