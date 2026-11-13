import { expect, test, type Page, type Route } from "@playwright/test"

// HarukiBot NEO registration against a mocked backend: a three-step form
// (QQ number, mailed code, the bot's id and shown-once credential).
const APP_HOST = "127.0.0.1:4173"
const QQ = "1234567890"
const BOT_ID = "91145149"
// Fake, and long enough to need wrapping on a phone.
const CREDENTIAL = `fake-credential-${"abcdefghijklmnopqrstuvwxyz0123456789".repeat(4)}`

type ApiCall = { path: string, body: unknown }
type Reply = { status: number, body?: unknown, headers?: Record<string, string> }
type Backend = {
  status?: Reply | (() => Reply)
  sendMail?: Reply
  register?: Reply
}

const ok = (updatedData: unknown): Reply => ({ status: 200, body: { status: 200, message: "ok", updatedData } })
const fail = (status: number, message: string, headers?: Record<string, string>): Reply => ({ status, body: { status, message }, headers })

async function openRegistration(page: Page, backend: Backend = {}) {
  const calls: ApiCall[] = []
  await page.addInitScript(() => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "NEO test", userId: "toolbox-test", gameAccountBindings: [],
      sessionToken: "test-token", tokenExpiration: 4_102_444_800,
    }))
  })
  await page.route("**/*", (route: Route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.host === APP_HOST) return route.continue()
    const cors = {
      "access-control-allow-origin": request.headers().origin ?? `http://${APP_HOST}`,
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": request.headers()["access-control-request-headers"] ?? "authorization, content-type",
      "access-control-expose-headers": "retry-after",
    }
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors })
    const send = (reply: Reply) => route.fulfill({
      status: reply.status,
      contentType: "application/json",
      headers: { ...cors, ...reply.headers },
      body: JSON.stringify(reply.body ?? {}),
    })
    if (!url.pathname.startsWith("/api/haruki-bot-neo/")) return route.abort()
    calls.push({ path: url.pathname, body: request.postDataJSON() })
    if (url.pathname.endsWith("/status")) {
      const status = backend.status ?? ok({ enabled: true })
      return send(typeof status === "function" ? status() : status)
    }
    if (url.pathname.endsWith("/send-mail")) return send(backend.sendMail ?? ok(null))
    if (url.pathname.endsWith("/register")) {
      return send(backend.register ?? ok({ bot_id: BOT_ID, credential: CREDENTIAL, owner_id: Number(QQ) }))
    }
    return route.abort()
  })
  await page.goto("/haruki-bot-neo")
  return calls
}

const panel = (page: Page) => page.getByTestId("bot-neo-panel")
const step = (page: Page, name: string) => page.getByTestId("bot-neo-steps").locator(`[data-step=${name}]`)
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

test("registers a bot and carries its credential into the config generator", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  const calls = await openRegistration(page)

  await expect(panel(page)).toHaveAttribute("data-step", "input", { timeout: 30_000 })
  await expect(step(page, "input")).toHaveAttribute("aria-current", "step")
  // The code goes to the mailbox of the number being typed.
  await page.locator("#bot-neo-qq").fill(QQ)
  await expect(page.locator("#bot-neo-qq-hint")).toContainText(`${QQ}@qq.com`)
  await page.getByTestId("bot-neo-input-form").getByRole("button").click()

  await expect(panel(page)).toHaveAttribute("data-step", "verify")
  await expect(step(page, "input")).toHaveAttribute("data-state", "done")
  await expect(page.getByTestId("bot-neo-code-sent")).toContainText(`${QQ}@qq.com`)
  await expect(page.locator("#bot-neo-code")).toBeFocused()
  expect(calls.find((call) => call.path.endsWith("/send-mail"))?.body).toEqual({ qq_number: Number(QQ) })

  await page.locator("#bot-neo-code").fill("123456")
  await page.locator("#bot-neo-code").press("Enter")

  const result = page.getByTestId("bot-neo-result")
  await expect(result).toBeVisible()
  expect(calls.find((call) => call.path.endsWith("/register"))?.body).toEqual({ qq_number: Number(QQ), verification_code: "123456" })
  await expect(step(page, "result")).toHaveAttribute("aria-current", "step")
  await expect(page.getByTestId("bot-neo-bot-id")).toHaveText(BOT_ID)
  await expect(page.getByTestId("bot-neo-credential")).toHaveText(CREDENTIAL)

  // Each value has its own copy button.
  await result.locator("dl").getByRole("button").nth(1).click()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(CREDENTIAL)

  // Leaving the shown-once credential asks first; cancelling keeps it on screen.
  await result.getByRole("button", { name: /注册另一个|Register another/ }).click()
  const dialog = page.getByRole("alertdialog")
  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: /取消|Cancel/ }).click()
  await expect(page.getByTestId("bot-neo-credential")).toHaveText(CREDENTIAL)

  // The generator opens with the bot filled in.
  await page.getByTestId("bot-neo-open-generator").click()
  await expect(page).toHaveURL(/\/client-config-generator\?/)
  await expect(page.locator("#client-bot-id")).toHaveValue(BOT_ID, { timeout: 30_000 })
  await expect(page.locator("#client-credential")).toHaveValue(CREDENTIAL)
  await expect(page.getByTestId("client-config-prefill")).toContainText(QQ)
  await expect(page.getByTestId("client-config-yaml")).toContainText(`botId: ${BOT_ID}`)
})

