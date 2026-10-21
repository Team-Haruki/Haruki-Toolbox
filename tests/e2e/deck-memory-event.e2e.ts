import { expect, test } from "@playwright/test"

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test(`memory-event simulation selects a unit and restores its configuration at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.addInitScript(() => {
      sessionStorage.setItem("user", JSON.stringify({
        name: "Deck test", userId: "toolbox-test", gameAccountBindings: [],
        sessionToken: "test-token", tokenExpiration: 4_102_444_800,
      }))
      localStorage.setItem("haruki:deck-recommend:saved-config", JSON.stringify({
        version: 1, config: {
          recommendMode: "event", eventSimulationEnabled: true,
          simulatedEventMode: "memory_event", simulatedEventUnit: "street",
        },
      }))
    })
    await page.route("**/*", (route) =>
      new URL(route.request().url()).host === "127.0.0.1:4173" ? route.continue() : route.abort(),
    )
    await page.goto("/deck-recommend")
    const simulation = page.getByRole("combobox", { name: "活动类型", exact: true })
    const unit = page.getByRole("combobox", { name: "团体", exact: true })
    await expect(simulation).toContainText("总集篇")
    await expect(unit).toContainText("Vivid BAD SQUAD")
    await expect(page.locator("#deck-simulation-attr-label")).toHaveCount(0)
    await expect(page.locator("#deck-world-bloom-turn-label")).toHaveCount(0)
    await expect(page.getByText(/五属性基础加成均为 25%/)).toBeVisible()
    await unit.click()
    await expect(page.getByRole("option")).toHaveCount(6)
    await expect(page.getByRole("option", { name: "自定义加成角色" })).toHaveCount(0)
    await page.getByRole("option", { name: "Virtual Singer", exact: true }).click()
    await expect(unit).toContainText("Virtual Singer")
    await simulation.click()
    await page.getByRole("option", { name: "连接世界", exact: true }).click()
    await expect(page.locator("#deck-world-bloom-turn-label")).toBeVisible()
    await expect(page.locator("#deck-simulation-unit-label")).toHaveCount(0)
    await simulation.click()
    await page.getByRole("option", { name: "总集篇", exact: true }).click()
    await expect(unit).toContainText("Virtual Singer")
    await expect(page.locator("#deck-world-bloom-turn-label")).toHaveCount(0)
    await page.getByRole("button", { name: "保存配置", exact: true }).click()
    const saved = await page.evaluate(() => JSON.parse(
      localStorage.getItem("haruki:deck-recommend:saved-config") ?? "{}",
    ))
    expect(saved.config).toMatchObject({
      eventSimulationEnabled: true, simulatedEventMode: "memory_event", simulatedEventUnit: "piapro",
    })
  })
}
