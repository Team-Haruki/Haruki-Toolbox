import { expect, test, type Page } from "@playwright/test"

// The calendar is laid out in the viewer's wall clock, so the plan below is
// built in one fixed zone.
test.use({ timezoneId: "Asia/Shanghai" })

const UID = "123456789012345678"
const HOUR = 3_600_000
const START = Date.parse("2026-10-20T06:00:00Z") // 14:00 local
const END = Date.parse("2026-10-28T11:59:59Z")
const NOW = "2026-10-22T08:00:00Z" // 16:00 local on day three

const brushes = [
  { id: "b1", name: "Main loop", color: "#33ccbb", pointsPerHour: 1_250_000, musicId: 74, difficulty: "expert", eventPointPerPlay: 2000, playsPerHour: 25, boostCount: 5, deckCardIds: [] },
  { id: "b2", name: "Low boost", color: "#7c6ef2", pointsPerHour: 420_000, musicId: 47, difficulty: "master", eventPointPerPlay: 2100, playsPerHour: 20, boostCount: 2, deckCardIds: [] },
]

/** Nights off, the main brush on six evenings, the cheap one around midday every other day. */
function seededCells() {
  const cells: Record<string, string> = {}
  for (let time = START; time < END; time += HOUR) {
    const hour = (new Date(time).getUTCHours() + 8) % 24
    const day = Math.floor((time - START) / (24 * HOUR))
    if (hour >= 1 && hour <= 7) cells[String(time)] = "rest"
    else if (hour >= 19 && hour <= 23 && day < 6) cells[String(time)] = "b1"
    else if (hour >= 12 && hour <= 14 && day % 2 === 0) cells[String(time)] = "b2"
  }
  return cells
}

async function openPlanner(page: Page) {
  await page.clock.setFixedTime(new Date(NOW))
  await page.addInitScript(({ uid, plan }) => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Planner test", userId: "toolbox-test",
      gameAccountBindings: [{ server: "jp", userId: uid, verified: true, isDefault: true }],
      sessionToken: "test-token", tokenExpiration: 4_102_444_800,
    }))
    localStorage.setItem("haruki:deck-recommend:saved-config", JSON.stringify({ version: 1, config: { selectedEventId: "221" } }))
    if (!localStorage.getItem("event-planner")) {
      localStorage.setItem("event-planner", JSON.stringify({ plans: { [`jp:${uid}|jp|221`]: plan } }))
    }
  }, { uid: UID, plan: { targetPointInput: "3000w", currentPointInput: "420w", brushes, cells: seededCells(), updatedAt: 1 } })

  const files: Record<string, unknown> = {
    events: [{ id: 221, eventType: "marathon", name: "Planner event", startAt: START, aggregateAt: END }],
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
          generatedAt: NOW, total: 1,
          accounts: [{ server: "jp", gameUserId: UID, ownership: "own", verified: true, isDefault: true, capabilities: { suite: {}, recommend: {} }, writeCapabilities: { suite: {} }, owner: null }],
        },
      }) })
    }
    if (url.host !== "sekai-api-cdn.haruki.seiunx.com") {
      return route.request().resourceType() === "image" ? route.fulfill({ status: 404 }) : route.abort()
    }
    const name = hashes[url.pathname.split("/").at(-1) ?? ""]
    const body = url.pathname.endsWith("/current")
      ? { dataVersion: "7.1.0.12", contentHash: "planner", files: Object.entries(hashes).map(([sha256, key]) => ({ name: `${key}.json`, sha256 })) }
      : name ? files[name] : []
    return route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) })
  })

  await page.goto("/event-planner")
  await expect(page.getByTestId("planner-day")).toHaveCount(9, { timeout: 30_000 })
}

const stat = (page: Page, key: string) => page.getByTestId("planner-progress").locator(`[data-stat=${key}] dd`)

test("the plan is read from the current hour on, day by day", async ({ page }) => {
  await openPlanner(page)

  // Four evenings of the main brush and nine hours of the cheap one are still ahead.
  await expect(stat(page, "planned")).toHaveText("+28,780,000")
  await expect(stat(page, "projected")).toHaveText("32,980,000")
  await expect(stat(page, "remaining")).toHaveText("0")
  await expect(page.getByTestId("planner-progress")).toHaveAttribute("data-state", "reached")

  // Days that are over have no running total; the sixth day is where the target is met.
  const totals = page.getByTestId("planner-day-total")
  await expect(totals.nth(0)).toHaveText("–")
  await expect(totals.nth(5)).toContainText(/达标|Target met/)
  await expect(totals.nth(4)).not.toContainText(/达标|Target met/)
})

test("painting an hour adds the brush's rate, and clearing asks first", async ({ page }) => {
  await openPlanner(page)

  await page.getByTestId("planner-brush").first().getByRole("button").first().click()
  // 16:00 on the seventh day: ahead of now, and empty in the seeded plan.
  await page.locator(`[data-hour="${Date.parse("2026-10-26T08:00:00Z")}"]`).click()
  await expect(stat(page, "planned")).toHaveText("+30,030,000")

  // The same brush on the same cell erases it.
  await page.locator(`[data-hour="${Date.parse("2026-10-26T08:00:00Z")}"]`).click()
  await expect(stat(page, "planned")).toHaveText("+28,780,000")

  await page.getByTestId("planner-calendar-panel").getByRole("button", { name: /清空规划|Clear plan/ }).click()
  const dialog = page.getByRole("alertdialog")
  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: /清空规划|Clear plan/ }).click()
  await expect(stat(page, "planned")).toHaveText("+0")
  await expect(page.getByTestId("planner-progress")).toHaveAttribute("data-state", "short")
  // The brushes survive a cleared calendar.
  await expect(page.getByTestId("planner-brush")).toHaveCount(2)
})

test("batch fill paints every day's hour range at once", async ({ page }) => {
  await openPlanner(page)

  await page.getByTestId("planner-calendar-panel").getByRole("button", { name: /批量填充|Batch fill/ }).click()
  // The defaults are every day, 0 to 23, with the rest brush: the whole calendar becomes rest.
  await page.getByTestId("planner-batch-apply").click()
  await expect(stat(page, "planned")).toHaveText("+0")
  await expect(page.getByTestId("planner-batch-apply")).toHaveCount(0)
})
