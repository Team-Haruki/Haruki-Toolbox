import { onBeforeUnmount, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { getDashboard, getTimeseries } from "@/modules/admin-statistics/api"
import { UnexpectedPayloadError } from "@/modules/admin/lib/unexpected-payload"
import {
  buildDirectoryStats,
  buildRegistrationTrend,
  readDirectoryCounts,
  type DirectoryStats,
  type RegistrationTrend,
} from "@/modules/admin-users/lib/user-stats"

/** Calendar days of registrations behind the sparkline, today included. */
export const REGISTRATION_TREND_DAYS = 14

/**
 * Site-wide user counters for the list's stat panel. They come from the
 * dashboard statistics (`users` of GET /api/admin/statistics/dashboard) and
 * the daily registrations of GET /api/admin/statistics/timeseries, not from
 * the list response: the list only knows the current filter and page.
 *
 * The first load shows skeletons; later reloads (after a batch action) keep
 * the figures on screen and let them glide to the new values.
 */
export function useAdminUserDirectoryStats() {
  const { t } = useI18n()
  const stats = ref<DirectoryStats | null>(null)
  const statsLoading = ref(true)
  const statsError = ref<ErrorDescription | null>(null)
  // Null when the trend could not be loaded: the tile then shows no sparkline.
  const registrations = ref<RegistrationTrend | null>(null)
  let latestRequest = 0

  async function loadCounts(requestId: number) {
    try {
      const counts = readDirectoryCounts(await getDashboard())
      if (!counts) {
        throw new UnexpectedPayloadError("/api/admin/statistics/dashboard")
      }
      if (requestId !== latestRequest) return
      stats.value = buildDirectoryStats(counts)
      statsError.value = null
    } catch (error: unknown) {
      if (requestId !== latestRequest) return
      stats.value = null
      statsError.value = describeError(error, t("adminUsers.management.stats.loadFailed"))
    }
  }

  async function loadRegistrations(requestId: number) {
    try {
      const to = new Date()
      // From local midnight, so the range is whole calendar days plus today.
      const from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - (REGISTRATION_TREND_DAYS - 1))
      const response = await getTimeseries({
        bucket: "day",
        from: from.toISOString(),
        to: to.toISOString(),
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      if (requestId !== latestRequest) return
      registrations.value = Array.isArray(response?.points) ? buildRegistrationTrend(response.points) : null
    } catch {
      if (requestId !== latestRequest) return
      // Decoration only: the total above it is still correct without it.
      registrations.value = null
    }
  }

  async function loadStats() {
    const requestId = ++latestRequest
    statsLoading.value = true
    await Promise.all([loadCounts(requestId), loadRegistrations(requestId)])
    if (requestId === latestRequest) {
      statsLoading.value = false
    }
  }

  onMounted(() => {
    void loadStats()
  })

  onBeforeUnmount(() => {
    latestRequest += 1
  })

  return {
    stats,
    statsLoading,
    statsError,
    registrations,
    reloadStats: () => {
      void loadStats()
    },
  }
}
