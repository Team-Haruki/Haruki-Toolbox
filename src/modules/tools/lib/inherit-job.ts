import type { InheritServer, UploadDataType } from "@/types"
import { asRecord } from "@/lib/record-utils"

/**
 * Inherit (transfer-code) upload jobs. The backend runs one job per upload:
 * it previews the account, waits for the owner to confirm, executes the
 * transfer, stores the credential in the owner's vault, issues a new transfer
 * code and only then fetches and stores the data. These helpers turn the wire
 * snapshot into typed data and answer the questions the UI keeps asking.
 */

export const INHERIT_JOB_STEPS = [
  "bootstrap",
  "preview",
  "awaiting_confirm",
  "execute",
  "vault_store_credential",
  "login",
  "issue_new_code",
  "vault_store_code",
  "fetch_suite",
  "fetch_mysekai",
  "upload",
  "done",
] as const

export type InheritJobStepName = (typeof INHERIT_JOB_STEPS)[number]
export type InheritJobStatus = "running" | "awaiting_confirm" | "succeeded" | "failed" | "cancelled"
export type InheritStepStatus = "pending" | "running" | "done" | "failed" | "skipped"
export type InheritSubstepStatus = "running" | "done" | "warning" | "failed"
export type InheritNewPasswordMode = "reuse" | "random"
export type InheritUnlockKind = "password" | "pin"

export interface InheritJobSubstep {
  name: string
  status: InheritSubstepStatus
  note: string
  at: string | null
}

export interface InheritJobStep {
  name: string
  status: InheritStepStatus
  startedAt: string | null
  finishedAt: string | null
  errorCode: string
  substeps: InheritJobSubstep[]
}

export interface InheritTransferRestriction {
  isRestrictDeviceTransfer: boolean
  /** Epoch milliseconds; 0 when the game sends none. */
  restrictEndAt: number
  restTransferCount: number
  isWorldBloomChapter: boolean
  restrictRank: number
  gameCharacterId: number
}

export interface InheritJobPreview {
  nickname: string
  rank: number
  gameUserIdMasked: string
  transferRestriction: InheritTransferRestriction | null
}

export interface InheritJobUnlock {
  kind: InheritUnlockKind
  initialized: boolean
}

export interface InheritProblem {
  code: string
  message: string
}

export interface InheritNewCode {
  inheritId: string
  password: string
  expiresAt: string | null
}

export interface InheritJob {
  id: string
  server: InheritServer
  uploadType: UploadDataType
  newPasswordMode: InheritNewPasswordMode
  status: InheritJobStatus
  currentStep: string
  steps: InheritJobStep[]
  preview: InheritJobPreview | null
  unlock: InheritJobUnlock | null
  confirmDeadline: string | null
  error: InheritProblem | null
  warnings: InheritProblem[]
  vaultEntryId: string
  newCode: InheritNewCode | null
  createdAt: string | null
  updatedAt: string | null
  finishedAt: string | null
}

const JOB_STATUSES: readonly InheritJobStatus[] = ["running", "awaiting_confirm", "succeeded", "failed", "cancelled"]
const STEP_STATUSES: readonly InheritStepStatus[] = ["pending", "running", "done", "failed", "skipped"]
const SUBSTEP_STATUSES: readonly InheritSubstepStatus[] = ["running", "done", "warning", "failed"]

