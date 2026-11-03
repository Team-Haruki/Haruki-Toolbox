import { devices, expect, test, type Locator, type Page } from "@playwright/test"

test.use({ hasTouch: true })

const OWN_UID = "123456789012345678"
const GRANTED_UID = "987654321987654321"
const OWNER_NAME = "A very long account owner name that must fit on a phone"
const EVENT_NAME = "A very long official event title with an unbroken suffix ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const MUSIC_NAME = "A very long song title with an unbroken suffix ABCDEFGHIJKLMNOPQRSTUVWXYZ"

const UNITS = ["light_sound", "idol", "street", "theme_park", "school_refusal", "piapro"] as const
const ATTRS = ["cute", "cool", "pure", "happy", "mysterious"] as const
const RARITIES = ["rarity_1", "rarity_2", "rarity_3", "rarity_4", "rarity_birthday"] as const

// Enough cards, characters, units, attributes and rarities for the card
// picker to show every filter row and a result list taller than a phone.
function cardPickerMasterFiles(): Record<string, unknown> {
  const gameCharacters = Array.from({ length: 26 }, (_, index) => ({
    id: index + 1,
    unit: UNITS[Math.min(Math.floor(index / 4), UNITS.length - 1)],
    firstName: "Character",
    givenName: String(index + 1),
  }))
  return {
    cards: Array.from({ length: 120 }, (_, index) => ({
      id: index + 1,
      seq: index + 1,
      characterId: (index % 26) + 1,
      cardRarityType: RARITIES[index % RARITIES.length],
      attr: ATTRS[index % ATTRS.length],
      prefix: `Card ${index + 1}`,
      assetbundleName: `res${String(index + 1).padStart(3, "0")}_no001`,
    })),
    cardRarities: RARITIES.map((cardRarityType, index) => ({ cardRarityType, maxLevel: 20 + index * 10, maxSkillLevel: 4 })),
    gameCharacters,
    gameCharacterUnits: gameCharacters.map((character) => ({ gameCharacterId: character.id, unit: character.unit, colorCode: "#33aaee" })),
    unitProfiles: UNITS.map((unit) => ({ unit, unitName: unit, unitProfileName: `Unit ${unit}`, colorCode: "#33aaee" })),
  }
}

async function mockMobileData(page: Page, enlargedText = false, withCards = false) {
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
    ...(withCards ? cardPickerMasterFiles() : {}),
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
    if (url.host !== "sekai-api-cdn.haruki.seiunx.com") {
      return route.request().resourceType() === "image" ? route.fulfill({ status: 404 }) : route.abort()
    }
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

/**
 * Keeps the glass effects on: the app turns on reduced visual effects (opaque
 * surfaces) by itself on low-core machines such as CI runners.
 */
async function keepFullVisualEffects(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("settings", JSON.stringify({ reducedVisualEffects: false, reducedVisualEffectsUserSet: true }))
  })
}

/** Alpha of the element's computed background colour (any CSS colour syntax). */
function backgroundAlpha(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const value = getComputedStyle(element).backgroundColor
    const slash = /\/\s*([\d.]+)(%?)\s*\)$/.exec(value)
    if (slash) return Number(slash[1]) / (slash[2] ? 100 : 1)
    const rgba = /^rgba\([^)]*,\s*([\d.]+)\)$/.exec(value)
    if (rgba) return Number(rgba[1])
    return value === "transparent" ? 0 : 1
  })
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

