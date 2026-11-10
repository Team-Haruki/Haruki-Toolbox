import { computed, onMounted, ref, shallowRef, watch, type Ref, type ShallowRef } from "vue"
import { useI18n } from "vue-i18n"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { getDashboard, getTimeseries, getUploadAnalytics } from "@/modules/admin-statistics/api/dashboard"
import { parseUploadAnalytics, type UploadAnalytics } from "@/modules/admin-statistics/lib/dashboard-analytics"
import { assertDashboardPayload } from "@/modules/admin-statistics/lib/dashboard-payload"
import type { DashboardData, TimeseriesPoint } from "@/types/admin"

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

/** The hourly buckets of the last 24 hours and of the 24 hours before them. */
export interface DashboardPulse {
  current: TimeseriesPoint[]
  previous: TimeseriesPoint[]
}

/** A loaded trend with the window it was requested for (the selects may already say something newer). */
export interface DashboardTrend {
  points: TimeseriesPoint[]
  days: number
  bucket: string
}

interface DashboardResource<T> {
  data: ShallowRef<T | null>
  loading: Ref<boolean>
  /** A failed load, shown inline where the data would be: zeros would read as real data. */
  error: Ref<ErrorDescription | null>
  load: () => Promise<void>
}

export function useDashboardStats() {
  const { t } = useI18n()

  /**
   * One independently loaded part of the page. Only the latest request of a
   * resource lands; a failed load drops the previous data so the panel shows
   * its error state instead of numbers that are no longer confirmed.
   */
  function defineResource<T>(fetch: () => Promise<T>): DashboardResource<T> {
    const data = shallowRef<T | null>(null)
    const loading = ref(true)
    const error = ref<ErrorDescription | null>(null)
    let latestRequest = 0

    async function load() {
      const requestId = ++latestRequest
      loading.value = true
      error.value = null
      try {
        const value = await fetch()
        if (requestId !== latestRequest) return
        data.value = value
      } catch (cause: unknown) {
        if (requestId !== latestRequest) return
        data.value = null
        error.value = describeError(cause, t("adminStatistics.dashboard.toast.loadFailedFallback"))
      } finally {
        if (requestId === latestRequest) {
          loading.value = false
        }
      }
    }

    return { data, loading, error, load }
  }

  // A 200 with another shape must not reach the render: it lands in the same
  // inline error state as a failed request.
  const dashboardResource = defineResource<DashboardData>(async () => assertDashboardPayload(await getDashboard()))

  // The backend caps a timeseries range at 30 days (`MaxUploadLogTimeRange`).
  const rangeDays = ref(30)
  const bucket = ref("day")
  const rangeOptions = computed(() => [
    { value: "7", label: t("adminStatistics.dashboard.chart.range7d") },
    { value: "14", label: t("adminStatistics.dashboard.chart.range14d") },
    { value: "30", label: t("adminStatistics.dashboard.chart.range30d") },
  ])
  const bucketOptions = computed(() => [
    { value: "day", label: t("adminStatistics.dashboard.chart.bucketDay") },
    { value: "week", label: t("adminStatistics.dashboard.chart.bucketWeek") },
    { value: "month", label: t("adminStatistics.dashboard.chart.bucketMonth") },
  ])

  // Align day/week/month buckets to the viewer's local calendar instead of UTC.
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const chartResource = defineResource<DashboardTrend>(async () => {
    const days = rangeDays.value
    const requestedBucket = bucket.value
    const to = new Date()
    const from = new Date(to.getTime() - days * DAY_MS)
    const response = await getTimeseries({
      bucket: requestedBucket,
      from: from.toISOString(),
      to: to.toISOString(),
      tz: timeZone,
    })
    return { points: response.points || [], days, bucket: requestedBucket }
  })

  // Two adjacent 24-hour windows, each cut at the same minute as "now": their
  // sums are the exact rolling totals, so the change between them is exact too.
  const pulseResource = defineResource<DashboardPulse>(async () => {
    const now = Date.now()
    const hourly = async (from: number, to: number) => {
      const response = await getTimeseries({
        bucket: "hour",
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
        tz: timeZone,
      })
      return response.points || []
    }
    const [current, previous] = await Promise.all([
      hourly(now - DAY_MS, now),
      hourly(now - 2 * DAY_MS, now - DAY_MS),
    ])
    return { current, previous }
  })

  const analyticsResource = defineResource<UploadAnalytics>(async () => parseUploadAnalytics(await getUploadAnalytics()))

  function reload() {
    void dashboardResource.load()
    void chartResource.load()
    void pulseResource.load()
    void analyticsResource.load()
  }

  function onRangeChange(value: unknown) {
    const next = Number(value)
    if (!Number.isFinite(next) || next <= 0) return
    rangeDays.value = next
  }

  function onBucketChange(value: unknown) {
    if (typeof value === "string" && value) {
      bucket.value = value
    }
  }

  watch([rangeDays, bucket], () => {
    void chartResource.load()
  })

  const refreshing = computed(() =>
    dashboardResource.loading.value
    || chartResource.loading.value
    || pulseResource.loading.value
    || analyticsResource.loading.value)

  onMounted(() => {
    reload()
  })

  return {
    dashboard: dashboardResource.data,
    loading: dashboardResource.loading,
    dashboardError: dashboardResource.error,
    loadDashboard: dashboardResource.load,
    trend: chartResource.data,
    chartLoading: chartResource.loading,
    chartError: chartResource.error,
    loadChart: chartResource.load,
    pulse: pulseResource.data,
    pulseLoading: pulseResource.loading,
    pulseError: pulseResource.error,
    loadPulse: pulseResource.load,
    analytics: analyticsResource.data,
    analyticsLoading: analyticsResource.loading,
    analyticsError: analyticsResource.error,
    loadAnalytics: analyticsResource.load,
    rangeDays,
    bucket,
    rangeOptions,
    bucketOptions,
    onRangeChange,
    onBucketChange,
    reload,
    refreshing,
  }
}