test("checks the QQ number and the code next to their fields before asking the server", async ({ page }) => {
  const calls = await openRegistration(page)
  const qq = page.locator("#bot-neo-qq")
  await expect(qq).toBeVisible({ timeout: 30_000 })

  // An empty submit is answered inline, not by a disabled button.
  await page.getByTestId("bot-neo-input-form").getByRole("button").click()
  await expect(page.locator("#bot-neo-qq-error")).toBeVisible()
  await expect(qq).toHaveAttribute("aria-invalid", "true")
  await expect(qq).toHaveAttribute("aria-describedby", "bot-neo-qq-error")
  await expect(qq).toBeFocused()

  await qq.fill("0123")
  await expect(page.locator("#bot-neo-qq-error")).toHaveCount(0)
  await qq.press("Enter")
  await expect(page.locator("#bot-neo-qq-error")).toContainText(/5–12/)
  expect(calls.filter((call) => call.path.endsWith("/send-mail"))).toHaveLength(0)

  await qq.fill(QQ)
  await qq.press("Enter")
  const code = page.locator("#bot-neo-code")
  await expect(code).toBeVisible()
  await code.fill("12")
  await code.press("Enter")
  await expect(page.locator("#bot-neo-code-error")).toBeVisible()
  await expect(code).toHaveAttribute("aria-invalid", "true")
  expect(calls.filter((call) => call.path.endsWith("/register"))).toHaveLength(0)

  // Going back keeps the number and drops the code.
  await page.getByRole("button", { name: /换一个 QQ 号|Change QQ number/ }).click()
  await expect(qq).toHaveValue(QQ)
  await qq.press("Enter")
  await expect(code).toHaveValue("")
})

test("puts a rejected request where it belongs", async ({ page }) => {
  await openRegistration(page, { sendMail: fail(409, "already registered") })
  const qq = page.locator("#bot-neo-qq")
  await expect(qq).toBeVisible({ timeout: 30_000 })
  await qq.fill(QQ)
  await qq.press("Enter")

  // "Already registered" is about this number: it stays on the first step, next to the field.
  await expect(page.locator("#bot-neo-qq-error")).toBeVisible()
  await expect(panel(page)).toHaveAttribute("data-step", "input")
})

test("says a wrong code next to the code field and stays on the step", async ({ page }) => {
  await openRegistration(page, { register: fail(400, "verification code is wrong or expired") })
  await page.locator("#bot-neo-qq").fill(QQ)
  await page.locator("#bot-neo-qq").press("Enter")
  const code = page.locator("#bot-neo-code")
  await code.fill("654321")
  await code.press("Enter")

  await expect(page.locator("#bot-neo-code-error")).toBeVisible()
  await expect(code).toHaveAttribute("aria-invalid", "true")
  await expect(panel(page)).toHaveAttribute("data-step", "verify")
  await expect(page.getByTestId("bot-neo-result")).toHaveCount(0)
})

test("counts down a rate limit on the send button", async ({ page }) => {
  await openRegistration(page, { sendMail: fail(429, "slow down", { "retry-after": "48" }) })
  const qq = page.locator("#bot-neo-qq")
  await expect(qq).toBeVisible({ timeout: 30_000 })
  await qq.fill(QQ)
  await qq.press("Enter")

  const send = page.getByTestId("bot-neo-input-form").getByRole("button")
  await expect(send).toBeDisabled()
  await expect(send).toContainText(/4\d/)
  await expect(panel(page)).toHaveAttribute("data-step", "input")
})

test("shows a closed registration, and opens the form once it is open again", async ({ page }) => {
  let enabled = false
  await openRegistration(page, { status: () => ok({ enabled }) })

  const closed = page.getByTestId("bot-neo-closed")
  await expect(closed).toBeVisible({ timeout: 30_000 })
  await expect(page.locator("#bot-neo-qq")).toHaveCount(0)

  enabled = true
  await closed.getByRole("button").click()
  await expect(page.locator("#bot-neo-qq")).toBeVisible()
})

test("keeps the form usable when the status check fails, and reports a failed send inline", async ({ page }) => {
  let statusCalls = 0
  await openRegistration(page, {
    status: () => {
      statusCalls += 1
      return fail(500, "boom")
    },
    sendMail: fail(500, "boom"),
  })

  const unknown = page.getByTestId("bot-neo-status-unknown")
  await expect(unknown).toBeVisible({ timeout: 30_000 })
  // Checking again asks the backend again (the request layer may retry a 500 on its own).
  const before = statusCalls
  await unknown.getByRole("button").click()
  await expect.poll(() => statusCalls).toBeGreaterThan(before)
  await expect(unknown).toBeVisible()

  await page.locator("#bot-neo-qq").fill(QQ)
  await page.locator("#bot-neo-qq").press("Enter")
  await expect(page.getByTestId("bot-neo-input-form").getByRole("alert")).toBeVisible()
  await expect(panel(page)).toHaveAttribute("data-step", "input")
})

for (const width of [390, 320]) {
  test(`fits a ${width}px phone on every step`, async ({ page }) => {
    await page.setViewportSize({ width, height: 760 })
    await openRegistration(page)

    await expect(page.locator("#bot-neo-qq")).toBeVisible({ timeout: 30_000 })
    expect(await overflow(page)).toBe(0)

    await page.locator("#bot-neo-qq").fill(QQ)
    await page.locator("#bot-neo-qq").press("Enter")
    await expect(page.locator("#bot-neo-code")).toBeVisible()
    expect(await overflow(page)).toBe(0)

    await page.locator("#bot-neo-code").fill("123456")
    await page.locator("#bot-neo-code").press("Enter")
    const credential = page.getByTestId("bot-neo-credential")
    await expect(credential).toHaveText(CREDENTIAL)
    expect(await overflow(page)).toBe(0)
    // The long credential wraps inside its own row.
    const box = await credential.boundingBox()
    expect(box!.x + box!.width).toBeLessThanOrEqual(width)
  })
}
