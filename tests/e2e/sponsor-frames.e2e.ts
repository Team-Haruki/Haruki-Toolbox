import { expect, test, type Page } from "@playwright/test"
import { readFileSync, existsSync } from "node:fs"
import path from "node:path"

const frames = JSON.parse(readFileSync(path.resolve("public/sponsor-frames/catalog.json"), "utf8")) as { id: string; name: Record<string, string>; thumbnail: string; panelPreview: string; profilePreview: string }[]
const FRAME = frames.find((f) => f.id === "rgb_coiled_dragon")!
const USER = "sponsor-test"
type Status = { oauthEnabled: boolean; afdianUserId: string | null; boundAt: string | null; eligible: boolean; category: string; expiresAt: string | null }

async function setup(page: Page, options: { eligible?: boolean; configured?: boolean; empty?: boolean; fail?: boolean; callbackStatus?: number } = {}) {
  const status: Status = { oauthEnabled: options.configured ?? true, afdianUserId: options.eligible === false ? null : "afdian-test", boundAt: null, eligible: options.eligible ?? true, category: options.eligible === false ? "none" : "former", expiresAt: "2025-01-01T00:00:00Z" }
  const accounts = options.empty ? [] : [{ server: "cn", gameUserId: "1234567890", verified: true, frameId: null as string | null }, { server: "jp", gameUserId: "9876543210", verified: false, frameId: null as string | null }]
  const writes: { path: string; data: Record<string, unknown> }[] = []
  let fail = options.fail ?? false
  await page.addInitScript((id) => {
    sessionStorage.setItem("user", JSON.stringify({ name: "赞助用户", userId: id, gameAccountBindings: [], sessionToken: "test-token", tokenExpiration: 4_102_444_800 }))
    localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN" }))
  }, USER)
  await page.route("**/*", (route) => {
    const req = route.request()
    const url = new URL(req.url())
    if (url.host === "127.0.0.1:4173") return route.continue()
    const reply = (data: unknown, statusCode = 200) => route.fulfill({ status: statusCode, contentType: "application/json", body: JSON.stringify({ status: statusCode, message: "test", updatedData: data }) })
    const base = `/api/user/${USER}`
    if (url.pathname === `${base}/sponsor-frames`) {
      if (fail) return reply(null, 503)
      return reply({ status, frames, accounts })
    }
    if (url.pathname.startsWith(`${base}/sponsor-frames/`) && req.method() === "PUT") {
      const data = req.postDataJSON()
      writes.push({ path: url.pathname, data })
      accounts[0]!.frameId = data.frameId || null
      return reply({ status, frames, accounts })
    }
    if (url.pathname === `${base}/afdian`) {
      if (req.method() === "DELETE") { status.afdianUserId = null; status.eligible = false }
      return reply(status)
    }
    if (url.pathname === `${base}/afdian/authorize`) return reply({ authorizeUrl: "https://afdian.com/oauth2/authorize?client_id=test&state=state" })
    if (url.pathname === `${base}/afdian/callback`) {
      writes.push({ path: url.pathname, data: req.postDataJSON() })
      return reply(status, options.callbackStatus ?? 200)
    }
    if (url.hostname === "afdian.com") return route.fulfill({ status: 200, body: "Authorization page" })
    return route.abort()
  })
  return { writes, status, accounts, recover: () => { fail = false } }
}

