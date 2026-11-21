import { createHmac, randomUUID } from "node:crypto"
import { expect, type APIRequestContext, type CDPSession, type Page } from "@playwright/test"

export const KRATOS_PUBLIC_URL = "http://localhost:4433"
const KRATOS_ADMIN_URL = "http://127.0.0.1:4434"
/** The closed port every backend but Kratos points at in `.env.kratos`. */
const BACKEND_ORIGIN = "http://127.0.0.1:9"

export interface TestIdentity {
  id: string
  email: string
  password: string
}

/**
 * A fresh account with a password, made through the Kratos admin API. The
 * toolbox role comes from `metadata_public`, which is where the app reads it
 * when the backend does not answer (see `resolveUserSettingsFromKratosSession`).
 */
export async function createIdentity(
  request: APIRequestContext,
  options: { role?: "user" | "admin" } = {}
): Promise<TestIdentity> {
  const tag = randomUUID().slice(0, 8)
  const email = `e2e-${tag}@example.com`
  const password = `Pw-${randomUUID()}`
  const response = await request.post(`${KRATOS_ADMIN_URL}/admin/identities`, {
    data: {
      schema_id: "default",
      traits: { email, name: `E2E ${tag}` },
      credentials: { password: { config: { password } } },
      verifiable_addresses: [{ value: email, verified: true, via: "email", status: "completed" }],
      metadata_public: { public_user_id: `e2e-${tag}`, role: options.role ?? "user" },
    },
  })
  expect(response.status(), await response.text()).toBe(201)
  const body = await response.json() as { id: string }
  return { id: body.id, email, password }
}

export async function deleteIdentity(request: APIRequestContext, identity: TestIdentity) {
  await request.delete(`${KRATOS_ADMIN_URL}/admin/identities/${identity.id}`)
}

export interface SessionProbe {
  status: number
  aal: string | null
  /** The methods the session passed, in order (`password`, `passkey`, `webauthn`, `totp`, …). */
  methods: string[]
  errorId: string | null
}

/** `GET /sessions/whoami` with the page's own cookies: what Kratos says the session is. */
export async function probeSession(page: Page): Promise<SessionProbe> {
  const response = await page.context().request.get(`${KRATOS_PUBLIC_URL}/sessions/whoami`, {
    headers: { Accept: "application/json" },
  })
  const body = await response.json().catch(() => ({})) as {
    authenticator_assurance_level?: string
    authentication_methods?: Array<{ method?: string }>
    error?: { id?: string }
  }
  return {
    status: response.status(),
    aal: body.authenticator_assurance_level ?? null,
    methods: (body.authentication_methods ?? []).map((entry) => entry.method ?? ""),
    errorId: body.error?.id ?? null,
  }
}

/**
 * Answers the toolbox backend, which is not running: the app then takes the
 * account from the Kratos session alone. Admin API calls get the answer the
 * real backend gives a session of that level.
 */
export async function mockBackend(page: Page) {
  await page.route(`${BACKEND_ORIGIN}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.startsWith("/api/admin/")) {
      const session = await probeSession(page)
      if (session.aal !== "aal2") {
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({ status: 403, message: "administrator access requires two-factor authentication" }),
        })
        return
      }
    }
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ status: 503, message: "backend not running in this test" }),
    })
  })
}

export interface VirtualAuthenticator {
  client: CDPSession
  id: string
}

/**
 * Chromium's virtual authenticator, which answers WebAuthn requests the way
 * a device would. `platform` is one built into the device (it keeps
 * discoverable credentials and verifies the user, as a passkey needs);
 * `security-key` is a plain USB key.
 */
export async function addVirtualAuthenticator(
  page: Page,
  kind: "platform" | "security-key"
): Promise<VirtualAuthenticator> {
  const client = await page.context().newCDPSession(page)
  await client.send("WebAuthn.enable")
  const { authenticatorId } = await client.send("WebAuthn.addVirtualAuthenticator", {
    options: kind === "platform"
      ? {
          protocol: "ctap2",
          transport: "internal",
          hasResidentKey: true,
          hasUserVerification: true,
          isUserVerified: true,
          automaticPresenceSimulation: true,
        }
      : {
          protocol: "ctap2",
          transport: "usb",
          hasResidentKey: false,
          hasUserVerification: false,
          automaticPresenceSimulation: true,
        },
  })
  return { client, id: authenticatorId }
}

export async function removeVirtualAuthenticator(authenticator: VirtualAuthenticator) {
  await authenticator.client.send("WebAuthn.removeVirtualAuthenticator", { authenticatorId: authenticator.id })
}

export async function countCredentials(authenticator: VirtualAuthenticator): Promise<number> {
  const { credentials } = await authenticator.client.send("WebAuthn.getCredentials", { authenticatorId: authenticator.id })
  return credentials.length
}

/** The current code of an authenticator app holding `secret` (RFC 6238, SHA-1, 6 digits, 30 s). */
export function totpCode(secret: string, now = Date.now()): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let bits = ""
  for (const char of secret.replace(/=+$/, "").toUpperCase()) {
    bits += alphabet.indexOf(char).toString(2).padStart(5, "0")
  }
  const key = Buffer.from(bits.match(/.{8}/g)?.map((byte) => Number.parseInt(byte, 2)) ?? [])
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 30_000)))
  const digest = createHmac("sha1", key).update(counter).digest()
  const offset = digest[digest.length - 1]! & 0x0f
  const value = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000
  return value.toString().padStart(6, "0")
}

/** The email and password step of the sign-in page. */
export async function submitPassword(page: Page, identity: TestIdentity) {
  await page.locator('input[name="identifier"]').fill(identity.email)
  await page.locator('input[name="password"]').fill(identity.password)
  await page.locator('button[type="submit"][name="method"][value="password"]').click()
}

/** Opens the sign-in page and signs in with the password; resolves once the app is back on `/`. */
export async function signInWithPassword(page: Page, identity: TestIdentity) {
  await page.goto("/user/login")
  await submitPassword(page, identity)
  await page.waitForURL((url) => url.origin === "http://localhost:4183" && url.pathname === "/")
}

/** Ends the Kratos session of the page, as the account menu's sign-out does. */
export async function signOut(page: Page) {
  const response = await page.context().request.get(`${KRATOS_PUBLIC_URL}/self-service/logout/browser`, {
    headers: { Accept: "application/json" },
  })
  expect(response.status()).toBe(200)
  const { logout_url: logoutUrl } = await response.json() as { logout_url: string }
  await page.context().request.get(logoutUrl, { headers: { Accept: "application/json" } })
  expect((await probeSession(page)).status).toBe(401)
}
