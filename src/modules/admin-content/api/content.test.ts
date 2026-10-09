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

async function mockRequest(updatedData: unknown) {
  installStorageStub("localStorage")
  installStorageStub("sessionStorage")
  const actual = await import("@/core/http/call-api")
  mock.module("@/core/http/call-api", () => ({
    ...actual,
    request: mock(async () => ({ status: 200, message: "ok", updatedData })),
  }))
}

describe("admin content api normalizers", () => {
  it("normalizes friend groups and drops unnamed or malformed entries", async () => {
    await mockRequest({
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
    await mockRequest({
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
