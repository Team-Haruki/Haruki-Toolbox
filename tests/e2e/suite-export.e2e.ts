import { readFile } from "node:fs/promises"
import { expect, test } from "@playwright/test"

// The user data settings hand the viewer the uploaded Suite as a file: the
// request names no keys, so the server answers with every table it serves.

const UPLOADED_AT = Math.floor(Date.parse("2026-11-13T10:27:13Z") / 1000)
const SUITE = {
  upload_time: UPLOADED_AT,
  userGamedata: { userId: 123456, name: "テスト", rank: 300 },
  userCards: [{ cardId: 1, level: 60 }],
}

test("exports the selected account's whole Suite as a JSON file", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN" }))
    sessionStorage.setItem("user", JSON.stringify({
      name: "Export test",
      userId: "toolbox-test",
      gameAccountBindings: [{ server: "jp", userId: 123456, verified: true, isDefault: true }],
      sessionToken: "test-token",
      tokenExpiration: 4_102_444_800,
    }))
  })
  const suiteRequests: string[] = []
  await page.route("**/game-account/jp/123456/suite**", (route) => {
    suiteRequests.push(new URL(route.request().url()).search)
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(SUITE) })
  })

  await page.goto("/about")
  await page.getByRole("button", { name: "设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "Haruki工具箱设置" })
  await dialog.locator("nav:visible").getByRole("button", { name: "用户数据", exact: true }).click()

  const exportButton = dialog.getByTestId("user-data-export")
  await expect(exportButton).toHaveText("导出账号数据")
  const [download] = await Promise.all([page.waitForEvent("download"), exportButton.click()])

  expect(download.suggestedFilename()).toMatch(/^suite-jp-123456-\d{8}-\d{6}\.json$/)
  expect(JSON.parse(await readFile(await download.path(), "utf8"))).toEqual(SUITE)
  // No `key` filter: every table the server serves, not the subset a page reads.
  expect(suiteRequests).toEqual([""])
  await expect(page.getByText("账号数据已导出")).toBeVisible()

  // A profile is read live from the game server; there is no upload to export.
  await dialog.getByRole("combobox", { name: "数据类型" }).click()
  await page.getByRole("option", { name: "个人档案（Profile）" }).click()
  await expect(exportButton).toHaveCount(0)
})