test.describe("Sponsor game profile frames", () => {
  test.describe.configure({ timeout: 60_000 })

  test("all catalog examples are shipped with the frontend", () => {
    expect(frames).toHaveLength(31)
    for (const f of frames) for (const asset of [f.thumbnail, f.panelPreview, f.profilePreview]) expect(existsSync(path.resolve(`public${asset}`))).toBe(true)
  })

  test("a former sponsor selects, previews, saves, reloads and resets a frame", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1050 })
    const env = await setup(page)
    await page.goto("/user/sponsor-frames")
    await expect(page.getByText("头像框已永久解锁")).toBeVisible()
    await page.getByRole("button", { name: FRAME.name["zh-CN"], exact: true }).click()
    await expect(page.locator(`img[src="${FRAME.panelPreview}"]`).last()).toBeVisible()
    await page.getByRole("button", { name: "个人信息", exact: true }).click()
    await expect(page.locator(`img[src="${FRAME.profilePreview}"]`)).toBeVisible()
    await page.locator(`img[src="${FRAME.profilePreview}"]`).evaluate(async (image: HTMLImageElement) => { await image.decode() })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: testInfo.outputPath("sponsor-frames-desktop.png"), fullPage: true })
    await page.getByRole("button", { name: "放大查看示例" }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.keyboard.press("Escape")
    await page.getByTestId("save-frame").click()
    await expect(page.getByText("头像框已保存", { exact: true })).toBeVisible()
    expect(env.writes).toEqual([{ path: `/api/user/${USER}/sponsor-frames/cn/1234567890`, data: { frameId: FRAME.id } }])
    await page.reload()
    await expect(page.getByRole("button", { name: FRAME.name["zh-CN"], exact: true })).toHaveAttribute("aria-pressed", "true")
    await page.getByRole("button", { name: "默认头像框", exact: true }).click()
    await page.getByTestId("save-frame").click()
    await expect.poll(() => env.writes.length).toBe(2)
    expect(env.writes[1]?.data).toEqual({ frameId: "" })
  })

  test("unverified accounts and non-sponsors can preview but cannot save", async ({ page }) => {
    await setup(page, { eligible: false })
    await page.goto("/user/sponsor-frames")
    await page.getByRole("button", { name: FRAME.name["zh-CN"], exact: true }).click()
    await expect(page.getByTestId("save-frame")).toBeDisabled()
    await expect(page.getByText(/先在账号设置绑定/)).toBeVisible()
    await page.locator("#frame-account").selectOption("jp:9876543210")
    await page.getByRole("button", { name: FRAME.name["zh-CN"], exact: true }).click()
    await expect(page.getByText(/请先验证这个游戏账号/)).toBeVisible()
    await expect(page.getByTestId("save-frame")).toBeDisabled()
  })

  test("mobile empty-account state keeps examples and binding guidance visible", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await setup(page, { empty: true })
    await page.goto("/user/sponsor-frames")
    await expect(page.getByText(/你还没有绑定游戏账号/)).toBeVisible()
    await page.getByRole("button", { name: FRAME.name["zh-CN"], exact: true }).click()
    await expect(page.getByTestId("save-frame")).toBeDisabled()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.locator(`img[src="${FRAME.panelPreview}"]`).last().evaluate(async (image: HTMLImageElement) => { await image.decode() })
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: testInfo.outputPath("sponsor-frames-mobile.png"), fullPage: true })
  })

  test("failed reads offer a working retry", async ({ page }) => {
    const env = await setup(page, { fail: true })
    await page.goto("/user/sponsor-frames")
    await expect(page.getByText("头像框暂时加载失败，请重试。")).toBeVisible()
    env.recover()
    await page.getByRole("button", { name: "重试", exact: true }).click()
    await expect(page.getByText("头像框已永久解锁")).toBeVisible()
  })

  test("missing OAuth credentials disable linking without hiding the page", async ({ page }) => {
    await setup(page, { eligible: false, configured: false })
    await page.goto("/user/settings")
    await expect(page.getByText("爱发电授权绑定暂未开放，请稍后再试。")).toBeVisible()
    await expect(page.getByRole("button", { name: "授权绑定爱发电" })).toBeDisabled()
    await page.getByRole("link", { name: "赞助头像框", exact: true }).click()
    await expect(page.getByRole("heading", { name: "赞助头像框", exact: true })).toBeVisible()
  })

  test("authorization uses the backend URL and callback clears secrets from history", async ({ page }) => {
    const env = await setup(page, { eligible: false })
    await page.goto("/user/settings")
    await page.getByRole("button", { name: "授权绑定爱发电" }).click()
    await expect(page).toHaveURL(/https:\/\/afdian\.com\/oauth2\/authorize/)
    await page.goto("/user/afdian/callback?code=single-use-code&state=bound-state")
    await expect(page.getByText("爱发电账号已绑定，赞助记录会自动匹配。")).toBeVisible()
    expect(page.url()).not.toContain("code=")
    expect(env.writes).toEqual([{ path: `/api/user/${USER}/afdian/callback`, data: { code: "single-use-code", state: "bound-state" } }])
    await page.reload()
    await expect(page.getByText(/绑定未完成/)).toBeVisible()
    expect(env.writes).toHaveLength(1)
  })

  test("rejected OAuth callbacks show a recovery link", async ({ page }) => {
    await setup(page, { callbackStatus: 409 })
    await page.goto("/user/afdian/callback?code=code&state=state")
    await expect(page.getByText(/绑定未完成/)).toBeVisible()
    await expect(page.getByRole("link", { name: "返回账号设置" })).toBeVisible()
    expect(page.url()).not.toContain("code=")
  })
})
