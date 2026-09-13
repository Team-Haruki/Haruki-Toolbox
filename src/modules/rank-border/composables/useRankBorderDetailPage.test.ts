import { afterEach, expect, test } from "bun:test"
import { computed, effectScope, ref } from "vue"
import { createPinia, setActivePinia } from "pinia"
const previousSessionStorage = globalThis.sessionStorage
Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: { getItem: () => null, setItem: () => {}, removeItem: () => {} } })
const { useRankBorderDetailPage } = await import("./useRankBorderDetailPage")
Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: previousSessionStorage })
import type { RankBorderDetailParams } from "../lib/detail-link"

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

test("player tracking keeps the selected player when the seat changes occupants", async () => {
  setActivePinia(createPinia())
  let occupant = "player-a"
  let playerRank = 1
  const playerRequests: string[] = []
  const item = (userId: string, rank: number) => ({ rankData: { userId, rank, score: 100, timestamp: 10 } })
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    let data = {}
    if (url.includes("details/rank/")) {
      data = { current: item(occupant, 1), rankTrace: [], playerTrace: [] }
    } else if (url.includes("details/user/")) {
      playerRequests.push(url)
      data = { current: item("player-a", playerRank), playerTrace: [] }
    }
    return new Response(JSON.stringify(data))
  }) as typeof fetch
  const scope = effectScope()
  const page = scope.run(() => useRankBorderDetailPage(
    computed<RankBorderDetailParams>(() => ({ region: "jp", eventId: 987654, mode: "normal", worldBloomCharacterId: null, intervalSeconds: 3600, target: { kind: "rank", rank: 1 } })),
    ref("https://tracking-test.example"),
  ))!
  try {
    await page.refresh()
    expect(page.current.value?.userId).toBe("player-a")
    occupant = "player-b"
    playerRank = 2
    await page.refresh()
    expect(page.current.value?.userId).toBe("player-a")
    expect(page.current.value?.rank).toBe(2)
    expect(playerRequests.every((url) => url.includes("details/user/player-a?"))).toBe(true)
    page.setTraceSource("border")
    await page.refresh()
    expect(page.current.value?.userId).toBe("player-b")
    page.setTraceSource("player")
    await page.refresh()
    expect(page.current.value?.userId).toBe("player-a")
  } finally {
    scope.stop()
  }
})

for (const status of [404, 503]) {
  test(`player lookup maps HTTP ${status} without confusing missing data with service errors`, async () => {
    setActivePinia(createPinia())
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      if (String(input).includes("details/user/")) {
        return new Response(status === 404 ? "Not Found" : "Service unavailable", { status })
      }
      return new Response(JSON.stringify({}))
    }) as typeof fetch
    const scope = effectScope()
    const page = scope.run(() => useRankBorderDetailPage(
      computed<RankBorderDetailParams>(() => ({ region: "jp", eventId: 987000 + status, mode: "normal", worldBloomCharacterId: null, intervalSeconds: 3600, target: { kind: "user", userId: "123456789012345678" } })),
      ref("https://missing-player-test.example"),
    ))!
    try {
      await page.refresh(false)
      expect(page.current.value).toBeNull()
      expect(page.error.value).toBe(status === 404 ? "not_found" : "Service unavailable")
    } finally {
      scope.stop()
    }
  })
}

for (const mode of ["normal", "world_bloom"] as const) {
  for (const rank of [200, 500, 1000]) {
    test(`${mode} T${rank} detail uses neighbouring tracked tiers and refreshes their scores`, async () => {
      setActivePinia(createPinia())
      let scoreOffset = 0
      const requests: string[] = []
      const point = (rank: number) => ({ rank, score: 10000 - rank + scoreOffset, timestamp: 100 })
      globalThis.fetch = (async (input: RequestInfo | URL) => {
        const url = String(input)
        requests.push(url)
        const data = url.includes("overview?")
          ? {
              topRankings: [{ rankData: point(100) }],
              borderLines: [point(1000), point(200), point(500)],
            }
          : { current: { rankData: point(rank) }, previous: null, next: null, rankTrace: [], playerTrace: [] }
        return new Response(JSON.stringify(data))
      }) as typeof fetch
      const scope = effectScope()
      const page = scope.run(() => useRankBorderDetailPage(
        computed<RankBorderDetailParams>(() => ({
          region: "jp", eventId: 988000 + rank, mode,
          worldBloomCharacterId: mode === "world_bloom" ? 21 : null,
          intervalSeconds: 3600, target: { kind: "line", rank },
        })),
        ref("https://line-neighbours-test.example"),
      ))!
      try {
        await page.refresh()
        const previousRank = rank === 200 ? 100 : rank === 500 ? 200 : 500
        const nextRank = rank === 200 ? 500 : rank === 500 ? 1000 : null
        expect(page.previous.value?.rank).toBe(previousRank)
        expect(page.next.value?.rank ?? null).toBe(nextRank)
        expect(page.previous.value!.score - page.current.value!.score).toBe(rank - previousRank)
        if (nextRank) expect(page.current.value!.score - page.next.value!.score).toBe(nextRank - rank)
        scoreOffset = 500
        await page.refresh()
        expect(page.previous.value?.score).toBe(point(previousRank).score)
        expect(page.next.value?.score ?? null).toBe(nextRank ? point(nextRank).score : null)
        expect(requests.some((url) => url.includes("details/user/"))).toBe(false)
      } finally {
        scope.stop()
      }
    })
  }
}
