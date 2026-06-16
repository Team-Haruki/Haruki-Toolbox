import { describe, expect, it } from "bun:test"
import {
  fetchRankBorderLines,
  fetchRankBorderPrivateLatestByUser,
  fetchRankBorderStatus,
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
  })

  it("passes owner identity on private bound account lookups", async () => {
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
              rankData: {
                timestamp: 1,
                userId: "123456789",
                score: 100,
                rank: 10,
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
      await fetchRankBorderPrivateLatestByUser({
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
    expect(requests.some((url) => url === "/event/jp/1/private/latest-ranking/user/123456789?owner=kratos-1")).toBe(true)
  })

  it("includes browser credentials for private REST lookup fallbacks", async () => {
    const originalFetch = globalThis.fetch
    const requests: Array<{ url: string; credentials: RequestCredentials | undefined }> = []
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      requests.push({ url, credentials: init?.credentials })
      if (url.includes("/event/jp/1/private/latest-ranking/user/123456789")) {
        return new Response(JSON.stringify({
          rankData: {
            timestamp: 1,
            userId: "123456789",
            score: 100,
            rank: 10,
          },
        }), { status: 200 })
      }
      return new Response("unexpected", { status: 500 })
    }) as typeof fetch

    try {
      await fetchRankBorderPrivateLatestByUser({
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
        url: "https://tracker.example/base/event/jp/1/private/latest-ranking/user/123456789?owner=kratos-1",
        credentials: "include",
      },
    ])
  })

  it("uses REST directly when websocket transport is disabled", async () => {
    const originalFetch = globalThis.fetch
    const requests: Array<{ url: string; credentials: RequestCredentials | undefined }> = []
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      requests.push({ url, credentials: init?.credentials })
      if (url.endsWith("/event/jp/1/status")) {
        return new Response(JSON.stringify({
          timestamp: 1,
          status: 0,
          statusDesc: "ok",
          timeAgo: 0,
        }), { status: 200 })
      }
      return new Response("unexpected", { status: 500 })
    }) as typeof fetch

    try {
      await fetchRankBorderStatus({
        endpoint: "https://tracker.example/base",
        region: "jp",
        eventId: 1,
        mode: "normal",
        useWebSocket: false,
      })
    } finally {
      globalThis.fetch = originalFetch
    }

    expect(requests).toEqual([
      {
        url: "https://tracker.example/base/event/jp/1/status",
        credentials: "omit",
      },
    ])
    expect(requests.some((request) => request.url.includes("/ws-ticket"))).toBe(false)
  })

  it("adds compatible playback timestamp query parameters to REST requests", async () => {
    const originalFetch = globalThis.fetch
    const requests: string[] = []
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      requests.push(url)
      if (url.includes("/event/jp/1/ranking-lines")) {
        return new Response(JSON.stringify([]), { status: 200 })
      }
      return new Response("unexpected", { status: 500 })
    }) as typeof fetch

    try {
      await fetchRankBorderLines({
        endpoint: "https://tracker.example/base",
        region: "jp",
        eventId: 1,
        mode: "normal",
        playbackAt: 1710000000,
        useWebSocket: false,
      })
    } finally {
      globalThis.fetch = originalFetch
    }

    expect(requests).toEqual([
      "https://tracker.example/base/event/jp/1/ranking-lines?at=1710000000&timestamp=1710000000",
    ])
  })
})
