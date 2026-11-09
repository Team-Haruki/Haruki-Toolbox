import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

// Signs in a test user and serves one write-target listing: an own verified JP
// account, an unverified EN one and a JP account granted by someone else.
async function mockManualUploadTargets(page: Page) {
  const state = { writeListingRequested: false }
  await page.addInitScript(() => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Upload test",
      userId: "toolbox-test",
      gameAccountBindings: [
        { server: "jp", userId: 123456, verified: true, isDefault: true },
        { server: "en", userId: 222222, verified: false },
      ],
      sessionToken: "test-token",
      tokenExpiration: 4_102_444_800,
    }))
  })
  await page.route("**/*", (handler) => {
    const url = new URL(handler.request().url())
    if (url.host === "127.0.0.1:4173") {
      return handler.continue()
    }
    if (url.pathname.includes("/api/user/toolbox-test/accessible-game-accounts")) {
      if (url.searchParams.get("action") === "write") {
        state.writeListingRequested = true
      }
      return handler.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "ok",
          updatedData: {
            generatedAt: "2026-10-06T00:00:00Z",
            total: 3,
            accounts: [
              { server: "jp", gameUserId: "123456", ownership: "own", verified: true, isDefault: true, capabilities: {}, writeCapabilities: { suite: {}, mysekai: {} }, owner: null },
              { server: "en", gameUserId: "222222", ownership: "own", verified: false, isDefault: false, capabilities: {}, writeCapabilities: {}, owner: null },
              { server: "jp", gameUserId: "987654321987654321", ownership: "granted", verified: true, isDefault: false, capabilities: {}, writeCapabilities: { suite: { expiresAt: "2026-11-01T00:00:00Z" } }, owner: null },
            ],
          },
        }),
      })
    }
    return handler.abort()
  })

  return state
}

// The manual upload tab lists accounts from the write-targets endpoint and
// gates uploads purely on writeCapabilities: a received write grant is
// selectable, an unverified own binding is listed but disabled.
test("manual upload selector offers write grants and disables unwritable accounts", async ({ page }) => {
  const state = await mockManualUploadTargets(page)
  await page.goto("/upload-data?tab=file")

  // The account selector is the first combobox on the file tab (data type follows it).
  const trigger = page.getByRole("combobox").first()
  await expect(trigger).toContainText("123456")
  expect(state.writeListingRequested).toBe(true)

  await trigger.click()
  const listbox = page.getByRole("listbox")
  await expect(listbox).toContainText(/我的绑定账号|My bound accounts/)
  await expect(listbox).toContainText(/他人授权的账号|Granted to me/)

  // Unverified own binding: present but not selectable.
  const unverified = page.getByRole("option", { name: /222222/ })
  await expect(unverified).toHaveAttribute("aria-disabled", "true")

  // Suite-only write grant: selectable, and the uid survives as a string
  // beyond Number.MAX_SAFE_INTEGER.
  await page.getByRole("option", { name: /987654321987654321/ }).click()
  await expect(trigger).toContainText("987654321987654321")
  await expect(trigger).toContainText(/授权|Granted/)
  await expect(page.getByText(/他人授权给你的账号|granted to you by another user/)).toBeVisible()
})

// Desktop users drop the capture file straight onto the file field: the hidden
// input receives it and the field shows the file name, as if it had been picked.
test("manual upload accepts a file dropped onto the file field", async ({ page }) => {
  await mockManualUploadTargets(page)
  await page.goto("/upload-data?tab=file")

  const zone = page.getByTestId("upload-drop-zone")
  await expect(zone).toBeVisible()
  await expect(page.getByTestId("upload-file-name")).toContainText(/未选择文件|No file selected/)

  const dataTransfer = await page.evaluateHandle(() => {
    const transfer = new DataTransfer()
    transfer.items.add(new File(["suite"], "suite-20261109.bin", { type: "application/octet-stream" }))
    return transfer
  })
  await zone.dispatchEvent("dragenter", { dataTransfer })
  await expect(zone).toHaveAttribute("data-drag-over", "true")
  await zone.dispatchEvent("drop", { dataTransfer })

  await expect(zone).not.toHaveAttribute("data-drag-over", "true")
  await expect(page.getByTestId("upload-file-name")).toContainText("suite-20261109.bin")
})
