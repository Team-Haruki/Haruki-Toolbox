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

// expire_time far enough in the future to keep the isActive fallback deterministic.
const FUTURE_EXPIRE_SECONDS = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60
const FUTURE_EXPIRE_ISO = new Date(FUTURE_EXPIRE_SECONDS * 1000).toISOString()
// expire_time clearly in the past.
const PAST_EXPIRE_SECONDS = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60

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
            expire_time: FUTURE_EXPIRE_SECONDS,
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
          planExpiresAt: FUTURE_EXPIRE_ISO,
          createdAt: "",
          updatedAt: "",
        },
      ],
    })
  })

  it("derives isActive from plan expiry when no explicit flag is present", async () => {
    installStorageStub("localStorage")
    installStorageStub("sessionStorage")
    const { normalizeAdminSponsorList } = await import("./sponsors")

    // Expired supporter that still carries a plan name must NOT be marked active.
    const expired = normalizeAdminSponsorList([
      {
        id: "expired-supporter",
        planName: "Legacy tier",
        plan_expires_at: PAST_EXPIRE_SECONDS,
      },
    ])
    expect(expired.items[0]?.isActive).toBe(false)
    expect(expired.items[0]?.planName).toBe("Legacy tier")

    // No flag and no expiry at all also falls back to inactive.
    const noExpiry = normalizeAdminSponsorList([
      {
        id: "no-expiry",
        planName: "Some tier",
      },
    ])
    expect(noExpiry.items[0]?.isActive).toBe(false)
  })

  it("honours an explicit isActive flag over the expiry fallback", async () => {
    installStorageStub("localStorage")
    installStorageStub("sessionStorage")
    const { normalizeAdminSponsorList } = await import("./sponsors")

    const result = normalizeAdminSponsorList([
      {
        id: "explicit-active",
        is_active: true,
        plan_expires_at: PAST_EXPIRE_SECONDS,
      },
    ])
    expect(result.items[0]?.isActive).toBe(true)
  })

  it("accepts bare arrays and supporters/sponsors keys", async () => {
    installStorageStub("localStorage")
    installStorageStub("sessionStorage")
    const { normalizeAdminSponsorList } = await import("./sponsors")

    const bare = normalizeAdminSponsorList([{ id: "bare-1" }, { id: "bare-2" }])
    expect(bare.items.map((item) => item.id)).toEqual(["bare-1", "bare-2"])
    expect(bare.total).toBe(2)

    const supporters = normalizeAdminSponsorList({ supporters: [{ id: "sup-1" }] })
    expect(supporters.items.map((item) => item.id)).toEqual(["sup-1"])

    const sponsors = normalizeAdminSponsorList({ sponsors: [{ id: "spo-1" }] })
    expect(sponsors.items.map((item) => item.id)).toEqual(["spo-1"])
  })

  it("falls back total to the number of normalized items", async () => {
    installStorageStub("localStorage")
    installStorageStub("sessionStorage")
    const { normalizeAdminSponsorList } = await import("./sponsors")

    const result = normalizeAdminSponsorList({
      items: [{ id: "a" }, { id: "b" }, { id: "" }],
    })
    // Third item is dropped (empty id), so total falls back to 2.
    expect(result.total).toBe(2)
    expect(result.items).toHaveLength(2)
  })

  it("normalizes epoch-millis and ISO date inputs", async () => {
    installStorageStub("localStorage")
    installStorageStub("sessionStorage")
    const { normalizeAdminSponsorList } = await import("./sponsors")

    const millis = normalizeAdminSponsorList([
      {
        id: "millis",
        last_pay_time: 1781956800000,
      },
    ])
    expect(millis.items[0]?.paidAt).toBe("2026-06-20T12:00:00.000Z")

    const iso = normalizeAdminSponsorList([
      {
        id: "iso",
        last_pay_time: "2026-06-20T12:00:00.000Z",
      },
    ])
    expect(iso.items[0]?.paidAt).toBe("2026-06-20T12:00:00.000Z")
  })
})

describe("updateAdminSponsorProfile", () => {
  it("unwraps a nested sponsor sub-record from the response", async () => {
    installStorageStub("localStorage")
    installStorageStub("sessionStorage")

    const actual = await import("@/core/http/call-api")
    const requestMock = mock(async () => ({
      updatedData: {
        sponsor: {
          id: "wrapped-1",
          name: "Wrapped",
          plan_expires_at: FUTURE_EXPIRE_SECONDS,
        },
      },
    }))
    mock.module("@/core/http/call-api", () => ({
      ...actual,
      request: requestMock,
    }))

    const { updateAdminSponsorProfile } = await import("./sponsors")
    const result = await updateAdminSponsorProfile("wrapped-1", { name: "Wrapped" })

    expect(requestMock).toHaveBeenCalledTimes(1)
    expect(result?.id).toBe("wrapped-1")
    expect(result?.name).toBe("Wrapped")
    expect(result?.isActive).toBe(true)

    mock.module("@/core/http/call-api", () => actual)
  })

  it("normalizes a flat sponsor response when no sponsor sub-record exists", async () => {
    installStorageStub("localStorage")
    installStorageStub("sessionStorage")

    const actual = await import("@/core/http/call-api")
    const requestMock = mock(async () => ({
      updatedData: {
        id: "flat-1",
        name: "Flat",
      },
    }))
    mock.module("@/core/http/call-api", () => ({
      ...actual,
      request: requestMock,
    }))

    const { updateAdminSponsorProfile } = await import("./sponsors")
    const result = await updateAdminSponsorProfile("flat-1", { name: "Flat" })

    expect(result?.id).toBe("flat-1")
    expect(result?.name).toBe("Flat")

    mock.module("@/core/http/call-api", () => actual)
  })
})
