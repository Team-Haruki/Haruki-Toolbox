import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { getAdminTickets } from "@/modules/tickets/api/admin"
import {
  buildAdminTicketCountQueries,
  summarizeAdminTicketCounts,
  type AdminTicketCounts,
} from "@/modules/tickets/lib/admin-ticket-stats"

/**
 * Whole-set ticket counts for the admin list's stat panel. They do not
 * follow the list's filters or page: each is the `total` of its own
 * single-row list request (see `lib/admin-ticket-stats`), loaded on mount
 * and again when the list is refreshed by hand.
 */
export function useAdminTicketListStats() {
  const counts = ref<AdminTicketCounts>({})
  // True until the first answer; a later reload keeps the old figures on
  // screen so the numbers glide to the new ones instead of blinking out.
  const loading = ref(true)
  const reloading = ref(false)
  const failed = ref(false)
  let latestRequestId = 0

  async function load() {
    const requestId = ++latestRequestId
    reloading.value = true
    const queries = buildAdminTicketCountQueries()
    const results = await Promise.allSettled(queries.map((query) => getAdminTickets(query.params)))
    if (requestId !== latestRequestId) return

    const next: AdminTicketCounts = {}
    let anyFailed = false
    results.forEach((result, index) => {
      const key = queries[index]!.key
      if (result.status === "fulfilled") {
        next[key] = result.value.total
      } else {
        next[key] = null
        anyFailed = true
      }
    })
    counts.value = next
    failed.value = anyFailed
    loading.value = false
    reloading.value = false
  }

  const summary = computed(() => summarizeAdminTicketCounts(counts.value))

  onMounted(() => {
    void load()
  })

  onBeforeUnmount(() => {
    latestRequestId += 1
  })

  return {
    summary,
    loading,
    reloading,
    failed,
    load,
  }
}
