import { expect, test } from "@playwright/test"

const GAME_ID = "28808221489823746"
const ROUNDED_ID = String(Number(GAME_ID))

for (const source of ["realtime", "snapshot"] as const) {
  test(`${source} player profile displays the exact game ID`, async ({ page }) => {
    await page.addInitScript((gameId) => {
      localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN" }))
      sessionStorage.setItem("user", JSON.stringify({
        name: "Precision test", userId: "toolbox-test",
        gameAccountBindings: [{ server: "jp", userId: gameId, verified: true, isDefault: true }],
        sessionToken: "test-token", tokenExpiration: 4_102_444_800,
      }))
    }, GAME_ID)
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url())
      if (url.host === "127.0.0.1:4173") return route.continue()
      // These must be raw JSON literals, not JSON.stringify(number): that
      // would round the fixture before the browser even receives it.
      if (url.pathname.endsWith(`/game-account/jp/${GAME_ID}/profile`)) {
        return route.fulfill({ contentType: "application/json", body: `{"user":{"userId":${GAME_ID},"name":"Precision player","rank":300}}` })
      }
      if (url.pathname.endsWith(`/game-account/jp/${GAME_ID}/suite`)) {
        const keys = (url.searchParams.get("key") ?? "").split(",")
        const emptyTables = Object.fromEntries(keys.filter((key) => key !== "userGamedata" && key !== "upload_time").map((key) => [key, []]))
        return route.fulfill({ contentType: "application/json", body: `{"userGamedata":{"userId":${GAME_ID},"userIdString":"${GAME_ID}","name":"Precision player","rank":300},"upload_time":1794565633,${JSON.stringify(emptyTables).slice(1)}` })
      }
      if (url.host === "sekai-api-cdn.haruki.seiunx.com") {
        const body = url.pathname.endsWith("/current")
          ? { dataVersion: "1", contentHash: "precision-test", files: [] }
          : []
        return route.fulfill({ contentType: "application/json", body: JSON.stringify(body) })
      }
      return route.abort()
    })
    await page.goto(`/profile/me?source=${source}`)
    await expect(page.getByText("Precision player", { exact: true })).toBeVisible({ timeout: 30_000 })
    // Check the profile content, not merely the selector that already had
    // the correct ID before this fix.
    await expect(page.locator("span.font-mono.tabular-nums", { hasText: GAME_ID })).toBeVisible()
    await expect(page.getByText(ROUNDED_ID, { exact: true })).toHaveCount(0)
  })
}
