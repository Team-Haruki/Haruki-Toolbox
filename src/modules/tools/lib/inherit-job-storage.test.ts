import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import {
  ACTIVE_INHERIT_JOB_KEY,
  ACTIVE_INHERIT_JOB_TTL_MS,
  clearActiveInheritJob,
  clearLegacyInheritStorage,
  LEGACY_INHERIT_STORAGE_KEY,
  loadActiveInheritJob,
  saveActiveInheritJob,
} from "@/modules/tools/lib/inherit-job-storage"

class MemoryStorage {
  readonly map = new Map<string, string>()
  getItem(key: string) {
    return this.map.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.map.set(key, value)
  }
  removeItem(key: string) {
    this.map.delete(key)
  }
}

const globalRef = globalThis as { window?: unknown }
let storage: MemoryStorage
let previousWindow: unknown

beforeEach(() => {
  previousWindow = globalRef.window
  storage = new MemoryStorage()
  globalRef.window = { localStorage: storage }
})

afterEach(() => {
  globalRef.window = previousWindow
})

describe("inherit job storage", () => {
  it("removes the plaintext code the old remember option left behind", () => {
    storage.setItem(LEGACY_INHERIT_STORAGE_KEY, JSON.stringify({ inherit_id: "ABCDEFGH12345678", inherit_password: "pw", server: "en", type: "suite", timestamp: Date.now() }))
    clearLegacyInheritStorage()
    expect(storage.getItem(LEGACY_INHERIT_STORAGE_KEY)).toBeNull()
  })

  it("keeps only the job id, owner, time and acknowledgement", () => {
    saveActiveInheritJob({ jobId: "job-1", userId: "user-1", createdAt: 1_000, codeAcknowledged: false })
    const raw = storage.getItem(ACTIVE_INHERIT_JOB_KEY) ?? ""
    expect(JSON.parse(raw)).toEqual({ jobId: "job-1", userId: "user-1", createdAt: 1_000, codeAcknowledged: false })
    expect(raw).not.toContain("password")
    expect(loadActiveInheritJob("user-1", 2_000)).toEqual({ jobId: "job-1", userId: "user-1", createdAt: 1_000, codeAcknowledged: false })
  })

  it("does not resume another user's job", () => {
    saveActiveInheritJob({ jobId: "job-1", userId: "user-1", createdAt: 1_000, codeAcknowledged: true })
    expect(loadActiveInheritJob("user-2", 2_000)).toBeNull()
    // …but leaves it for its owner.
    expect(loadActiveInheritJob("user-1", 2_000)?.codeAcknowledged).toBe(true)
  })

  it("drops a job older than the server keeps it, and garbage", () => {
    saveActiveInheritJob({ jobId: "job-1", userId: "user-1", createdAt: 0, codeAcknowledged: false })
    expect(loadActiveInheritJob("user-1", ACTIVE_INHERIT_JOB_TTL_MS + 1)).toBeNull()
    expect(storage.getItem(ACTIVE_INHERIT_JOB_KEY)).toBeNull()

    storage.setItem(ACTIVE_INHERIT_JOB_KEY, "{not json")
    expect(loadActiveInheritJob("user-1")).toBeNull()
    expect(storage.getItem(ACTIVE_INHERIT_JOB_KEY)).toBeNull()
  })

  it("clears the job", () => {
    saveActiveInheritJob({ jobId: "job-1", userId: "user-1", createdAt: Date.now(), codeAcknowledged: false })
    clearActiveInheritJob()
    expect(loadActiveInheritJob("user-1")).toBeNull()
  })

  it("works without storage", () => {
    globalRef.window = undefined
    expect(() => clearLegacyInheritStorage()).not.toThrow()
    expect(loadActiveInheritJob("user-1")).toBeNull()
  })
})
