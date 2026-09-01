import { computed, onScopeDispose, reactive, watch, type ComputedRef } from "vue"
import { useRoute, useRouter, type LocationQuery } from "vue-router"
import { mergeQuery, serializeQueryRecord, type QueryWriteRecord } from "@/lib/query-codec"

export type QueryCodec<T extends object> = {
  /** Every query key this page owns; foreign keys are preserved on write. */
  keys: readonly string[]
  /** Keys that count as user filters (for `activeFilterCount` / `reset`). Defaults to `keys`. */
  filterKeys?: readonly string[]
  defaults: () => T
  parse: (query: LocationQuery) => T
  serialize: (state: T) => QueryWriteRecord
}

export type UseRouteQueryStateOptions<T extends object> = {
  /** Query keys written after a pause instead of on every change (free-text search). */
  debounceKeys?: readonly string[]
  debounceMs?: number
  /**
   * When any owned key other than these changes, `pageKey` is reset to 1
   * (filters changed → back to the first page).
   */
  pageKey?: keyof T & string
  pageNeutralKeys?: readonly string[]
}

export type RouteQueryState<T extends object> = {
  state: T
  /** Resets the given keys (default: `filterKeys`) to their defaults. */
  reset: (keys?: readonly string[]) => void
  isDefault: ComputedRef<boolean>
  activeFilterCount: ComputedRef<number>
}

/**
 * Two-way binding between a reactive state object and `route.query`.
 *
 * - state → URL via `router.replace` (no history entries), only when the
 *   serialized form actually changed, optionally debounced per key;
 * - URL → state on back/forward or external navigation to the same path;
 * - navigation away from the page cancels pending writes so a debounced
 *   search never lands on the next route.
 */
export function useRouteQueryState<T extends object>(
  codec: QueryCodec<T>,
  options: UseRouteQueryStateOptions<T> = {},
): RouteQueryState<T> {
  const route = useRoute()
  const router = useRouter()
  const ownedPath = route.path
  const debounceKeys = new Set(options.debounceKeys ?? [])
  const debounceMs = options.debounceMs ?? 250
  const pageNeutral = new Set<string>([
    ...(options.pageNeutralKeys ?? []),
    ...(options.pageKey ? [options.pageKey] : []),
  ])
  const filterKeys = codec.filterKeys ?? codec.keys

  const state = reactive(codec.parse(route.query)) as T
  let lastRecord = codec.serialize(state)
  let lastWritten = serializeQueryRecord(lastRecord)
  let timer: ReturnType<typeof setTimeout> | null = null
  let disposed = false

  function isOwnedRoute(): boolean {
    return !disposed && route.path === ownedPath
  }

  function cancelPending() {
    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function flush(record: QueryWriteRecord) {
    timer = null
    if (!isOwnedRoute()) {
      return
    }
    const serialized = serializeQueryRecord(record)
    if (serialized === lastWritten) {
      return
    }
    lastWritten = serialized
    void router.replace({ query: mergeQuery(route.query, codec.keys, record) })
  }

  watch(
    () => codec.serialize(state),
    (record) => {
      const serialized = serializeQueryRecord(record)
      if (serialized === lastWritten && timer == null) {
        lastRecord = record
        return
      }

      const changedKeys = codec.keys.filter((key) => record[key] !== lastRecord[key])
      lastRecord = record

      if (
        options.pageKey
        && changedKeys.some((key) => !pageNeutral.has(key))
        && (state as Record<string, unknown>)[options.pageKey] !== 1
      ) {
        ;(state as Record<string, unknown>)[options.pageKey] = 1
        // The page reset re-triggers this watcher with the final record.
        return
      }

      cancelPending()
      if (changedKeys.some((key) => debounceKeys.has(key))) {
        timer = setTimeout(() => flush(codec.serialize(state)), debounceMs)
      } else {
        flush(record)
      }
    },
  )

  watch(
    () => route.query,
    (query) => {
      if (!isOwnedRoute()) {
        cancelPending()
        return
      }
      const parsed = codec.parse(query)
      const record = codec.serialize(parsed)
      const serialized = serializeQueryRecord(record)
      if (serialized === lastWritten) {
        return
      }
      // External change (back/forward, a link with a different query): the
      // URL wins over any pending debounced write.
      cancelPending()
      lastWritten = serialized
      lastRecord = record
      Object.assign(state as object, parsed)
    },
  )

  onScopeDispose(() => {
    disposed = true
    cancelPending()
  })

  const defaultRecord = codec.serialize(codec.defaults())

  const activeFilterCount = computed(() => {
    const record = codec.serialize(state)
    let count = 0
    for (const key of filterKeys) {
      if ((record[key] ?? "") !== (defaultRecord[key] ?? "")) {
        count += 1
      }
    }
    return count
  })

  const isDefault = computed(() => serializeQueryRecord(codec.serialize(state)) === serializeQueryRecord(defaultRecord))

  function reset(keys: readonly string[] = filterKeys) {
    const defaults = codec.defaults() as Record<string, unknown>
    const target = state as Record<string, unknown>
    for (const key of keys) {
      if (key in defaults) {
        target[key] = defaults[key]
      }
    }
  }

  return { state, reset, isDefault, activeFilterCount }
}
