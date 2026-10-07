import { expect, test, type Page } from "@playwright/test"

// `.env.e2e` points the Sekai Station API at this closed port. The page only
// reads the room stream (an EventSource, which page.route cannot serve), so the
// specs replace it with a fake in the page and record every HTTP request that
// still goes to the API: there should be none. The Toolbox's own backends share
// the closed origin, so the API is told apart by its (Mafuyu v2) endpoints.
const STATION_ORIGIN = "http://127.0.0.1:9"
const STATION_ENDPOINT = /^\/(announcement|status|recent|statistic|realtime)(\/|$)/

interface FakeRoom {
  /** Seconds before the stream opens */
  age: number
  id: string
  msg: string
  name: string
  source: string
}

const ROOMS: FakeRoom[] = [
  { age: 40, id: "22222", msg: "3/5 veteran only, fast clear", name: "Kanade", source: "qq" },
  { age: 10, id: "11111", msg: "缺1 自由 来", name: "Mizuki", source: "qq" },
  { age: 90, id: "33333", msg: "长期车 欢迎新人", name: "Ena", source: "qq" },
  { age: 150, id: "44444", msg: "清火 2/5", name: "Mafuyu", source: "qq" },
]

const ROOM_ID_BUTTON = /^(复制房间号|Copy room number) \d{5}$/

/** Installs the fake stream; returns the HTTP requests made to the Sekai Station API */
async function installFakeStation(page: Page): Promise<string[]> {
  await page.addInitScript((rooms: FakeRoom[]) => {
    type Payload = Record<string, unknown>
    const open = new Set<FakeEventSource>()
    const streamUrls: string[] = []

    function toRoom(room: { age?: number; id: string; msg: string; name: string; source: string }): Payload {
      return {
        time: Math.floor(Date.now() / 1000) - (room.age ?? 0),
        id: room.id,
        msg: room.msg,
        name: room.name,
        source: room.source,
        info: { handle: "", url: "", avatar: null },
      }
    }

    class FakeEventSource extends EventTarget {
      static readonly CONNECTING = 0
      static readonly OPEN = 1
      static readonly CLOSED = 2
      readonly CONNECTING = 0
      readonly OPEN = 1
      readonly CLOSED = 2
      readonly url: string
      readonly withCredentials = false
      readyState = 0
      onopen: ((event: Event) => void) | null = null
      onmessage: ((event: MessageEvent) => void) | null = null
      onerror: ((event: Event) => void) | null = null

      constructor(url: string | URL) {
        super()
        this.url = String(url)
        streamUrls.push(this.url)
        setTimeout(() => {
          if (this.readyState === 2) {
            return
          }
          if (!this.url.endsWith("/realtime")) {
            this.readyState = 2
            this.onerror?.(new Event("error"))
            return
          }
          this.readyState = 1
          open.add(this)
          this.onopen?.(new Event("open"))
          // The server replays recent rooms right after the stream opens
          for (const room of rooms) {
            this.emit("room", toRoom(room))
          }
          this.emit("statistic", { online: 42, past15m: 7 })
        }, 20)
      }

      emit(type: string, payload: Payload) {
        this.dispatchEvent(new MessageEvent(type, { data: JSON.stringify(payload) }))
      }

      close() {
        this.readyState = 2
        open.delete(this)
      }
    }

    const target = window as unknown as {
      EventSource: unknown
      __stationPushRoom: (room: { id: string; msg: string; name: string; source: string }) => void
      __stationStreamUrls: string[]
    }
    target.EventSource = FakeEventSource
    target.__stationStreamUrls = streamUrls
    // A room posted now, as it would arrive live after the replay
    target.__stationPushRoom = (room) => {
      for (const source of open) {
        source.emit("room", toRoom(room))
      }
    }
  }, ROOMS)

  const stationRequests: string[] = []
  page.on("request", (request) => {
    const url = new URL(request.url())
    if (url.origin === STATION_ORIGIN && STATION_ENDPOINT.test(url.pathname)) {
      stationRequests.push(request.url())
    }
  })
  // Keep the page on-origin (no analytics, no real backends)
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    return url.host === "127.0.0.1:4173" ? route.continue() : route.abort()
  })
  return stationRequests
}

function roomIdButton(page: Page, id: string) {
  return page.getByRole("button", { name: new RegExp(`^(复制房间号|Copy room number) ${id}$`) })
}

