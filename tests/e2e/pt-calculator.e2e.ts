import { expect, test, type Page } from "@playwright/test"

// The score-control song: basic pt 100, so an idle game earns exactly
// (100 + bonus) × the boost multiplier.
const MUSICS = [{ id: 74, title: "Score control song", publishedAt: 1601028000000, assetbundleName: "jacket_s_074" }]
const MUSIC_METAS = [{ music_id: 74, difficulty: "master", event_rate: 100 }]

async function mockScoreControlData(page: Page) {
  const files: Record<string, unknown> = { musics: MUSICS, musicDifficulties: [{ musicId: 74, musicDifficulty: "master", playLevel: 26, totalNoteCount: 600 }] }
  const hashes = Object.fromEntries(Object.keys(files).map((name, index) => [String(index + 1).repeat(64), name]))
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    if (url.host === "127.0.0.1:4173") return route.continue()
    if (url.host !== "sekai-api-cdn.haruki.seiunx.com") {
      return route.request().resourceType() === "image" ? route.fulfill({ status: 404 }) : route.abort()
    }
    const name = hashes[url.pathname.split("/").at(-1) ?? ""]
    const body = url.pathname.endsWith("/music_metas.json")
      ? MUSIC_METAS
      : url.pathname.endsWith("/current")
        ? { dataVersion: "7.1.0.12", contentHash: "score-control", files: Object.entries(hashes).map(([sha256, key]) => ({ name: `${key}.json`, sha256 })) }
        : name ? files[name] : []
    return route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) })
  })
}

async function openCalculator(page: Page) {
  await mockScoreControlData(page)
  await page.goto("/pt-calculator")
  await expect(page.getByTestId("score-control-form")).toBeVisible()
  // The basic pt line appears once the song data is in.
  await expect(page.getByTestId("score-control-form")).toContainText("100")
}

test("a gap no single game can earn is split into games that add up to it", async ({ page }) => {
  await openCalculator(page)
  await page.locator("#score-control-gap").fill("23154")

  const summary = page.getByTestId("score-control-summary")
  await expect(summary).toHaveAttribute("data-status", "ok")
  await expect(summary).toContainText("23,154")
  await expect(page.getByTestId("score-control-single")).toHaveCount(0)

  const firstPlan = page.getByTestId("score-control-plan").first()
  const steps = firstPlan.getByTestId("score-control-step")
  await expect(steps).toHaveCount(2)
  // 354% deck: 454 × 20 at 4 fire, then 454 × 31 at 8 fire.
  await expect(steps.nth(0)).toContainText("354%")
  await expect(steps.nth(0)).toContainText("+9,080")
  await expect(steps.nth(1)).toContainText("+14,074")
})

test("a pt one game can earn lists the single-game options, idle ones first", async ({ page }) => {
  await openCalculator(page)
  await page.locator("#score-control-gap").fill("3000")

  await expect(page.getByTestId("score-control-plan").first().getByTestId("score-control-step")).toHaveCount(1)
  const rows = page.getByTestId("score-control-single-row")
  await expect(rows).toHaveCount(12)
  await expect(rows.nth(0)).toContainText("200%")
  await expect(rows.nth(1)).toContainText("100%")
})

test("current and target pt give running totals, and a gap that is still too wide says where to play up to", async ({ page }) => {
  await openCalculator(page)
  await page.getByRole("tab").nth(1).click()
  await page.locator("#score-control-current").fill("1234567")
  await page.locator("#score-control-target").fill("1257721")

  const summary = page.getByTestId("score-control-summary")
  await expect(summary).toHaveAttribute("data-status", "ok")
  await expect(page.getByTestId("score-control-plan").first().getByTestId("score-control-step").last()).toContainText("1,257,721")

  await page.locator("#score-control-target").fill("300w")
  await expect(summary).toHaveAttribute("data-status", "tooFar")
  // Five idle games at 10 fire and 435% cover 93,625 pt.
  await expect(summary).toContainText("93,625")
  await expect(summary).toContainText("2,906,375")
  await expect(page.getByTestId("score-control-plan")).toHaveCount(0)
})

test("a step hands its bonus and boost to deck recommend", async ({ page }) => {
  // Deck recommend needs a session, and consumes its query once read: record
  // the navigation itself rather than the address bar afterwards.
  await page.addInitScript(() => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Score control test", userId: "toolbox-test",
      gameAccountBindings: [], sessionToken: "test-token", tokenExpiration: 4_102_444_800,
    }))
    const pushed: string[] = []
    Object.assign(window, { __pushed: pushed })
    const push = history.pushState.bind(history)
    history.pushState = (state, unused, url) => {
      pushed.push(String(url))
      return push(state, unused, url)
    }
  })
  await openCalculator(page)
  await page.locator("#score-control-gap").fill("3000")
  await page.getByTestId("score-control-plan").first().getByRole("button").click()

  const readTarget = () => page.evaluate(() =>
    (window as unknown as { __pushed: string[] }).__pushed.find((url) => url.includes("/deck-recommend?")) ?? null)
  await expect.poll(readTarget).not.toBeNull()
  const query = new URL((await readTarget())!, "http://127.0.0.1:4173").searchParams
  expect(query.get("mode")).toBe("bonus")
  expect(query.get("bonusTargets")).toBe("200")
  expect(query.get("boost")).toBe("2")
  expect(query.get("musicId")).toBe("74")
})
