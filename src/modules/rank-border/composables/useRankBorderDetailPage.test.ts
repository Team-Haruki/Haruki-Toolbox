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
        const data = /\/(overview|top100|borders|growth|status)\?/.test(url)
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

test("push refreshes read the target on the versioned GET and leave the overview to its TTL", async () => {
  setActivePinia(createPinia())
  const requests: Array<{ url: string; cache?: RequestCache }> = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    requests.push({ url, cache: init?.cache })
    if (url.includes("/overview?") || url.includes("/top100?") || url.includes("/borders?")) {
      return new Response(JSON.stringify({ topRankings: [], borderLines: [] }))
    }
    return new Response(JSON.stringify({ current: { rankData: { userId: "u1", rank: 3, score: 100, timestamp: 10 } }, playerTrace: [{ userId: "u1", rank: 3, score: 100, timestamp: 10 }] }))
  }) as typeof fetch
  const scope = effectScope()
  const page = scope.run(() => useRankBorderDetailPage(
    computed<RankBorderDetailParams>(() => ({ region: "cn", eventId: 989001, mode: "normal", worldBloomCharacterId: null, intervalSeconds: 3600, target: { kind: "user", userId: "u1" } })),
    ref("https://push-refresh-test.example"),
  ))!
  try {
    await page.refresh(false)
    requests.length = 0
    await page.refreshForPush(77)
    expect(requests.length).toBe(1)
    expect(requests[0]?.url).toContain("details/user/u1?")
    expect(requests[0]?.url).toContain("v=77")
    expect(requests[0]?.url).not.toContain("_t=")
    expect(requests[0]?.cache).toBe("default")
  } finally {
    scope.stop()
  }
})

test("overview and comparison failures surface as retryable issues", async () => {
  setActivePinia(createPinia())
  let failing = true
  const originalConsoleError = console.error
  console.error = () => {}
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    if (/\/(overview|top100|borders)\?/.test(url)) {
      return failing ? new Response("down", { status: 503 }) : new Response(JSON.stringify({ topRankings: [], borderLines: [] }))
    }
    if (url.includes("details/user/cmp")) {
      return failing ? new Response("down", { status: 503 }) : new Response(JSON.stringify({ current: { rankData: { userId: "cmp", rank: 9, score: 5, timestamp: 10 } }, playerTrace: [{ userId: "cmp", rank: 9, score: 5, timestamp: 10 }] }))
    }
    return new Response(JSON.stringify({ current: { rankData: { userId: "u2", rank: 3, score: 100, timestamp: 10 } }, playerTrace: [{ userId: "u2", rank: 3, score: 100, timestamp: 10 }] }))
  }) as typeof fetch
  const scope = effectScope()
  const page = scope.run(() => useRankBorderDetailPage(
    computed<RankBorderDetailParams>(() => ({ region: "cn", eventId: 989002, mode: "normal", worldBloomCharacterId: null, intervalSeconds: 3600, target: { kind: "user", userId: "u2" } })),
    ref("https://issues-test.example"),
  ))!
  try {
    page.addComparisonPlayer("cmp")
    await page.refresh(false)
    expect(page.hasIssues.value).toBe(true)
    expect(page.issues.value.overview).toBe(true)
    expect(page.issues.value.comparisons).toEqual(["cmp"])
    failing = false
    page.retryIssues()
    for (let index = 0; index < 20 && page.hasIssues.value; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    expect(page.hasIssues.value).toBe(false)
  } finally {
    console.error = originalConsoleError
    scope.stop()
  }
})

