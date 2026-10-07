import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from "bun:test"
import { createPinia, setActivePinia } from "pinia"
import { useSekaiStationFeedStore as useFeed } from "./sekai-station-feed"
import { useSekaiStationPrefsStore as usePrefs } from "./sekai-station-prefs"

type Listener = (event: { data: string }) => void

class FakeEventSource {
  static instances: FakeEventSource[] = []
  readonly url: string
  onopen: (() => void) | null = null
  onerror: (() => void) | null = null
  closed = false
  private readonly listeners = new Map<string, Listener[]>()

  constructor(url: string) {
    this.url = url
    FakeEventSource.instances.push(this)
  }

  addEventListener(type: string, listener: Listener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener])
  }

  close() {
    this.closed = true
  }

  open() {
    this.onopen?.()
  }

  fail() {
    this.onerror?.()
  }

  emit(type: string, payload: unknown) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ data: JSON.stringify(payload) })
    }
  }

  static latest(): FakeEventSource {
    const latest = FakeEventSource.instances.at(-1)
    if (!latest) {
      throw new Error("no EventSource opened")
    }
    return latest
  }
}

const listenerLog: string[] = []
/** The window/document listeners the store registered, by event type */
const handlers = new Map<string, () => void>()
const fakeTarget = (name: string) => ({
  visibilityState: "visible",
  addEventListener: (type: string, handler: () => void) => {
    listenerLog.push(`${name}+${type}`)
    handlers.set(type, handler)
  },
  removeEventListener: (type: string) => {
    listenerLog.push(`${name}-${type}`)
    handlers.delete(type)
  },
})

/** Every HTTP request the store made: none expected, everything comes from the stream */
const fetchCalls: string[] = []
const originalFetch = globalThis.fetch
const originalEventSource = globalThis.EventSource
// The store reads the API base on use; restored so later test files see the .env value
const previousApiUrl = process.env.VITE_SEKAI_STATION_API_URL

beforeAll(() => {
  process.env.VITE_SEKAI_STATION_API_URL = "https://station.example/station/api/v2"
})

afterAll(() => {
  if (previousApiUrl === undefined) {
    delete process.env.VITE_SEKAI_STATION_API_URL
  } else {
    process.env.VITE_SEKAI_STATION_API_URL = previousApiUrl
  }
})

beforeEach(() => {
  // Fake timers advance Date.now() too (do not combine with setSystemTime: in
  // bun 1.3 advancing timers then resets the clock to the real time)
  jest.useFakeTimers()
  FakeEventSource.instances = []
  listenerLog.length = 0
  handlers.clear()
  fetchCalls.length = 0
  globalThis.EventSource = FakeEventSource as unknown as typeof EventSource
  globalThis.fetch = ((input: string | URL | Request) => {
    fetchCalls.push(String(input))
    return Promise.reject(new Error("unexpected request"))
  }) as unknown as typeof fetch
  Object.assign(globalThis, { window: fakeTarget("window"), document: fakeTarget("document") })
  setActivePinia(createPinia())
})

afterEach(() => {
  jest.useRealTimers()
  globalThis.fetch = originalFetch
  globalThis.EventSource = originalEventSource
  delete (globalThis as { window?: unknown }).window
  delete (globalThis as { document?: unknown }).document
})

const now = () => Math.floor(Date.now() / 1000)

function room(id: string, ageSeconds: number, msg = "") {
  return { time: now() - ageSeconds, id, msg, name: `user${id}`, source: "qq", info: { handle: "", url: "", avatar: null } }
}

async function flush() {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve()
  }
}

const keys = (store: ReturnType<typeof useFeed>) => store.displayItems.map((entry) => entry.key.split("-")[0])

