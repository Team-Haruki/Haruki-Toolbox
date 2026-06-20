import { describe, expect, it } from "bun:test"

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

describe("admin sponsor api normalizers", () => {
  it("normalizes backend and afdian-shaped sponsor profiles", async () => {
    installStorageStub("localStorage")
    installStorageStub("sessionStorage")
    const { normalizeAdminSponsorList } = await import("./sponsors")

    expect(normalizeAdminSponsorList({
      generated_at: "2026-06-20T08:00:00Z",
      total_count: "2",
      items: [
        {
          user: {
            user_id: "afdian-user",
            name: "Miku",
            avatar: "https://example.com/miku.png",
          },
          current_plan: {
            name: "Spark tier",
            expire_time: 1782043200,
          },
          last_pay_time: 1781956800,
          all_sum_amount: "39.00",
          month: "3",
          manual_profile: true,
          remark: "thank you",
        },
        {
          id: "",
          name: "missing id",
        },
      ],
    })).toEqual({
      generatedAt: "2026-06-20T08:00:00Z",
      total: 2,
      items: [
        {
          id: "afdian-user",
          name: "Miku",
          avatar: "https://example.com/miku.png",
          planName: "Spark tier",
          message: "thank you",
          source: "",
          isActive: true,
          afdianSyncDisabled: true,
          totalAmount: 39,
          month: 3,
          paidAt: "2026-06-20T12:00:00.000Z",
          planExpiresAt: "2026-06-21T12:00:00.000Z",
          createdAt: "",
          updatedAt: "",
        },
      ],
    })
  })
})