test("a followed player who leaves the ranks keeps their history and shows as not ranked", async () => {
  setActivePinia(createPinia())
  let ranked = true
  const row = (userId: string, rank: number, timestamp: number) => ({ userId, rank, score: timestamp, timestamp })
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    let data: unknown = {}
    if (url.includes("details/rank/")) {
      data = { current: { rankData: row(ranked ? "player-a" : "player-b", 200, 20) }, rankTrace: [row("player-a", 200, 10), row("player-b", 200, 20)] }
    } else if (url.includes("details/user/player-a")) {
      data = ranked
        ? { ranked: true, current: { rankData: row("player-a", 200, 10) }, playerTrace: [row("player-a", 200, 10)] }
        : { ranked: false, playerTrace: url.includes("cursor=") ? [] : [row("player-a", 200, 10)], profile: { userId: "player-a", name: "Alpha" } }
    }
    return new Response(JSON.stringify(data))
  }) as typeof fetch
  const scope = effectScope()
  const page = scope.run(() => useRankBorderDetailPage(
    computed<RankBorderDetailParams>(() => ({ region: "cn", eventId: 989101, mode: "normal", worldBloomCharacterId: null, intervalSeconds: 3600, target: { kind: "rank", rank: 200 } })),
    ref("https://not-ranked-test.example"),
  ))!
  try {
    await page.refresh()
    expect(page.current.value?.userId).toBe("player-a")
    expect(page.notRanked.value).toBe(false)
    ranked = false
    await page.refresh()
    // Never the new occupant, and the history stays.
    expect(page.current.value).toBeNull()
    expect(page.notRanked.value).toBe(true)
    expect(page.error.value).toBeNull()
    expect(page.playerTrace.value.map((point) => point.timestamp)).toEqual([10])
  } finally {
    scope.stop()
  }
})

test("a user target that is no longer ranked loads its history without an error", async () => {
  setActivePinia(createPinia())
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (String(input).includes("details/user/")) {
      return new Response(JSON.stringify({ ranked: false, playerTrace: [{ userId: "gone", rank: 90, score: 5, timestamp: 10 }, { userId: "gone", rank: 99, score: 6, timestamp: 20 }], profile: { userId: "gone", name: "Gone" } }))
    }
    return new Response(JSON.stringify({}))
  }) as typeof fetch
  const scope = effectScope()
  const page = scope.run(() => useRankBorderDetailPage(
    computed<RankBorderDetailParams>(() => ({ region: "cn", eventId: 989102, mode: "normal", worldBloomCharacterId: null, intervalSeconds: 3600, target: { kind: "user", userId: "gone" } })),
    ref("https://not-ranked-user-test.example"),
  ))!
  try {
    await page.refresh(false)
    expect(page.error.value).toBeNull()
    expect(page.current.value).toBeNull()
    expect(page.notRanked.value).toBe(true)
    expect(page.profile.value?.name).toBe("Gone")
    expect(page.playerTrace.value).toHaveLength(2)
  } finally {
    scope.stop()
  }
})

// Trackers up to 4.1.0 answer a cursor poll with nothing newer with 404.
for (const kind of ["rank", "user"] as const) {
  test(`a ${kind} cursor poll answered 404 is "no new data", not an error`, async () => {
    setActivePinia(createPinia())
    const originalConsoleError = console.error
    console.error = () => {}
    const cursorRequests: string[] = []
    const row = (userId: string, timestamp: number) => ({ userId, rank: 200, score: timestamp, timestamp })
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes("cursor=")) {
        cursorRequests.push(url)
        return new Response(JSON.stringify({ error: "not found" }), { status: 404 })
      }
      if (url.includes("details/rank/")) {
        return new Response(JSON.stringify({ current: { rankData: row("p1", 10) }, rankTrace: [row("p1", 10)] }))
      }
      if (url.includes("details/user/")) {
        return new Response(JSON.stringify({ current: { rankData: row("p1", 10) }, playerTrace: [row("p1", 10)] }))
      }
      return new Response(JSON.stringify({ topRankings: [], borderLines: [] }))
    }) as typeof fetch
    const scope = effectScope()
    const page = scope.run(() => useRankBorderDetailPage(
      computed<RankBorderDetailParams>(() => ({
        region: "cn", eventId: kind === "rank" ? 989103 : 989104, mode: "normal", worldBloomCharacterId: null, intervalSeconds: 3600,
        target: kind === "rank" ? { kind: "rank", rank: 200 } : { kind: "user", userId: "p1" },
      })),
      ref(`https://cursor-404-${kind}-test.example`),
    ))!
    try {
      page.addComparisonTarget("rank", "500", "T500")
      await page.refresh()
      await page.refresh()
      expect(cursorRequests.length).toBeGreaterThan(0)
      expect(page.error.value).toBeNull()
      expect(page.current.value?.userId).toBe("p1")
      expect(page.playerTrace.value).toHaveLength(1)
      expect(page.hasIssues.value).toBe(false)
    } finally {
      console.error = originalConsoleError
      scope.stop()
    }
  })
}

