import { beforeEach, describe, expect, it } from "bun:test"
import { createPinia, setActivePinia } from "pinia"

const storage = {
  length: 0,
  clear: () => undefined,
  getItem: () => null,
  key: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
}

Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true })
Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true })

const { useUserStore } = await import("./user")

describe("user store", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("updates only the user fields included in a partial payload", () => {
    const store = useUserStore()
    store.setUser({ name: "Haruki", userId: "42", role: "admin" })
    store.setUser({ avatarPath: "/avatar.png" })

    expect(store.name).toBe("Haruki")
    expect(store.userId).toBe("42")
    expect(store.role).toBe("admin")
    expect(store.avatarPath).toBe("/avatar.png")
  })

  it("normalizes session expiration and clears it when the token is removed", () => {
    const store = useUserStore()
    store.setUser({ sessionToken: "token", sessionExpiresAt: 2_000_000_000_000 })
    expect(store.tokenExpiration).toBe(2_000_000_000)

    store.setUser({ sessionToken: "" })
    expect(store.sessionToken).toBe("")
    expect(store.tokenExpiration).toBeNull()
  })

  it("preserves expiration when resetExpiration is disabled", () => {
    const store = useUserStore()
    store.setUser({ sessionToken: "first", sessionExpiresAt: 2_000_000_000 })
    store.setUser({ sessionToken: "second", sessionExpiresAt: 2_100_000_000 }, { resetExpiration: false })

    expect(store.sessionToken).toBe("second")
    expect(store.tokenExpiration).toBe(2_000_000_000)
  })

  it("updates expiration for an existing token without replacing it", () => {
    const store = useUserStore()
    store.setUser({ sessionToken: "token", sessionExpiresAt: 2_000_000_000 })
    store.setUser({ sessionExpiresAt: 2_100_000_000 })

    expect(store.sessionToken).toBe("token")
    expect(store.tokenExpiration).toBe(2_100_000_000)
  })
})
