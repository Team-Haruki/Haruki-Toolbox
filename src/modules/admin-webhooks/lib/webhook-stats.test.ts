import { describe, expect, it } from "bun:test"
import {
  rankEndpointsBySubscriptions,
  summarizeWebhookEndpoints,
  summarizeWebhookSubscribers,
} from "./webhook-stats"

const ENDPOINTS = [
  { id: "1", callbackUrl: "https://a.example/hook", enabled: true, subscriptionCount: 40, bearer: "token" },
  { id: "2", callbackUrl: "https://b.example/hook", enabled: false, subscriptionCount: 10, bearer: "" },
  { id: "10", callbackUrl: "https://c.example/hook", enabled: true, subscriptionCount: 0, bearer: "  " },
  { id: "3", callbackUrl: "https://d.example/hook", enabled: true, subscriptionCount: 10, bearer: "x" },
]

describe("summarizeWebhookEndpoints", () => {
  it("counts switches, subscriptions and bearer use", () => {
    expect(summarizeWebhookEndpoints(ENDPOINTS)).toEqual({
      loaded: 4,
      enabled: 3,
      disabled: 1,
      subscriptions: 60,
      reachableSubscriptions: 50,
      withSubscribers: 3,
      withBearer: 2,
    })
  })

  it("is all zeros for an empty list and ignores bad subscription counts", () => {
    expect(summarizeWebhookEndpoints([])).toEqual({
      loaded: 0,
      enabled: 0,
      disabled: 0,
      subscriptions: 0,
      reachableSubscriptions: 0,
      withSubscribers: 0,
      withBearer: 0,
    })
    expect(summarizeWebhookEndpoints([{ enabled: true, subscriptionCount: Number.NaN, bearer: "" }]).subscriptions).toBe(0)
    expect(summarizeWebhookEndpoints([{ enabled: true, subscriptionCount: -3, bearer: "" }]).subscriptions).toBe(0)
  })
})

describe("rankEndpointsBySubscriptions", () => {
  it("orders by subscriptions, then by id as numbers, and drops endpoints without subscribers", () => {
    expect(rankEndpointsBySubscriptions(ENDPOINTS, 5)).toEqual({
      top: [
        { id: "1", callbackUrl: "https://a.example/hook", enabled: true, count: 40 },
        { id: "2", callbackUrl: "https://b.example/hook", enabled: false, count: 10 },
        { id: "3", callbackUrl: "https://d.example/hook", enabled: true, count: 10 },
      ],
      rest: 0,
    })
  })

  it("sums what the limit cuts off", () => {
    const ranked = rankEndpointsBySubscriptions(ENDPOINTS, 1)
    expect(ranked.top.map((endpoint) => endpoint.id)).toEqual(["1"])
    expect(ranked.rest).toBe(20)
    expect(rankEndpointsBySubscriptions(ENDPOINTS, 0)).toEqual({ top: [], rest: 60 })
  })
})

describe("summarizeWebhookSubscribers", () => {
  it("counts distinct users and groups by server and data type", () => {
    expect(summarizeWebhookSubscribers([
      { userId: "1", server: "jp", dataType: "suite" },
      { userId: "1", server: "JP", dataType: "mysekai" },
      { userId: "2", server: "cn", dataType: "suite" },
      { userId: "3", server: " ", dataType: "suite" },
    ])).toEqual({
      total: 4,
      users: 3,
      byServer: [{ key: "jp", count: 2 }, { key: "cn", count: 1 }],
      byDataType: [{ key: "suite", count: 3 }, { key: "mysekai", count: 1 }],
    })
  })

  it("is empty for no subscribers", () => {
    expect(summarizeWebhookSubscribers([])).toEqual({ total: 0, users: 0, byServer: [], byDataType: [] })
  })
})
