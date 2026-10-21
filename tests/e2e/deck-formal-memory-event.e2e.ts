import { expect, test } from "@playwright/test"

// The published event remains a marathon. Its all-attribute bonuses belong
// to masterdata, so the normal picker must not require simulation controls.
test("default deck recommendation selects the ongoing official memory event", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-21T08:00:00Z"))
  await page.addInitScript(() => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Deck test", userId: "toolbox-test", gameAccountBindings: [],
      sessionToken: "test-token", tokenExpiration: 4_102_444_800,
    }))
  })
  const files: Record<string, unknown> = {
    events: [
      { id: 220, eventType: "marathon", name: "Stars Off Orbit", startAt: 1791784800000, aggregateAt: 1792411199000 },
      { id: 221, eventType: "marathon", name: "Vivid BAD SQUAD Memories", startAt: 1792562400000, aggregateAt: 1792929599000, assetbundleName: "event_memories_vbs_2026" },
    ],
    eventCards: [],
    eventDeckBonuses: ["cute", "cool", "pure", "happy", "mysterious"].flatMap((cardAttr) => [
      { eventId: 221, cardAttr, bonusRate: 25 },
      ...[9, 10, 11, 12].map((gameCharacterUnitId) => ({ eventId: 221, gameCharacterUnitId, cardAttr, bonusRate: 75 })),
    ]),
  }
  const names = Object.keys(files)
  const hashes = Object.fromEntries(names.map((name, index) => [String(index + 1).repeat(64), name]))
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    if (url.host === "127.0.0.1:4173") return route.continue()
    if (url.host !== "sekai-api-cdn.haruki.seiunx.com") return route.abort()
    let body: unknown = []
    if (url.pathname.endsWith("/current") && url.pathname.includes("/master/")) {
      body = { dataVersion: "7.1.0.12", contentHash: "formal-memory-event", files: Object.entries(hashes).map(([sha256, name]) => ({ name: `${name}.json`, sha256 })) }
    } else {
      const name = hashes[url.pathname.split("/").at(-1) ?? ""]
      body = name ? files[name] : []
    }
    return route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) })
  })
  await page.goto("/deck-recommend")
  await expect(page.getByRole("button", { name: /Vivid BAD SQUAD Memories/ })).toBeVisible()
  await expect(page.locator("#deck-event-simulation")).toHaveAttribute("aria-checked", "false")
  await expect(page.locator("#deck-simulation-type-label")).toHaveCount(0)
  await expect(page.getByText(/正式总集篇无需开启模拟/)).toBeVisible()
  await page.locator("#deck-event-simulation").click()
  await page.getByRole("combobox", { name: "活动类型", exact: true }).click()
  await page.getByRole("option", { name: "总集篇", exact: true }).click()
  await page.getByRole("combobox", { name: "团体", exact: true }).click()
  await expect(page.getByRole("option")).toHaveCount(6)
  await page.getByRole("option", { name: "Leo/need", exact: true }).click()
  await expect(page.getByRole("combobox", { name: "团体", exact: true })).toContainText("Leo/need")
})
