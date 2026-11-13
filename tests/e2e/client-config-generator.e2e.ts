import { readFile } from "node:fs/promises"
import { expect, test, type Page } from "@playwright/test"

// The Haruki Client config generator: a local form with the generated
// configs.yaml beside it. Nothing here talks to a backend.
const BOT_ID = "91145149"
// Fake, and long enough to overflow a narrow box if it did not scroll.
const CREDENTIAL = `fake-credential-${"abcdefghijklmnopqrstuvwxyz0123456789".repeat(4)}`

async function openGenerator(page: Page, query = "") {
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    return url.host === "127.0.0.1:4173" ? route.continue() : route.abort()
  })
  await page.goto(`/client-config-generator${query}`)
  await expect(page.locator("#client-bot-id")).toBeVisible({ timeout: 30_000 })
}

const yaml = (page: Page) => page.getByTestId("client-config-yaml")
const fold = (page: Page, name: string) => page.locator(`[data-fold=${name}]`)
const fact = (page: Page, key: string) => page.getByTestId("client-config-output").locator(`[data-fact=${key}] dd`)
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

async function pickOption(page: Page, trigger: ReturnType<Page["locator"]>, name: string | RegExp) {
  await trigger.click()
  await page.getByRole("option", { name }).click()
}

test("builds the file as the form is filled in", async ({ page }) => {
  await openGenerator(page)

  // A fresh form writes the defaults and says what is still missing.
  await expect(yaml(page)).toContainText('host: "127.0.0.1"')
  await expect(yaml(page)).toContainText("botId: 0")
  await expect(yaml(page)).toContainText("controlApiAccessToken: null")
  await expect(page.getByTestId("client-config-missing")).toBeVisible()
  await expect(fact(page, "modules")).toHaveText(/全部|All/)

  await page.locator("#client-bot-id").fill(BOT_ID)
  await expect(page.getByTestId("client-config-missing")).toBeVisible()
  await page.locator("#client-credential").fill(CREDENTIAL)
  await expect(page.getByTestId("client-config-missing")).toHaveCount(0)
  await expect(yaml(page)).toContainText(`botId: ${BOT_ID}`)
  await expect(yaml(page)).toContainText(`credential: "${CREDENTIAL}"`)

  // A port out of range is flagged at the field; the file still follows the form.
  await page.locator("#client-port").fill("70000")
  await expect(page.locator("#client-port-error")).toBeVisible()
  await expect(page.locator("#client-port")).toHaveAttribute("aria-invalid", "true")
  await page.locator("#client-port").fill("9001")
  await expect(page.locator("#client-port-error")).toHaveCount(0)
  await expect(yaml(page)).toContainText("port: 9001")

  // Switches and the run mode.
  await page.locator("#client-toggle-enableReplyMessage").click()
  await expect(yaml(page)).toContainText("enableReplyMessage: true")
  await pickOption(page, page.getByTestId("client-run-mode"), /白名单模式|Whitelist mode/)
  await expect(yaml(page)).toContainText("runMode: whitelist")
})

