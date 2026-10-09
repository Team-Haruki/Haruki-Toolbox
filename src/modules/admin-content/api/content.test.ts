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

describe("admin content api normalizers", () => {
  it("normalizes friend groups and drops unnamed or malformed entries", async () => {
    await respondWith({
      items: [
        {
          id: 3,
          name: "Group",
          sort_order: "2",
          group_list: [
            { id: 7, name: " Member ", avatar: "a.png", bg: "b.png", group_info: "info", description: "about", url: "https://example.com/x", sort_order: 1 },
            { id: 8, name: "Unsafe", url: "javascript:alert(1)" },
            { id: 9, name: "  " },
            "not a record",
          ],
        },
        { id: 4, name: "" },
        null,
      ],
    })
    const { getFriendGroups } = await import("./friend-group")

    expect(await getFriendGroups()).toEqual([
      {
        id: 3,
        group: "Group",
        sortOrder: 2,
        groupList: [
          { id: 7, name: "Member", avatar: "a.png", bg: "b.png", groupInfo: "info", detail: "about", url: "https://example.com/x", sortOrder: 1 },
          { id: 8, name: "Unsafe", avatar: "", bg: "", groupInfo: undefined, detail: undefined, url: undefined, sortOrder: 0 },
        ],
      },
    ])
  })

  it("normalizes friend links", async () => {
    await respondWith({
      items: [
        { id: 5, name: "Link", detail: "desc", avatar: "a.png", url: "https://example.com", tags: ["t"], sortOrder: 3 },
        { id: 6, name: "" },
      ],
    })
    const { getFriendLinks } = await import("./friend-link")

    expect(await getFriendLinks()).toEqual([
      { id: "5", name: "Link", description: "desc", avatar: "a.png", url: "https://example.com/", tags: ["t"], sortOrder: 3 },
    ])
  })
})
