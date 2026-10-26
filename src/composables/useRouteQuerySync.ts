import { onScopeDispose, watch } from "vue"
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router"
import { mergeQuery, readQueryString, serializeQueryRecord, type QueryWriteRecord } from "@/lib/query-codec"

/**
 * One-way mirror of list state (filters, page, page size) into `route.query`,
 * the way the admin user list keeps its state shareable and restorable after
 * navigating into a detail page and back.
 *
 * `keys` are every query key the page owns; `build` returns their current
 * values (`undefined` omits a key, so defaults keep the address bar short).
 * Foreign keys are preserved, writes use `router.replace` so they add no
 * history entries, a write that would not change the URL is skipped, and a
 * write that would land after the user started leaving the page is dropped
 * so it cannot abort their navigation.
 *
 * Pages parse the initial `route.query` themselves (see `@/lib/query-codec`).
 */
export function useRouteQuerySync(keys: readonly string[], build: () => QueryWriteRecord): void {
  const route = useRoute()
  const router = useRouter()
  const ownedPath = route.path
  let leaving = false

  function currentOwnedRecord(): QueryWriteRecord {
    const record: QueryWriteRecord = {}
    for (const key of keys) {
      record[key] = readQueryString(route.query[key]) ?? undefined
    }
    return record
  }

  function sync(record: QueryWriteRecord) {
    if (leaving || router.currentRoute.value.path !== ownedPath) return
    if (serializeQueryRecord(record) === serializeQueryRecord(currentOwnedRecord())) return
    void router.replace({ query: mergeQuery(route.query, keys, record) }).catch(() => undefined)
  }

  watch(build, sync)

  onBeforeRouteLeave((to, from) => {
    if (to.path !== from.path) {
      leaving = true
    }
  })

  // An aborted/cancelled navigation leaves the page mounted; resume syncing.
  const removeAfterEach = router.afterEach((_to, _from, failure) => {
    if (failure && router.currentRoute.value.path === ownedPath) {
      leaving = false
    }
  })

  onScopeDispose(() => {
    leaving = true
    removeAfterEach()
  })
}
