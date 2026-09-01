import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { nextTick } from "vue"
import { useCatalogViewPreference } from "./useCatalogViewPreference"

class MemoryStorage implements Storage {
  private map = new Map<string, string>()

  get length() {
    return this.map.size
  }

  clear() {
    this.map.clear()
  }

  getItem(key: string) {
    return this.map.get(key) ?? null
  }

  key(index: number) {
    return [...this.map.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.map.delete(key)
  }

  setItem(key: string, value: string) {
    this.map.set(key, value)
  }
}

const globalRef = globalThis as { localStorage?: Storage }
let previous: Storage | undefined

beforeEach(() => {
  previous = globalRef.localStorage
  globalRef.localStorage = new MemoryStorage()
})

afterEach(() => {
  if (previous) {
    globalRef.localStorage = previous
  } else {
    delete globalRef.localStorage
  }
})

describe("useCatalogViewPreference", () => {
  test("falls back to the default and persists changes", async () => {
    const art = useCatalogViewPreference("cards", "art", () => "both", ["normal", "trained", "both"])
    expect(art.value).toBe("both")
    art.value = "trained"
    await nextTick()
    expect(globalRef.localStorage?.getItem("catalog:cards:art")).toBe("trained")

    const again = useCatalogViewPreference("cards", "art", () => "both", ["normal", "trained", "both"])
    expect(again.value).toBe("trained")
  })

  test("ignores stored values outside the allowed set", () => {
    globalRef.localStorage?.setItem("catalog:events:view", "carousel")
    const view = useCatalogViewPreference("events", "view", () => "grid", ["grid", "list"])
    expect(view.value).toBe("grid")
  })

  test("handles booleans", async () => {
    const open = useCatalogViewPreference("cards", "filtersOpen", () => true)
    expect(open.value).toBe(true)
    open.value = false
    await nextTick()
    expect(globalRef.localStorage?.getItem("catalog:cards:filtersOpen")).toBe("0")
    expect(useCatalogViewPreference("cards", "filtersOpen", () => true).value).toBe(false)
  })
})
