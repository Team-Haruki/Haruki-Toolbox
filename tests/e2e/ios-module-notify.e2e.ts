import { expect, test, type Page } from "@playwright/test"

// The iOS module generator's upload notification switch: on by default, and
// turning it off adds notify=false to the module and script URLs (the module
// then declares its notify argument as off). In proxy mode every app but
// Stash offers it.
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

// The switch sits under "advanced options", closed until asked for.
async function openModulePage(page: Page) {
  await page.goto("/upload-data?tab=ios")
  const advanced = page.getByTestId("ios-advanced")
  await advanced.getByRole("button").click({ timeout: 30_000 })
  return advanced
}

// The proxy app and the upload mode are single choices shown as cards.
const chooseSoftware = (page: Page, name: string) =>
  page.getByRole("radiogroup", { name: "选择软件" }).getByRole("radio", { name, exact: true }).check()
const chooseProxyMode = (page: Page) =>
  page.getByRole("radiogroup", { name: "选择上传数据方式" }).getByRole("radio", { name: /^代理上传/ }).check()
const moduleUrl = (page: Page) => page.getByRole("textbox", { name: "模块 URL" })
const scriptUrl = (page: Page) => page.getByRole("textbox", { name: "脚本 URL" })

test.describe("iOS module upload notifications", () => {
  test("are on by default and turn off through the module URL", async ({ page }) => {
    await setup(page)
    await openModulePage(page)
    await expect(notifySwitch(page)).toHaveAttribute("aria-checked", "true", { timeout: 30_000 })
    await expect(moduleUrl(page)).toHaveValue(/mode=script&endpoint=\w+&chunk=1$/)
    await expect(scriptUrl(page)).not.toHaveValue(/notify=/)

    await notifySwitch(page).click()
    await expect(notifySwitch(page)).toHaveAttribute("aria-checked", "false")
    await expect(moduleUrl(page)).toHaveValue(/&chunk=1&notify=false$/)
    await expect(scriptUrl(page)).toHaveValue(/&notify=false$/)
  })

  // Proxy mode: every module but Stash's offers the switch (Stash's override
  // carries the script, but it is not verified on a device yet).
  const proxyApps = [
    { name: "Surge", ext: "sgmodule" },
    { name: "Shadowrocket", ext: "sgmodule" },
    { name: "Loon", ext: "lnplugin" },
    { name: "Quantumult X", ext: "conf" },
  ]
  for (const app of proxyApps) {
    test(`are offered for ${app.name} in proxy mode`, async ({ page }) => {
      await setup(page)
      await openModulePage(page)
      await expect(notifySwitch(page)).toBeVisible({ timeout: 30_000 })
      await chooseSoftware(page, app.name)
      await chooseProxyMode(page)
      await expect(notifySwitch(page)).toHaveAttribute("aria-checked", "true")
      await expect(moduleUrl(page)).toHaveValue(new RegExp(`\\.${app.ext}\\?mode=proxy&endpoint=\\w+$`))

      await notifySwitch(page).click()
      await expect(moduleUrl(page)).toHaveValue(new RegExp(`\\.${app.ext}\\?mode=proxy&endpoint=\\w+&notify=false$`))
    })
  }

  test("tell Quantumult X users to reinstall to change them", async ({ page }) => {
    await setup(page)
    await openModulePage(page)
    await expect(notifySwitch(page)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText("模块参数里开关")).toBeVisible()
    await chooseSoftware(page, "Quantumult X")
    await expect(page.getByText("Quantumult X 没有模块参数")).toBeVisible()
  })

  test("are not offered for Stash in proxy mode", async ({ page }) => {
    await setup(page)
    await openModulePage(page)
    await expect(notifySwitch(page)).toBeVisible({ timeout: 30_000 })
    await notifySwitch(page).click()
    await chooseSoftware(page, "Stash")
    await expect(notifySwitch(page)).toBeVisible()
    await chooseProxyMode(page)
    await expect(notifySwitch(page)).toHaveCount(0)
    // A switch turned off earlier does not carry over to the hidden one.
    await expect(moduleUrl(page)).toHaveValue(/\.stoverride\?mode=proxy&endpoint=\w+$/)
  })

  // Screenshots for review (in the test output directory): Quantumult X in
  // proxy mode, the setting this change adds.
  for (const colorScheme of ["light", "dark"] as const) {
    for (const width of [390, 1440]) {
      test(`renders Quantumult X proxy mode at ${width}px in ${colorScheme} mode`, async ({ page }, testInfo) => {
        await page.emulateMedia({ colorScheme })
        await page.setViewportSize({ width, height: width < 800 ? 844 : 1000 })
        await setup(page)
        await openModulePage(page)
        await expect(notifySwitch(page)).toBeVisible({ timeout: 30_000 })
        await chooseSoftware(page, "Quantumult X")
        await expect(moduleUrl(page)).toHaveValue(/\.conf\?mode=proxy&/)
        await expect(notifySwitch(page)).toBeVisible()
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow).toBeLessThanOrEqual(0)
        await notifySwitch(page).evaluate((element) => element.scrollIntoView({ block: "center" }))
        await page.screenshot({ path: testInfo.outputPath(`ios-module-notify-qx-proxy-${width}-${colorScheme}.png`) })
      })
    }
  }
})
