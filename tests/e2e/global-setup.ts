import { chromium, type FullConfig } from "@playwright/test"

/**
 * Warms the cold Vite dev server before the timed tests start.
 *
 * CI serves the app straight from `vite` with no prebuilt bundle, so the
 * first visit to a page pays the on-demand transform of its whole module
 * graph. On a slow runner that alone exceeded the 15s expect timeout for the
 * first tests to run (the two smoke tests, each on its own worker), while
 * every later test passed once the graph was cached. Visiting each route the
 * specs use once, outside any test's timeout, moves that cost out of the
 * timed window. Nothing here is fatal: a route that fails to warm up still
 * gets its normal timed run.
 */
const WARM_ROUTES = [
  "/",
  "/logout",
  "/this/route/does/not/exist",
  "/cards",
  "/events",
  "/gachas",
  "/music",
  "/cards/box",
  "/music/progress",
  "/events/records",
  "/profile/me",
  "/training/challenge",
  "/event-planner",
  "/user/harukibot-authorization",
]

export default async function globalSetup(config: FullConfig) {
  if (!process.env.CI && !process.env.E2E_WARMUP) {
    return
  }

  const baseURL = config.projects[0]?.use.baseURL ?? "http://127.0.0.1:4173"
  const origin = new URL(baseURL).host
  const browser = await chromium.launch()
  const context = await browser.newContext({ baseURL })
  // Stay on-origin like the auth specs do: the login page would otherwise
  // start a Kratos flow against the real auth host.
  await context.route("**/*", (route) =>
    new URL(route.request().url()).host === origin ? route.continue() : route.abort(),
  )
  const page = await context.newPage()
  const startedAt = Date.now()

  for (const path of WARM_ROUTES) {
    try {
      await page.goto(path, { waitUntil: "load", timeout: 90_000 })
      // Route chunks load after the router resolves; give them a moment, but
      // never wait on pollers that keep the network busy.
      await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined)
    } catch (error) {
      console.warn(`[e2e warm-up] ${path}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  console.log(`[e2e warm-up] visited ${WARM_ROUTES.length} routes in ${Math.round((Date.now() - startedAt) / 1000)}s`)
  await browser.close()
}
