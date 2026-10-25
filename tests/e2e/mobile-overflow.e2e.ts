import { expect, test, type Locator, type Page } from "@playwright/test"

test.use({ hasTouch: true })

const OWN_UID = "123456789012345678"
const GRANTED_UID = "987654321987654321"
const OWNER_NAME = "A very long account owner name that must fit on a phone"
const EVENT_NAME = "A very long official event title with an unbroken suffix ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const MUSIC_NAME = "A very long song title with an unbroken suffix ABCDEFGHIJKLMNOPQRSTUVWXYZ"

async function mockMobileData(page: Page, enlargedText = false) {
  await page.clock.setFixedTime(new Date("2026-10-21T08:00:00Z"))
  await page.addInitScript(({ uid, enlarged }) => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Mobile layout test", userId: "toolbox-test",
      gameAccountBindings: [{ server: "jp", userId: uid, verified: true, isDefault: true }],
      sessionToken: "test-token", tokenExpiration: 4_102_444_800,
    }))
    localStorage.setItem("haruki:deck-recommend:saved-config", JSON.stringify({
      version: 1,
      config: { selectedMusicId: "1", selectedDifficulty: "expert", selectedEventId: "221" },
    }))
    if (enlarged) {
      localStorage.setItem("settings", JSON.stringify({ locale: "en-US" }))
      document.addEventListener("DOMContentLoaded", () => { document.documentElement.style.fontSize = "20px" })
    }
  }, { uid: OWN_UID, enlarged: enlargedText })

  // Use the same manifest/blob protocol as the production master-data worker.
  const files: Record<string, unknown> = {
    events: [{ id: 221, eventType: "marathon", name: EVENT_NAME, startAt: 1792562400000, aggregateAt: 1792929599000 }],
    musics: [{ id: 1, title: MUSIC_NAME, publishedAt: 1601028000000, assetbundleName: "jacket_s_001" }],
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
          generatedAt: "2026-10-21T08:00:00Z", total: 2,
          accounts: [
            { server: "jp", gameUserId: OWN_UID, ownership: "own", verified: true, isDefault: true, capabilities: { suite: {}, recommend: {} }, writeCapabilities: { suite: {} }, owner: null },
            { server: "jp", gameUserId: GRANTED_UID, ownership: "granted", verified: true, isDefault: false, capabilities: { suite: {}, recommend: {} }, writeCapabilities: { suite: {} }, owner: { userId: "grantor", name: OWNER_NAME, avatarPath: null } },
          ],
        },
      }) })
    }
    if (url.pathname.includes("/game-account/") && url.pathname.endsWith("/suite")) {
      return route.fulfill({ status: 404, contentType: "application/json", headers: apiHeaders, body: JSON.stringify({ status: 404, message: "Player data not found." }) })
    }
    if (url.host !== "sekai-api-cdn.haruki.seiunx.com") return route.abort()
    const name = hashes[url.pathname.split("/").at(-1) ?? ""]
    const body = url.pathname.endsWith("/current")
      ? { dataVersion: "7.1.0.12", contentHash: "mobile-layout", files: Object.entries(hashes).map(([sha256, key]) => ({ name: `${key}.json`, sha256 })) }
      : name ? files[name] : []
    return route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) })
  })
}

test("point calculator advanced fields fit with enlarged English text", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await mockMobileData(page, true)
  await page.goto("/pt-calculator")
  await page.getByRole("button", { name: "Advanced options", exact: true }).click()
  await expectControlsToFit(page.locator("main"))
  await expectPageToFit(page)
})

test("music filters fit with enlarged English text", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await mockMobileData(page, true)
  await page.goto("/music")
  await page.locator("[data-slot=catalog-filter-panel] > button").click()
  const filters = page.locator("[data-slot=catalog-filter-sheet]")
  await expect(filters).toBeVisible()
  await expectControlsToFit(filters)
  await expectPageToFit(page)
})

test("settings and route choices fit with enlarged English text", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await mockMobileData(page, true)
  await page.goto("/")
  await page.getByRole("button", { name: "Settings", exact: true }).first().click()
  const settings = page.getByRole("dialog")
  await expectControlsToFit(settings)
  for (const label of ["dialog-endpoint-label", "dialog-asset-endpoint-label"]) {
    await test.step(label, async () => {
      await settings.locator(`[aria-labelledby=${label}]`).press("Space")
      await expect(page.getByRole("listbox")).toBeVisible()
      await expectControlsToFit(page.locator("[data-slot=select-content]"))
      await page.keyboard.press("Escape")
    })
  }
  await expectPageToFit(page)
})

