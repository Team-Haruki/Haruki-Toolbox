import { isAxiosError } from "axios"
import { request } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import { asRecord } from "@/lib/record-utils"
import type { APIResponse, InheritServer, UploadDataType } from "@/types"
import {
  normalizeInheritJob,
  readRunningJobId,
  type InheritJob,
  type InheritNewPasswordMode,
} from "@/modules/tools/lib/inherit-job"
import {
  normalizeRevealedCode,
  normalizeVaultEntries,
  normalizeVaultKeyStatus,
  toUnlockBody,
  type InheritRevealedCode,
  type InheritUnlockInput,
  type InheritVaultEntry,
  type InheritVaultKeyStatus,
} from "@/modules/tools/lib/inherit-vault"

/**
 * A refused inherit job or vault request. `code` is the backend's stable
 * machine code (`updatedData.code`); branch on it, never on `message`.
 */
export class InheritApiError extends Error {
  readonly code: string
  readonly status: number
  /** Seconds from a `Retry-After` header, when the backend sent one. */
  readonly retryAfter: number | null
  /** For `job_already_running`: the caller's own running job, "" when the backend did not name it. */
  readonly runningJobId: string

  constructor(code: string, message: string, status = 0, retryAfter: number | null = null, runningJobId = "") {
    super(message || code)
    this.name = "InheritApiError"
    this.code = code
    this.status = status
    this.retryAfter = retryAfter
    this.runningJobId = runningJobId
  }
}

/** Turns any failure of these endpoints into an InheritApiError (code "" when the server never answered). */
export function toInheritApiError(error: unknown): InheritApiError {
  if (error instanceof InheritApiError) return error
  if (isAxiosError(error)) {
    const response = error.response
    if (!response) return new InheritApiError("", error.message, 0)
    const body = asRecord(response.data)
    const data = asRecord(body?.updatedData)
    const code = typeof data?.code === "string" ? data.code : ""
    const message = typeof body?.message === "string" ? body.message : ""
    const header = response.headers?.["retry-after"]
    const retryAfter = header != null && Number.isFinite(Number(header)) ? Number(header) : null
    return new InheritApiError(code, message, response.status, retryAfter, readRunningJobId(code, data))
  }
  return new InheritApiError("", error instanceof Error ? error.message : String(error), 0)
}

async function call<T>(url: string, options: Parameters<typeof request>[1] = {}): Promise<T | undefined> {
  try {
    const response = await request<APIResponse<T>>(url, { skipErrorToast: true, ...options })
    return response.updatedData
  } catch (error) {
    throw toInheritApiError(error)
  }
}

function requireJob(value: unknown): InheritJob {
  const job = normalizeInheritJob(value)
  if (!job) throw new InheritApiError("invalid_response", "invalid job snapshot")
  return job
}

const JOBS = "/api/inherit/jobs"
const VAULT = "/api/inherit/vault"

export interface CreateInheritJobInput {
  server: InheritServer
  uploadType: UploadDataType
  inheritId: string
  inheritPassword: string
  newPasswordMode: InheritNewPasswordMode
}

export async function createInheritJob(input: CreateInheritJobInput): Promise<InheritJob> {
  const data = await call<{ job_id?: string; job?: unknown }>(JOBS, {
    method: "POST",
    data: {
      server: input.server,
      upload_type: input.uploadType,
      inherit_id: input.inheritId,
      inherit_password: input.inheritPassword,
      new_password_mode: input.newPasswordMode,
    },
  })
  return requireJob(data?.job)
}

export async function fetchInheritJob(jobId: string): Promise<InheritJob> {
  return requireJob(await call<unknown>(`${JOBS}/${encodePathSegment(jobId)}`))
}

export async function confirmInheritJob(jobId: string, unlock: InheritUnlockInput): Promise<InheritJob> {
  return requireJob(await call<unknown>(`${JOBS}/${encodePathSegment(jobId)}/confirm`, {
    method: "POST",
    data: toUnlockBody(unlock),
  }))
}

export async function cancelInheritJob(jobId: string): Promise<InheritJob> {
  return requireJob(await call<unknown>(`${JOBS}/${encodePathSegment(jobId)}/cancel`, { method: "POST" }))
}

/** A one-time, 30-second ticket for the job's WebSocket. */
export async function fetchInheritJobWsTicket(jobId: string): Promise<string> {
  const data = await call<{ ticket?: unknown }>(`${JOBS}/${encodePathSegment(jobId)}/ws-ticket`, { method: "POST" })
  const ticket = typeof data?.ticket === "string" ? data.ticket : ""
  if (!ticket) throw new InheritApiError("invalid_response", "invalid ws ticket")
  return ticket
}

export async function fetchInheritVaultKey(): Promise<InheritVaultKeyStatus> {
  return normalizeVaultKeyStatus(await call<unknown>(`${VAULT}/key`))
}

export async function listInheritVaultEntries(): Promise<InheritVaultEntry[]> {
  return normalizeVaultEntries(await call<unknown>(`${VAULT}/entries`))
}

export async function revealInheritVaultCode(entryId: string, unlock: InheritUnlockInput): Promise<InheritRevealedCode> {
  const code = normalizeRevealedCode(await call<unknown>(`${VAULT}/entries/${encodePathSegment(entryId)}/reveal`, {
    method: "POST",
    data: toUnlockBody(unlock),
  }))
  if (!code) throw new InheritApiError("invalid_response", "invalid reveal response")
  return code
}

export async function reissueInheritVaultCode(
  entryId: string,
  unlock: InheritUnlockInput,
  newPasswordMode: InheritNewPasswordMode,
): Promise<InheritRevealedCode> {
  const code = normalizeRevealedCode(await call<unknown>(`${VAULT}/entries/${encodePathSegment(entryId)}/reissue`, {
    method: "POST",
    data: { ...toUnlockBody(unlock), new_password_mode: newPasswordMode },
    // Logging in and issuing a code takes a few seconds; the backend gives up after 60.
    timeout: 90_000,
  }))
  if (!code) throw new InheritApiError("invalid_response", "invalid reissue response")
  return code
}

export async function destroyInheritVaultEntry(entryId: string): Promise<void> {
  await call<unknown>(`${VAULT}/entries/${encodePathSegment(entryId)}`, { method: "DELETE" })
}

export async function resetInheritVault(password?: string): Promise<number> {
  const data = await call<{ destroyed_entries?: unknown }>(`${VAULT}/key/reset`, {
    method: "POST",
    data: password ? { password, confirm: true } : { confirm: true },
  })
  return typeof data?.destroyed_entries === "number" ? data.destroyed_entries : 0
}