// --- Detail request diet (T1-5 / T1-6) ----------------------------------------

type DetailRequest = { url: string; params: URLSearchParams }

function parseRequest(url: string): DetailRequest {
  return { url, params: new URL(url, "https://tracker.example").searchParams }
}

/** The composable loads on creation; wait for that before counting requests. */
async function settleInitialLoad(page: { loading: { value: boolean } }) {
  for (let index = 0; index < 50; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0))
    if (!page.loading.value) {
      return
    }
  }
  throw new Error("initial load did not settle")
}

/** Lets silent loads (trace-source switches, target changes) run to completion. */
async function flushLoads() {
  for (let index = 0; index < 20; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

function rankRequests(requests: DetailRequest[]) {
  return requests.filter((request) => request.url.includes("details/rank/"))
}

function userRequests(requests: DetailRequest[]) {
  return requests.filter((request) => request.url.includes("details/user/"))
}

test("a rank seat loads the occupant first and fetches the seat trace only for the border view", async () => {
  setActivePinia(createPinia())
  const requests: DetailRequest[] = []
  const row = (userId: string, timestamp: number) => ({ userId, rank: 7, score: timestamp, timestamp })
  let latest = 30
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const request = parseRequest(String(input))
    requests.push(request)
    const cursor = Number(request.params.get("cursor") ?? 0)
    if (request.url.includes("details/rank/")) {
      const rankTrace = request.params.get("includeTrace") === "true"
        ? [row("seat-a", 10), row("seat-b", 20), row("seat-b", latest)].filter((point) => point.timestamp > cursor)
        : []
      return new Response(JSON.stringify({ current: { rankData: row("seat-b", latest) }, rankTrace, playerTrace: [] }))
    }
    if (request.url.includes("details/user/")) {
      const playerTrace = [row("seat-b", 20), row("seat-b", latest)].filter((point) => point.timestamp > cursor)
      return new Response(JSON.stringify({ ranked: true, current: { rankData: row("seat-b", latest) }, playerTrace, profile: { userId: "seat-b", name: "Bee" } }))
    }
    return new Response(JSON.stringify({ topRankings: [], borderLines: [] }))
  }) as typeof fetch
  const scope = effectScope()
  const page = scope.run(() => useRankBorderDetailPage(
    computed<RankBorderDetailParams>(() => ({ region: "jp", eventId: 989201, mode: "normal", worldBloomCharacterId: null, intervalSeconds: 3600, target: { kind: "rank", rank: 7 } })),
    ref("https://lazy-border-test.example"),
  ))!
  try {
    await settleInitialLoad(page)
    // Initial: one seat read without its trace, the player's history with the profile.
    expect(rankRequests(requests)).toHaveLength(1)
    expect(rankRequests(requests)[0]?.params.get("includeTrace")).toBe("false")
    expect(userRequests(requests)).toHaveLength(1)
    expect(userRequests(requests)[0]?.params.get("includeProfile")).toBe("true")
    expect(page.traceSource.value).toBe("player")
    expect(page.canSwitchTraceSource.value).toBe(true)
    expect(page.borderTrace.value).toEqual([])
    expect(page.playerTrace.value.map((point) => point.timestamp)).toEqual([20, 30])
    expect(page.profile.value?.name).toBe("Bee")

    // Pushes while following a known player: only the player's increment.
    requests.length = 0
    latest = 40
    await page.refreshForPush(2)
    expect(rankRequests(requests)).toHaveLength(0)
    expect(userRequests(requests)).toHaveLength(1)
    expect(userRequests(requests)[0]?.params.get("cursor")).toBe("30")
    expect(userRequests(requests)[0]?.params.get("includeProfile")).toBe("false")
    expect(page.borderTrace.value).toEqual([])
    expect(page.playerTrace.value.map((point) => point.timestamp)).toEqual([20, 30, 40])

    // The border view fetches the whole seat trace once, ...
    requests.length = 0
    page.setTraceSource("border")
    await flushLoads()
    const borderLoads = rankRequests(requests).filter((request) => request.params.get("includeTrace") === "true" && !request.params.has("cursor"))
    expect(borderLoads).toHaveLength(1)
    expect(page.borderTrace.value.map((point) => point.timestamp)).toEqual([10, 20, 40])
    expect(page.current.value?.userId).toBe("seat-b")

    // ... then follows pushes by cursor, also after switching back to the player.
    requests.length = 0
    latest = 50
    await page.refreshForPush(3)
    expect(rankRequests(requests)).toHaveLength(1)
    expect(rankRequests(requests)[0]?.params.get("cursor")).toBe("40")
    expect(rankRequests(requests)[0]?.params.get("includeTrace")).toBe("true")
    expect(page.borderTrace.value.map((point) => point.timestamp)).toEqual([10, 20, 40, 50])
    page.setTraceSource("player")
    await flushLoads()
    requests.length = 0
    latest = 60
    await page.refreshForPush(4)
    expect(rankRequests(requests).map((request) => request.params.get("cursor"))).toEqual(["50"])
    expect(page.borderTrace.value.map((point) => point.timestamp)).toEqual([10, 20, 40, 50, 60])
    expect(page.playerTrace.value.map((point) => point.timestamp)).toEqual([20, 30, 40, 50, 60])
  } finally {
    scope.stop()
  }
})

