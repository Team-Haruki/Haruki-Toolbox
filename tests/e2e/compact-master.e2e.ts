import { expect, test } from "@playwright/test"

for (const fallback of [false, true]) {
  test(`master worker caches restored catalogs${fallback ? " with original fallback" : " from compact downloads"}`, async ({ page, context }) => {
    const digests = { cards: "a".repeat(64), compactCards: "b".repeat(64), gachas: "c".repeat(64), compactGachas: "d".repeat(64) }
    const fields = { cards: "cardParameters", gachas: "gachaDetails" }
    const original = {
      cards: [{ id: 1, cardParameters: [{ id: 11, power: 50 }, { id: 12, power: 70 }] }],
      gachas: [{ id: 2, gachaDetails: [{ cardId: 1, weight: 1, isWish: false }] }],
    }
    const downloads: string[] = []
    await context.route("**/compact-worker-probe", (route) => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Worker probe</title>" }))
    await context.route("https://sekai-api-cdn.haruki.seiunx.com/**", async (route) => {
      const path = new URL(route.request().url()).pathname
      let body: unknown
      if (path.endsWith("/current")) {
        body = { dataVersion: "1", contentHash: "compact-test", files: Object.entries(digests).map(([name, sha256]) => ({ name: `${name}.json`, sha256 })) }
      } else {
        const name = Object.entries(digests).find(([, digest]) => path.endsWith(`/${digest}`))?.[0]
        if (!name) return route.abort()
        downloads.push(name)
        const logical = name.toLowerCase().includes("cards") ? "cards" : "gachas"
        const field = fields[logical]
        body = name.startsWith("compact")
          ? [{ id: original[logical][0].id, [field]: logical === "cards"
            ? { id: [11, 12], power: fallback ? [50] : [50, 70], __ENUM__: {} }
            : { cardId: [1], weight: [1], isWish: [0], __ENUM__: { isWish: [false] } } }]
          : original[logical]
      }
      await route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) })
    })
    await page.goto("/compact-worker-probe")
    const result = await page.evaluate(async () => {
      const worker = new Worker("/src/shared/sekai/update-worker.ts", { type: "module" })
      const ensure = (requestId: string) => new Promise<{ cacheHit: boolean }>((resolve, reject) => {
        worker.onerror = (event) => reject(new Error(event.message))
        worker.onmessage = ({ data }) => {
          if (data.type === "done") resolve(data)
          if (data.type === "error") reject(new Error(data.message))
        }
        worker.postMessage({ type: "ensure-region", requestId, region: "jp", files: ["cards", "gachas"], musicMetas: false })
      })
      const first = await ensure("first")
      const second = await ensure("second")
      worker.terminate()
      const modulePath = "/src/shared/sekai/cache.ts"
      const cache = await import(modulePath)
      return {
        hits: [first.cacheHit, second.cacheHit],
        data: await cache.readSekaiMasterFiles("jp", ["cards", "gachas"]),
        meta: await cache.readSekaiRegionCacheMeta("jp"),
      }
    })
    expect(result.hits).toEqual([false, true])
    expect(result.data).toEqual(original)
    expect(result.meta.master.files).toEqual(["cards", "gachas"])
    expect(downloads.sort()).toEqual((fallback ? ["cards", "compactCards", "compactGachas"] : ["compactCards", "compactGachas"]).sort())
  })
}
