import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 30_000,
  // CI serves through a cold Vite dev server: the first visit to a page pays
  // on-demand transform of its whole module graph, which on CI hardware can
  // exceed the 5s default expect timeout before first paint.
  expect: { timeout: process.env.CI ? 15_000 : 5_000 },
  fullyParallel: true,
  // Pays the dev server's cold-start transform cost once, before any test's
  // clock starts (see the file for the failure it prevents).
  globalSetup: "./tests/e2e/global-setup.ts",
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    // Opt-in mobile Safari pass for the tests tagged @webkit (iOS-only
    // layout and scroll-lock behaviour). CI installs Chromium only.
    ...(process.env.E2E_WEBKIT
      ? [{ name: "webkit", use: { ...devices["iPhone 13"] }, grep: /@webkit/ }]
      : []),
  ],
  webServer: {
    // Invoke the installed CLI under Node directly, avoiding a nested Bun
    // launcher that can stall before Vite starts listening in CI.
    command: "./node_modules/.bin/vite --mode e2e --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // On CI the dev server's own log lands in the job output, so a dependency
    // re-optimisation or a forced page reload mid-suite is visible next to
    // the test that it broke.
    stdout: process.env.CI ? "pipe" : "ignore",
    stderr: "pipe",
  },
})