test.describe("sekai station", () => {
  let stationRequests: string[] = []

  test.beforeEach(async ({ page }) => {
    stationRequests = await installFakeStation(page)
  })

  test("sidebar entry opens the room feed", async ({ page }) => {
    await page.goto("/")

    await page.locator('[data-sidebar="sidebar"]').getByRole("link", { name: /^(协力车站|Sekai Station)$/ }).click()

    await expect(page).toHaveURL(/\/sekai-station$/)
    await expect(page.getByRole("heading", { level: 1, name: /协力车站|Sekai Station/ })).toBeVisible()
    const siteLink = page.getByRole("link", { name: /^(在Sekai Station中查看|View on Sekai Station)$/ })
    await expect(siteLink).toHaveAttribute("href", "https://pjsk-zh.mid.red")
    await expect(siteLink).toHaveAttribute("target", "_blank")
    await expect(page.getByRole("tab")).toHaveCount(0)
  })

  test("reads everything from the stream and sends no request to the API", async ({ page }) => {
    await page.goto("/sekai-station")

    await expect(page.getByRole("button", { name: ROOM_ID_BUTTON })).toHaveText(["11111", "22222", "33333", "44444"])
    await expect(page.locator('[data-slot="station-toolbar"]')).toContainText(/42 (人在线|online)/)
    await page.evaluate(() => {
      const target = window as unknown as { __stationPushRoom: (room: object) => void }
      target.__stationPushRoom({ id: "55555", msg: "live room", name: "Ichika", source: "qq" })
    })
    await expect(roomIdButton(page, "55555")).toBeVisible()
    await page.waitForLoadState("networkidle")

    expect(await page.evaluate(() => (window as unknown as { __stationStreamUrls: string[] }).__stationStreamUrls)).toEqual([
      `${STATION_ORIGIN}/realtime`,
    ])
    expect(stationRequests).toEqual([])
  })

  test("lists replayed rooms newest first, then live rooms on top", async ({ page }) => {
    await page.goto("/sekai-station")

    const ids = page.getByRole("button", { name: ROOM_ID_BUTTON })
    await expect(ids).toHaveText(["11111", "22222", "33333", "44444"])
    const toolbar = page.locator('[data-slot="station-toolbar"]')
    await expect(toolbar).toContainText(/42 (人在线|online)/)
    await expect(toolbar).toContainText(/已连接|Connected/)

    await page.evaluate(() => {
      const target = window as unknown as { __stationPushRoom: (room: object) => void }
      target.__stationPushRoom({ id: "55555", msg: "live room", name: "Ichika", source: "qq" })
    })
    await expect(ids).toHaveText(["55555", "11111", "22222", "33333", "44444"])
  })

  test("a blacklist keyword hides matching rooms until its chip is removed", async ({ page }) => {
    await page.goto("/sekai-station")
    await expect(roomIdButton(page, "22222")).toBeVisible()

    await page.locator('[data-slot="station-toolbar"]').getByRole("button", { name: /^(筛选与显示|Filter & display)$/ }).click()
    const keyword = page.getByRole("textbox", { name: /^(添加关键词|Add keyword)$/ })
    await keyword.fill("veteran")
    await keyword.press("Enter")
    await keyword.press("Escape")

    await expect(roomIdButton(page, "22222")).toHaveCount(0)
    await expect(roomIdButton(page, "11111")).toBeVisible()

    const filterBar = page.locator('[data-slot="station-active-filters"]')
    const chip = filterBar.getByRole("button", { name: /veteran/ })
    await expect(chip).toBeVisible()
    await chip.click()

    await expect(roomIdButton(page, "22222")).toBeVisible()
    await expect(filterBar).toHaveCount(0)
  })

  test("clicking a room number copies it", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await page.goto("/sekai-station")

    await roomIdButton(page, "11111").click()

    await expect(page.getByText(/^(已复制|Copied)$/)).toBeVisible()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("11111")
    await expect(roomIdButton(page, "11111")).toBeVisible()
  })

  test("holding a room number hides it and undo brings it back", async ({ page }) => {
    await page.goto("/sekai-station")
    const target = roomIdButton(page, "33333")
    await expect(target).toBeVisible()

    const box = await target.boundingBox()
    expect(box).not.toBeNull()
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    // The block fires while the number is still held (HOLD_TO_BLOCK_MS)
    await expect(roomIdButton(page, "33333")).toHaveCount(0)
    await page.mouse.up()
    await expect(page.getByText(/(已屏蔽|Hid) 33333/)).toBeVisible()

    await page.getByRole("button", { name: /^(撤销|Undo)$/ }).click()
    await expect(roomIdButton(page, "33333")).toBeVisible()
    await expect(page.getByRole("button", { name: ROOM_ID_BUTTON })).toHaveText(["11111", "22222", "33333", "44444"])
  })
})
