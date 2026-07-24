import { expect, test } from "@playwright/test"

const authGatedRoutes = ["/cards/box", "/music/progress", "/events/records", "/profile/me", "/training/challenge", "/event-planner"]

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
