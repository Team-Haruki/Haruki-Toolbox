import { describe, expect, test } from "bun:test"
import { createApp, effectScope, nextTick, ref } from "vue"
import { createMemoryHistory, createRouter } from "vue-router"
import { writeQueryValue } from "@/lib/query-codec"
import { useRouteQuerySync } from "./useRouteQuerySync"

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
      { path: "/admin/logs", component: { render: () => null } },
      { path: "/admin/users", component: { render: () => null } },
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

  const search = ref("")
  const page = ref(1)
  const pageSize = ref(20)
  const scope = effectScope()
  scope.run(() => app.runWithContext(() => useRouteQuerySync(["q", "page", "size"], () => ({
    q: writeQueryValue(search.value.trim()),
    page: writeQueryValue(page.value, 1),
    size: writeQueryValue(pageSize.value, 20),
  }))))

  return {
    router,
    scope,
    search,
    page,
    pageSize,
    query: () => router.currentRoute.value.query,
    replaceCalls: () => replaceCalls,
  }
}

describe("useRouteQuerySync", () => {
  test("writes changed state and omits defaults", async () => {
    const ctx = await setup("/admin/logs")
    ctx.search.value = "login"
    ctx.page.value = 3
    await settle()
    expect(ctx.query().q).toBe("login")
    expect(ctx.query().page).toBe("3")
    expect(ctx.query().size).toBeUndefined()

    ctx.page.value = 1
    await settle()
    expect(ctx.query().page).toBeUndefined()
    ctx.scope.stop()
  })

  test("skips writes that would not change the URL and keeps foreign keys", async () => {
    const ctx = await setup("/admin/logs?q=login&utm=abc")
    const before = ctx.replaceCalls()
    ctx.search.value = "login"
    await settle()
    expect(ctx.replaceCalls()).toBe(before)

    ctx.pageSize.value = 50
    await settle()
    expect(ctx.query().size).toBe("50")
    expect(ctx.query().utm).toBe("abc")
    expect(ctx.replaceCalls()).toBe(before + 1)
    ctx.scope.stop()
  })

  test("never writes onto another route", async () => {
    const ctx = await setup("/admin/logs")
    await ctx.router.push("/admin/users")
    ctx.search.value = "stale"
    await settle()
    expect(ctx.router.currentRoute.value.path).toBe("/admin/users")
    expect(ctx.query().q).toBeUndefined()
    ctx.scope.stop()
  })
})