async function expectControlsToFit(scope: Locator) {
  // scrollWidth alone misses controls cut off by overflow-hidden ancestors.
  // Check real control bounds against each containing block as well as the
  // viewport. Text ellipsis inside an otherwise usable control is intentional.
  await expect.poll(() => scope.evaluate((root) => {
    const elements = [root, ...root.querySelectorAll("button, input:not([type=hidden]), [role=combobox], [role=option], [data-slot=table-container], .overflow-x-auto")]
    const failures: string[] = []
    for (const element of elements) {
      const rect = element.getBoundingClientRect()
      if (!rect.width || !rect.height) continue
      // Table/calendar cells intentionally scroll; test their container below.
      if (element.parentElement?.closest("[data-slot=table-container], .overflow-x-auto")) continue
      const label = element.getAttribute("aria-labelledby") || element.getAttribute("aria-label") || element.id || element.textContent?.trim().slice(0, 50)
      if (rect.left < -1 || rect.right > window.innerWidth + 1) {
        failures.push(`${label}: outside viewport (${Math.round(rect.left)}..${Math.round(rect.right)})`)
        continue
      }
      if (element.matches("button, [role=option]") && getComputedStyle(element).overflowX === "visible" && element.scrollWidth > element.clientWidth + 1) {
        failures.push(`${label}: content spills out of the control (${element.scrollWidth} > ${element.clientWidth})`)
      }
      for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        const style = getComputedStyle(parent)
        const bounds = parent.getBoundingClientRect()
        if (!bounds.width) continue
        const left = bounds.left + Number.parseFloat(style.borderLeftWidth)
        const right = bounds.right - Number.parseFloat(style.borderRightWidth)
        if (rect.left < left - 1 || rect.right > right + 1) {
          failures.push(`${label}: outside ${parent.tagName.toLowerCase()}.${parent.className} (${Math.round(rect.left)}..${Math.round(rect.right)} vs ${Math.round(left)}..${Math.round(right)})`)
          break
        }
      }
    }
    return failures
  })).toEqual([])
}

async function expectPageToFit(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual((page.viewportSize()?.width ?? 0) + 1)
}

for (const { width, enlargedText } of [
  { width: 320, enlargedText: false },
  { width: 360, enlargedText: false },
  { width: 390, enlargedText: false },
  { width: 320, enlargedText: true },
]) {
  test(`deck parameters and picker dialogs fit at ${width}px${enlargedText ? " with enlarged English text" : ""}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await mockMobileData(page, enlargedText)
    await page.goto("/deck-recommend")
    const account = page.getByRole("combobox", { name: /^(账号|Account)$/ })
    await expect(account).toContainText(OWN_UID)
    const event = page.getByRole("button", { name: new RegExp(EVENT_NAME) })
    const music = page.getByRole("button", { name: new RegExp(MUSIC_NAME) })
    await expect(event).toBeEnabled()
    await expect(music).toBeEnabled()
    await expectControlsToFit(page.locator("main"))
    await expectPageToFit(page)

    await account.click()
    await expect(page.getByRole("listbox")).toContainText(OWNER_NAME)
    await expectControlsToFit(page.locator("[data-slot=select-content]"))
    await page.getByRole("option", { name: new RegExp(GRANTED_UID) }).click()
    await expect(account).toContainText(GRANTED_UID)
    await expectControlsToFit(page.locator("main"))

    await music.click()
    const musicDialog = page.getByRole("dialog", { name: /^(选择歌曲|Select Music)$/ })
    await expect(musicDialog).toBeVisible()
    await expectControlsToFit(musicDialog)
    await page.keyboard.press("Escape")
    await expect(musicDialog).not.toBeVisible()
    await event.click()
    const eventDialog = page.getByRole("dialog", { name: /^(选择活动|Select Event)$/ })
    await expect(eventDialog).toBeVisible()
    await expectControlsToFit(eventDialog)
    await page.keyboard.press("Escape")
    await expect(eventDialog).not.toBeVisible()

    await page.locator("#deck-event-simulation").click()
    const simulation = page.getByRole("combobox", { name: /^(活动类型|Event type)$/ })
    await simulation.click()
    await page.getByRole("option", { name: /^(总集篇|Memory Event)$/ }).click()
    await page.getByRole("combobox", { name: /^(团体|Unit)$/ }).click()
    await page.getByRole("option", { name: "Vivid BAD SQUAD", exact: true }).click()
    await page.getByRole("button", { name: /^(进阶配置|Advanced Settings)$/ }).click()
    await expectControlsToFit(page.locator("main"))
    await expectPageToFit(page)
    const trainingTable = page.locator("[data-slot=table-container]").first()
    expect(await trainingTable.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)
    expect(await trainingTable.evaluate((element) => {
      element.scrollLeft = 100
      return element.scrollLeft
    })).toBeGreaterThan(0)
  })

  if (enlargedText) continue
  for (const path of ["/event-planner", "/events/records", "/upload-data?tab=file"]) {
    test(`long account choices fit ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await mockMobileData(page)
      await page.goto(path)
      const account = page.getByRole("combobox").first()
      await expect(account).toContainText(OWN_UID)
      await expectControlsToFit(page.locator("main"))
      await expectPageToFit(page)
      await account.click()
      await expect(page.getByRole("listbox")).toContainText(GRANTED_UID)
      await page.getByRole("option", { name: new RegExp(GRANTED_UID) }).click()
      await expect(account).toContainText(GRANTED_UID)
      await expectControlsToFit(page.locator("main"))
      await expectPageToFit(page)
    })
  }
}
