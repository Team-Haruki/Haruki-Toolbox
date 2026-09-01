import { describe, expect, test } from "bun:test"
import { createApp, effectScope, nextTick } from "vue"
import { createMemoryHistory, createRouter } from "vue-router"
import {
  readQueryInt,
  readQueryIntList,
  readQueryString,
  writeQueryList,
  writeQueryValue,
} from "@/lib/query-codec"
import { useRouteQueryState, type QueryCodec } from "./useRouteQueryState"

type State = {
  q: string
  ids: number[]
  sort: string
  page: number
}

const codec: QueryCodec<State> = {
  keys: ["q", "ids", "sort", "page"],
  filterKeys: ["q", "ids"],
  defaults: () => ({ q: "", ids: [], sort: "release", page: 1 }),
  parse: (query) => ({
    q: readQueryString(query.q) ?? "",
    ids: readQueryIntList(query.ids),
    sort: readQueryString(query.sort) ?? "release",
    page: readQueryInt(query.page, { min: 1 }) ?? 1,
  }),
  serialize: (state) => ({
    q: writeQueryValue(state.q),
    ids: writeQueryList(state.ids),
    sort: writeQueryValue(state.sort, "release"),
    page: writeQueryValue(state.page, 1),
  }),
}

const DEBOUNCE_MS = 20

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Lets the watcher run and the (async) router.replace navigation settle. */
async function settle() {
  await nextTick()
  await sleep(0)
  await nextTick()
}

async function setup(initialPath: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/cards", component: { render: () => null } },
      { path: "/other", component: { render: () => null } },
    ],
  })
  const app = createApp({ render: () => null })
  app.use(router)
  await router.push(initialPath)
  await router.isReady()

  let replaceCalls = 0
  const originalReplace = router.replace.bind(router)
  router.replace = ((to) => {
    replaceCalls += 1
    return originalReplace(to)
  }) as typeof router.replace

  const scope = effectScope()
  const bound = scope.run(() => app.runWithContext(() => useRouteQueryState(codec, {
    debounceKeys: ["q"],
    debounceMs: DEBOUNCE_MS,
    pageKey: "page",
    pageNeutralKeys: [],
  })))!

  return {
    router,
    scope,
    ...bound,
    query: () => router.currentRoute.value.query,
    replaceCalls: () => replaceCalls,
  }
}

describe("useRouteQueryState", () => {
  test("parses the initial query into state", async () => {
    const ctx = await setup("/cards?q=miku&ids=1,2&sort=id&page=3")
    expect(ctx.state.q).toBe("miku")
    expect(ctx.state.ids).toEqual([1, 2])
    expect(ctx.state.sort).toBe("id")
    expect(ctx.state.page).toBe(3)
    expect(ctx.activeFilterCount.value).toBe(2)
    expect(ctx.isDefault.value).toBe(false)
    ctx.scope.stop()
  })

  test("writes non-debounced changes immediately and omits defaults", async () => {
    const ctx = await setup("/cards")
    ctx.state.ids = [5]
    await settle()
    expect(ctx.query().ids).toBe("5")
    expect(ctx.query().sort).toBeUndefined()
    expect(ctx.query().page).toBeUndefined()

    ctx.state.ids = []
    await settle()
    expect(ctx.query().ids).toBeUndefined()
    ctx.scope.stop()
  })

  test("debounces text keys", async () => {
    const ctx = await setup("/cards")
    ctx.state.q = "a"
    await nextTick()
    expect(ctx.query().q).toBeUndefined()
    ctx.state.q = "ab"
    await sleep(DEBOUNCE_MS * 2)
    expect(ctx.query().q).toBe("ab")
    ctx.scope.stop()
  })

  test("resets the page in the same write when a filter changes", async () => {
    const ctx = await setup("/cards?page=4")
    expect(ctx.state.page).toBe(4)
    const before = ctx.replaceCalls()
    ctx.state.ids = [7]
    await settle()
    expect(ctx.state.page).toBe(1)
    expect(ctx.query().page).toBeUndefined()
    expect(ctx.query().ids).toBe("7")
    expect(ctx.replaceCalls() - before).toBe(1)
    ctx.scope.stop()
  })

  test("keeps the debounce when a debounced change also resets the page", async () => {
    const ctx = await setup("/cards?page=2")
    ctx.state.q = "x"
    await settle()
    // Not flushed yet: the page reset must not short-circuit the debounce.
    expect(ctx.query().q).toBeUndefined()
    expect(ctx.query().page).toBe("2")
    await sleep(DEBOUNCE_MS * 2)
    expect(ctx.query().q).toBe("x")
    expect(ctx.query().page).toBeUndefined()
    ctx.scope.stop()
  })

  test("does not reset the page for page-neutral keys and preserves foreign keys", async () => {
    const ctx = await setup("/cards?page=3&utm=abc")
    ctx.state.page = 5
    await settle()
    expect(ctx.query().page).toBe("5")
    expect(ctx.query().utm).toBe("abc")
    ctx.scope.stop()
  })

  test("re-parses external query changes (back/forward)", async () => {
    const ctx = await setup("/cards?ids=1")
    await ctx.router.push("/cards?ids=9&q=len")
    await nextTick()
    expect(ctx.state.ids).toEqual([9])
    expect(ctx.state.q).toBe("len")
    ctx.scope.stop()
  })

  test("a pending debounced write never lands on another route", async () => {
    const ctx = await setup("/cards")
    ctx.state.q = "leaving"
    await nextTick()
    await ctx.router.push("/other")
    await sleep(DEBOUNCE_MS * 2)
    expect(ctx.router.currentRoute.value.path).toBe("/other")
    expect(ctx.router.currentRoute.value.query.q).toBeUndefined()
    ctx.scope.stop()
  })

  test("reset clears filter keys only", async () => {
    const ctx = await setup("/cards?q=miku&ids=1&sort=id")
    ctx.reset()
    await nextTick()
    expect(ctx.state.q).toBe("")
    expect(ctx.state.ids).toEqual([])
    expect(ctx.state.sort).toBe("id")
    expect(ctx.activeFilterCount.value).toBe(0)
    ctx.scope.stop()
  })
})
