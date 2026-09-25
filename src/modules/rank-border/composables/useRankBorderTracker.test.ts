import { afterEach, expect, test } from "bun:test"
import { useRankBorderTracker } from "./useRankBorderTracker"

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

test("an aborted refresh writes neither data nor an error", async () => {
  const controller = new AbortController()
  globalThis.fetch = (async () => {
    controller.abort()
    return new Response(JSON.stringify({ topRankings: [{ rank: 1, userId: "old", score: 1, timestamp: 1 }], borderLines: [] }))
  }) as typeof fetch
  const tracker = useRankBorderTracker()
  await tracker.refresh({ endpoint: "https://abort-test.example", region: "cn", eventId: 1, mode: "normal", intervalSeconds: 3600, signal: controller.signal })
  expect(tracker.topRankings.value).toEqual([])
  expect(tracker.error.value).toBeNull()

  const failing = new AbortController()
  globalThis.fetch = (async () => {
    failing.abort()
    throw new DOMException("aborted", "AbortError")
  }) as typeof fetch
  await tracker.refresh({ endpoint: "https://abort-test.example", region: "cn", eventId: 2, mode: "normal", intervalSeconds: 3600, signal: failing.signal })
  expect(tracker.error.value).toBeNull()
})