test("an empty seat keeps reading the rank detail until an occupant appears", async () => {
  setActivePinia(createPinia())
  const requests: DetailRequest[] = []
  let occupant: string | null = null
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const request = parseRequest(String(input))
    requests.push(request)
    if (request.url.includes("details/rank/")) {
      return new Response(JSON.stringify({ current: occupant ? { rankData: { userId: occupant, rank: 3, score: 1, timestamp: 10 } } : null, rankTrace: [], playerTrace: [] }))
    }
    if (request.url.includes("details/user/")) {
      return new Response(JSON.stringify({ ranked: true, current: { rankData: { userId: occupant, rank: 3, score: 1, timestamp: 10 } }, playerTrace: [] }))
    }
    return new Response(JSON.stringify({ topRankings: [], borderLines: [] }))
  }) as typeof fetch
  const scope = effectScope()
  const page = scope.run(() => useRankBorderDetailPage(
    computed<RankBorderDetailParams>(() => ({ region: "jp", eventId: 989202, mode: "normal", worldBloomCharacterId: null, intervalSeconds: 3600, target: { kind: "rank", rank: 3 } })),
    ref("https://empty-seat-test.example"),
  ))!
  try {
    await settleInitialLoad(page)
    expect(page.error.value).toBe("not_found")
    await page.refreshForPush(1)
    expect(rankRequests(requests)).toHaveLength(2)
    expect(rankRequests(requests).every((request) => request.params.get("includeTrace") === "false" && !request.params.has("cursor"))).toBe(true)
    expect(userRequests(requests)).toHaveLength(0)
    occupant = "late-comer"
    await page.refreshForPush(2)
    expect(rankRequests(requests)).toHaveLength(3)
    expect(userRequests(requests)).toHaveLength(1)
    expect(page.current.value?.userId).toBe("late-comer")
    expect(page.error.value).toBeNull()
  } finally {
    scope.stop()
  }
})