function str(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function strOrNull(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

function normalizeProblem(value: unknown): InheritProblem | null {
  const record = asRecord(value)
  if (!record) return null
  const code = str(record.code)
  return code ? { code, message: str(record.message) } : null
}

function normalizeSubstep(value: unknown): InheritJobSubstep | null {
  const record = asRecord(value)
  if (!record || !str(record.name)) return null
  return {
    name: str(record.name),
    status: pick(record.status, SUBSTEP_STATUSES, "running"),
    note: str(record.note),
    at: strOrNull(record.at),
  }
}

function normalizeStep(value: unknown): InheritJobStep | null {
  const record = asRecord(value)
  if (!record || !str(record.name)) return null
  const substeps = Array.isArray(record.substeps)
    ? record.substeps.map(normalizeSubstep).filter((item): item is InheritJobSubstep => item !== null)
    : []
  return {
    name: str(record.name),
    status: pick(record.status, STEP_STATUSES, "pending"),
    startedAt: strOrNull(record.started_at),
    finishedAt: strOrNull(record.finished_at),
    errorCode: str(record.error_code),
    substeps,
  }
}

function normalizeRestriction(value: unknown): InheritTransferRestriction | null {
  const record = asRecord(value)
  if (!record) return null
  return {
    isRestrictDeviceTransfer: record.is_restrict_device_transfer === true,
    restrictEndAt: num(record.restrict_end_at),
    restTransferCount: num(record.rest_transfer_count),
    isWorldBloomChapter: record.is_world_bloom_chapter === true,
    restrictRank: num(record.restrict_rank),
    gameCharacterId: num(record.game_character_id),
  }
}

function normalizePreview(value: unknown): InheritJobPreview | null {
  const record = asRecord(value)
  if (!record) return null
  return {
    nickname: str(record.nickname),
    rank: num(record.rank),
    gameUserIdMasked: str(record.game_user_id_masked),
    transferRestriction: normalizeRestriction(record.transfer_restriction),
  }
}

function normalizeNewCode(value: unknown): InheritNewCode | null {
  const record = asRecord(value)
  if (!record) return null
  const inheritId = str(record.inherit_id)
  const password = str(record.password)
  if (!inheritId || !password) return null
  return { inheritId, password, expiresAt: strOrNull(record.expires_at) }
}

/**
 * Every step in contract order. A snapshot lists them all, but a missing one
 * (an older backend, a truncated frame) still renders as pending.
 */
function completeSteps(steps: InheritJobStep[]): InheritJobStep[] {
  const byName = new Map(steps.map((step) => [step.name, step]))
  const ordered: InheritJobStep[] = INHERIT_JOB_STEPS.map((name) =>
    byName.get(name) ?? { name, status: "pending", startedAt: null, finishedAt: null, errorCode: "", substeps: [] },
  )
  // Steps a newer backend added go last instead of disappearing.
  for (const step of steps) {
    if (!(INHERIT_JOB_STEPS as readonly string[]).includes(step.name)) ordered.push(step)
  }
  return ordered
}

/** Parses a job snapshot (`GET /api/inherit/jobs/{id}`, WebSocket `job`); null when it is not one. */
export function normalizeInheritJob(value: unknown): InheritJob | null {
  const record = asRecord(value)
  if (!record) return null
  const id = str(record.id)
  if (!id || typeof record.status !== "string") return null
  const unlockRecord = asRecord(record.unlock)
  const steps = Array.isArray(record.steps)
    ? record.steps.map(normalizeStep).filter((item): item is InheritJobStep => item !== null)
    : []
  return {
    id,
    server: record.server === "en" ? "en" : "jp",
    uploadType: record.upload_type === "mysekai" ? "mysekai" : "suite",
    newPasswordMode: record.new_password_mode === "reuse" ? "reuse" : "random",
    status: pick(record.status, JOB_STATUSES, "running"),
    currentStep: str(record.current_step),
    steps: completeSteps(steps),
    preview: normalizePreview(record.preview),
    unlock: unlockRecord
      ? { kind: unlockRecord.kind === "pin" ? "pin" : "password", initialized: unlockRecord.initialized === true }
      : null,
    confirmDeadline: strOrNull(record.confirm_deadline),
    error: normalizeProblem(record.error),
    warnings: Array.isArray(record.warnings)
      ? record.warnings.map(normalizeProblem).filter((item): item is InheritProblem => item !== null)
      : [],
    vaultEntryId: str(record.vault_entry_id),
    newCode: normalizeNewCode(record.new_code),
    createdAt: strOrNull(record.created_at),
    updatedAt: strOrNull(record.updated_at),
    finishedAt: strOrNull(record.finished_at),
  }
}

export function isTerminalJobStatus(status: InheritJobStatus): boolean {
  return status === "succeeded" || status === "failed" || status === "cancelled"
}

export function findJobStep(job: InheritJob, name: InheritJobStepName): InheritJobStep | undefined {
  return job.steps.find((step) => step.name === name)
}

/**
 * True once the executing call has started: from then on the entered code
 * may be used up and the job can no longer be cancelled.
 */
export function hasJobStartedExecuting(job: InheritJob): boolean {
  const execute = findJobStep(job, "execute")
  return execute != null && execute.status !== "pending"
}

/** Cancel is allowed until the owner confirms (the backend answers `cannot_cancel` after). */
export function canCancelJob(job: InheritJob): boolean {
  return !isTerminalJobStatus(job.status) && !hasJobStartedExecuting(job)
}

/** Whether the code the owner entered is still usable after the job stopped with `code`. */
export type EnteredCodeValidity = "valid" | "used" | "unknown"

const CODE_STILL_VALID = new Set([
  "inherit_restricted",
  "transfer_restricted",
  "confirm_timeout",
  "cancelled",
  "game_degraded",
  "server_busy",
])

const CODE_USED = new Set([
  "login_failed",
  "fetch_failed",
  "mysekai_unavailable",
  "upload_failed",
  "upload_forbidden",
])

export function enteredCodeValidity(job: InheritJob): EnteredCodeValidity | null {
  if (job.status === "succeeded") return "used"
  if (!isTerminalJobStatus(job.status) || !job.error) return null
  const code = job.error.code
  if (code === "inherit_invalid") return null
  if (CODE_STILL_VALID.has(code)) return "valid"
  if (CODE_USED.has(code)) return "used"
  if (code === "execute_uncertain") return "unknown"
  // game_* errors, job_interrupted and internal_error depend on how far it got.
  return hasJobStartedExecuting(job) ? "used" : "valid"
}

export function hasJobWarning(job: InheritJob, code: string): boolean {
  return job.warnings.some((warning) => warning.code === code)
}

/**
 * The new code was issued but could not be stored: the owner must write it
 * down now, the vault will not have it.
 */
export function isNewCodeUnsaved(job: InheritJob): boolean {
  return hasJobWarning(job, "vault_store_failed")
}

/** Milliseconds a step took (or has been running); null when it has not started. */
export function stepDurationMs(step: Pick<InheritJobStep, "startedAt" | "finishedAt" | "status">, now: number): number | null {
  if (!step.startedAt) return null
  const start = Date.parse(step.startedAt)
  if (Number.isNaN(start)) return null
  const end = step.finishedAt ? Date.parse(step.finishedAt) : step.status === "running" ? now : Number.NaN
  if (Number.isNaN(end)) return null
  return Math.max(0, end - start)
}

/** "0.4 s", "12 s", "1 min 5 s": compact enough for a step row. */
export function formatStepDuration(ms: number): string {
  if (ms < 10_000) return `${(ms / 1000).toFixed(1)} s`
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds} s`
  return `${Math.floor(seconds / 60)} min ${seconds % 60} s`
}

/**
 * What the game accepts as a transfer password, and therefore what "reuse
 * this password for the new code" needs: 8 to 16 printable ASCII characters,
 * no spaces.
 */
export function isReusableInheritPassword(password: string): boolean {
  return /^[\x21-\x7e]{8,16}$/.test(password)
}

export const INHERIT_ID_PATTERN = /^[A-Za-z0-9]{16}$/

/** The vault PIN rule (identities without a Toolbox password): 8 to 128 characters. */
export function isValidVaultPin(pin: string): boolean {
  const length = Array.from(pin).length
  return length >= 8 && length <= 128
}

/** Splits a remaining duration into parts for a countdown; null once it has passed. */
export function remainingParts(targetMs: number, now: number): { days: number; hours: number; minutes: number; seconds: number } | null {
  const remaining = targetMs - now
  if (!Number.isFinite(remaining) || remaining <= 0) return null
  const total = Math.floor(remaining / 1000)
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

/** Job error codes the UI has its own text for; anything else shows the backend message. */
export const KNOWN_JOB_ERROR_CODES = [
  "inherit_invalid",
  "inherit_restricted",
  "transfer_restricted",
  "confirm_timeout",
  "cancelled",
  "game_degraded",
  "server_busy",
  "game_maintenance",
  "game_unavailable",
  "game_error",
  "execute_uncertain",
  "login_failed",
  "fetch_failed",
  "mysekai_unavailable",
  "upload_failed",
  "upload_forbidden",
  "job_interrupted",
  "internal_error",
] as const

export const KNOWN_JOB_WARNING_CODES = ["issue_code_failed", "vault_db_unavailable", "vault_store_failed"] as const

/** Request and unlock error codes of the job and vault endpoints the UI translates. */
export const KNOWN_API_ERROR_CODES = [
  "invalid_request",
  "invalid_server",
  "invalid_upload_type",
  "inherit_id_invalid",
  "inherit_password_invalid",
  "new_password_mode_invalid",
  "reuse_password_invalid",
  "mysekai_requires_qq",
  "job_already_running",
  "rate_limited",
  "server_busy",
  "game_degraded",
  "vault_unavailable",
  "identity_unavailable",
  "store_unavailable",
  "job_not_found",
  "job_not_awaiting_confirm",
  "cannot_cancel",
  "unauthenticated",
  "ws_ticket_invalid",
  "internal_error",
  "password_required",
  "vault_pin_required",
  "vault_pin_invalid_format",
  "password_invalid",
  "vault_pin_invalid",
  "previous_password_invalid",
  "vault_password_changed",
  "vault_not_initialized",
  "unlock_rate_limited",
  "entry_not_found",
  "entry_stale",
  "code_not_available",
  "no_previous_password",
  "reset_confirmation_required",
  "reissue_failed",
  "reissue_login_failed",
  "reissue_rejected",
  "client_update_required",
] as const

function includesCode(list: readonly string[], code: string): boolean {
  return list.includes(code)
}

export function isKnownJobErrorCode(code: string): boolean {
  return includesCode(KNOWN_JOB_ERROR_CODES, code)
}

export function isKnownJobWarningCode(code: string): boolean {
  return includesCode(KNOWN_JOB_WARNING_CODES, code)
}

export function isKnownApiErrorCode(code: string): boolean {
  return includesCode(KNOWN_API_ERROR_CODES, code)
}
