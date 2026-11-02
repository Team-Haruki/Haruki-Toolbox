import { expect, test, type Page } from "@playwright/test"

// The account settings card that turns the iOS module's upload notifications
// on and off, against a mocked backend. A backend that has never stored a
// choice omits nothing: it reports true, and so does a missing field.
const USER = "notify-test"

type Write = { path: string, data: Record<string, unknown> }

async function setup(page: Page, options: { stored?: boolean, failWrite?: boolean } = {}) {
  const writes: Write[] = []
  let stored = options.stored
  await page.addInitScript(({ id }) => {
    sessionStorage.setItem("user", JSON.stringify({ name: "通知用户", userId: id, emailInfo: { email: "notify@example.test", verified: true }, gameAccountBindings: [], sessionToken: "test-token", tokenExpiration: 4_102_444_800 }))
    localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN" }))
  }, { id: USER })
  await page.route("**/*", (route) => {
    const req = route.request()
    const url = new URL(req.url())
    if (url.host === "127.0.0.1:4173") return route.continue()
    const reply = (data: unknown, statusCode = 200) => route.fulfill({ status: statusCode, contentType: "application/json", body: JSON.stringify({ status: statusCode, message: "test", updatedData: data }) })
    const base = `/api/user/${USER}`
    if (url.pathname === `${base}/get-settings` || url.pathname === "/api/user/me") {
      const user: Record<string, unknown> = { name: "通知用户", userId: USER, role: "user", emailInfo: { email: "notify@example.test", verified: true }, gameAccountBindings: [] }
      if (stored !== undefined) user.iosModuleNotificationsEnabled = stored
      return reply(user)
    }
    if (url.pathname === `${base}/profile` && req.method() === "PUT") {
      const data = req.postDataJSON() as Record<string, unknown>
      writes.push({ path: url.pathname, data })
      if (options.failWrite) return reply(null, 500)
      stored = data.iosModuleNotificationsEnabled as boolean
      return reply({ iosModuleNotificationsEnabled: stored })
    }
    if (url.pathname === `${base}/afdian`) {
      return reply({ orderVerificationEnabled: false, verificationMethod: "", oauthEnabled: false, afdianUserId: null, boundAt: null, eligible: false, category: "none", expiresAt: null })
    }
    return route.abort()
  })
  return { writes }
}

const toggle = (page: Page) => page.getByRole("switch", { name: "iOS 模块上传通知" })

test.describe("iOS module upload notifications setting", () => {
  test("is on without a stored choice and saves a change", async ({ page }) => {
    const { writes } = await setup(page)
    await page.goto("/user/settings")
    await expect(toggle(page)).toHaveAttribute("aria-checked", "true", { timeout: 30_000 })

    await toggle(page).click()
    await expect(toggle(page)).toHaveAttribute("aria-checked", "false")
    await expect(page.getByText("已关闭 iOS 模块上传通知")).toBeVisible()
    expect(writes).toEqual([{ path: `/api/user/${USER}/profile`, data: { iosModuleNotificationsEnabled: false } }])

    await page.reload()
    await expect(toggle(page)).toHaveAttribute("aria-checked", "false", { timeout: 30_000 })
  })

  test("keeps the old value when saving fails", async ({ page }) => {
    await setup(page, { stored: true, failWrite: true })
    await page.goto("/user/settings")
    await expect(toggle(page)).toHaveAttribute("aria-checked", "true", { timeout: 30_000 })

    await toggle(page).click()
    await expect(page.getByText("通知设置保存失败")).toBeVisible()
    await expect(toggle(page)).toHaveAttribute("aria-checked", "true")
  })

  // Screenshots for review (in the test output directory), phone and desktop,
  // light and dark.
  for (const colorScheme of ["light", "dark"] as const) {
    for (const width of [390, 1440]) {
      test(`renders at ${width}px in ${colorScheme} mode`, async ({ page }, testInfo) => {
        await page.emulateMedia({ colorScheme })
        await page.setViewportSize({ width, height: width < 800 ? 844 : 1000 })
        await setup(page)
        await page.goto("/user/settings")
        const card = page.locator("[data-slot=card]").filter({ has: toggle(page) })
        await expect(toggle(page)).toHaveAttribute("aria-checked", "true", { timeout: 30_000 })
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow).toBeLessThanOrEqual(0)
        await card.scrollIntoViewIfNeeded()
        await page.screenshot({ path: testInfo.outputPath(`module-notifications-${width}-${colorScheme}.png`) })
      })
    }
  }
})
