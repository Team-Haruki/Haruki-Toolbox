import { asRecord } from "@/lib/record-utils"

/**
 * Remembers which inherit job this browser is following, so reopening the
 * page resumes it. Only the job id (and whether the owner acknowledged the
 * new code) is kept: never the transfer code, its password, or any unlock
 * secret. The job record itself lives for an hour on the server.
 */

/** Key of the retired "remember my transfer code" option, which kept the code in plaintext. */
export const LEGACY_INHERIT_STORAGE_KEY = "haruki_inherit"
export const ACTIVE_INHERIT_JOB_KEY = "haruki_inherit_job"
export const ACTIVE_INHERIT_JOB_TTL_MS = 60 * 60 * 1000

export interface StoredInheritJob {
  jobId: string
  /** The Toolbox user the job belongs to; another user on this browser does not resume it. */
  userId: string
  createdAt: number
  codeAcknowledged: boolean
}

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null
  } catch {
    return null
  }
}

/** Removes the plaintext transfer code the old "remember" option may have left behind. */
export function clearLegacyInheritStorage(): void {
  try {
    storage()?.removeItem(LEGACY_INHERIT_STORAGE_KEY)
  } catch {
    // storage blocked: nothing to clear
  }
}

export function clearActiveInheritJob(): void {
  try {
    storage()?.removeItem(ACTIVE_INHERIT_JOB_KEY)
  } catch {
    // storage blocked
  }
}

export function loadActiveInheritJob(userId: string, now = Date.now()): StoredInheritJob | null {
  let raw: string | null
  try {
    raw = storage()?.getItem(ACTIVE_INHERIT_JOB_KEY) ?? null
  } catch {
    return null
  }
  if (!raw) return null
  let record: Record<string, unknown> | null
  try {
    record = asRecord(JSON.parse(raw))
  } catch {
    record = null
  }
  const jobId = typeof record?.jobId === "string" ? record.jobId : ""
  const owner = typeof record?.userId === "string" ? record.userId : ""
  const createdAt = typeof record?.createdAt === "number" ? record.createdAt : Number.NaN
  if (!record || !jobId || !owner || Number.isNaN(createdAt) || now - createdAt > ACTIVE_INHERIT_JOB_TTL_MS) {
    clearActiveInheritJob()
    return null
  }
  if (owner !== userId) return null
  return { jobId, userId: owner, createdAt, codeAcknowledged: record.codeAcknowledged === true }
}

export function saveActiveInheritJob(job: StoredInheritJob): void {
  try {
    storage()?.setItem(ACTIVE_INHERIT_JOB_KEY, JSON.stringify({
      jobId: job.jobId,
      userId: job.userId,
      createdAt: job.createdAt,
      codeAcknowledged: job.codeAcknowledged,
    }))
  } catch {
    // Storage blocked: the job still runs, it just will not resume after a reload.
  }
}
