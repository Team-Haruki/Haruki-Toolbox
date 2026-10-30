import type { InheritServer } from "@/types"
import { asRecord } from "@/lib/record-utils"
import type { InheritJobUnlock, InheritProblem, InheritUnlockKind } from "@/modules/tools/lib/inherit-job"

/**
 * The inherit vault keeps, per transferred account, the game login credential
 * (7 days) and the latest transfer code issued for it (24 hours), both sealed
 * to a key only the owner's Toolbox password (or vault PIN) opens.
 */

export interface InheritVaultKeyStatus {
  initialized: boolean
  kind: InheritUnlockKind
  /** Only reported before the key exists. */
  identityHasPassword: boolean | null
  createdAt: string | null
  updatedAt: string | null
}

export interface InheritVaultEntry {
  id: string
  server: InheritServer
  gameUserIdMasked: string
  jobId: string
  createdAt: string | null
  credentialExpiresAt: string | null
  hasCode: boolean
  codeIssuedAt: string | null
  codeExpiresAt: string | null
  /** False for entries sealed to a key that was reset since. */
  readable: boolean
  /** Parked in the fallback store until the database is back; still opens normally. */
  pending: boolean
}

export interface InheritRevealedCode {
  inheritId: string
  password: string
  expiresAt: string | null
  warnings: InheritProblem[]
}

/** The step-up secret a vault operation (and the job confirmation) carries. */
export interface InheritUnlockInput {
  password?: string
  previousPassword?: string
  vaultPin?: string
}

function str(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function strOrNull(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null
}

export function normalizeVaultKeyStatus(value: unknown): InheritVaultKeyStatus {
  const record = asRecord(value) ?? {}
  return {
    initialized: record.initialized === true,
    kind: record.kind === "pin" ? "pin" : "password",
    identityHasPassword: typeof record.identity_has_password === "boolean" ? record.identity_has_password : null,
    createdAt: strOrNull(record.created_at),
    updatedAt: strOrNull(record.updated_at),
  }
}

export function normalizeVaultEntry(value: unknown): InheritVaultEntry | null {
  const record = asRecord(value)
  if (!record || !str(record.id)) return null
  return {
    id: str(record.id),
    server: record.server === "en" ? "en" : "jp",
    gameUserIdMasked: str(record.game_user_id_masked),
    jobId: str(record.job_id),
    createdAt: strOrNull(record.created_at),
    credentialExpiresAt: strOrNull(record.credential_expires_at),
    hasCode: record.has_code === true,
    codeIssuedAt: strOrNull(record.code_issued_at),
    codeExpiresAt: strOrNull(record.code_expires_at),
    readable: record.readable !== false,
    pending: record.pending === true,
  }
}

export function normalizeVaultEntries(value: unknown): InheritVaultEntry[] {
  const list = Array.isArray(value) ? value : (asRecord(value)?.items as unknown)
  if (!Array.isArray(list)) return []
  return list.map(normalizeVaultEntry).filter((entry): entry is InheritVaultEntry => entry !== null)
}

export function normalizeRevealedCode(value: unknown): InheritRevealedCode | null {
  const record = asRecord(value)
  if (!record) return null
  const inheritId = str(record.inherit_id)
  const password = str(record.password)
  if (!inheritId || !password) return null
  const warnings = Array.isArray(record.warnings)
    ? record.warnings
        .map((item) => {
          const warning = asRecord(item)
          const code = warning ? str(warning.code) : ""
          return code ? { code, message: str(warning?.message) } : null
        })
        .filter((item): item is InheritProblem => item !== null)
    : []
  return { inheritId, password, expiresAt: strOrNull(record.code_expires_at), warnings }
}

/** The wire body of an unlock: only the fields that carry something. */
export function toUnlockBody(input: InheritUnlockInput): Record<string, string> {
  const body: Record<string, string> = {}
  if (input.password) body.password = input.password
  if (input.previousPassword) body.previous_password = input.previousPassword
  if (input.vaultPin) body.vault_pin = input.vaultPin
  return body
}

/** What a step-up asks for: the sign-in password or a vault PIN, and whether the vault exists yet. */
export interface InheritUnlockMode {
  kind: InheritUnlockKind
  initialized: boolean
}

/**
 * Picks the secret a step-up asks for. The vault key status is the live
 * answer: the backend reports the key's own kind once the key exists and the
 * identity's (password or not) before, and the page reloads it after a reset
 * and whenever a job moves on. The job's `unlock` hint is what the backend
 * knew when the job was created, so it is only the fallback: after a vault
 * reset in the confirm step it still says "initialized", and for an account
 * whose PIN vault was reset after it added a password it still says "pin".
 */
export function resolveUnlockMode(
  keyStatus: Pick<InheritVaultKeyStatus, "kind" | "initialized"> | null | undefined,
  jobHint?: InheritJobUnlock | null,
): InheritUnlockMode {
  if (keyStatus) return { kind: keyStatus.kind, initialized: keyStatus.initialized }
  if (jobHint) return { kind: jobHint.kind, initialized: jobHint.initialized }
  return { kind: "password", initialized: true }
}

/** A vault code is shown or kept only while it still works. */
export function isVaultCodeLive(entry: Pick<InheritVaultEntry, "hasCode" | "codeExpiresAt">, now: number): boolean {
  if (!entry.hasCode) return false
  if (!entry.codeExpiresAt) return true
  const expires = Date.parse(entry.codeExpiresAt)
  return Number.isNaN(expires) || expires > now
}
