import { computed, ref } from "vue"
import { defineStore } from "pinia"
import {
  EXPIRE_SECONDS,
  FONT_SIZE,
  LINE_HEIGHT,
  PRESET_TAGS,
} from "@/modules/sekai-station/lib/sekai-station-constants"
import type { StationFilterMode } from "@/modules/sekai-station/lib/station-types"

export function clampNumber(value: unknown, range: { min: number; max: number; default: number }): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(range.max, Math.max(range.min, value)) : range.default
}

/** Trimmed, non-empty, de-duplicated strings */
function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  const items = value.filter((item): item is string => typeof item === "string").map((item) => item.trim())
  return [...new Set(items.filter((item) => item !== ""))]
}

/**
 * The room feed's display and filter preferences, kept per device. Ported
 * from Sekai Station's settings store (MIT © middlered) without the parts the
 * Toolbox already owns (theme, language, effects).
 */
export const useSekaiStationPrefsStore = defineStore("sekai-station-prefs", () => {
  /** How long a room stays listed after it was posted */
  const expireSeconds = ref<number>(EXPIRE_SECONDS.default)
  const filterMode = ref<StationFilterMode>("blacklist")
  const filterKeywords = ref<string[]>([])
  /** Selected preset chips (subset of PRESET_TAGS) */
  const filterTags = ref<string[]>([])
  const fontSize = ref<number>(FONT_SIZE.default)
  const lineHeight = ref<number>(LINE_HEIGHT.default)

  // A saved tag that is no longer offered has no chip to turn it off, so it is ignored
  const activeTags = computed(() => filterTags.value.filter((tag) => PRESET_TAGS.includes(tag)))
  const filterTerms = computed(() => [...activeTags.value, ...filterKeywords.value])
  const hasActiveFilters = computed(() => filterTerms.value.length > 0)

  function setExpireSeconds(seconds: number) {
    expireSeconds.value = clampNumber(seconds, EXPIRE_SECONDS)
  }

  function setFilterMode(mode: StationFilterMode) {
    filterMode.value = mode === "whitelist" ? "whitelist" : "blacklist"
  }

  /** Adds a keyword; returns false when it is empty or already present */
  function addKeyword(keyword: string): boolean {
    const trimmed = keyword.trim()
    if (!trimmed || filterKeywords.value.includes(trimmed)) {
      return false
    }
    filterKeywords.value = [...filterKeywords.value, trimmed]
    return true
  }

  function removeKeyword(keyword: string) {
    filterKeywords.value = filterKeywords.value.filter((item) => item !== keyword)
  }

  function setTags(tags: readonly string[]) {
    filterTags.value = stringList(tags).filter((tag) => PRESET_TAGS.includes(tag))
  }

  function toggleTag(tag: string) {
    setTags(filterTags.value.includes(tag) ? filterTags.value.filter((item) => item !== tag) : [...filterTags.value, tag])
  }

  function clearFilters() {
    filterTags.value = []
    filterKeywords.value = []
  }

  function setFontSize(size: number) {
    fontSize.value = clampNumber(Math.round(size), FONT_SIZE)
  }

  function setLineHeight(value: number) {
    lineHeight.value = clampNumber(Math.round(value * 10) / 10, LINE_HEIGHT)
  }

  /** Repairs values restored from storage (older versions, hand edits) */
  function normalize() {
    expireSeconds.value = clampNumber(expireSeconds.value, EXPIRE_SECONDS)
    filterMode.value = filterMode.value === "whitelist" ? "whitelist" : "blacklist"
    filterKeywords.value = stringList(filterKeywords.value)
    filterTags.value = stringList(filterTags.value)
    fontSize.value = clampNumber(fontSize.value, FONT_SIZE)
    lineHeight.value = clampNumber(lineHeight.value, LINE_HEIGHT)
  }

  return {
    expireSeconds,
    filterMode,
    filterKeywords,
    filterTags,
    fontSize,
    lineHeight,
    activeTags,
    filterTerms,
    hasActiveFilters,
    setExpireSeconds,
    setFilterMode,
    addKeyword,
    removeKeyword,
    setTags,
    toggleTag,
    clearFilters,
    setFontSize,
    setLineHeight,
    normalize,
  }
}, {
  persist: {
    pick: ["expireSeconds", "filterMode", "filterKeywords", "filterTags", "fontSize", "lineHeight"],
    afterHydrate: ({ store }) => {
      store.normalize()
    },
  },
})
