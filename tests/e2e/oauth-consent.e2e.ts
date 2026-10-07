import { expect, test } from "@playwright/test"

// The generic consent page against a backend that, since the device flow,
// also sends consent_request_id in GET /api/oauth2/consent. The page must
// render as before and never forward fields it does not know.
const APP_HOST = "127.0.0.1:4173"
const USER_ID = "toolbox-consent"
const CHALLENGE = "e2e-consent-challenge"
const REDIRECT = `http://${APP_HOST}/e2e-consent-done`

test("the consent page ignores consent_request_id and accepts with the known fields only", async ({ page }) => {
  const acceptBodies: unknown[] = []
  await page.addInitScript((userId) => {
    sessionStorage.setItem("user", JSON.stringify({
      name: "Consent test",
      userId,
      gameAccountBindings: [],
      sessionToken: "test-token",
      tokenExpiration: 4_102_444_800,
    }))
  }, USER_ID)
  await page.route(REDIRECT, (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>done</title>" }))
  await page.route("**/*", (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.host === APP_HOST) {
      return route.continue()
    }
    if (url.pathname === "/api/oauth2/consent" && url.searchParams.get("consent_challenge") === CHALLENGE) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: 200,
          message: "ok",
          updatedData: {
            challenge: CHALLENGE,
            consent_request_id: "consent-request-1",
            skip: false,
            subject: "kratos-subject",
            request_url: "https://auth.example/oauth2/auth?client_id=web-client",
            requested_scope: ["user:read", "game-data:read"],
            requested_access_token_audience: [],
            client: { client_id: "web-client", client_name: "E2E Web Client" },
          },
        }),
      })
    }
    if (url.pathname === "/api/oauth2/consent/accept" && url.searchParams.get("consent_challenge") === CHALLENGE) {
      acceptBodies.push(request.postDataJSON())
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: 200, message: "ok", updatedData: { redirect_to: REDIRECT } }),
      })
    }
    return route.abort()
  })

  await page.goto(`/oauth2/consent?consent_challenge=${CHALLENGE}`)

  await expect(page.getByText("E2E Web Client").first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(/读取游戏数据|Read game data/)).toBeVisible()
  await expect(page.getByText("consent-request-1")).toHaveCount(0)

  await page.getByRole("button", { name: /^(授权|Authorize)$/ }).click()
  await page.waitForURL(REDIRECT)
  expect(acceptBodies).toEqual([{ grantScope: ["user:read", "game-data:read"], grantAccessTokenAudience: [] }])
})
