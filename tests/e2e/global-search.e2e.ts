import { expect, test, type Page } from "@playwright/test"

// The search dialog over a small mocked master set: what it offers before
// anything is typed, how a query is matched and narrowed, and where a hit goes.

const DAY = 86_400_000
const NOW = Date.parse("2026-10-22T08:00:00Z")

const musics = [
  { id: 1, title: "Tell Your World", pronunciation: "てるゆあわーるど", composer: "kz", arranger: "kz", lyricist: "kz", assetbundleName: "jacket_s_001", publishedAt: NOW - 900 * DAY },
  { id: 2, title: "ロキ", pronunciation: "ろき", composer: "みきとP", arranger: "みきとP", lyricist: "みきとP", assetbundleName: "jacket_s_002", publishedAt: NOW - 800 * DAY },
  // Enough "Sample" songs for the group to overflow its five rows.
  ...Array.from({ length: 7 }, (_, index) => ({
    id: 10 + index,
    title: `Sample Song ${index + 1}`,
    pronunciation: "",
    composer: "Composer",
    arranger: "",
    lyricist: "",
    assetbundleName: `jacket_s_01${index}`,
    publishedAt: NOW - (100 - index) * DAY,
  })),
]

const files: Record<string, unknown> = {
  musics,
  musicDifficulties: musics.flatMap((music) => [
    { id: music.id * 10 + 1, musicId: music.id, musicDifficulty: "expert", playLevel: 25, totalNoteCount: 800 },
    { id: music.id * 10 + 2, musicId: music.id, musicDifficulty: "master", playLevel: 30, totalNoteCount: 1100 },
  ]),
  gameCharacters: [
    { id: 21, firstName: "初音", givenName: "ミク", unit: "piapro" },
    { id: 22, firstName: "鏡音", givenName: "リン", unit: "piapro" },
  ],
  gameCharacterUnits: [
    { id: 21, gameCharacterId: 21, unit: "piapro", colorCode: "#33ccbb" },
    { id: 22, gameCharacterId: 22, unit: "piapro", colorCode: "#ffcc11" },
  ],
  cards: [
    { id: 7, characterId: 21, cardRarityType: "rarity_4", attr: "cute", supportUnit: "none", prefix: "奇跡の歌声", assetbundleName: "res021_no001", releaseAt: NOW - 400 * DAY, skillId: 1 },
    { id: 8, characterId: 22, cardRarityType: "rarity_3", attr: "cool", supportUnit: "none", prefix: "Sample Card", assetbundleName: "res022_no001", releaseAt: NOW - 300 * DAY, skillId: 1 },
  ],
  cardSupplies: [],
  events: [
    { id: 7, eventType: "marathon", name: "Sample Marathon", assetbundleName: "event_sample", startAt: NOW - 2 * DAY, aggregateAt: NOW + 5 * DAY },
    { id: 6, eventType: "cheerful_carnival", name: "Old Carnival", assetbundleName: "event_old", startAt: NOW - 40 * DAY, aggregateAt: NOW - 33 * DAY },
  ],
  eventCards: [],
  eventDeckBonuses: [],
  gachas: [
    { id: 7, gachaType: "ceil", name: "Sample Gacha", seq: 7, assetbundleName: "ab_gacha_7", startAt: NOW - 2 * DAY, endAt: NOW + 5 * DAY, gachaPickups: [], gachaCardRarityRates: [], gachaBehaviors: [] },
  ],
  unitStories: [],
  eventStories: [
    { id: 7, eventId: 7, assetbundleName: "event_sample", eventStoryEpisodes: [
      { id: 71, episodeNo: 1, scenarioId: "event_07_01", title: "First", assetbundleName: "ep01" },
      { id: 72, episodeNo: 2, scenarioId: "event_07_02", title: "Second", assetbundleName: "ep02" },
    ] },
  ],
  eventStoryUnits: [],
  specialStories: [],
}

async function mockSearchData(page: Page) {
  await page.clock.setFixedTime(new Date(NOW))
  await page.addInitScript(() => {
    if (!localStorage.getItem("settings")) {
      localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN" }))
    }
  })
  const hashes = Object.fromEntries(
    Object.keys(files).map((name, index) => [index.toString(16).padStart(2, "0").repeat(32), name]),
  )
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    if (url.host === "127.0.0.1:4173") return route.continue()
    if (url.host !== "sekai-api-cdn.haruki.seiunx.com") {
      return route.request().resourceType() === "image" ? route.fulfill({ status: 404 }) : route.abort()
    }
    const name = hashes[url.pathname.split("/").at(-1) ?? ""]
    const body = url.pathname.endsWith("/current")
      ? { dataVersion: "7.1.0.12", contentHash: "search", files: Object.entries(hashes).map(([sha256, key]) => ({ name: `${key}.json`, sha256 })) }
      : name ? files[name] : []
    return route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) })
  })
}

async function openSearch(page: Page, path = "/about") {
  await mockSearchData(page)
  await page.goto(path)
  await page.getByRole("button", { name: /^(快速搜索|Quick search)$/ }).first().click()
  const dialog = page.getByRole("dialog", { name: /^(快速搜索|Quick search)$/ })
  // The dialog's chunk is fetched on the first open.
  await expect(dialog).toBeVisible({ timeout: 30_000 })
  return {
    dialog,
    input: page.getByTestId("global-search-input"),
    section: (id: string) => dialog.locator(`[data-section="${id}"]`),
    scope: (id: string) => dialog.locator(`[data-scope="${id}"]`),
    rows: dialog.getByRole("option"),
  }
}

