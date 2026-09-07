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
