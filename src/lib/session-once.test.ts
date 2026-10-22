import { describe, expect, it } from "bun:test"
import { claimSessionOnce, clearSessionMark, readSessionMark, writeSessionMark } from "./session-once"

function createStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value) },
    removeItem: (key: string) => { store.delete(key) },
    store,
  }
}

describe("claimSessionOnce", () => {
  it("grants the first claim and refuses repeats within the session", () => {
    const storage = createStorage()
    expect(claimSessionOnce("prefetch:a", { storage, now: 1_000 })).toBe(true)
    expect(claimSessionOnce("prefetch:a", { storage, now: 2_000 })).toBe(false)
    expect(claimSessionOnce("prefetch:b", { storage, now: 2_000 })).toBe(true)
  })

  it("re-grants after the ttl elapses and refreshes the mark", () => {
    const storage = createStorage()
    expect(claimSessionOnce("k", { storage, now: 0, ttlMs: 100 })).toBe(true)
    expect(claimSessionOnce("k", { storage, now: 50, ttlMs: 100 })).toBe(false)
    expect(claimSessionOnce("k", { storage, now: 100, ttlMs: 100 })).toBe(true)
    expect(readSessionMark("k", { storage })).toBe(100)
  })

  it("treats a corrupt or missing mark as absent", () => {
    const storage = createStorage()
    storage.store.set("haruki-toolbox-once:k", "nope")
    expect(readSessionMark("k", { storage })).toBeNull()
    expect(claimSessionOnce("k", { storage, now: 5 })).toBe(true)
    clearSessionMark("k", { storage })
    expect(readSessionMark("k", { storage })).toBeNull()
  })

  it("always grants when storage is unavailable or throws", () => {
    expect(claimSessionOnce("k", { storage: null })).toBe(true)
    expect(claimSessionOnce("k", { storage: null })).toBe(true)
    const broken = {
      getItem: () => { throw new Error("blocked") },
      setItem: () => { throw new Error("blocked") },
      removeItem: () => { throw new Error("blocked") },
    }
    expect(claimSessionOnce("k", { storage: broken })).toBe(true)
    expect(() => writeSessionMark("k", { storage: broken })).not.toThrow()
  })
})
