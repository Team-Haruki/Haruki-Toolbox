import { describe, expect, it, mock } from "bun:test"
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios"

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

function notFound(data: unknown): AxiosError {
  const response = { status: 404, data, statusText: "Not Found", headers: {}, config: { headers: new AxiosHeaders() } } as AxiosResponse
  return new AxiosError("Not Found", "ERR_BAD_REQUEST", undefined, undefined, response)
}

// Runs `body` with request() replaced by `impl`, then restores it.
async function withRequest(impl: (url: string, options: unknown) => Promise<unknown>, body: (api: typeof import("./story")) => Promise<void>) {
  installStorageStub("localStorage")
  installStorageStub("sessionStorage")
  const actual = await import("@/core/http/call-api")
  // mock.module patches `actual` in place, so keep the real request to restore.
  const realRequest = actual.request
  const requestMock = mock(impl)
  mock.module("@/core/http/call-api", () => ({ ...actual, request: requestMock }))
  try {
    await body(await import("./story"))
  } finally {
    mock.module("@/core/http/call-api", () => ({ ...actual, request: realRequest }))
  }
  return requestMock
}

describe("getStoryTranslation", () => {
  it("returns a finished translation", async () => {
    const translation = { scenarioId: "event_1_01", lang: "zh-Hans", model: "m", names: {}, lines: ["嗯"], updatedAt: "" }
    const calls = await withRequest(async () => translation, async (api) => {
      expect(await api.getStoryTranslation("event_1_01")).toEqual({ status: "done", translation })
    })
    expect(calls.mock.calls[0][0]).toBe("/api/misc/story/translations/event_1_01")
  })

  it("tells pending and unavailable apart", async () => {
    await withRequest(async () => Promise.reject(notFound({ status: "pending" })), async (api) => {
      expect(await api.getStoryTranslation("a")).toEqual({ status: "pending" })
    })
    await withRequest(async () => Promise.reject(notFound({ status: "unavailable" })), async (api) => {
      expect(await api.getStoryTranslation("a")).toEqual({ status: "unavailable" })
    })
  })

  it("rethrows other failures", async () => {
    await withRequest(async () => Promise.reject(new Error("offline")), async (api) => {
      await expect(api.getStoryTranslation("a")).rejects.toThrow("offline")
    })
  })
})
