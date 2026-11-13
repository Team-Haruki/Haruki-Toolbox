import { expect, test, type Locator, type Page } from "@playwright/test"

// The card box on a phone pages its cards. Grouped by character, every
// character is listed and pages its own cards: a cut through the full list
// would leave a few of each character's cards on every page.

const NOW = Date.parse("2026-10-22T08:00:00Z")
const DAY = 86_400_000
const CHARACTERS = [
  { id: 1, firstName: "星乃", givenName: "一歌", unit: "light_sound", cards: 40 },
  { id: 2, firstName: "天馬", givenName: "咲希", unit: "light_sound", cards: 40 },
  // More than a page of 60.
  { id: 21, firstName: "初音", givenName: "ミク", unit: "piapro", cards: 70 },
]
const TOTAL = CHARACTERS.reduce((sum, character) => sum + character.cards, 0)

// Ids interleave the characters, as release order does in the real data.
const owners: number[] = []
for (let round = 0; owners.length < TOTAL; round += 1) {
  for (const character of CHARACTERS) {
    if (round < character.cards) {
      owners.push(character.id)
    }
  }
}
const cards = owners.map((characterId, index) => ({
  id: index + 1,
  characterId,
  cardRarityType: "rarity_3",
  attr: ["cute", "cool", "pure", "happy", "mysterious"][index % 5],
  supportUnit: "none",
  prefix: `Card ${index + 1}`,
  assetbundleName: `res${String(characterId).padStart(3, "0")}_no${String(index + 1).padStart(3, "0")}`,
  releaseAt: NOW - (500 - index) * DAY,
  skillId: 1,
}))

const files: Record<string, unknown> = {
  cards,
  gameCharacters: CHARACTERS.map(({ id, firstName, givenName, unit }) => ({ id, firstName, givenName, unit })),
  gameCharacterUnits: CHARACTERS.map((character) => ({ id: character.id, gameCharacterId: character.id, unit: character.unit, colorCode: "#33ccbb" })),
}

async function openCardBox(page: Page) {
  await page.clock.setFixedTime(new Date(NOW))
  await page.addInitScript(() => {
    if (!localStorage.getItem("settings")) {
      localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN" }))
    }
    sessionStorage.setItem("user", JSON.stringify({
      name: "Card box test",
      userId: "toolbox-test",
      gameAccountBindings: [{ server: "jp", userId: 123456, verified: true, isDefault: true }],
      sessionToken: "test-token",
      tokenExpiration: 4_102_444_800,
    }))
  })
  const hashes = Object.fromEntries(
    Object.keys(files).map((name, index) => [index.toString(16).padStart(2, "0").repeat(32), name]),
  )
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    if (url.host === "127.0.0.1:4173") return route.continue()
    if (url.pathname.endsWith("/game-account/jp/123456/suite")) {
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ upload_time: Math.floor(NOW / 1000), userCards: cards.filter((card) => card.id % 2 === 0).map((card) => ({ cardId: card.id, level: 30, masterRank: 0, skillLevel: 1, specialTrainingStatus: "not_doing", defaultImage: "original" })) }),
      })
    }
    if (url.host !== "sekai-api-cdn.haruki.seiunx.com") {
      return route.request().resourceType() === "image" ? route.fulfill({ status: 404 }) : route.abort()
    }
    const name = hashes[url.pathname.split("/").at(-1) ?? ""]
    const body = url.pathname.endsWith("/current")
      ? { dataVersion: "7.1.0.12", contentHash: "card-box", files: Object.entries(hashes).map(([sha256, key]) => ({ name: `${key}.json`, sha256 })) }
      : name ? files[name] : []
    return route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) })
  })
  await page.goto("/cards/box")
  await expect(page.locator("section[id^='card-box-character-']").first()).toBeVisible({ timeout: 30_000 })
}

function sections(page: Page) {
  return page.locator("section[id^='card-box-character-']")
}

function tiles(section: Locator) {
  return section.locator("a[href^='/cards/']")
}

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test("a grouped card box lists every character, closed, without a pager over the list", async ({ page }) => {
    await openCardBox(page)

    await expect(sections(page)).toHaveCount(CHARACTERS.length)
    for (const section of await sections(page).all()) {
      await expect(section.getByRole("button").first()).toHaveAttribute("aria-expanded", "false")
    }
    await expect(page.locator("[data-slot='catalog-pagination']")).toHaveCount(0)
    await expect(page.locator("main a[href^='/cards/']:not([href='/cards/box'])")).toHaveCount(0)
  })

  test("a character shows all of its cards, and pages them itself when they do not fit", async ({ page }) => {
    await openCardBox(page)

    // 40 cards fit in a page of 60: all of them, no pager.
    const small = page.locator("#card-box-character-1")
    await small.getByRole("button").first().click()
    await expect(tiles(small)).toHaveCount(40)
    await expect(small.getByTestId("card-box-section-pager")).toHaveCount(0)

    // 70 cards: 60, then the other 10, under the character's own pager.
    const large = page.locator("#card-box-character-21")
    await large.getByRole("button").first().click()
    await expect(tiles(large)).toHaveCount(60)
    const pager = large.getByTestId("card-box-section-pager")
    await expect(pager).toContainText("1 / 2")
    await expect(pager.getByRole("button", { name: /^(上一页|Previous page)$/ })).toBeDisabled()
    await pager.getByRole("button", { name: /^(下一页|Next page)$/ }).click()
    await expect(pager).toContainText("2 / 2")
    await expect(tiles(large)).toHaveCount(10)
    await expect(pager.getByRole("button", { name: /^(下一页|Next page)$/ })).toBeDisabled()
    // The other character is where it was.
    await expect(tiles(small)).toHaveCount(40)
    // The new page starts at the character's heading.
    await expect(large.getByRole("button").first()).toBeInViewport()
  })

  test("the roster opens a character's section", async ({ page }) => {
    await openCardBox(page)

    await page.getByRole("button", { name: "天馬咲希", exact: true }).click()
    const section = page.locator("#card-box-character-2")
    await expect(section.getByRole("button").first()).toHaveAttribute("aria-expanded", "true")
    await expect(tiles(section)).toHaveCount(40)
    await expect(section.getByRole("button").first()).toBeInViewport()
  })

  test("the ungrouped card box pages the whole list", async ({ page }) => {
    await openCardBox(page)

    await page.getByText(/^(全部卡牌|All cards)$/).click()
    await expect(sections(page)).toHaveCount(0)
    await expect(page.locator("main a[href^='/cards/']:not([href='/cards/box'])")).toHaveCount(60)
    await page.getByRole("button", { name: /^(下一页|Next page)$/ }).first().click()
    await expect(page).toHaveURL(/[?&]page=2(?:&|$)/)
    await expect(page.locator("main a[href^='/cards/']:not([href='/cards/box'])")).toHaveCount(60)
  })
})

test("a wide screen shows every character open and whole on one page", async ({ page }) => {
  await openCardBox(page)

  await expect(sections(page)).toHaveCount(CHARACTERS.length)
  await expect(tiles(page.locator("#card-box-character-21"))).toHaveCount(70)
  await expect(page.getByTestId("card-box-section-pager")).toHaveCount(0)
  await expect(page.locator("[data-slot='catalog-pagination']")).toHaveCount(0)
})
