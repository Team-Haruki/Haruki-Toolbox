import { expect, test } from "@playwright/test"

const authGatedRoutes = ["/cards/box", "/music/progress", "/events/records", "/profile/me", "/training/challenge", "/event-planner", "/user/harukibot-authorization"]

const missingSnapshotRoutes = [
  { path: "/events/records", linkName: /前往上传数据|Upload game data/ },
  { path: "/music/progress", linkName: /前往上传数据|Upload game data/ },
] as const

for (const route of authGatedRoutes) {
  test(`unauthenticated visit to ${route} redirects to login`, async ({ page }) => {
    // Keep the test hermetic: the login page immediately starts a Kratos flow
    // against the real auth host, which would carry the page off-origin.
    await page.route("**/*", (handler) => {
      const url = new URL(handler.request().url())
      return url.host === "127.0.0.1:4173" ? handler.continue() : handler.abort()
    })

    await page.goto(route)

    await page.waitForURL(/\/user\/login/)
    expect(new URL(page.url()).searchParams.get("redirect")).toBe(route)
  })
}

for (const route of missingSnapshotRoutes) {
  test(`missing user snapshot on ${route.path} links to upload data`, async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("user", JSON.stringify({
        name: "Mobile test",
        userId: "toolbox-test",
        gameAccountBindings: [
          { server: "jp", userId: 123456, verified: true, isDefault: true },
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
      if (url.pathname.includes("/api/user/toolbox-test/game-account/jp/123456/suite")) {
        return handler.fulfill({ status: 404, contentType: "application/json", body: "{}" })
      }
      return handler.abort()
    })

    await page.goto(route.path)

    const uploadLink = page.getByRole("link", { name: route.linkName })
    await expect(uploadLink).toBeVisible()
    await expect(uploadLink).toHaveAttribute("href", "/upload-data")
  })
}

test("global search opens with the keyboard shortcut", async ({ page }) => {
  await page.goto("/")

  const searchButton = page.getByRole("button", { name: /快速搜索|Quick search/ }).first()
  await expect(searchButton).toBeVisible()

  await page.keyboard.press("ControlOrMeta+k")
  await expect(page.getByRole("dialog")).toBeVisible()
})

test("global search opens from the topbar button", async ({ page }) => {
  await page.goto("/")

  await page.getByRole("button", { name: /快速搜索|Quick search/ }).first().click()
  await expect(page.getByRole("dialog")).toBeVisible()
})
