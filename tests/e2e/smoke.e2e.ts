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
