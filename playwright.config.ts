import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "https://127.0.0.1:4173",
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
  },
  webServer: {
    command: "bun run dev --host 127.0.0.1 --port 4173",
    url: "https://127.0.0.1:4173",
    ignoreHTTPSErrors: true,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
