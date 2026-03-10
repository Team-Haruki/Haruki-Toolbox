import { expect, test } from "@playwright/test"

test("settings page renders i18n controls", async ({ page }) => {
  await page.goto("/settings")

  await expect(page.getByRole("heading", { name: /Haruki工具箱设置|Haruki Toolbox Settings/ })).toBeVisible()
  await expect(page.getByText(/服务器端点|Server Endpoint/)).toBeVisible()
  await expect(page.getByText(/界面语言|Language/)).toBeVisible()
})
