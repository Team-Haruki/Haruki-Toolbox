import { expect, test } from "@playwright/test"

const authGatedRoutes = ["/cards/box", "/music/progress", "/events/records", "/profile/me", "/training/challenge", "/event-planner", "/user/harukibot-authorization"]

const missingSnapshotRoutes = [
  "/events/records", "/music/progress", "/cards/box", "/profile/me",
  "/training/challenge", "/training/power", "/training/area",
  "/training/bonds", "/training/leader", "/training/missions",
].map((path) => ({ path, linkName: /前往数据上传页|Go to data upload/ }))

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
        return handler.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ status: 404, message: "Player data not found." }) })
      }
      return handler.abort()
    })

    await page.goto(route.path)

    if (route.path === "/profile/me") {
      // The profile page defaults to the live source; the uploaded-data tab is
      // mirrored into the URL as `?source=snapshot` so the link can be shared.
      await page.getByRole("tab", { name: /上传的数据|Uploaded data/ }).click()
      await expect(page).toHaveURL(/[?&]source=snapshot(?:&|$)/)
    }
    const uploadLink = page.getByRole("link", { name: route.linkName })
    await expect(uploadLink).toBeVisible()
    await expect(uploadLink).toHaveAttribute("href", "/upload-data")
    await expect(page.getByText(/Request failed with status code 404|Player data not found/)).toHaveCount(0)
    await uploadLink.click()
    await expect(page).toHaveURL(/\/upload-data$/)
  })
}

// Keep the test hermetic (and `load` fast): the home page pulls third-party
// scripts (gtag) whose latency from CI runners would otherwise gate goto().
function blockExternalHosts(page: import("@playwright/test").Page) {
  return page.route("**/*", (handler) => {
    const url = new URL(handler.request().url())
    return url.host === "127.0.0.1:4173" ? handler.continue() : handler.abort()
  })
}

test("global search opens with the keyboard shortcut", async ({ page }) => {
  await blockExternalHosts(page)
  await page.goto("/")

  // An unauthenticated boot waits up to 4s on the dead-port Kratos session
  // before mounting, so the first visibility check gets a boot-sized timeout.
  const searchButton = page.getByRole("button", { name: /快速搜索|Quick search/ }).first()
  await expect(searchButton).toBeVisible({ timeout: 10_000 })

  await page.keyboard.press("ControlOrMeta+k")
  await expect(page.getByRole("dialog")).toBeVisible()
})

test("global search opens from the topbar button", async ({ page }) => {
  await blockExternalHosts(page)
  await page.goto("/")

  const searchButton = page.getByRole("button", { name: /快速搜索|Quick search/ }).first()
  await expect(searchButton).toBeVisible({ timeout: 10_000 })
  await searchButton.click()
  await expect(page.getByRole("dialog")).toBeVisible()
})

test("account selector groups granted accounts and filters them by capability", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Grant test",
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
    if (url.pathname.includes("/api/user/toolbox-test/accessible-game-accounts")) {
      return handler.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "ok",
          updatedData: {
            generatedAt: "2026-08-25T12:00:00Z",
            total: 3,
            accounts: [
              { server: "jp", gameUserId: "123456", ownership: "own", verified: true, isDefault: true, capabilities: { suite: {}, mysekai: {}, profile: {}, recommend: {} }, owner: null },
              { server: "jp", gameUserId: "987654321", ownership: "granted", verified: true, isDefault: false, capabilities: { suite: { expiresAt: "2026-09-30T00:00:00Z" } }, owner: { userId: "owner-1", name: "Grantor", avatarPath: null } },
              { server: "cn", gameUserId: "555555", ownership: "granted", verified: true, isDefault: false, capabilities: { mysekai: { expiresAt: "2026-09-01T00:00:00Z" } }, owner: { userId: "owner-2", name: "MysekaiOnly", avatarPath: null } },
            ],
          },
        }),
      })
    }
    if (url.pathname.includes("/api/user/toolbox-test/game-account/") && /\/(suite|mysekai)$/.test(url.pathname)) {
      return handler.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ status: 404, message: "Player data not found." }) })
    }
    return handler.abort()
  })

  await page.goto("/events/records")

  const trigger = page.getByRole("combobox").first()
  await expect(trigger).toContainText("123456")
  await trigger.click()

  const listbox = page.getByRole("listbox")
  await expect(listbox).toContainText(/我的绑定账号|My bound accounts/)
  await expect(listbox).toContainText(/他人授权的账号|Granted to me/)
  await expect(listbox).toContainText("Grantor")
  // The mysekai-only grant must not appear on a suite-gated page.
  await expect(listbox).not.toContainText("MysekaiOnly")

  await page.getByRole("option", { name: /Grantor/ }).click()
  await expect(trigger).toContainText("987654321")
  await expect(trigger).toContainText(/授权|Granted/)
  await expect(page.getByText(/该账号的主人还没有上传游戏数据|The owner of this account has not uploaded/)).toBeVisible()
  await expect(page.getByRole("link", { name: /前往数据上传页|Go to data upload/ })).toBeVisible()
})

for (const platform of [null, "discord"] as const) {
  test(`game binding form is available with ${platform ?? "no"} social binding`, async ({ page }) => {
    await page.addInitScript((socialPlatform) => {
      sessionStorage.setItem("user", JSON.stringify({
        name: "Binding test",
        userId: "toolbox-test",
        gameAccountBindings: [],
        socialPlatformInfo: socialPlatform
          ? { platform: socialPlatform, userId: "discord-test", verified: true }
          : null,
        sessionToken: "test-token",
        tokenExpiration: 4_102_444_800,
      }))
    }, platform)
    await blockExternalHosts(page)
    await page.goto("/user/game-account-bindings")
    await page.getByRole("button", { name: /绑定新账号|Bind new account/ }).first().click()

    const dialog = page.getByRole("dialog")
    await expect(dialog.locator("#binding-user-id")).toBeEnabled()
    await dialog.locator("#binding-user-id").fill("123456")
    await expect(dialog.getByRole("button", { name: /验证|Verify/, exact: true })).toBeEnabled()
    await expect(dialog.getByRole("button", { name: /保存|Save/, exact: true })).toBeDisabled()
  })
}

for (const failure of [
  { status: 404, message: "binding not found" },
  { status: 403, message: "not authorized to access this binding" },
  { status: 500, message: "failed to get user data" },
]) {
  test(`snapshot ${failure.status} ${failure.message} does not claim data was never uploaded`, async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("user", JSON.stringify({
        name: "Failure test", userId: "toolbox-test",
        gameAccountBindings: [{ server: "jp", userId: 123456, verified: true, isDefault: true }],
        sessionToken: "test-token", tokenExpiration: 4_102_444_800,
      }))
    })
    await page.route("**/*", (handler) => {
      const url = new URL(handler.request().url())
      if (url.host === "127.0.0.1:4173") return handler.continue()
      if (url.pathname.endsWith("/game-account/jp/123456/suite")) {
        return handler.fulfill({ status: failure.status, contentType: "application/json", body: JSON.stringify(failure) })
      }
      return handler.abort()
    })
    await page.goto("/events/records")
    await expect(page.getByRole("button", { name: /重试|Retry/, exact: true })).toBeVisible()
    await expect(page.getByRole("link", { name: /前往数据上传页|Go to data upload/ })).toHaveCount(0)
  })
}
