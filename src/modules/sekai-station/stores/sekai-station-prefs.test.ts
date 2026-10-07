import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { createApp } from "vue"
import { createPinia, setActivePinia } from "pinia"
import { createPersistedState } from "pinia-plugin-persistedstate"
import { clampNumber, useSekaiStationPrefsStore } from "./sekai-station-prefs"

const globalRef = globalThis as { window?: unknown }
const previousWindow = globalRef.window

afterEach(() => {
  if (previousWindow === undefined) {
    delete globalRef.window
  } else {
    globalRef.window = previousWindow
  }
})

beforeEach(() => {
  setActivePinia(createPinia())
})

describe("clampNumber", () => {
  it("clamps into range and falls back for non-numbers", () => {
    const range = { min: 10, max: 600, default: 300 }
    expect(clampNumber(5, range)).toBe(10)
    expect(clampNumber(900, range)).toBe(600)
    expect(clampNumber(120, range)).toBe(120)
    expect(clampNumber("120", range)).toBe(300)
    expect(clampNumber(Number.NaN, range)).toBe(300)
  })
})

describe("sekai station prefs", () => {
  it("adds keywords trimmed and once", () => {
    const prefs = useSekaiStationPrefsStore()
    expect(prefs.addKeyword("  sage ")).toBe(true)
    expect(prefs.addKeyword("sage")).toBe(false)
    expect(prefs.addKeyword("   ")).toBe(false)
    expect(prefs.filterKeywords).toEqual(["sage"])
    prefs.removeKeyword("sage")
    expect(prefs.filterKeywords).toEqual([])
  })

  it("only keeps preset tags and combines them with keywords", () => {
    const prefs = useSekaiStationPrefsStore()
    prefs.toggleTag("🦐")
    prefs.toggleTag("not-a-preset")
    prefs.addKeyword("veteran")
    expect(prefs.filterTags).toEqual(["🦐"])
    expect(prefs.filterTerms).toEqual(["🦐", "veteran"])
    expect(prefs.hasActiveFilters).toBe(true)
    prefs.toggleTag("🦐")
    prefs.clearFilters()
    expect(prefs.hasActiveFilters).toBe(false)
  })

  it("ignores a stored tag that is no longer offered", () => {
    const prefs = useSekaiStationPrefsStore()
    prefs.filterTags = ["retired-tag", "龙"]
    expect(prefs.activeTags).toEqual(["龙"])
  })

  it("clamps display settings", () => {
    const prefs = useSekaiStationPrefsStore()
    prefs.setExpireSeconds(5)
    prefs.setFontSize(30.4)
    prefs.setLineHeight(1.234)
    expect([prefs.expireSeconds, prefs.fontSize, prefs.lineHeight]).toEqual([10, 20, 1.2])
    prefs.setFilterMode("whitelist")
    expect(prefs.filterMode).toBe("whitelist")
  })

  it("repairs values restored from storage", () => {
    const prefs = useSekaiStationPrefsStore()
    Object.assign(prefs, {
      expireSeconds: "a lot",
      filterMode: "everything",
      filterKeywords: [" sage ", 3, "sage", ""],
      filterTags: "🦐",
      fontSize: 99,
      lineHeight: null,
    })
    prefs.normalize()
    expect(prefs.expireSeconds).toBe(300)
    expect(prefs.filterMode).toBe("blacklist")
    expect(prefs.filterKeywords).toEqual(["sage"])
    expect(prefs.filterTags).toEqual([])
    expect(prefs.fontSize).toBe(20)
    expect(prefs.lineHeight).toBe(1.5)
  })
})

describe("persisted sekai station prefs", () => {
  it("repairs bad values when they are restored", () => {
    const stored = new Map<string, string>([["sekai-station-prefs", JSON.stringify({
      expireSeconds: 5,
      filterMode: "nope",
      filterKeywords: [" sage ", 3, "sage"],
      filterTags: "🦐",
      fontSize: "big",
      lineHeight: 9,
    })]])
    // pinia-plugin-persistedstate reads window.localStorage
    globalRef.window = {
      localStorage: {
        getItem: (key: string) => stored.get(key) ?? null,
        setItem: (key: string, value: string) => stored.set(key, value),
        removeItem: (key: string) => stored.delete(key),
      },
    }
    const pinia = createPinia().use(createPersistedState())
    // Plugins only run once pinia is installed in an app
    createApp({}).use(pinia)
    setActivePinia(pinia)

    const prefs = useSekaiStationPrefsStore()
    expect(prefs.expireSeconds).toBe(10)
    expect(prefs.filterMode).toBe("blacklist")
    expect(prefs.filterKeywords).toEqual(["sage"])
    expect(prefs.filterTags).toEqual([])
    expect(prefs.fontSize).toBe(14)
    expect(prefs.lineHeight).toBe(2)
  })
})
