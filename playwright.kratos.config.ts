import { defineConfig } from "@playwright/test"

/**
 * `bun run e2e:kratos`: the sign-in and second-factor flows against a real
 * Ory Kratos, with real browser sessions and a virtual authenticator.
 *
 * The hermetic suite (playwright.config.ts) answers Kratos with captured
 * responses, which cannot show what Kratos does with a session: which level
 * it reaches, where it redirects, what an account without a second factor
 * gets. These specs start Kratos itself, with tests/kratos/kratos.yml.
 *
 * Needs the `kratos` binary of the production version (ORY_VERSION) on PATH,
 * or its path in KRATOS_BIN; a build with SQLite, for the in-memory database.
 * Not part of CI.
 */
const KRATOS_BIN = process.env.KRATOS_BIN ?? "kratos"

export default defineConfig({
  testDir: "tests/kratos",
  testMatch: "**/*.kratos.ts",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  // One Kratos, and identities that are signed in and out: one at a time.
  workers: 1,
  fullyParallel: false,
  reporter: "list",
  use: {
    // `localhost`, not 127.0.0.1: a WebAuthn relying party id is a domain.
    baseURL: "http://localhost:4183",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: [
    {
      command: `${KRATOS_BIN} serve --dev --watch-courier -c tests/kratos/kratos.yml`,
      url: "http://127.0.0.1:4433/health/ready",
      reuseExistingServer: true,
      timeout: 60_000,
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      command: "./node_modules/.bin/vite --mode kratos --host localhost --port 4183 --strictPort",
      url: "http://localhost:4183",
      reuseExistingServer: true,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
})