test("the seat holder's history starts loading after the first seat page, before the seat trace finished paging", async () => {
  setActivePinia(createPinia())
  const order: string[] = []
  const row = (timestamp: number) => ({ userId: "holder", rank: 1, score: timestamp, timestamp })
  const firstPage = Array.from({ length: 10_000 }, (_, index) => row(index + 1))
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const request = parseRequest(String(input))
    if (request.url.includes("details/rank/")) {
      const cursor = request.params.get("cursor")
      order.push(cursor ? `rank-page@${cursor}` : "rank-page")
      const rankTrace = request.params.get("includeTrace") === "true" ? (cursor ? [row(10_001)] : firstPage) : []
      return new Response(JSON.stringify({ current: { rankData: row(10_001) }, rankTrace, playerTrace: [] }))
    }
    if (request.url.includes("details/user/")) {
      order.push("player")
      return new Response(JSON.stringify({ ranked: true, current: { rankData: row(10_001) }, playerTrace: [row(5), row(10_001)] }))
    }
    return new Response(JSON.stringify({ topRankings: [], borderLines: [] }))
  }) as typeof fetch
  const scope = effectScope()
  const page = scope.run(() => useRankBorderDetailPage(
    computed<RankBorderDetailParams>(() => ({ region: "jp", eventId: 989203, mode: "normal", worldBloomCharacterId: null, intervalSeconds: 3600, target: { kind: "rank", rank: 1 } })),
    ref("https://parallel-player-test.example"),
  ))!
  try {
    await settleInitialLoad(page)
    expect(order).toEqual(["rank-page", "player"])
    order.length = 0
    page.setTraceSource("border")
    await flushLoads()
    expect(order).toEqual(["rank-page", "player", "rank-page@10000"])
    expect(page.borderTrace.value).toHaveLength(10_001)
    expect(page.playerTrace.value.map((point) => point.timestamp)).toEqual([5, 10_001])
    expect(page.borderTraceLoading.value).toBe(false)
  } finally {
    scope.stop()
  }
})

test("switching back to the player while the seat trace loads clears its indicator", async () => {
  setActivePinia(createPinia())
  let releaseBorder: (() => void) | null = null
  const row = (timestamp: number) => ({ userId: "holder", rank: 2, score: timestamp, timestamp })
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const request = parseRequest(String(input))
    if (request.url.includes("details/rank/")) {
      if (request.params.get("includeTrace") === "true") {
        await new Promise<void>((resolve) => { releaseBorder = resolve })
      }
      return new Response(JSON.stringify({ current: { rankData: row(20) }, rankTrace: request.params.get("includeTrace") === "true" ? [row(10), row(20)] : [], playerTrace: [] }))
    }
    if (request.url.includes("details/user/")) {
      return new Response(JSON.stringify({ ranked: true, current: { rankData: row(20) }, playerTrace: [row(10), row(20)] }))
    }
    return new Response(JSON.stringify({ topRankings: [], borderLines: [] }))
  }) as typeof fetch
  const scope = effectScope()
  const page = scope.run(() => useRankBorderDetailPage(
    computed<RankBorderDetailParams>(() => ({ region: "jp", eventId: 989208, mode: "normal", worldBloomCharacterId: null, intervalSeconds: 3600, target: { kind: "rank", rank: 2 } })),
    ref("https://border-loading-test.example"),
  ))!
  try {
    await settleInitialLoad(page)
    expect(page.borderTraceLoading.value).toBe(false)
    page.setTraceSource("border")
    await flushLoads()
    expect(page.borderTraceLoading.value).toBe(true)
    expect(page.activeTrace.value).toBe(page.playerTrace.value)
    page.setTraceSource("player")
    await flushLoads()
    expect(page.borderTraceLoading.value).toBe(false)
    releaseBorder?.()
    await flushLoads()
    expect(page.borderTraceLoading.value).toBe(false)
    expect(page.borderTrace.value).toEqual([])
  } finally {
    scope.stop()
  }
})

