import { expect, test } from "@playwright/test"

test("music library route renders its list page", async ({ page }) => {
  await page.goto("/music")

  await expect(
    page
      .getByText("浏览 PJSK 曲库：支持搜索，并按难度、等级、物量、团体与年份筛选。", { exact: true })
      .or(page.getByText("Browse the PJSK music catalog: search, filter by difficulty, level, note count, unit and year.", { exact: true })),
  ).toBeVisible()
})

test("card catalog route renders its list page", async ({ page }) => {
  await page.goto("/cards")

  await expect(page.getByRole("heading", { name: /卡牌图鉴|Card catalog/ })).toBeVisible()
})

test("event catalog route renders its list page", async ({ page }) => {
  await page.goto("/events")

  await expect(page.getByRole("heading", { name: /活动图鉴|Event catalog/ })).toBeVisible()
})

test("home navigation links into the sekai catalog", async ({ page }) => {
  await page.goto("/")

  await page.getByRole("link", { name: /^(曲库|Music library)$/ }).first().click()
  await expect(page).toHaveURL(/\/music$/)
})