test("offers the ongoing event and common pages before anything is typed", async ({ page }) => {
  const search = await openSearch(page)

  await expect(search.input).toBeFocused()
  await expect(search.section("ongoing").getByRole("option")).toHaveText(/Sample Marathon/)
  await expect(search.section("ongoing").getByRole("option")).toHaveCount(1)
  await expect(search.section("suggested").getByRole("option").first()).toContainText("组卡推荐")
  await expect(search.section("recent")).toHaveCount(0)
})

test("finds pages by pinyin and remembers what was opened", async ({ page }) => {
  const search = await openSearch(page)

  await search.input.fill("kongfen")
  await expect(search.rows).toHaveCount(1)
  await expect(search.rows.first()).toContainText("控分计算")
  await expect(search.rows.first()).toHaveAttribute("aria-selected", "true")
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/pt-calculator$/)
  await expect(search.dialog).toBeHidden()

  // Reopened, the page leads the list and is no longer among the suggestions.
  await page.keyboard.press("Control+k")
  await expect(search.section("recent").getByRole("option")).toHaveText(/控分计算/)
  await expect(search.section("suggested")).not.toContainText("控分计算")
  await search.section("recent").getByRole("button", { name: "清除" }).click()
  await expect(search.section("recent")).toHaveCount(0)
  await expect(search.section("suggested")).toContainText("控分计算")
})

test("ranks, counts and narrows the hits of a query", async ({ page }) => {
  const search = await openSearch(page)

  await search.input.fill("sample")
  // Five of the seven songs, newest first, then a row leading to the list page.
  const songs = search.section("results-music")
  await expect(songs.locator("[data-type=music]")).toHaveCount(5)
  await expect(songs.locator("[data-type=music]").first()).toContainText("Sample Song 7")
  await expect(songs.getByTestId("global-search-more")).toContainText("7")
  await expect(search.scope("all")).toContainText("11")
  await expect(search.scope("music")).toContainText("7")
  await expect(search.scope("card")).toContainText("1")
  await expect(search.scope("event")).toContainText("1")
  await expect(search.scope("gacha")).toContainText("1")
  await expect(search.scope("story")).toContainText("1")
  await expect(search.scope("page")).toContainText("0")

  // Tab walks the scopes that found something; the field keeps the focus.
  await page.keyboard.press("Tab")
  await expect(search.scope("music")).toHaveAttribute("aria-checked", "true")
  await expect(search.input).toBeFocused()
  await expect(songs.locator("[data-type=music]")).toHaveCount(7)
  await expect(songs.getByTestId("global-search-more")).toHaveCount(0)
  await page.keyboard.press("Shift+Tab")
  await expect(search.scope("all")).toHaveAttribute("aria-checked", "true")

  // The arrow keys move through every row, and wrap.
  await page.keyboard.press("ArrowUp")
  await expect(search.rows.last()).toHaveAttribute("aria-selected", "true")
  await page.keyboard.press("ArrowDown")
  await expect(search.rows.first()).toHaveAttribute("aria-selected", "true")

  await songs.getByTestId("global-search-more").click()
  await expect(page).toHaveURL(/\/music\?q=sample/)
})

test("an id, a reading and a character each lead where they should", async ({ page }) => {
  const search = await openSearch(page)

  // A number is an id: the card, the event and the gacha numbered 7 (no song is),
  // each alone in its group although other titles contain a 7.
  await search.input.fill("#7")
  await expect(search.section("results-card").getByRole("option")).toContainText("奇跡の歌声")
  await expect(search.section("results-event").getByRole("option")).toContainText("Sample Marathon")
  await expect(search.section("results-gacha").getByRole("option")).toContainText("Sample Gacha")

  // Kana titles are found by their romaji.
  await search.input.fill("roki")
  await expect(search.rows).toHaveCount(1)
  await expect(search.rows.first()).toContainText("ロキ")

  // Nothing found says so.
  await search.input.fill("zzzqqq")
  await expect(page.getByTestId("global-search-empty")).toContainText("没有匹配的结果")

  // A character opens the card list filtered to it; its cards are listed too.
  await search.input.fill("初音")
  await expect(search.section("results-character").getByRole("option")).toContainText("初音ミク")
  await expect(search.section("results-card").getByRole("option")).toContainText("奇跡の歌声")
  await search.section("results-character").getByRole("option").click()
  await expect(page).toHaveURL(/\/cards\?chars=21/)
})

test("an event's story opens the player on its first episode", async ({ page }) => {
  const search = await openSearch(page)

  await search.scope("story").click()
  await expect(search.section("browse-story").getByRole("option")).toHaveText(/Sample Marathon/)
  await search.section("browse-story").getByRole("option").click()
  await expect(page).toHaveURL(/\/story\?.*scenario=event_07_01/)
})

test("fits a phone without sideways scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 760 })
  const search = await openSearch(page)

  await search.input.fill("sample")
  await expect(search.section("results-music").locator("[data-type=music]")).toHaveCount(5)
  const box = await search.dialog.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(390)
  expect(box!.y + box!.height).toBeLessThanOrEqual(760)
  const list = page.getByTestId("global-search-list")
  expect(await list.evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
})
