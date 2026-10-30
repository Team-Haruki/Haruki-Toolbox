import { describe, expect, it } from "bun:test"
import {
  isVaultCodeLive,
  normalizeRevealedCode,
  normalizeVaultEntries,
  normalizeVaultKeyStatus,
  toUnlockBody,
} from "@/modules/tools/lib/inherit-vault"
import { describeInheritApiError, describeJobError, formatInheritRemaining } from "@/modules/tools/lib/inherit-messages"

const t = (key: string, params?: Record<string, unknown>) => (params ? `${key} ${JSON.stringify(params)}` : key)

describe("vault payloads", () => {
  it("parses entries newest first as sent", () => {
    const entries = normalizeVaultEntries([
      { id: "a", server: "en", game_user_id_masked: "16***363", job_id: "j", created_at: "2026-10-30T00:00:00Z",
        credential_expires_at: "2026-11-06T00:00:00Z", has_code: true, code_issued_at: "2026-10-30T00:00:00Z",
        code_expires_at: "2026-10-31T00:00:00Z", readable: true, pending: true },
      { id: "b", server: "jp", has_code: false, readable: false },
      { nothing: true },
    ])
    expect(entries.map((entry) => entry.id)).toEqual(["a", "b"])
    expect(entries[0]).toMatchObject({ server: "en", hasCode: true, pending: true, readable: true })
    expect(entries[1]).toMatchObject({ server: "jp", hasCode: false, readable: false, codeExpiresAt: null })
  })

  it("parses the key status for both identity kinds", () => {
    expect(normalizeVaultKeyStatus({ initialized: true, kind: "password", key_version: 1 })).toMatchObject({ initialized: true, kind: "password" })
    expect(normalizeVaultKeyStatus({ initialized: false, kind: "pin", identity_has_password: false })).toMatchObject({
      initialized: false,
      kind: "pin",
      identityHasPassword: false,
    })
  })

  it("parses a reveal or re-issue answer with its warnings", () => {
    expect(normalizeRevealedCode({ inherit_id: "ID", password: "PW", code_expires_at: "2026-10-31T00:00:00Z",
      warnings: [{ code: "vault_store_failed", message: "m" }] })).toEqual({
      inheritId: "ID",
      password: "PW",
      expiresAt: "2026-10-31T00:00:00Z",
      warnings: [{ code: "vault_store_failed", message: "m" }],
    })
    expect(normalizeRevealedCode({ inherit_id: "ID" })).toBeNull()
  })

  it("sends only the unlock fields that carry something", () => {
    expect(toUnlockBody({ password: "new", previousPassword: "old" })).toEqual({ password: "new", previous_password: "old" })
    expect(toUnlockBody({ vaultPin: "12345678" })).toEqual({ vault_pin: "12345678" })
  })

  it("treats a code as live until it expires", () => {
    const entry = { hasCode: true, codeExpiresAt: "2026-10-31T00:00:00Z" }
    expect(isVaultCodeLive(entry, Date.parse("2026-10-30T23:59:59Z"))).toBe(true)
    expect(isVaultCodeLive(entry, Date.parse("2026-10-31T00:00:01Z"))).toBe(false)
    expect(isVaultCodeLive({ hasCode: false, codeExpiresAt: null }, 0)).toBe(false)
  })
})

describe("inherit messages", () => {
  it("translates known codes, adds Retry-After, and falls back to the backend message", () => {
    expect(describeInheritApiError(t, { code: "password_invalid", message: "密码错误", status: 403 })).toBe("tools.uploadData.inheritErrors.password_invalid")
    expect(describeInheritApiError(t, { code: "server_busy", message: "", status: 429, retryAfter: 30 })).toContain("retryAfter")
    expect(describeInheritApiError(t, { code: "brand_new_code", message: "后端文案", status: 400 })).toBe("后端文案")
    expect(describeInheritApiError(t, { code: "", message: "Network Error", status: 0 })).toBe("tools.uploadData.inheritErrors.network")
  })

  it("translates job errors", () => {
    expect(describeJobError(t, { code: "execute_uncertain", message: "" })).toBe("tools.uploadData.inheritJob.errors.execute_uncertain")
    expect(describeJobError(t, { code: "unknown_future", message: "后端" })).toBe("后端")
  })

  it("formats a countdown from the catalog strings", () => {
    expect(formatInheritRemaining(t, 3_725_000, 0)).toBe('catalog.countdown.hours {"hours":1} catalog.countdown.minutes {"minutes":2}')
    expect(formatInheritRemaining(t, 0, 1)).toBeNull()
    expect(formatInheritRemaining(t, null, 0)).toBeNull()
  })
})