test("a cached border view requests the seat trace it never loaded", async () => {
  setActivePinia(createPinia())
  const requests: DetailRequest[] = []
  const row = (timestamp: number) => ({ userId: "holder", rank: 9, score: timestamp, timestamp })
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const request = parseRequest(String(input))
    requests.push(request)
    if (request.url.includes("details/rank/")) {
      return new Response(JSON.stringify({ current: { rankData: row(20) }, rankTrace: request.params.get("includeTrace") === "true" ? [row(10), row(20)] : [], playerTrace: [] }))
    }
    if (request.url.includes("details/user/")) {
      return new Response(JSON.stringify({ ranked: true, current: { rankData: row(20) }, playerTrace: [row(10), row(20)] }))
    }
    return new Response(JSON.stringify({ topRankings: [], borderLines: [] }))
  }) as typeof fetch
  const targets = { a: { kind: "rank", rank: 9 }, b: { kind: "rank", rank: 8 } } as const
  const selected = ref<"a" | "b">("b")
  const scope = effectScope()
  const page = scope.run(() => useRankBorderDetailPage(
    computed<RankBorderDetailParams>(() => ({ region: "jp", eventId: 989204, mode: "normal", worldBloomCharacterId: null, intervalSeconds: 3600, target: targets[selected.value] })),
    ref("https://cached-border-test.example"),
  ))!
  try {
    // Seat 8 is cached from the player view, without its trace.
    await settleInitialLoad(page)
    expect(page.borderTrace.value).toEqual([])
    // Seat 9 is switched to the border view ...
    selected.value = "a"
    await settleInitialLoad(page)
    expect(page.traceSource.value).toBe("player")
    page.setTraceSource("border")
    await flushLoads()
    expect(page.borderTrace.value).toHaveLength(2)
    // ... and back on seat 8 the border view is kept and its trace fetched.
    requests.length = 0
    selected.value = "b"
    await flushLoads()
    expect(page.traceSource.value).toBe("border")
    expect(page.borderTrace.value.map((point) => point.timestamp)).toEqual([10, 20])
    const borderLoads = rankRequests(requests).filter((request) => request.url.includes("details/rank/8") && request.params.get("includeTrace") === "true")
    expect(borderLoads.length).toBeGreaterThan(0)
    expect(borderLoads.every((request) => !request.params.has("cursor"))).toBe(true)
  } finally {
    scope.stop()
  }
})

test("a rank comparison draws the seat's series and never appends the occupant's rows", async () => {
  setActivePinia(createPinia())
  const requests: DetailRequest[] = []
  const row = (userId: string, timestamp: number) => ({ userId, rank: 5, score: timestamp, timestamp })
  let polled = false
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const request = parseRequest(String(input))
    requests.push(request)
    if (request.url.includes("details/rank/5")) {
      // An older tracker answers a cursor poll with a fresh player row but no seat row.
      return new Response(JSON.stringify(polled
        ? { current: { rankData: row("seat-holder", 30) }, rankTrace: [], playerTrace: [row("seat-holder", 30)] }
        : { current: { rankData: row("seat-holder", 20) }, rankTrace: [row("previous-holder", 10), row("seat-holder", 20)], playerTrace: [row("seat-holder", 20)] }))
    }
    if (request.url.includes("details/user/")) {
      return new Response(JSON.stringify({ ranked: true, current: { rankData: { userId: "me", rank: 1, score: 100, timestamp: 20 } }, playerTrace: [{ userId: "me", rank: 1, score: 100, timestamp: 20 }] }))
    }
    return new Response(JSON.stringify({ topRankings: [], borderLines: [] }))
  }) as typeof fetch
  const scope = effectScope()
  const page = scope.run(() => useRankBorderDetailPage(
    computed<RankBorderDetailParams>(() => ({ region: "jp", eventId: 989205, mode: "normal", worldBloomCharacterId: null, intervalSeconds: 3600, target: { kind: "user", userId: "me" } })),
    ref("https://rank-comparison-test.example"),
  ))!
  try {
    expect(page.addComparisonTarget("rank", "5", "#5")).toBe("added")
    await page.refresh(false)
    const comparisonLoads = requests.filter((request) => request.url.includes("details/rank/5"))
    expect(comparisonLoads.every((request) => request.params.get("includePlayerTrace") === "false")).toBe(true)
    expect(page.comparisons.value[0]?.trace.map((point) => point.timestamp)).toEqual([10, 20])
    expect(page.comparisons.value[0]?.label).toBe("#5")
    polled = true
    await page.refresh()
    expect(page.comparisons.value[0]?.trace.map((point) => point.timestamp)).toEqual([10, 20])
    expect(page.comparisons.value[0]?.current?.timestamp).toBe(30)
  } finally {
    scope.stop()
  }
})

