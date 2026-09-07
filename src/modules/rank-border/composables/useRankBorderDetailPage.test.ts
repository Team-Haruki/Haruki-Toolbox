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
