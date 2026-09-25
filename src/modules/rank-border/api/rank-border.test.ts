import { describe, expect, it } from "bun:test"
import {
  fetchRankBorderOverview,
  fetchRankBorderPrivateWebUserDetailV2,
  fetchRankBorderPublicUserProfile,
  fetchRankBorderUserProfiles,
  fetchRankBorderWebRankDetailV2,
  fetchRankBorderWebTraceByUser,
  isRankBorderTrackerUnauthorizedError,
  fetchRankBorderWebUserDetailV2,
  normalizeTrackerVersion,
  resetRankBorderSplitPartsSupport,
  subscribeRankBorderRealtime,
  type RankBorderRealtimeEvent,
  resolveRankBorderTrackerWebSocketTicketUrl,
  resolveRankBorderTrackerWebSocketUrl,
} from "./rank-border"

describe("rank border tracker api", () => {
  it("resolves relative tracker endpoints to same-origin websocket urls", () => {
    expect(resolveRankBorderTrackerWebSocketUrl("/event-tracker", "https://toolbox.example/rank-border")).toBe(
      "wss://toolbox.example/event-tracker/ws",
    )
    expect(resolveRankBorderTrackerWebSocketUrl("event-tracker", "http://127.0.0.1:5173/rank-border")).toBe(
      "ws://127.0.0.1:5173/event-tracker/ws",
    )
  })

  it("resolves websocket ticket endpoints beside websocket endpoints", () => {
    expect(resolveRankBorderTrackerWebSocketTicketUrl("/event-tracker", "https://toolbox.example/rank-border")).toBe(
      "https://toolbox.example/event-tracker/ws-ticket",
    )
    expect(resolveRankBorderTrackerWebSocketTicketUrl("wss://tracker.example/base/ws", "https://toolbox.example")).toBe(
      "https://tracker.example/base/ws-ticket",
    )
  })

  it("resolves absolute http and websocket tracker endpoints", () => {
    expect(resolveRankBorderTrackerWebSocketUrl("https://tracker.example/base", "https://toolbox.example")).toBe(
      "wss://tracker.example/base/ws",
    )
    expect(resolveRankBorderTrackerWebSocketUrl("ws://tracker.example/base/ws", "https://toolbox.example")).toBe(
      "ws://tracker.example/base/ws",
    )
    expect(resolveRankBorderTrackerWebSocketUrl("https://tracker.example/base///", "https://toolbox.example")).toBe(
      "wss://tracker.example/base/ws",
    )
  })

  it("passes owner identity on private bound account lookups over websocket", async () => {
    const originalFetch = globalThis.fetch
    const requests: string[] = []
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      requests.push(url)
      if (url.endsWith("/ws-ticket")) {
        return new Response(JSON.stringify({ ticket: "ticket-1" }), { status: 200 })
      }
      throw new Error("unexpected REST fallback")
    }) as typeof fetch

    class MockWebSocket extends EventTarget {
      static CONNECTING = 0
      static OPEN = 1
      static CLOSED = 3
      readyState = MockWebSocket.CONNECTING

      constructor() {
        super()
        setTimeout(() => {
          this.readyState = MockWebSocket.OPEN
          this.dispatchEvent(new Event("open"))
        }, 0)
      }

      send(payload: string) {
        const message = JSON.parse(payload) as { id: string; path: string }
        requests.push(message.path)
        this.dispatchEvent(new MessageEvent("message", {
          data: JSON.stringify({
            id: message.id,
            ok: true,
            status: 200,
            data: {
              current: {
                rankData: {
                  timestamp: 1,
                  userId: "123456789",
                  score: 100,
                  rank: 10,
                },
              },
            },
          }),
        }))
      }

      close() {
        this.readyState = MockWebSocket.CLOSED
      }
    }

    const originalWebSocket = globalThis.WebSocket
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket
    try {
      await fetchRankBorderPrivateWebUserDetailV2({
        endpoint: "https://tracker.example/base",
        region: "jp",
        eventId: 1,
        mode: "normal",
        userId: "123456789",
        ownerId: "kratos-1",
        useWebSocket: true,
      })
    } finally {
      globalThis.fetch = originalFetch
      globalThis.WebSocket = originalWebSocket
    }

    expect(requests.some((url) => url.includes("/ws-ticket"))).toBe(true)
    expect(requests.some((url) => url === "/api/v2/web/events/jp/1/leaderboards/total/private/details/user/123456789?includeTrace=false&includeProfile=false&limit=5000&owner=kratos-1")).toBe(true)
  })

  it("includes browser credentials for private REST lookup fallbacks", async () => {
    const originalFetch = globalThis.fetch
    const requests: Array<{ url: string; credentials: RequestCredentials | undefined }> = []
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      requests.push({ url, credentials: init?.credentials })
      if (url.includes("/api/v2/web/events/jp/1/leaderboards/total/private/details/user/123456789")) {
        return new Response(JSON.stringify({
          current: {
            rankData: {
              timestamp: 1,
              userId: "123456789",
              score: 100,
              rank: 10,
            },
          },
        }), { status: 200 })
      }
      return new Response("unexpected", { status: 500 })
    }) as typeof fetch

    try {
      await fetchRankBorderPrivateWebUserDetailV2({
        endpoint: "https://tracker.example/base",
        region: "jp",
        eventId: 1,
        mode: "normal",
        userId: "123456789",
        ownerId: "kratos-1",
        useWebSocket: false,
      })
    } finally {
      globalThis.fetch = originalFetch
    }

    expect(requests).toEqual([
      {
        url: "https://tracker.example/base/api/v2/web/events/jp/1/leaderboards/total/private/details/user/123456789?includeTrace=false&includeProfile=false&limit=5000&owner=kratos-1",
        credentials: "include",
      },
    ])
  })

  it("extracts nested private lookup auth errors", async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({
        error: {
          code: 401,
          status: "Unauthorized",
          message: "Access credentials are invalid",
        },
      }), { status: 401 })
    }) as typeof fetch

    try {
      await fetchRankBorderPrivateWebUserDetailV2({
        endpoint: "https://tracker.example/base",
        region: "jp",
        eventId: 1,
        mode: "normal",
        userId: "123456789",
        ownerId: "kratos-1",
        useWebSocket: false,
      })
      throw new Error("expected private lookup to fail")
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe("Access credentials are invalid")
      expect(isRankBorderTrackerUnauthorizedError(error)).toBe(true)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("uses v2 web overview and detail routes", async () => {
    const originalFetch = globalThis.fetch
    const requests: string[] = []
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      requests.push(url)
      if (url.includes("/api/v2/web/events/cn/170/leaderboards/world-bloom/20/overview")) {
        return new Response(JSON.stringify({
          meta: { server: "cn", eventId: 170, scope: "world-bloom/20", characterId: 20, fetchedAt: 1 },
          topRankings: [],
          topPlayerGrowths: [],
          topRankGrowths: [],
          borderLines: [],
          borderGrowths: [],
          intervalSeconds: 3600,
          windowStart: 1,
          windowEnd: 2,
        }), { status: 200 })
      }
      if (url.includes("/api/v2/web/events/cn/170/leaderboards/world-bloom/20/details/rank/100")) {
        return new Response(JSON.stringify({
          current: {
            rankData: { timestamp: 2, userId: "u100", score: 1100, rank: 100, characterId: 20 },
            userData: { userId: "u100", name: "Miku" },
          },
          rankTrace: [{ timestamp: 1, userId: "u100", score: 1000, rank: 100, characterId: 20 }],
        }), { status: 200 })
      }
      if (url.includes("/api/v2/web/events/cn/170/leaderboards/world-bloom/20/details/user/u100")) {
        return new Response(JSON.stringify({
          current: {
            rankData: { timestamp: 2, userId: "u100", score: 1100, rank: 100, characterId: 20 },
            userData: { userId: "u100", name: "Miku" },
          },
          playerTrace: [{ timestamp: 1, userId: "u100", score: 1000, rank: 100, characterId: 20 }],
        }), { status: 200 })
      }
      return new Response("unexpected", { status: 500 })
    }) as typeof fetch

    try {
      await fetchRankBorderOverview({
        endpoint: "https://tracker.example/base",
        region: "cn",
        eventId: 170,
        mode: "world_bloom",
        worldBloomCharacterId: 20,
        intervalSeconds: 3600,
      })
      const rankDetail = await fetchRankBorderWebRankDetailV2({
        endpoint: "https://tracker.example/base",
        region: "cn",
        eventId: 170,
        mode: "world_bloom",
        worldBloomCharacterId: 20,
        rank: 100,
        includeTrace: true,
      })
      const userDetail = await fetchRankBorderWebUserDetailV2({
        endpoint: "https://tracker.example/base",
        region: "cn",
        eventId: 170,
        mode: "world_bloom",
        worldBloomCharacterId: 20,
        userId: "u100",
        includeTrace: true,
      })
      expect(rankDetail.rankTrace[0]?.score).toBe(1000)
      expect(userDetail.playerTrace[0]?.score).toBe(1000)
    } finally {
      globalThis.fetch = originalFetch
    }

    // The split parts answer 500 here, so this read falls back to the overview.
    expect(requests).toEqual([
      ...["top100", "borders", "growth", "status"].map((part) => `https://tracker.example/base/api/v2/web/events/cn/170/leaderboards/world-bloom/20/${part}?interval=3600`),
      "https://tracker.example/base/api/v2/web/events/cn/170/leaderboards/world-bloom/20/overview?interval=3600",
      "https://tracker.example/base/api/v2/web/events/cn/170/leaderboards/world-bloom/20/details/rank/100?includeTrace=true&includePlayerTrace=false&limit=5000",
      "https://tracker.example/base/api/v2/web/events/cn/170/leaderboards/world-bloom/20/details/user/u100?includeTrace=true&includeProfile=false&limit=5000",
    ])
  })

  it("paginates rank player traces until every page is loaded", async () => {
    const originalFetch = globalThis.fetch
    const requests: string[] = []
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      requests.push(url)
      const cursor = new URL(url).searchParams.get("cursor")
      const playerTrace = cursor == null
        ? [
            { timestamp: 1, userId: "u1", score: 100, rank: 1 },
            { timestamp: 2, userId: "u1", score: 200, rank: 1 },
          ]
        : cursor === "2"
          ? [{ timestamp: 3, userId: "u1", score: 300, rank: 1 }]
          : []
      return new Response(JSON.stringify({ playerTrace }), { status: 200 })
    }) as typeof fetch

    try {
      const detail = await fetchRankBorderWebRankDetailV2({
        endpoint: "https://tracker.example/base",
        region: "cn",
        eventId: 176,
        mode: "normal",
        rank: 1,
        includePlayerTrace: true,
        fetchAllTrace: true,
        limit: 2,
      })
      expect(detail.playerTrace.map((record) => record.timestamp)).toEqual([1, 2, 3])
    } finally {
      globalThis.fetch = originalFetch
    }

    expect(requests).toEqual([
      "https://tracker.example/base/api/v2/web/events/cn/176/leaderboards/total/details/rank/1?includeTrace=false&includePlayerTrace=true&limit=2",
      "https://tracker.example/base/api/v2/web/events/cn/176/leaderboards/total/details/rank/1?includeTrace=false&includePlayerTrace=true&cursor=2&limit=2",
    ])
  })

  it("requests user traces through v2 web user details", async () => {
    const originalFetch = globalThis.fetch
    const requests: string[] = []
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      requests.push(url)
      if (url.includes("/api/v2/web/events/jp/1/leaderboards/total/details/user/public-user")) {
        return new Response(JSON.stringify({
          playerTrace: [
            { timestamp: 1710000000, userId: "public-user", score: 100, rank: 1 },
            { timestamp: 1710000600, userId: "public-user", score: 200, rank: 1 },
          ],
        }), { status: 200 })
      }
      return new Response("unexpected", { status: 500 })
    }) as typeof fetch

    try {
      const records = await fetchRankBorderWebTraceByUser({
        endpoint: "https://tracker.example/base",
        region: "jp",
        eventId: 1,
        mode: "normal",
        userId: "public-user",
        full: true,
        useWebSocket: false,
      })
      expect(records.map((record) => record.timestamp)).toEqual([1710000000, 1710000600])
    } finally {
      globalThis.fetch = originalFetch
    }

    expect(requests).toEqual([
      "https://tracker.example/base/api/v2/web/events/jp/1/leaderboards/total/details/user/public-user?includeTrace=true&includeProfile=false&limit=5000",
    ])
  })

  it("uses v2 web user search routes", async () => {
    const originalFetch = globalThis.fetch
    const requests: string[] = []
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      requests.push(url)
      if (url.includes("/api/v2/web/events/jp/1/leaderboards/total/users/search")) {
        return new Response(JSON.stringify({
          items: [
            { userId: "abc", name: "Alice" },
          ],
        }), { status: 200 })
      }
      return new Response("unexpected", { status: 500 })
    }) as typeof fetch

    try {
      const users = await fetchRankBorderUserProfiles({
        endpoint: "https://tracker.example/base",
        region: "jp",
        eventId: 1,
        mode: "normal",
        query: "Alice",
      })
      const user = await fetchRankBorderPublicUserProfile({
        endpoint: "https://tracker.example/base",
        region: "jp",
        eventId: 1,
        mode: "normal",
        uniqueId: "a".repeat(64),
      })
      expect(users[0]?.name).toBe("Alice")
      expect(user?.name).toBe("Alice")
    } finally {
      globalThis.fetch = originalFetch
    }

    expect(requests).toEqual([
      "https://tracker.example/base/api/v2/web/events/jp/1/leaderboards/total/users/search?name=Alice&limit=5",
      `https://tracker.example/base/api/v2/web/events/jp/1/leaderboards/total/users/search?uniqueId=${"a".repeat(64)}&limit=5`,
    ])
  })

  it("reads versioned live parts from the split resources over cacheable HTTP", async () => {
    resetRankBorderSplitPartsSupport()
    const originalFetch = globalThis.fetch
    const originalWebSocket = globalThis.WebSocket
    const requests: Array<{ url: string; credentials?: RequestCredentials; cache?: RequestCache }> = []
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      requests.push({ url, credentials: init?.credentials, cache: init?.cache })
      if (url.includes("/top100?")) {
        return new Response(JSON.stringify({ meta: { fetchedAt: 1_700_000_005 }, topRankings: [{ rank: 1, userId: "a", score: 10, timestamp: 5 }] }))
      }
      if (url.includes("/borders?")) {
        return new Response(JSON.stringify({ borderLines: [{ rank: 200, score: 3, timestamp: 5 }] }))
      }
      if (url.includes("/growth?")) {
        return new Response(JSON.stringify({ meta: { fetchedAt: 1_700_000_005 }, topPlayerGrowths: [], topRankGrowths: [], borderGrowths: [], intervalSeconds: 3600 }))
      }
      if (url.includes("/status?")) {
        return new Response(JSON.stringify({ meta: { fetchedAt: 1_800_000_000 }, status: { timestamp: 1_700_000_004, status: 0 } }))
      }
      return new Response("unexpected", { status: 500 })
    }) as typeof fetch
    globalThis.WebSocket = class {
      constructor() {
        throw new Error("public reads must not open a socket")
      }
    } as unknown as typeof WebSocket

    let overview
    try {
      overview = await fetchRankBorderOverview({
        endpoint: "https://tracker-split.example/base",
        region: "cn",
        eventId: 180,
        mode: "normal",
        intervalSeconds: 3600,
        useWebSocket: true,
        version: 42,
      })
    } finally {
      globalThis.fetch = originalFetch
      globalThis.WebSocket = originalWebSocket
    }

    const base = "https://tracker-split.example/base/api/v2/web/events/cn/180/leaderboards/total"
    expect(requests).toEqual([
      ...["top100", "borders", "growth"].map((part) => ({
        url: `${base}/${part}?interval=3600&v=42`,
        credentials: "omit",
        cache: "default",
      })),
      // Status is per request: never versioned, always revalidated.
      { url: `${base}/status?interval=3600`, credentials: "omit", cache: "no-cache" },
    ])
    expect(overview.status?.timestamp).toBe(1_700_000_004)
    expect(overview.asOf).toBe(1_700_000_005)
    expect(overview.topRankings.map((entry) => entry.rank)).toEqual([1])
    expect(overview.borderLines.map((line) => line.rank)).toEqual([200])
    expect(overview.intervalSeconds).toBe(3600)
  })

  it("falls back to the overview for the session when the split resources are missing", async () => {
    resetRankBorderSplitPartsSupport()
    const originalFetch = globalThis.fetch
    const requests: string[] = []
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      requests.push(url)
      if (url.includes("/overview?")) {
        return new Response(JSON.stringify({ topRankings: [], borderLines: [] }))
      }
      return new Response("Not Found", { status: 404 })
    }) as typeof fetch

    const scope = {
      endpoint: "https://tracker-old.example",
      region: "jp" as const,
      eventId: 1,
      mode: "world_bloom" as const,
      worldBloomCharacterId: 20,
      intervalSeconds: 900,
      parts: ["top100", "borders"] as const,
    }
    try {
      await fetchRankBorderOverview({ ...scope, version: 7 })
      await fetchRankBorderOverview({ ...scope, version: 8 })
    } finally {
      globalThis.fetch = originalFetch
    }

    const base = "https://tracker-old.example/api/v2/web/events/jp/1/leaderboards/world-bloom/20"
    expect(requests).toEqual([
      `${base}/top100?interval=900&v=7`,
      `${base}/borders?interval=900&v=7`,
      `${base}/overview?interval=900&v=7`,
      `${base}/overview?interval=900&v=8`,
    ])
  })

  it("reads split parts without v when a push carries no version, and replay keeps the overview", async () => {
    resetRankBorderSplitPartsSupport()
    const originalFetch = globalThis.fetch
    const requests: Array<{ url: string; cache?: RequestCache; credentials?: RequestCredentials }> = []
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(input), cache: init?.cache, credentials: init?.credentials })
      return new Response(JSON.stringify({ topRankings: [], borderLines: [] }), { status: 200 })
    }) as typeof fetch

    try {
      const scope = {
        endpoint: "https://tracker-unversioned.example",
        region: "cn" as const,
        eventId: 180,
        mode: "normal" as const,
        intervalSeconds: 3600,
        useWebSocket: true,
      }
      await fetchRankBorderOverview({ ...scope, version: null })
      await fetchRankBorderOverview({ ...scope, version: 42, playbackAt: 1_700_000_000 })
    } finally {
      globalThis.fetch = originalFetch
    }

    const base = "https://tracker-unversioned.example/api/v2/web/events/cn/180/leaderboards/total"
    expect(requests.map((request) => request.url)).toEqual([
      `${base}/top100?interval=3600`,
      `${base}/borders?interval=3600`,
      `${base}/growth?interval=3600`,
      `${base}/status?interval=3600`,
      `${base}/overview?interval=3600&at=1700000000&timestamp=1700000000`,
    ])
    for (const request of requests) {
      expect(request.cache).toBe("no-cache")
      expect(request.credentials).toBe("omit")
      expect(request.url).not.toContain("_t=")
    }
  })

  it("aborts superseded public reads", async () => {
    const originalFetch = globalThis.fetch
    let seenSignal: AbortSignal | undefined
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      seenSignal = init?.signal ?? undefined
      return new Response(JSON.stringify({}), { status: 200 })
    }) as typeof fetch
    const controller = new AbortController()
    try {
      await fetchRankBorderWebUserDetailV2({
        endpoint: "https://tracker.example",
        region: "cn",
        eventId: 1,
        mode: "normal",
        userId: "u1",
        signal: controller.signal,
      })
    } finally {
      globalThis.fetch = originalFetch
    }
    expect(seenSignal).toBe(controller.signal)
  })

  it("normalizes tracker versions", () => {
    expect(normalizeTrackerVersion(0)).toBe(0)
    expect(normalizeTrackerVersion(123)).toBe(123)
    expect(normalizeTrackerVersion("456")).toBe(456)
    expect(normalizeTrackerVersion(-1)).toBeNull()
    expect(normalizeTrackerVersion(1.5)).toBeNull()
    expect(normalizeTrackerVersion("12a")).toBeNull()
    expect(normalizeTrackerVersion(undefined)).toBeNull()
  })

  it("surfaces the version of updated pushes and null from older trackers", async () => {
    const originalFetch = globalThis.fetch
    const originalWebSocket = globalThis.WebSocket
    globalThis.fetch = (async () => new Response(JSON.stringify({ ticket: "ticket-1" }), { status: 200 })) as typeof fetch

    const sockets: MockWebSocket[] = []
    class MockWebSocket extends EventTarget {
      static CONNECTING = 0
      static OPEN = 1
      static CLOSED = 3
      readyState = MockWebSocket.CONNECTING

      constructor() {
        super()
        sockets.push(this)
        setTimeout(() => {
          this.readyState = MockWebSocket.OPEN
          this.dispatchEvent(new Event("open"))
        }, 0)
      }

      send(payload: string) {
        const message = JSON.parse(payload) as { id: string }
        this.dispatchEvent(new MessageEvent("message", {
          data: JSON.stringify({ id: message.id, ok: true, status: 200, data: { total: 1, topic: 1 } }),
        }))
      }

      push(data: unknown) {
        this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(data) }))
      }

      close() {
        this.readyState = MockWebSocket.CLOSED
      }
    }
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket

    const events: RankBorderRealtimeEvent[] = []
    try {
      const subscription = await subscribeRankBorderRealtime({
        endpoint: "https://tracker-version.example/base",
        region: "cn",
        eventId: 180,
      }, (event) => events.push(event))
      const active = sockets[0]
      active?.push({ type: "updated", server: "cn", eventId: 180, timestamp: 1_700_000_000, version: 77 })
      active?.push({ type: "updated", server: "cn", eventId: 180, timestamp: 1_700_000_001 })
      subscription.unsubscribe()
    } finally {
      globalThis.fetch = originalFetch
      globalThis.WebSocket = originalWebSocket
    }

    const updates = events.filter((event) => event.type === "updated")
    expect(updates.map((event) => event.type === "updated" ? event.version : undefined)).toEqual([77, null])
  })

  it("unsubscribes a topic only when its last subscriber on the socket leaves", async () => {
    const originalFetch = globalThis.fetch
    const originalWebSocket = globalThis.WebSocket
    globalThis.fetch = (async () => new Response(JSON.stringify({ ticket: "ticket-1" }), { status: 200 })) as typeof fetch

    const sent: Array<{ type?: string }> = []
    class MockWebSocket extends EventTarget {
      static CONNECTING = 0
      static OPEN = 1
      static CLOSED = 3
      readyState = MockWebSocket.CONNECTING

      constructor() {
        super()
        setTimeout(() => {
          this.readyState = MockWebSocket.OPEN
          this.dispatchEvent(new Event("open"))
        }, 0)
      }

      send(payload: string) {
        const message = JSON.parse(payload) as { id: string; type?: string }
        sent.push(message)
        this.dispatchEvent(new MessageEvent("message", {
          data: JSON.stringify({ id: message.id, ok: true, status: 200, data: { total: 1, topic: 1 } }),
        }))
      }

      close() {
        this.readyState = MockWebSocket.CLOSED
      }
    }
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket

    try {
      const scope = { endpoint: "https://tracker-refcount.example/base", region: "cn" as const, eventId: 180 }
      const older = await subscribeRankBorderRealtime(scope, () => {})
      const newer = await subscribeRankBorderRealtime(scope, () => {})
      older.unsubscribe()
      expect(sent.map((message) => message.type)).toEqual(["subscribe", "subscribe"])
      newer.unsubscribe()
      newer.unsubscribe()
      expect(sent.map((message) => message.type)).toEqual(["subscribe", "subscribe", "unsubscribe"])
    } finally {
      globalThis.fetch = originalFetch
      globalThis.WebSocket = originalWebSocket
    }
  })
})