test("turns list rows into scoped lists", async ({ page }) => {
  await openGenerator(page)

  // Two rows of one scope are merged; a second scope gets its own key.
  const blacklists = page.getByTestId("client-config-blacklists")
  await blacklists.getByRole("textbox").first().fill("123, 456")
  await blacklists.getByRole("button", { name: /^(添加|Add)$/ }).click()
  await blacklists.getByRole("textbox").nth(1).fill("456 789")
  await blacklists.getByRole("button", { name: /^(添加|Add)$/ }).click()
  await pickOption(page, blacklists.getByRole("combobox").nth(2), /custom_profile/)
  await blacklists.getByRole("textbox").nth(2).fill("1000")
  await expect(yaml(page)).toContainText("blacklists:\n  all:\n    - 123\n    - 456\n    - 789\n  custom_profile:\n    - 1000\n")

  // Removing a row takes its ids out; the last row is blanked, not removed.
  await blacklists.getByTestId("client-config-access-row").nth(2).getByRole("button").click()
  await expect(yaml(page)).not.toContainText("custom_profile")
  await expect(blacklists.getByTestId("client-config-access-row")).toHaveCount(2)

  const admins = page.getByTestId("client-config-admins")
  await admins.getByRole("textbox").fill("1145")
  await expect(yaml(page)).toContainText("botAdmins:\n  - 1145\n")
  await expect(fact(page, "admins")).toHaveText("1")
  await admins.getByTestId("client-config-admin-row").getByRole("button").click()
  await expect(admins.getByRole("textbox")).toHaveValue("")
  await expect(yaml(page)).toContainText("botAdmins: []")

  // "All modules" stands alone: adding a row starts a list of specific modules.
  const modules = page.getByTestId("client-config-modules")
  await modules.getByRole("button", { name: /添加模块|Add module/ }).click()
  await expect(modules.getByTestId("client-config-module-row")).toHaveCount(1)
  await pickOption(page, modules.getByRole("combobox"), /pjsk/)
  await expect(yaml(page)).toContainText('enableModules:\n  - "pjsk"\n')
  await expect(fact(page, "modules")).toHaveText("1")

  // A per-feature policy.
  const policies = page.getByTestId("client-config-policies")
  await expect(policies.getByTestId("client-config-policy-row")).toHaveCount(0)
  await policies.getByRole("button", { name: /添加策略|Add policy/ }).click()
  await pickOption(page, policies.getByRole("combobox").first(), "mysekai")
  await pickOption(page, policies.getByRole("combobox").nth(1), /白名单模式|Whitelist mode/)
  await expect(yaml(page)).toContainText("featurePolicyModes:\n  mysekai: whitelist\n")
  await expect(fact(page, "scopes")).toHaveText("1")
})

test("keeps the advanced options folded until asked for", async ({ page }) => {
  await openGenerator(page)

  const routing = fold(page, "routing")
  await expect(page.locator("#client-endpoint-override")).toBeHidden()
  await expect(routing.getByTestId("client-config-fold-changed")).toHaveCount(0)

  await routing.getByRole("button").first().click()
  await expect(routing.getByRole("button").first()).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByTestId("client-config-routing-state")).toHaveAttribute("data-state", "dynamic")

  // A pinned endpoint wins over dynamic routing, and the fields that no longer apply are locked.
  await page.locator("#client-endpoint-override").fill("https://example.com/pinned")
  await expect(page.getByTestId("client-config-routing-state")).toHaveAttribute("data-state", "pinned")
  await expect(page.locator("#client-routing-url")).toBeDisabled()
  await expect(page.locator("#client-dynamic-routing")).toBeDisabled()
  await expect(yaml(page)).toContainText('serverEndpointOverride: "https://example.com/pinned"')

  // Closed again, the group still says it was changed.
  await routing.getByRole("button").first().click()
  await expect(page.locator("#client-endpoint-override")).toBeHidden()
  await expect(routing.getByTestId("client-config-fold-changed")).toContainText("1")

  // The access token is written only while its switch is on.
  const security = fold(page, "security")
  await security.getByRole("button").first().click()
  await expect(page.locator("#client-control-token")).toHaveCount(0)
  await page.locator("#client-use-control-token").click()
  await page.locator("#client-control-token").fill("fake-local-token")
  await expect(yaml(page)).toContainText('controlApiAccessToken: "fake-local-token"')
  await page.locator("#client-use-control-token").click()
  await expect(yaml(page)).toContainText("controlApiAccessToken: null")

  const rateLimit = fold(page, "rateLimit")
  await rateLimit.getByRole("button").first().click()
  await page.locator("#client-group-command-limit").click()
  await page.locator("#client-hour-limit").fill("120")
  await expect(yaml(page)).toContainText("enableGroupCommandLimit: true\nglobalCommandHourlyLimit: 120\n")
  await expect(rateLimit.getByTestId("client-config-fold-changed")).toContainText("2")
})

