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

async function importAlerts() {
  installStorageStub("localStorage")
  installStorageStub("sessionStorage")
  return await import("./alerts")
}

// The example list from the backend contract: one handled alert with every
// member set, one open alert with every nullable member null.
const RESOLVED_ALERT = {
  id: 42,
  kind: "auth_failed",
  botId: "30042042",
  ownerQq: "1234567890",
  sourceIp: "203.0.113.7",
  buildId: "build-7f3a",
  clientVersion: "3.2.1",
  reason: "invalid credential",
  enforced: true,
  count: 5,
  threshold: 5,
  windowSeconds: 600,
  node: "node-a",
  alertTime: "2026-09-02T09:00:00Z",
  receivedAt: "2026-09-02T09:00:00.412Z",
  status: "resolved",
  note: "credential reset",
  handledBy: { userId: "1001", name: "Admin" },
  handledAt: "2026-09-02T09:30:00Z",
}

const OPEN_ALERT = {
  id: 41,
  kind: "rate_limited",
  botId: null,
  ownerQq: null,
  sourceIp: "198.51.100.9",
  buildId: "",
  clientVersion: "",
  reason: "",
  enforced: true,
  count: 5,
  threshold: 5,
  windowSeconds: 600,
  node: "node-b",
  alertTime: "2026-09-02T08:55:00Z",
  receivedAt: "2026-09-02T08:55:00.120Z",
  status: "open",
  note: "",
  handledBy: null,
  handledAt: null,
}

describe("bot security alert normalizers", () => {
  it("maps the documented list response", async () => {
    const { normalizeBotSecurityAlertList } = await importAlerts()

    expect(normalizeBotSecurityAlertList({
      items: [RESOLVED_ALERT, OPEN_ALERT],
      total: 2,
      page: 1,
      pageSize: 20,
    })).toEqual({
      items: [RESOLVED_ALERT, OPEN_ALERT],
      total: 2,
      page: 1,
      pageSize: 20,
    })
  })

  it("keeps null members null and treats blank ones as absent", async () => {
    const { normalizeBotSecurityAlert } = await importAlerts()

    const alert = normalizeBotSecurityAlert({ ...OPEN_ALERT, botId: "  ", ownerQq: undefined, handledAt: "" })
    expect(alert?.botId).toBeNull()
    expect(alert?.ownerQq).toBeNull()
    expect(alert?.handledAt).toBeNull()
    expect(alert?.handledBy).toBeNull()
  })

  it("keeps a handler whose user was deleted", async () => {
    const { normalizeBotSecurityAlert } = await importAlerts()

    expect(normalizeBotSecurityAlert({ ...RESOLVED_ALERT, handledBy: { userId: "1001", name: "" } })?.handledBy)
      .toEqual({ userId: "1001", name: "" })
    expect(normalizeBotSecurityAlert({ ...RESOLVED_ALERT, handledBy: { userId: "", name: "ghost" } })?.handledBy)
      .toBeNull()
  })

  it("keeps unknown kinds and client-controlled text verbatim", async () => {
    const { normalizeBotSecurityAlert } = await importAlerts()

    const markup = "<img src=x onerror=alert(1)>"
    const alert = normalizeBotSecurityAlert({
      ...OPEN_ALERT,
      kind: "brand_new_kind",
      buildId: markup,
      reason: "x".repeat(1024),
      enforced: false,
    })
    expect(alert?.kind).toBe("brand_new_kind")
    expect(alert?.buildId).toBe(markup)
    expect(alert?.reason).toHaveLength(1024)
    expect(alert?.enforced).toBe(false)
  })

  it("drops entries without a usable id and tolerates a missing items array", async () => {
    const { normalizeBotSecurityAlertList } = await importAlerts()

    const list = normalizeBotSecurityAlertList({ items: [OPEN_ALERT, { ...OPEN_ALERT, id: 0 }, null, "bad"] })
    expect(list.items.map((item) => item.id)).toEqual([41])
    expect(list.total).toBe(1)

    expect(normalizeBotSecurityAlertList(null)).toEqual({ items: [], total: 0, page: 0, pageSize: 0 })
  })

  it("maps the summary and skips kind entries without a kind", async () => {
    const { normalizeBotSecuritySummary } = await importAlerts()

    expect(normalizeBotSecuritySummary({
      open: 4,
      byKind: [{ kind: "auth_failed", count: 2 }, { kind: "", count: 9 }, { count: 1 }, { kind: "rate_limited", count: 2 }],
      last24h: 3,
      last7d: 4,
    })).toEqual({
      open: 4,
      byKind: [{ kind: "auth_failed", count: 2 }, { kind: "rate_limited", count: 2 }],
      last24h: 3,
      last7d: 4,
    })

    expect(normalizeBotSecuritySummary({})).toEqual({ open: 0, byKind: [], last24h: 0, last7d: 0 })
  })
})

describe("bot security alert requests", () => {
  it("PATCHes the alert and returns the updated item", async () => {
    installStorageStub("localStorage")
    installStorageStub("sessionStorage")

    const actual = await import("@/core/http/call-api")
    const requestMock = mock(async () => ({
      status: 200,
      message: "bot security alert updated",
      updatedData: { ...OPEN_ALERT, status: "ignored", note: "known scanner", handledBy: { userId: "1001", name: "Admin" }, handledAt: "2026-09-02T10:00:00Z" },
    }))
    mock.module("@/core/http/call-api", () => ({
      ...actual,
      request: requestMock,
    }))

    const { updateBotSecurityAlert } = await import("./alerts")
    const updated = await updateBotSecurityAlert(41, { status: "ignored", note: "known scanner" })

    expect(requestMock).toHaveBeenCalledTimes(1)
    expect(requestMock.mock.calls[0] as unknown[]).toEqual([
      "/api/admin/bot-security/alerts/41",
      { method: "PATCH", data: { status: "ignored", note: "known scanner" } },
    ])
    expect(updated?.status).toBe("ignored")
    expect(updated?.handledBy).toEqual({ userId: "1001", name: "Admin" })

    mock.module("@/core/http/call-api", () => actual)
  })

  it("passes list filters through as query params", async () => {
    installStorageStub("localStorage")
    installStorageStub("sessionStorage")

    const actual = await import("@/core/http/call-api")
    const requestMock = mock(async () => ({
      status: 200,
      message: "success",
      updatedData: { items: [OPEN_ALERT], total: 1, page: 1, pageSize: 20 },
    }))
    mock.module("@/core/http/call-api", () => ({
      ...actual,
      request: requestMock,
    }))

    const { getBotSecurityAlerts } = await import("./alerts")
    const list = await getBotSecurityAlerts({ page: 1, pageSize: 20, status: "open" })

    expect(requestMock.mock.calls[0] as unknown[]).toEqual([
      "/api/admin/bot-security/alerts",
      { method: "GET", params: { page: 1, pageSize: 20, status: "open" } },
    ])
    expect(list.items).toHaveLength(1)
    expect(list.items[0]?.botId).toBeNull()

    mock.module("@/core/http/call-api", () => actual)
  })
})
