import { expect, test, type Page } from "@playwright/test"

async function mockChallengeCards(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Deck test", userId: "toolbox-test", gameAccountBindings: [],
      sessionToken: "test-token", tokenExpiration: 4_102_444_800,
    }))
    if (!localStorage.getItem("haruki:deck-recommend:saved-config")) {
      localStorage.setItem("haruki:deck-recommend:saved-config", JSON.stringify({
        version: 1,
        config: { recommendMode: "challenge", selectedCharacterId: "1", fixedCardIds: [101, 102, 201] },
      }))
    }
  })

  const files: Record<string, unknown> = {
    cards: [101, 102, 103, 104, 105, 106, 201, 202].map((id) => ({
      id, characterId: id < 200 ? 1 : 2, prefix: `Card ${id}`, cardRarityType: "rarity_4", attr: "cool",
    })),
    gameCharacters: [1, 2].map((id) => ({ id, unit: "light_sound", firstName: "Character", givenName: String(id) })),
  }
  const hashes = Object.fromEntries(Object.keys(files).map((name, index) => [String(index + 1).repeat(64), name]))
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    if (url.host === "127.0.0.1:4173") return route.continue()
    if (url.host !== "sekai-api-cdn.haruki.seiunx.com") return route.abort()
    const name = hashes[url.pathname.split("/").at(-1) ?? ""]
    const body = url.pathname.endsWith("/current")
      ? { dataVersion: "7.1.0.12", contentHash: "challenge-fixed-cards", files: Object.entries(hashes).map(([sha256, key]) => ({ name: `${key}.json`, sha256 })) }
      : name ? files[name] : []
    return route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) })
  })
}

for (const width of [1280, 390]) {
  test(`fixed cards follow challenge and ordinary character rules at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await mockChallengeCards(page)
    await page.goto("/deck-recommend")
    await page.getByRole("button", { name: "进阶配置", exact: true }).click()
    const browse = page.getByRole("button", { name: /选择固定卡牌/ })
    await expect(browse).toBeEnabled({ timeout: 20_000 })
    await expect(browse).toContainText("2/5")
    await expect(page.getByText("仅限所选挑战角色的卡牌", { exact: true })).toBeVisible()

    await browse.click()
    const picker = page.getByRole("dialog", { name: "浏览卡牌", exact: true })
    const card = (id: number) => picker.getByRole("button", { name: new RegExp(`Card ${id} `) })
    await expect(card(201)).toHaveCount(0)
    await expect(card(103)).toBeEnabled()
    for (const id of [103, 104, 105]) await card(id).click()
    await expect(card(106)).toBeDisabled()
    await card(102).click()
    await expect(card(106)).toBeEnabled()
    await card(106).click()
    await picker.getByRole("button", { name: "完成", exact: true }).click()
    await page.getByRole("button", { name: "保存配置", exact: true }).click()
    const savedIds = await page.evaluate(() => JSON.parse(
      localStorage.getItem("haruki:deck-recommend:saved-config") ?? "{}",
    ).config.fixedCardIds)
    expect(savedIds).toEqual([101, 103, 104, 105, 106])

    await page.reload()
    await page.getByRole("button", { name: "进阶配置", exact: true }).click()
    await expect(browse).toBeEnabled()
    await expect(browse).toContainText("5/5")
    await page.getByRole("tab", { name: "最强组卡", exact: true }).click()
    await expect(browse).toContainText("1/5")
    await browse.click()
    await expect(card(102)).toBeDisabled()
    await expect(card(201)).toBeEnabled()
    await card(201).click()
    await picker.getByRole("button", { name: "完成", exact: true }).click()
    await expect(browse).toContainText("2/5")

    await page.getByRole("tab", { name: "挑战组卡", exact: true }).click()
    await expect(browse).toBeDisabled()
    const character = page.getByRole("combobox", { name: "请选择角色", exact: true })
    await character.click()
    await page.getByRole("option", { name: /Character\s*2/ }).click()
    await browse.click()
    await expect(card(101)).toHaveCount(0)
    await card(201).click()
    await card(202).click()
    // A character filter in the browser must not survive a change of challenge character.
    // The filters start folded; open them to reach the character select.
    await picker.getByRole("button", { name: /^筛选/ }).click()
    await picker.getByRole("combobox").click()
    await page.getByRole("option", { name: /Character\s*2/ }).click()
    await picker.getByRole("button", { name: "完成", exact: true }).click()
    await expect(browse).toContainText("2/5")
    await character.click()
    await page.getByRole("option", { name: /Character\s*1/ }).click()
    await expect(browse).toContainText("0/5")
    await browse.click()
    await expect(card(101)).toBeEnabled()
    await expect(card(201)).toHaveCount(0)
  })
}