describe("sekai station feed", () => {
  it("merges the replayed burst newest first, dropping expired and duplicate rooms", async () => {
    const store = useFeed()
    store.connect()
    const source = FakeEventSource.latest()
    expect(source.url).toBe("https://station.example/station/api/v2/realtime")
    expect(store.connectionState).toBe("connecting")

    source.open()
    source.emit("room", room("11111", 20))
    source.emit("room", room("33333", 1_000))
    source.emit("room", room("22222", 5))
    source.emit("room", room("22222", 5))
    source.emit("room", ["room", 1, "44444"]) // legacy array: ignored
    expect(store.ready).toBe(false)

    jest.advanceTimersByTime(800)
    expect(store.ready).toBe(true)
    expect(keys(store)).toEqual(["22222", "11111"])

    // Live rooms go on top
    source.emit("room", room("55555", 0))
    expect(keys(store)).toEqual(["55555", "22222", "11111"])
    store.disconnect()
  })

  it("treats a silent stream as lost and reconnects with backoff without blanking the list", async () => {
    const store = useFeed()
    store.connect()
    const source = FakeEventSource.latest()
    source.open()
    source.emit("room", room("11111", 10))
    jest.advanceTimersByTime(800)

    // Heartbeats keep it alive
    jest.advanceTimersByTime(40_000)
    source.emit("heartbeat", { time: Date.now() })
    jest.advanceTimersByTime(40_000)
    expect(store.connectFailed).toBe(false)

    jest.advanceTimersByTime(5_001)
    expect(store.connectFailed).toBe(true)
    expect(store.connectionState).toBe("closed")
    expect(source.closed).toBe(true)
    expect(store.retryAt).not.toBeNull()
    expect(keys(store)).toEqual(["11111"])

    // First retry within 1 s ± 25 %
    jest.advanceTimersByTime(1_250)
    expect(FakeEventSource.instances).toHaveLength(2)
    const retry = FakeEventSource.latest()
    retry.fail()
    // Second retry waits longer (2 s ± 25 %)
    jest.advanceTimersByTime(1_400)
    expect(FakeEventSource.instances).toHaveLength(2)
    jest.advanceTimersByTime(1_200)
    expect(FakeEventSource.instances).toHaveLength(3)

    FakeEventSource.latest().open()
    expect(store.connectFailed).toBe(false)
    expect(store.connectionState).toBe("open")

    // A good connection resets the backoff: the next drop retries within 1 s again
    FakeEventSource.latest().fail()
    jest.advanceTimersByTime(1_250)
    expect(FakeEventSource.instances).toHaveLength(4)
    store.disconnect()
  })

  it("retries at once when the browser comes back online", () => {
    const store = useFeed()
    store.connect()
    FakeEventSource.latest().fail()
    expect(store.retryAt).not.toBeNull()

    handlers.get("online")?.()
    expect(FakeEventSource.instances).toHaveLength(2)
    expect(store.retryAt).toBeNull()
    store.disconnect()
  })

  it("merges a reconnect replay without listing rooms twice", () => {
    const store = useFeed()
    store.connect()
    const first = FakeEventSource.latest()
    first.open()
    // The same objects throughout: room() derives the time, and so the key, from the clock
    const a = room("11111", 10)
    const b = room("22222", 20)
    first.emit("room", a)
    first.emit("room", b)
    jest.advanceTimersByTime(800)
    expect(keys(store)).toEqual(["11111", "22222"])

    // A live duplicate changes nothing
    first.emit("room", a)
    expect(keys(store)).toEqual(["11111", "22222"])

    // The server replays recent rooms on reconnect
    first.fail()
    jest.advanceTimersByTime(1_250)
    const second = FakeEventSource.latest()
    second.open()
    second.emit("room", a)
    second.emit("room", b)
    second.emit("room", room("33333", 0))
    jest.advanceTimersByTime(800)
    expect(keys(store)).toEqual(["33333", "11111", "22222"])
    store.disconnect()
  })

  it("waits for the replay again when everything listed expired while the page was closed", () => {
    const store = useFeed()
    store.connect()
    const first = FakeEventSource.latest()
    first.open()
    first.emit("room", room("11111", 10))
    jest.advanceTimersByTime(800)
    store.disconnect()

    // Back within the window: the list shows at once
    jest.advanceTimersByTime(60_000)
    store.connect()
    expect(store.ready).toBe(true)
    expect(keys(store)).toEqual(["11111"])
    store.disconnect()

    // Back after it expired: loading again, not "no rooms"
    jest.advanceTimersByTime(400_000)
    store.connect()
    expect(store.ready).toBe(false)
    const again = FakeEventSource.latest()
    again.open()
    again.emit("room", room("22222", 0))
    jest.advanceTimersByTime(800)
    expect(store.ready).toBe(true)
    expect(keys(store)).toEqual(["22222"])
    store.disconnect()
  })

  it("stops everything on disconnect", () => {
    const store = useFeed()
    store.connect()
    expect(listenerLog).toEqual(["document+visibilitychange", "window+online"])
    const source = FakeEventSource.latest()
    source.fail()
    expect(store.retryAt).not.toBeNull()

    store.disconnect()
    expect(store.retryAt).toBeNull()
    expect(listenerLog).toEqual(["document+visibilitychange", "window+online", "document-visibilitychange", "window-online"])
    jest.advanceTimersByTime(120_000)
    expect(FakeEventSource.instances).toHaveLength(1)
  })

  it("applies the keyword filter but keeps pins first", () => {
    const store = useFeed()
    const prefs = usePrefs()
    store.connect()
    const source = FakeEventSource.latest()
    source.open()
    source.emit("room", room("11111", 10, "sage only"))
    source.emit("room", room("22222", 5, "veteran"))
    jest.advanceTimersByTime(800)

    prefs.addKeyword("sage")
    expect(keys(store)).toEqual(["22222"])
    prefs.setFilterMode("whitelist")
    expect(keys(store)).toEqual(["11111"])

    const entry = store.displayItems[0]
    if (!entry) {
      throw new Error("expected a room")
    }
    prefs.setFilterMode("blacklist")
    store.pinRoom(entry.key, entry.room)
    expect(keys(store)).toEqual(["11111", "22222"])
    store.disconnect()
  })

  it("hides a blocked room number for 10 minutes and unpins it", async () => {
    const store = useFeed()
    store.connect()
    const source = FakeEventSource.latest()
    source.open()
    const blocked = room("11111", 10)
    source.emit("room", blocked)
    source.emit("room", room("22222", 5))
    jest.advanceTimersByTime(800)
    store.pinRoom(`11111-${blocked.time}`, blocked)

    store.blockRoom("11111")
    expect(keys(store)).toEqual(["22222"])
    expect(store.isPinned(`11111-${blocked.time}`)).toBe(false)
    expect(store.blockedList.map((entry) => entry.id)).toEqual(["11111"])

    // A new post with the same number stays hidden while blocked
    source.emit("room", room("11111", 0, "again"))
    expect(keys(store)).toEqual(["22222"])

    // The expiry timer is scheduled by a watcher, which runs after a microtask
    await flush()
    jest.advanceTimersByTime(10 * 60_000 + 100)
    await flush()
    expect(store.blockedList).toEqual([])

    // By now the old rooms have left the 5-minute window; a new post with the
    // number shows again. Reconnect explicitly: the silent stream has been
    // retrying with random jitter in the meantime.
    store.disconnect()
    store.connect()
    const live = FakeEventSource.latest()
    live.open()
    jest.advanceTimersByTime(800)
    live.emit("room", room("11111", 0, "back"))
    expect(keys(store)).toEqual(["11111"])
    store.disconnect()
  })

  it("unpinning an expired room removes it", () => {
    const store = useFeed()
    const old = room("11111", 1_000)
    store.pinRoom(`11111-${old.time}`, old)
    expect(keys(store)).toEqual(["11111"])
    store.unpinRoom(`11111-${old.time}`)
    expect(keys(store)).toEqual([])
  })

  it("parses statistic events", () => {
    const store = useFeed()
    store.connect()
    FakeEventSource.latest().open()
    FakeEventSource.latest().emit("statistic", { online: 12, past15m: 31 })
    expect(store.statistic).toEqual({ online: 12, past15m: 31 })
    store.disconnect()
  })

  it("only opens the stream and never makes an HTTP request", async () => {
    const store = useFeed()
    store.connect()
    await flush()
    const source = FakeEventSource.latest()
    source.open()
    source.emit("room", room("11111", 10))
    source.emit("roomExtra", { id: "11111", time: Date.now(), data: [3] })
    source.emit("statistic", { online: 12, past15m: 31 })
    jest.advanceTimersByTime(800)
    // A reconnect loads nothing on the side either
    source.fail()
    jest.advanceTimersByTime(1_250)
    FakeEventSource.latest().open()
    jest.advanceTimersByTime(800)
    await flush()

    expect(keys(store)).toEqual(["11111"])
    expect(store.getExtra("11111")?.data).toEqual([3])
    expect(FakeEventSource.instances.map((instance) => instance.url)).toEqual([
      "https://station.example/station/api/v2/realtime",
      "https://station.example/station/api/v2/realtime",
    ])
    expect(fetchCalls).toEqual([])
    store.disconnect()
  })
})
