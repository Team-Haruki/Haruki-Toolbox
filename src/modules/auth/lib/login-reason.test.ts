import { describe, expect, it } from "bun:test"
import {
  LOGIN_REASON_STORAGE_KEY,
  clearLoginReason,
  isLoginReason,
  readLoginReason,
  rememberLoginReason,
  resolveLoginReason,
} from "./login-reason"

function createStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value) },
    removeItem: (key: string) => { store.delete(key) },
    store,
  }
}

describe("login reason", () => {
  it("round-trips a known reason through storage", () => {
    const storage = createStorage()
    rememberLoginReason("auth-required", storage)
    expect(storage.store.get(LOGIN_REASON_STORAGE_KEY)).toBe("auth-required")
    expect(readLoginReason(storage)).toBe("auth-required")
    clearLoginReason(storage)
    expect(readLoginReason(storage)).toBeNull()
  })

  it("ignores unknown stored values", () => {
    const storage = createStorage({ [LOGIN_REASON_STORAGE_KEY]: "garbage" })
    expect(readLoginReason(storage)).toBeNull()
    expect(isLoginReason("admin-required")).toBe(true)
    expect(isLoginReason(42)).toBe(false)
  })

  it("prefers the query reason and falls back to the stored one", () => {
    const storage = createStorage({ [LOGIN_REASON_STORAGE_KEY]: "admin-required" })
    expect(resolveLoginReason("session-expired", storage)).toBe("session-expired")
    expect(resolveLoginReason(undefined, storage)).toBe("admin-required")
    expect(resolveLoginReason("nope", createStorage())).toBeNull()
  })

  it("survives a storage that throws", () => {
    const broken = {
      getItem: () => { throw new Error("blocked") },
      setItem: () => { throw new Error("blocked") },
      removeItem: () => { throw new Error("blocked") },
    }
    expect(() => rememberLoginReason("auth-required", broken)).not.toThrow()
    expect(readLoginReason(broken)).toBeNull()
    expect(() => clearLoginReason(broken)).not.toThrow()
  })
})
