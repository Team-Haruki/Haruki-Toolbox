import { describe, expect, test } from "bun:test"
import {
  buildOAuthClientWebhookCreatePayload,
  buildOAuthClientWebhookUpdatePayload,
  normalizeOAuthClientWebhook,
  readOAuthClientWebhookMutation,
} from "./webhook"

describe("oauth client webhook helpers", () => {
  test("normalizes webhook fields from backend response", () => {
    expect(normalizeOAuthClientWebhook({
      id: "wh_1",
      client_id: "client-a",
      callback_url: "https://example.com/{server}",
      bearer_set: 1,
      enabled: false,
      created_at: "2026-06-01T00:00:00Z",
      updated_at: "2026-06-02T00:00:00Z",
    })).toEqual({
      id: "wh_1",
      clientId: "client-a",
      callbackUrl: "https://example.com/{server}",
      bearerSet: true,
      enabled: false,
      createdAt: "2026-06-01T00:00:00Z",
      updatedAt: "2026-06-02T00:00:00Z",
    })
  })

  test("reads mutation wrapper", () => {
    expect(readOAuthClientWebhookMutation({
      webhook: {
        id: "wh_2",
        clientId: "client-b",
        callbackUrl: "https://example.com/cb",
        bearerSet: false,
        enabled: true,
        createdAt: "2026-06-01T00:00:00Z",
      },
    }).id).toBe("wh_2")
  })

  test("builds create and update payloads without empty bearer", () => {
    expect(buildOAuthClientWebhookCreatePayload({
      callbackUrl: " https://example.com/cb ",
      bearer: "  ",
      enabled: true,
    })).toEqual({
      callbackUrl: "https://example.com/cb",
      enabled: true,
    })

    expect(buildOAuthClientWebhookUpdatePayload({
      callbackUrl: " https://example.com/cb2 ",
      bearer: "secret",
      enabled: false,
      clearBearer: false,
    })).toEqual({
      callbackUrl: "https://example.com/cb2",
      bearer: "secret",
      enabled: false,
    })
  })

  test("clear bearer takes precedence over replacement bearer", () => {
    expect(buildOAuthClientWebhookUpdatePayload({
      callbackUrl: "https://example.com/cb",
      bearer: "secret",
      enabled: true,
      clearBearer: true,
    })).toEqual({
      callbackUrl: "https://example.com/cb",
      enabled: true,
      clearBearer: true,
    })
  })
})
