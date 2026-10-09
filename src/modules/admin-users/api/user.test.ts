import { describe, expect, it, mock } from "bun:test"

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

async function importUserApi(updatedData: unknown) {
  installStorageStub("localStorage")
  installStorageStub("sessionStorage")
  const actual = await import("@/core/http/call-api")
  mock.module("@/core/http/call-api", () => ({
    ...actual,
    request: mock(async () => ({ status: 200, message: "ok", updatedData })),
  }))
  return await import("./user")
}

describe("admin user api", () => {
  it("flags soft-deleted users in the list", async () => {
    const { getUsers } = await importUserApi({
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

    const users = await getUsers()
    expect(users.items.map((user) => user.deleted)).toEqual([true, false])
  })

  it("flags a soft-deleted user in the detail", async () => {
    const { getUserDetail } = await importUserApi({
      userData: { userId: "1", name: "a", role: "user" },
      banned: true,
      banReason: "[soft_deleted]",
    })

    expect((await getUserDetail("1")).deleted).toBe(true)
  })
})
