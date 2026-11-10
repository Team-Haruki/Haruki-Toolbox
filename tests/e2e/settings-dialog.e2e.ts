import { expect, test } from "@playwright/test"

test("settings dialog lays every tab out as titled groups of rows", async ({ page }) => {
  await page.goto("/about")
  await page.getByRole("button", { name: /^(设置|Settings)$/ }).click()

  const dialog = page.getByRole("dialog", { name: /Haruki工具箱设置|Haruki Toolbox Settings/ })
  const tabs = dialog.locator("nav:visible")

  // Preferences: appearance, network, privacy, music playback and reset, each a group of rows.
  await expect(dialog.getByRole("heading", { level: 3 }).filter({ visible: true })).toHaveCount(5)
  await expect(dialog.getByText(/^(资产线路|Asset route)$/)).toBeVisible()
  await expect(dialog.getByText(/^(恢复默认设置|Restore default settings)$/)).toBeVisible()
  await expect(dialog.locator("[data-slot='settings-row']").filter({ visible: true })).toHaveCount(10)
  await expect(dialog.getByRole("combobox", { name: /^(优先演唱版本|Preferred vocal version)$/ })).toContainText(/SEKAI/)

  await tabs.getByRole("button", { name: /^(应用|App)$/ }).click()
  await expect(dialog.getByTestId("settings-update-status")).toBeVisible()
  await expect(dialog.locator("[data-slot='settings-facts']").filter({ visible: true })).toHaveCount(1)
  await expect(dialog.getByRole("button", { name: /^(检查更新|Check for updates)$/ })).toBeVisible()

  await tabs.getByRole("button", { name: /^(游戏数据库|Game database)$/ }).click()
  for (const region of ["jp", "en", "tw", "kr", "cn"]) {
    await expect(dialog.getByTestId(`settings-region-${region}`)).toBeVisible()
  }
})