test("copies and downloads exactly the file on screen", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await openGenerator(page, `?ownerId=1234567890&botId=${BOT_ID}&credential=${CREDENTIAL}`)

  // The registration page's link fills the bot in and says where it came from.
  await expect(page.locator("#client-bot-id")).toHaveValue(BOT_ID)
  await expect(page.locator("#client-credential")).toHaveValue(CREDENTIAL)
  await expect(page.getByTestId("client-config-prefill-tag")).toBeVisible()
  await expect(page.getByTestId("client-config-prefill")).toContainText("1234567890")
  await expect(yaml(page)).not.toContainText("1234567890")

  const shown = await yaml(page).locator("code").textContent()
  expect(shown).toContain(`botId: ${BOT_ID}\ncredential: "${CREDENTIAL}"\n`)
  expect(shown?.endsWith("userBlacklists:\n  all: []\n")).toBe(true)

  await page.getByTestId("client-config-copy").click()
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(shown)

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("client-config-download").click(),
  ])
  expect(download.suggestedFilename()).toBe("configs.yaml")
  expect(await readFile(await download.path(), "utf8")).toBe(shown)
})

test("resets only after confirming", async ({ page }) => {
  await openGenerator(page, `?botId=${BOT_ID}&credential=${CREDENTIAL}`)
  await page.locator("#client-host").fill("0.0.0.0")
  await page.getByTestId("client-config-admins").getByRole("textbox").fill("1145")

  await page.getByTestId("client-config-reset").click()
  const dialog = page.getByRole("alertdialog")
  await dialog.getByRole("button", { name: /取消|Cancel/ }).click()
  await expect(page.locator("#client-host")).toHaveValue("0.0.0.0")

  await page.getByTestId("client-config-reset").click()
  await dialog.getByRole("button", { name: /重置|Reset/ }).click()
  await expect(dialog).toBeHidden()
  await expect(page.locator("#client-host")).toHaveValue("127.0.0.1")
  await expect(page.getByTestId("client-config-admins").getByRole("textbox")).toHaveValue("")
  await expect(yaml(page)).toContainText("botId: 0")
  // The values handed over by the registration link are gone, so is the note about them.
  await expect(page.getByTestId("client-config-prefill-tag")).toHaveCount(0)
  await expect(page.getByTestId("client-config-missing")).toBeVisible()
})

test("puts the file beside the form on a wide screen", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await openGenerator(page)

  const form = await page.getByTestId("client-config-form").boundingBox()
  const output = await page.getByTestId("client-config-output").boundingBox()
  expect(output!.x).toBeGreaterThanOrEqual(form!.x + form!.width)
  await expect(page.getByTestId("client-config-bottom-bar")).toBeHidden()

  // The file stays in view while the long form scrolls.
  await page.evaluate(() => window.scrollTo(0, 1200))
  await expect(page.getByTestId("client-config-copy")).toBeInViewport()
  expect(await overflow(page)).toBe(0)
})

for (const width of [390, 320]) {
  test(`stacks on a ${width}px phone without sideways scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height: 760 })
    await openGenerator(page, `?botId=${BOT_ID}&credential=${CREDENTIAL}`)
    for (const name of ["routing", "security", "rateLimit", "birthday"]) {
      await fold(page, name).getByRole("button").first().click()
    }
    await page.locator("#client-endpoint-override").fill("https://example.com/a-very-long-pinned-endpoint/that/does/not/break/anywhere")

    const form = await page.getByTestId("client-config-form").boundingBox()
    const output = await page.getByTestId("client-config-output").boundingBox()
    expect(output!.y).toBeGreaterThanOrEqual(form!.y + form!.height)
    expect(await overflow(page)).toBe(0)

    // The long credential scrolls inside the file box instead of widening the page.
    const box = await yaml(page).boundingBox()
    expect(box!.x + box!.width).toBeLessThanOrEqual(width)
    expect(await yaml(page).evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true)

    // Copying stays in reach from the top of the form, and the bar leads to the file.
    const bar = page.getByTestId("client-config-bottom-bar")
    await expect(bar).toBeInViewport()
    await bar.getByRole("button").first().click()
    await expect(page.getByTestId("client-config-output")).toBeInViewport()
  })
}
