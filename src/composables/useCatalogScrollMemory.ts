import { nextTick, onMounted, watch, type Ref } from "vue"
import { onBeforeRouteLeave, useRoute } from "vue-router"

const STORAGE_PREFIX = "catalog-scroll:"
const MAX_ENTRIES = 24

function storage(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage
  } catch {
    return null
  }
}

function readEntry(key: string): number | null {
  const store = storage()
  if (!store) {
    return null
  }
  const raw = store.getItem(key)
  const parsed = raw == null ? Number.NaN : Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function writeEntry(key: string, value: number): void {
  const store = storage()
  if (!store) {
    return
  }
  try {
    store.setItem(key, String(Math.round(value)))
    pruneEntries(store)
  } catch {
    // Quota exceeded or storage disabled — scroll memory is best-effort.
  }
}

function pruneEntries(store: Storage): void {
  const keys: string[] = []
  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index)
    if (key?.startsWith(STORAGE_PREFIX)) {
      keys.push(key)
    }
  }
  // sessionStorage has no ordering guarantee; dropping the oldest inserted
  // entries is approximated by dropping the first reported ones.
  while (keys.length > MAX_ENTRIES) {
    const key = keys.shift()
    if (key) {
      store.removeItem(key)
    }
  }
}

/**
 * Remembers the window scroll position of a catalog list per `fullPath`
 * (filters live in the query, so the key identifies the exact listing) and
 * restores it once the list has rendered real content. The router's own
 * `savedPosition` cannot do this: the list remounts behind the page-fade
 * transition and the saved offset lands on a skeleton that is shorter than
 * the eventual content.
 */
export function useCatalogScrollMemory(ready: Ref<boolean>): void {
  const route = useRoute()
  let pendingKey: string | null = null
  let restoreTimer: ReturnType<typeof setTimeout> | null = null

  function cancelRestore() {
    if (restoreTimer != null) {
      clearTimeout(restoreTimer)
      restoreTimer = null
    }
  }

  function restore(target: number) {
    cancelRestore()
    let attempts = 0
    const attempt = () => {
      restoreTimer = null
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      if (maxScroll >= target || attempts >= 8) {
        window.scrollTo({ top: Math.min(target, maxScroll), behavior: "auto" })
        return
      }
      // Content (thumbnails, fonts) may still be laying out; retry briefly.
      attempts += 1
      restoreTimer = setTimeout(attempt, 60)
    }
    // Wait for the page-fade transition (150 ms) and the first paint.
    restoreTimer = setTimeout(() => {
      requestAnimationFrame(attempt)
    }, 180)
  }

  onMounted(() => {
    pendingKey = `${STORAGE_PREFIX}${route.fullPath}`
  })

  watch(ready, async (isReady) => {
    if (!isReady || pendingKey == null) {
      return
    }
    const key = pendingKey
    pendingKey = null
    const target = readEntry(key)
    storage()?.removeItem(key)
    if (target == null) {
      return
    }
    await nextTick()
    restore(target)
  }, { immediate: true })

  onBeforeRouteLeave((to, from) => {
    cancelRestore()
    if (to.path === from.path) {
      return
    }
    if (typeof window !== "undefined" && window.scrollY > 0) {
      writeEntry(`${STORAGE_PREFIX}${from.fullPath}`, window.scrollY)
    }
  })
}
