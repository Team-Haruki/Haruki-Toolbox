import { expect, test, type Page } from "@playwright/test"

// The page-side update flow (src/pwa.ts) against a mocked /build-info.json.
// The e2e server is Vite dev, so there is no Service Worker here: these cover
// the build comparison, the prompt, the forced update and its reload guard.
// .env.e2e turns the build-info checks on outside production builds.

type BuildInfoPayload = {
  version: string
  gitCommit: string
  buildTime: string
  minSupportedVersion?: string
}

const NEWER_BUILD: BuildInfoPayload = {
  version: "99.0.0",
  gitCommit: "e2e0000000aa",
  buildTime: "2099-01-01T00:00:00.000Z",
  minSupportedVersion: "0.0.1",
}

const UPDATE_PROMPT = /^(发现新版本|New version available)$/
const UPDATE_ACTION = /^(更新应用|Update app)$/
const FORCED_TITLE = /^(当前版本已停止支持|This version is no longer supported)$/
const FORCED_WITH_INPUT = /一分钟后刷新|reloads in a minute/

/** Serves `payload()` as the deployed build-info.json (404 while it is null). */
async function mockBuildInfo(page: Page, payload: () => BuildInfoPayload | null) {
  await page.route("**/build-info.json*", (route) => {
    const body = payload()
    return body
      ? route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) })
      : route.fulfill({ status: 404, body: "" })
  })
}

/** Counts document loads of the top frame. */
function countDocumentLoads(page: Page) {
  const counter = { loads: 0 }
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      counter.loads += 1
    }
  })
  return counter
}

test("a newer deployed build shows the prompt, and accepting it reloads", async ({ page }) => {
  await mockBuildInfo(page, () => NEWER_BUILD)
  const counter = countDocumentLoads(page)

  await page.goto("/")
  await expect(page.getByText(UPDATE_PROMPT)).toBeVisible()
  expect(counter.loads).toBe(1)

  await page.getByRole("button", { name: UPDATE_ACTION }).click()
  await expect.poll(() => counter.loads).toBe(2)
})

test("a build below minSupportedVersion reloads once, then the guard stops a loop", async ({ page }) => {
  // Every reload still sees the old build (as with a stale cache in front of
  // the site): exactly one forced reload, then the plain prompt.
  await mockBuildInfo(page, () => ({ ...NEWER_BUILD, minSupportedVersion: "99.0.0" }))
  const counter = countDocumentLoads(page)

  await page.goto("/")
  await expect.poll(() => counter.loads, { timeout: 15_000 }).toBe(2)
  await expect(page.getByText(UPDATE_PROMPT)).toBeVisible()
  await page.waitForTimeout(3000)
  expect(counter.loads).toBe(2)
})

test("a forced update gives a reader with unsaved input a grace period", async ({ page }) => {
  let deployed: BuildInfoPayload | null = null
  await mockBuildInfo(page, () => deployed)
  const counter = countDocumentLoads(page)

  await page.goto("/")
  await expect(page.getByRole("heading", { name: /欢迎使用 Haruki 工具箱|Welcome to Haruki Toolbox/ })).toBeVisible()

  // Any text field the reader typed into counts; this one stands in for a form.
  await page.evaluate(() => {
    const field = document.createElement("textarea")
    field.setAttribute("aria-label", "draft")
    document.body.append(field)
  })
  await page.getByLabel("draft").fill("half-written ticket")

  deployed = { ...NEWER_BUILD, minSupportedVersion: "99.0.0" }
  // Returning to the tab runs a check.
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")))

  await expect(page.getByText(FORCED_TITLE)).toBeVisible()
  await expect(page.getByText(FORCED_WITH_INPUT)).toBeVisible()
  await page.waitForTimeout(3000)
  expect(counter.loads).toBe(1)
  await expect(page.getByLabel("draft")).toHaveValue("half-written ticket")
})
