import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "@playwright/test"

// A Kratos message can carry one long unbreakable token: the spec URL in a
// WebAuthn error, a request id. Such a message used to push the whole form
// wider than its panel, off the side of a phone. Every sign-in family page
// must keep its content inside its column (`data-kratos-page`) at 320 px.
const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "kratos")
const KRATOS_HOST = "127.0.0.1:9"
const LONG_MESSAGE = "NotAllowedError: The operation either timed out or was not allowed. See: "
  + "https://www.w3.org/TR/webauthn-2/#sctn-privacy-considerations-client. "
  + "request_id=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

const CASES = [
  { flowType: "login", fixture: "login-wrong-password", path: "/user/login?flow=e2e-flow" },
  { flowType: "registration", fixture: "registration-password-too-short", path: "/user/register?flow=e2e-flow" },
  { flowType: "recovery", fixture: "recovery-wrong-code", path: "/user/recovery?flow=e2e-flow" },
  { flowType: "verification", fixture: "verification-wrong-code", path: "/user/verification?flow=e2e-flow" },
] as const

function flowWithLongMessages(fixture: string): string {
  const flow = JSON.parse(readFileSync(join(FIXTURE_DIR, `${fixture}.json`), "utf8"))
  flow.ui.messages = [{ id: 9_999_001, text: LONG_MESSAGE, type: "error" }]
  for (const node of flow.ui.nodes) {
    if (node.type === "input" && node.attributes?.type !== "hidden") {
      node.messages = [{ id: 9_999_002, text: LONG_MESSAGE, type: "error" }]
    }
  }
  return JSON.stringify(flow)
}

for (const state of CASES) {
  test(`a long ${state.flowType} error stays inside the card on a phone`, async ({ page }) => {
    const appOrigin = new URL(test.info().project.use.baseURL ?? "http://127.0.0.1:4173").origin
    const body = flowWithLongMessages(state.fixture)
    await page.setViewportSize({ width: 320, height: 800 })
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url())
      if (url.origin === appOrigin) {
        return route.continue()
      }
      if (url.host === KRATOS_HOST && url.pathname === `/self-service/${state.flowType}/flows`) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "access-control-allow-origin": appOrigin, "access-control-allow-credentials": "true" },
          body,
        })
      }
      return route.abort()
    })
    await page.goto(state.path)

    const card = page.locator("[data-kratos-page]").first()
    await expect(card.getByText(/request_id=0123456789abcdef/).first()).toBeVisible()

    const layout = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth
      const cardBox = document.querySelector("[data-kratos-page]")!.getBoundingClientRect()
      let widest = 0
      for (const element of Array.from(document.querySelectorAll("[data-kratos-page] *"))) {
        const box = element.getBoundingClientRect()
        if (box.width > 0) widest = Math.max(widest, box.right)
      }
      return {
        pageOverflow: document.documentElement.scrollWidth - viewport,
        cardRight: cardBox.right,
        widest,
      }
    })
    expect(layout.pageOverflow).toBe(0)
    expect(layout.widest).toBeLessThanOrEqual(layout.cardRight + 0.5)
  })
}
