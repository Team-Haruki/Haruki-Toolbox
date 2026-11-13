import { expect, test } from "@playwright/test"

test("music library route renders its list page", async ({ page }) => {
  await page.goto("/music")

  await expect(page.getByRole("heading", { name: /^(曲库|Music library)$/ })).toBeVisible()
})

test("card catalog route renders its list page", async ({ page }) => {
  await page.goto("/cards")

  await expect(page.getByRole("heading", { name: /卡牌一览|Card catalog/ })).toBeVisible()
})

test("event catalog route renders its list page", async ({ page }) => {
  await page.goto("/events")

  await expect(page.getByRole("heading", { name: /活动图鉴|Event catalog/ })).toBeVisible()
})

test("gacha catalog route renders its list page", async ({ page }) => {
  await page.goto("/gachas")

  await expect(page.getByRole("heading", { name: /卡池图鉴|Gacha catalog/ })).toBeVisible()
})

test("home navigation links into the sekai catalog", async ({ page }) => {
  await page.goto("/")

  // The home tile's name also carries its one-line description.
  await page.getByTestId("home-toolbox").getByRole("link", { name: /^(歌曲一览|Music catalog)/ }).first().click()
  // Catalog pages name their server in the URL so the link is shareable.
  await expect(page).toHaveURL(/\/music(\?region=[a-z]{2})?$/)
})

test("story player route renders with nothing picked", async ({ page }) => {
  await page.goto("/story")

  await expect(page.getByRole("heading", { name: /剧情播放|Story player/ })).toBeVisible()
  await expect(page.getByRole("combobox", { name: /文本语言|Text language/ })).toBeVisible()
  await expect(page).not.toHaveURL(/scenario=/)
})
