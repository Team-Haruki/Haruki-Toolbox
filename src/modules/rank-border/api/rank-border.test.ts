import { describe, expect, it } from "bun:test"
import {
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
})
