import { afterAll, beforeAll, describe, expect, it } from "bun:test"
import type { InternalAxiosRequestConfig } from "axios"

function installStorageStub(name: "localStorage" | "sessionStorage") {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    },
  })
}

let originalAdapter: InternalAxiosRequestConfig["adapter"]

beforeAll(async () => {
  installStorageStub("localStorage")
  installStorageStub("sessionStorage")
  const { apiClient } = await import("@/core/http/call-api")
  originalAdapter = apiClient.defaults.adapter
})

// Test files share one process: leave the HTTP client as found.
afterAll(async () => {
  const { apiClient } = await import("@/core/http/call-api")
  apiClient.defaults.adapter = originalAdapter
})

async function respondWith(updatedData: unknown) {
  const { apiClient } = await import("@/core/http/call-api")
  apiClient.defaults.adapter = async (config) => ({
    data: { status: 200, message: "ok", updatedData },
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  })
}

describe("admin user api", () => {
  it("flags soft-deleted users in the list", async () => {
    await respondWith({
      page: 1,
      pageSize: 20,
      total: 2,
      totalPages: 1,
      hasMore: false,
      items: [
        { userId: "1", name: "a", role: "user", banned: true, banReason: "[soft_deleted] requested" },
        { userId: "2", name: "b", role: "user", banned: true, banReason: "spam" },
      ],
    })

    const { getUsers } = await import("./user")
    const users = await getUsers()
    expect(users.items.map((user) => user.deleted)).toEqual([true, false])
  })

  it("flags a soft-deleted user in the detail", async () => {
    await respondWith({
      userData: { userId: "1", name: "a", role: "user" },
      banned: true,
      banReason: "[soft_deleted]",
    })

    const { getUserDetail } = await import("./user")
    expect((await getUserDetail("1")).deleted).toBe(true)
  })
})