// Own-account reads go over the socket: mock it like the API tests do.
function installMockTrackerSocket(answer: (path: string) => unknown) {
  const paths: string[] = []
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
      const message = JSON.parse(payload) as { id: string; path?: string }
      if (!message.path) {
        return
      }
      paths.push(message.path)
      this.dispatchEvent(new MessageEvent("message", {
        data: JSON.stringify({ id: message.id, ok: true, status: 200, data: answer(message.path) }),
      }))
    }

    close() {
      this.readyState = MockWebSocket.CLOSED
    }
  }
  const originalWebSocket = globalThis.WebSocket
  globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket
  return { paths, restore: () => { globalThis.WebSocket = originalWebSocket } }
}

for (const server of ["new", "old"] as const) {
  test(`own-account pushes poll by cursor and merge what a ${server} tracker answers`, async () => {
    setActivePinia(createPinia())
    const { useUserStore } = await import("@/shared/stores/user")
    useUserStore().setUser({ kratosIdentityId: "kratos-1", sessionToken: "session-token" })
    const row = (timestamp: number) => ({ userId: "mine", rank: 42, score: timestamp * 10, timestamp })
    let history = [row(10), row(20)]
    const socket = installMockTrackerSocket((path) => {
      const params = new URL(path, "https://tracker.example").searchParams
      const cursor = Number(params.get("cursor") ?? 0)
      // Older trackers ignore the cursor and answer with the whole history.
      const playerTrace = server === "new" ? history.filter((point) => point.timestamp > cursor) : history
      return {
        ranked: true,
        current: { rankData: history[history.length - 1] },
        playerTrace,
        profile: params.get("includeProfile") === "true" ? { userId: "mine", name: "Me" } : null,
      }
    })
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith("/ws-ticket")) {
        return new Response(JSON.stringify({ ticket: "ticket-1" }))
      }
      if (/\/(overview|top100|borders)\?/.test(url)) {
        return new Response(JSON.stringify({ topRankings: [], borderLines: [] }))
      }
      throw new Error(`unexpected REST request ${url}`)
    }) as typeof fetch
    const scope = effectScope()
    const page = scope.run(() => useRankBorderDetailPage(
      computed<RankBorderDetailParams>(() => ({ region: "jp", eventId: server === "new" ? 989206 : 989207, mode: "normal", worldBloomCharacterId: null, intervalSeconds: 3600, target: { kind: "user", userId: "mine", own: true } })),
      ref(`https://private-cursor-${server}-test.example`),
    ))!
    try {
      await settleInitialLoad(page)
      expect(socket.paths).toHaveLength(1)
      expect(socket.paths[0]).toContain("/private/details/user/mine?")
      expect(socket.paths[0]).toContain("includeTrace=true&includeProfile=true")
      expect(socket.paths[0]).toContain("owner=kratos-1")
      expect(socket.paths[0]).not.toContain("cursor=")
      expect(page.profile.value?.name).toBe("Me")
      expect(page.playerTrace.value.map((point) => point.timestamp)).toEqual([10, 20])

      history = [...history, row(30)]
      await page.refreshForPush(5)
      expect(socket.paths).toHaveLength(2)
      expect(socket.paths[1]).toContain("includeProfile=false")
      expect(socket.paths[1]).toContain("cursor=20")
      expect(page.playerTrace.value.map((point) => point.timestamp)).toEqual([10, 20, 30])
      expect(page.playerTrace.value.map((point) => point.score)).toEqual([100, 200, 300])
      expect(page.current.value?.timestamp).toBe(30)
      expect(page.profile.value?.name).toBe("Me")
      expect(page.error.value).toBeNull()

      // Nothing newer: the trace is left alone.
      await page.refreshForPush(6)
      expect(socket.paths[2]).toContain("cursor=30")
      expect(page.playerTrace.value).toHaveLength(3)
    } finally {
      socket.restore()
      scope.stop()
    }
  })
}
