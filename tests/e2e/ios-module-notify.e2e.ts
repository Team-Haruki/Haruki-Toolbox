import { expect, test, type Page } from "@playwright/test"

// The iOS module generator's upload notification switch: on by default, and
// turning it off adds notify=false to the module and script URLs (the module
// then declares its notify argument as off). In proxy mode only the Loon
// plugin can notify, so only Loon offers the switch there.
async function setup(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Module test",
      userId: "toolbox-test",
      iosUploadCode: "0123456789abcdef0123456789abcdef",
      gameAccountBindings: [{ server: "jp", userId: 123456, verified: true, isDefault: true }],
      sessionToken: "test-token",
      tokenExpiration: 4_102_444_800,
    }))
    localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN" }))
  })
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    if (url.host === "127.0.0.1:4173") return route.continue()
    return route.abort()
  })
}

const notifySwitch = (page: Page) => page.getByRole("switch", { name: "上传通知" })
const moduleUrl = (page: Page) => page.getByRole("textbox", { name: "模块 URL" })
const scriptUrl = (page: Page) => page.getByRole("textbox", { name: "脚本 URL" })

test.describe("iOS module upload notifications", () => {
  test("are on by default and turn off through the module URL", async ({ page }) => {
    await setup(page)
    await page.goto("/upload-data?tab=ios")
    await expect(notifySwitch(page)).toHaveAttribute("aria-checked", "true", { timeout: 30_000 })
    await expect(moduleUrl(page)).toHaveValue(/mode=script&endpoint=\w+&chunk=1$/)
    await expect(scriptUrl(page)).not.toHaveValue(/notify=/)

    await notifySwitch(page).click()
    await expect(notifySwitch(page)).toHaveAttribute("aria-checked", "false")
    await expect(moduleUrl(page)).toHaveValue(/&chunk=1&notify=false$/)
    await expect(scriptUrl(page)).toHaveValue(/&notify=false$/)
  })

  test("are offered for Loon in proxy mode", async ({ page }) => {
    await setup(page)
    await page.goto("/upload-data?tab=ios")
    await expect(notifySwitch(page)).toBeVisible({ timeout: 30_000 })
    await page.getByRole("combobox", { name: "选择软件" }).click()
    await page.getByRole("option", { name: "Loon" }).click()
    await page.getByRole("combobox", { name: "选择上传数据方式" }).click()
    await page.getByRole("option", { name: "代理上传" }).click()
    await expect(notifySwitch(page)).toHaveAttribute("aria-checked", "true")
    await expect(moduleUrl(page)).toHaveValue(/\.lnplugin\?mode=proxy&endpoint=\w+$/)

    await notifySwitch(page).click()
    await expect(moduleUrl(page)).toHaveValue(/\.lnplugin\?mode=proxy&endpoint=\w+&notify=false$/)
  })

  test("are not offered for other apps in proxy mode", async ({ page }) => {
    await setup(page)
    await page.goto("/upload-data?tab=ios")
    await expect(notifySwitch(page)).toBeVisible({ timeout: 30_000 })
    await page.getByRole("combobox", { name: "选择上传数据方式" }).click()
    await page.getByRole("option", { name: "代理上传" }).click()
    await expect(notifySwitch(page)).toHaveCount(0)
    await expect(moduleUrl(page)).not.toHaveValue(/notify=/)
  })

  // Screenshots for review (in the test output directory): Loon in proxy mode,
  // the setting this change adds.
  for (const colorScheme of ["light", "dark"] as const) {
    for (const width of [390, 1440]) {
      test(`renders Loon proxy mode at ${width}px in ${colorScheme} mode`, async ({ page }, testInfo) => {
        await page.emulateMedia({ colorScheme })
        await page.setViewportSize({ width, height: width < 800 ? 844 : 1000 })
        await setup(page)
        await page.goto("/upload-data?tab=ios")
        await expect(notifySwitch(page)).toBeVisible({ timeout: 30_000 })
        await page.getByRole("combobox", { name: "选择软件" }).click()
        await page.getByRole("option", { name: "Loon" }).click()
        await page.getByRole("combobox", { name: "选择上传数据方式" }).click()
        await page.getByRole("option", { name: "代理上传" }).click()
        await expect(notifySwitch(page)).toBeVisible()
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow).toBeLessThanOrEqual(0)
        await notifySwitch(page).evaluate((element) => element.scrollIntoView({ block: "center" }))
        await page.screenshot({ path: testInfo.outputPath(`ios-module-notify-loon-proxy-${width}-${colorScheme}.png`) })
      })
    }
  }
})
