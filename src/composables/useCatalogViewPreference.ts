import { ref, watch, type Ref } from "vue"

const STORAGE_PREFIX = "catalog:"

function storage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage
  } catch {
    return null
  }
}

/**
 * Per-device layout preference for a catalog page (grid/list view, art
 * mode, collapsed filter panel…). Deliberately NOT part of the URL: a shared
 * link must not force the recipient's layout, and layout toggles must not
 * churn the history. Stored in localStorage under `catalog:<page>:<key>`.
 */
export function useCatalogViewPreference<T extends string | boolean>(
  page: string,
  key: string,
  defaultValue: () => T,
  allowed?: readonly T[],
): Ref<T> {
  const storageKey = `${STORAGE_PREFIX}${page}:${key}`

  function read(): T {
    const fallback = defaultValue()
    const store = storage()
    if (!store) {
      return fallback
    }
    const raw = store.getItem(storageKey)
    if (raw == null) {
      return fallback
    }
    if (typeof fallback === "boolean") {
      return (raw === "1" || raw === "true") as T
    }
    if (allowed && !(allowed as readonly string[]).includes(raw)) {
      return fallback
    }
    return raw as T
  }

  const value = ref(read()) as Ref<T>

  watch(value, (next) => {
    const store = storage()
    if (!store) {
      return
    }
    try {
      store.setItem(storageKey, typeof next === "boolean" ? (next ? "1" : "0") : String(next))
    } catch {
      // Storage full or disabled — the preference simply does not persist.
    }
  })

  return value
}

/** True on phone-sized viewports at call time (no reactivity; used for defaults). */
export function isNarrowViewport(maxWidthPx = 767): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false
  }
  return window.matchMedia(`(max-width: ${maxWidthPx}px)`).matches
}
