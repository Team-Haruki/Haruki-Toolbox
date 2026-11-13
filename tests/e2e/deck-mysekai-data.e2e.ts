import { expect, test, type Page } from "@playwright/test"

const OWN_UID = "123456789012345678"

// An own account with no upload at all, MySekai deck mode saved, and the
// minimal master data the run button needs.
async function mockDeckData(page: Page) {
  await page.clock.setFixedTime(new Date("2026-10-21T08:00:00Z"))
  await page.addInitScript((uid) => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Deck test", userId: "toolbox-test",
      gameAccountBindings: [{ server: "jp", userId: uid, verified: true, isDefault: true }],
      sessionToken: "test-token", tokenExpiration: 4_102_444_800,
    }))
    localStorage.setItem("haruki:deck-recommend:saved-config", JSON.stringify({
      version: 1,
      config: { selectedMusicId: "1", selectedDifficulty: "expert", selectedEventId: "221", recommendMode: "mysekai" },
    }))
  }, OWN_UID)

  // Use the same manifest/blob protocol as the production master-data worker.
  const files: Record<string, unknown> = {
    events: [{ id: 221, eventType: "marathon", name: "Event", startAt: 1792562400000, aggregateAt: 1792929599000 }],
    musics: [{ id: 1, title: "Song", publishedAt: 1601028000000, assetbundleName: "jacket_s_001" }],
    musicDifficulties: [{ musicId: 1, musicDifficulty: "expert", playLevel: 28, totalNoteCount: 1000 }],
  }
  const hashes = Object.fromEntries(Object.keys(files).map((name, index) => [String(index + 1).repeat(64), name]))
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    if (url.host === "127.0.0.1:4173") return route.continue()
    const apiHeaders = {
      "access-control-allow-origin": route.request().headers().origin ?? "http://127.0.0.1:4173",
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "GET, HEAD, OPTIONS",
      "access-control-allow-headers": route.request().headers()["access-control-request-headers"] ?? "authorization, content-type",
    }
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: apiHeaders })
    if (url.pathname.endsWith("/accessible-game-accounts")) {
      return route.fulfill({ contentType: "application/json", headers: apiHeaders, body: JSON.stringify({
        status: 200, message: "ok", updatedData: {
          generatedAt: "2026-10-21T08:00:00Z", total: 1,
          accounts: [
            { server: "jp", gameUserId: OWN_UID, ownership: "own", verified: true, isDefault: true, capabilities: { suite: {}, recommend: {} }, writeCapabilities: { suite: {} }, owner: null },
          ],
        },
      }) })
    }
    if (url.pathname.includes("/game-account/") && (url.pathname.endsWith("/suite") || url.pathname.endsWith("/mysekai"))) {
      return route.fulfill({ status: 404, contentType: "application/json", headers: apiHeaders, body: JSON.stringify({ status: 404, message: "Player data not found." }) })
    }
    if (url.host !== "sekai-api-cdn.haruki.seiunx.com") return route.abort()
    const name = hashes[url.pathname.split("/").at(-1) ?? ""]
    const body = url.pathname.endsWith("/current")
      ? { dataVersion: "7.1.0.12", contentHash: "deck-mysekai-data", files: Object.entries(hashes).map(([sha256, key]) => ({ name: `${key}.json`, sha256 })) }
      : name ? files[name] : []
    return route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) })
  })
}

// MySekai mode runs on the Suite upload alone: its gate, canvas and fixture
// bonuses are Suite tables. With no upload at all it must ask only for Suite
// and say so, never for a MySekai upload.
test("mysekai deck mode reads only the Suite upload", async ({ page }) => {
  const gameAccountReads: string[] = []
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname
    if (request.method() === "GET" && path.includes("/game-account/")) gameAccountReads.push(path.split("/").at(-1) ?? "")
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await mockDeckData(page)
  await page.goto("/deck-recommend")
  await expect(page.getByRole("combobox", { name: /^(账号|Account)$/ })).toContainText(OWN_UID)
  const run = page.getByRole("button", { name: /^(开始推荐|重新推荐)$/ })
  await expect(run).toBeEnabled({ timeout: 20_000 })
  await run.click()
  await expect(page.getByText("还没有可用于组卡的游戏数据")).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(/烤森组卡也无需上传 MySekai/)).toBeVisible()
  expect(gameAccountReads).toContain("suite")
  expect(gameAccountReads).not.toContain("mysekai")
})