// iPhone Safari (390 x 664 visible with the toolbars shown): the card picker
// opens on top of the full-screen expert dialog and must keep its own list
// scrollable, its filters reachable, and stay inside the visible viewport.
// The iPhone user agent matters on every engine: reka-ui only installs its
// iOS touchmove scroll lock when the user agent says iOS. Run it on WebKit
// too with `E2E_WEBKIT=1 bunx playwright test --project webkit`.
test.describe("iPhone", () => {
  const { userAgent, deviceScaleFactor, isMobile } = devices["iPhone 13"]
  test.use({ userAgent, deviceScaleFactor, isMobile, hasTouch: true })

  test("card picker nested in the expert dialog scrolls on a phone", { tag: "@webkit" }, async ({ page, browserName }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 664 })
    await mockMobileData(page, false, true)
    await page.goto("/deck-recommend")
    await expect(page.getByRole("combobox", { name: /^(账号|Account)$/ })).toContainText(OWN_UID)
    await page.getByRole("button", { name: /^(专家配置|Expert Settings)$/ }).click()
    const expert = page.getByRole("dialog", { name: /专家配置|Expert Settings/ })
    await expect(expert).toBeVisible()
    const browse = expert.getByRole("button", { name: /选择卡牌|Select cards?/ })
    await expect(browse).toBeEnabled()
    await browse.click()

    const picker = page.getByRole("dialog", { name: /^(浏览卡牌|Browse Cards)$/ })
    await expect(picker).toBeVisible()
    await expect(picker.getByRole("button", { name: /Card 120/ })).toBeAttached()
    const screenshotDir = process.env.E2E_SCREENSHOT_DIR
    if (screenshotDir) {
      await page.waitForTimeout(400)
      await page.screenshot({ path: `${screenshotDir}/card-picker-${testInfo.project.name}.png` })
    }

    // The dialog stays inside the visible viewport.
    const box = await picker.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(664 + 1)

    // On iOS the modal scroll lock cancels any touchmove without a scrollable
    // ancestor. A swipe over the filters or the results must not be cancelled.
    for (const target of [picker.getByRole("group", { name: /^(稀有度|Rarity)$/ }), picker.getByRole("button", { name: /Card 1 \(#1\)/ })]) {
      expect(await target.evaluate((element) => {
        const event = new Event("touchmove", { bubbles: true, cancelable: true })
        Object.defineProperty(event, "touches", { value: [{ clientX: 0, clientY: 0 }] })
        element.dispatchEvent(event)
        return event.defaultPrevented
      })).toBe(false)
    }

    // Its body is a real scroll container whose content is taller than it.
    const scroller = picker.locator("[data-slot=card-browse-scroll]")
    const metrics = await scroller.evaluate((element) => ({
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      overflowY: getComputedStyle(element).overflowY,
    }))
    expect(metrics.overflowY).toBe("auto")
    expect(metrics.clientHeight).toBeGreaterThan(150)
    expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight)

    // Scrolling moves the list (real wheel input where the engine has one;
    // Playwright's mobile WebKit has no wheel or swipe), and the last card and
    // the footer become reachable.
    const before = await scroller.evaluate((element) => element.scrollTop)
    const scrollerBox = await scroller.boundingBox()
    if (browserName === "chromium") {
      await page.mouse.move(scrollerBox!.x + scrollerBox!.width / 2, scrollerBox!.y + scrollerBox!.height / 2)
      await page.mouse.wheel(0, 600)
    } else {
      await scroller.evaluate((element) => element.scrollBy(0, 600))
    }
    await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(before)
    if (screenshotDir) {
      await page.screenshot({ path: `${screenshotDir}/card-picker-scrolled-${testInfo.project.name}.png` })
    }
    await scroller.evaluate((element) => { element.scrollTop = element.scrollHeight })
    const last = picker.getByRole("button", { name: /Card 120/ })
    const lastBox = await last.boundingBox()
    const scrollerBottom = scrollerBox!.y + scrollerBox!.height
    expect(lastBox!.y + lastBox!.height).toBeLessThanOrEqual(scrollerBottom + 1)
    await expect(picker.getByRole("button", { name: /^(完成|Done)$/ })).toBeInViewport()
  })
  // iOS Safari: translucent glass let the deck page show through the full-screen
  // expert dialog and the card picker on top of it. On touch devices dialog
  // surfaces are near-opaque, and a dialog opened over another one gets a
  // darker scrim.
  for (const colorScheme of ["light", "dark"] as const) {
    test(`nested dialogs are opaque on a phone (${colorScheme})`, { tag: "@webkit" }, async ({ page }, testInfo) => {
      await page.emulateMedia({ colorScheme })
      await page.setViewportSize({ width: 390, height: 664 })
      await keepFullVisualEffects(page)
      await mockMobileData(page, false, true)
      await page.goto("/deck-recommend")
      await expect(page.getByRole("combobox", { name: /^(账号|Account)$/ })).toContainText(OWN_UID)
      await page.getByRole("button", { name: /^(专家配置|Expert Settings)$/ }).click()
      const expert = page.getByRole("dialog", { name: /专家配置|Expert Settings/ })
      await expert.getByRole("button", { name: /选择卡牌|Select cards?/ }).click()
      const picker = page.getByRole("dialog", { name: /^(浏览卡牌|Browse Cards)$/ })
      await expect(picker.getByRole("button", { name: /Card 120/ })).toBeAttached()
      await page.waitForTimeout(400)
      const screenshotDir = process.env.E2E_SCREENSHOT_DIR
      if (screenshotDir) {
        await page.screenshot({ path: `${screenshotDir}/nested-picker-${testInfo.project.name}-${colorScheme}.png` })
      }

      // The expert dialog is aria-hidden behind the picker, so find both surfaces by slot.
      const surfaces = page.locator("[data-slot=dialog-content]")
      await expect(surfaces).toHaveCount(2)
      for (const index of [0, 1]) {
        expect(await backgroundAlpha(surfaces.nth(index))).toBeGreaterThanOrEqual(0.94)
      }
      const overlays = page.locator("[data-slot=dialog-overlay]")
      await expect(overlays).toHaveCount(2)
      expect(await backgroundAlpha(overlays.nth(1))).toBeGreaterThanOrEqual(0.4)
    })
  }
})

// The opaque surface is for touch devices only: a mouse-driven desktop keeps
// the translucent glass dialog.
test.describe("desktop", () => {
  test.use({ hasTouch: false, isMobile: false })

  test("dialogs keep the glass surface on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await keepFullVisualEffects(page)
    await mockMobileData(page, false, true)
    await page.goto("/deck-recommend")
    await expect(page.getByRole("combobox", { name: /^(账号|Account)$/ })).toContainText(OWN_UID)
    await page.getByRole("button", { name: /^(专家配置|Expert Settings)$/ }).click()
    const surface = page.locator("[data-slot=dialog-content]")
    await expect(surface).toHaveCount(1)
    expect(await backgroundAlpha(surface)).toBeLessThan(0.9)
  })
})
