import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 30_000,
  // CI serves through a cold Vite dev server: the first visit to a page pays
  // on-demand transform of its whole module graph, which on CI hardware can
  // exceed the 5s default expect timeout before first paint.
  expect: { timeout: process.env.CI ? 15_000 : 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: {
    // Deliberately NOT `bunx --bun vite` (the dev script): vite under the bun
    // runtime hangs before listening on linux-x64 CI runners (seen with both
    // bun 1.4.0 + vite 8.2.1 and bun 1.3.14 + vite 8.2.2). Plain bunx runs
    // vite's CLI under node, which is immune.
    command: "bunx vite --mode e2e --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
