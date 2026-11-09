import { computed, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideLink,
  LucideShield,
  LucideUploadCloud,
  LucideUsers,
} from "lucide-vue-next"
import { formatLocalizedDate } from "@/lib/date-time"
import { formatNumberCN } from "@/lib/number-format"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { getDashboard, getTimeseries } from "@/modules/admin-statistics/api/dashboard"
import { toBreakdownItems } from "@/modules/admin-statistics/lib/dashboard-breakdown"
import { assertDashboardPayload } from "@/modules/admin-statistics/lib/dashboard-payload"
import {
  resolveUploadDataTypeLabel,
  resolveUploadMethodLabel,
  resolveUploadServerLabel,
} from "@/modules/admin-statistics/lib/upload-log-meta"
import type { DashboardData, TimeseriesPoint } from "@/types/admin"
import { buildPairedAxes } from "@/modules/admin-statistics/lib/dashboard-chart-axes"

const DAY_MS = 24 * 60 * 60 * 1000

// Mid-tone series colors validated against both themes (dataviz palette checks):
// blue/red pass CVD and contrast as a pair; the darker green holds 3:1 on light.
export const SERIES_COLORS = {
  uploads: "#3b82f6",
  failures: "#ef4444",
  registrations: "#16a34a",
} as const

export function useDashboardStats() {
  const { t } = useI18n()
  const loading = ref(true)
  const dashboard = ref<DashboardData | null>(null)
  // A failed load is shown inline in place of the cards (no toast): zeros
  // would read as real data.
  const dashboardError = ref<ErrorDescription | null>(null)
  const chartData = ref<TimeseriesPoint[]>([])
  const chartLoading = ref(true)
  const chartError = ref<ErrorDescription | null>(null)
  const rangeDays = ref(30)
  const bucket = ref("day")
  let latestDashboardRequest = 0
  let latestChartRequest = 0

  const rangeOptions = computed(() => [
    { value: "7", label: t("adminStatistics.dashboard.chart.range7d") },
    { value: "30", label: t("adminStatistics.dashboard.chart.range30d") },
    { value: "90", label: t("adminStatistics.dashboard.chart.range90d") },
  ])
  const bucketOptions = computed(() => [
    { value: "day", label: t("adminStatistics.dashboard.chart.bucketDay") },
    { value: "week", label: t("adminStatistics.dashboard.chart.bucketWeek") },
    { value: "month", label: t("adminStatistics.dashboard.chart.bucketMonth") },
  ])

  async function loadDashboard() {
    const requestId = ++latestDashboardRequest
    loading.value = true
    dashboardError.value = null
    try {
      // A 200 with another shape must not reach the render: it lands in the
      // same inline error state as a failed request.
      const data = assertDashboardPayload(await getDashboard())
      if (requestId !== latestDashboardRequest) return
      dashboard.value = data
    } catch (error: unknown) {
      if (requestId !== latestDashboardRequest) return
      dashboardError.value = describeError(error, t("adminStatistics.dashboard.toast.loadFailedFallback"))
    } finally {
      if (requestId === latestDashboardRequest) {
        loading.value = false
      }
    }
  }

  async function loadChart() {
    const requestId = ++latestChartRequest
    chartLoading.value = true
    chartError.value = null
    try {
      const to = new Date()
      const from = new Date(to.getTime() - rangeDays.value * DAY_MS)
      const response = await getTimeseries({
        bucket: bucket.value,
        from: from.toISOString(),
        to: to.toISOString(),
        // Align day/week/month buckets to the viewer's local calendar instead of UTC.
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      if (requestId !== latestChartRequest) return
      chartData.value = response.points || []
    } catch (error: unknown) {
      if (requestId !== latestChartRequest) return
      chartError.value = describeError(error, t("adminStatistics.dashboard.toast.loadFailedFallback"))
    } finally {
      if (requestId === latestChartRequest) {
        chartLoading.value = false
      }
    }
  }

  function reload() {
    void loadDashboard()
    void loadChart()
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
    void loadChart()
  })

  const statCards = computed(() => [
    {
      key: "totalUsers",
      label: t("adminStatistics.dashboard.stat.totalUsers"),
      icon: LucideUsers,
      color: "text-blue-500",
      value: dashboard.value?.users.total ?? 0,
      secondary: null,
    },
    {
      key: "superAdmin",
      label: t("adminStatistics.dashboard.stat.superAdmin"),
      icon: LucideShield,
      color: "text-purple-500",
      value: dashboard.value?.users.superAdmin ?? 0,
      secondary: {
        label: t("adminStatistics.dashboard.stat.admin"),
        value: dashboard.value?.users.admin ?? 0,
      },
    },
    {
      key: "totalBindings",
      label: t("adminStatistics.dashboard.stat.totalBindings"),
      icon: LucideLink,
      color: "text-green-500",
      value: dashboard.value?.bindings.total ?? 0,
      secondary: {
        label: t("adminStatistics.dashboard.stat.verifiedBindings"),
        value: dashboard.value?.bindings.verified ?? 0,
      },
    },
    {
      key: "totalUploads",
      label: t("adminStatistics.dashboard.stat.totalUploads"),
      icon: LucideUploadCloud,
      color: "text-orange-500",
      value: dashboard.value?.uploads.totalAllTime ?? 0,
      secondary: null,
    },
  ])

  const serverBreakdown = computed(() => toBreakdownItems(
    dashboard.value?.bindings.byServer,
    (entry) => ({ key: entry.server, count: entry.count }),
    (key) => resolveUploadServerLabel(key, t),
  ))
  const methodBreakdown = computed(() => toBreakdownItems(
    dashboard.value?.uploads.byMethod,
    (entry) => ({ key: entry.method, count: entry.count }),
    (key) => resolveUploadMethodLabel(key, t),
  ))
  const dataTypeBreakdown = computed(() => toBreakdownItems(
    dashboard.value?.uploads.byDataType,
    (entry) => ({ key: entry.dataType, count: entry.count }),
    (key) => resolveUploadDataTypeLabel(key, t),
  ))
  const uploadWindowHours = computed(() => dashboard.value?.uploads.windowHours ?? 24)

  function x(_: TimeseriesPoint, index: number) {
    return index
  }

  function yUploads(point: TimeseriesPoint) {
    return point.uploads
  }

  function yRegistrations(point: TimeseriesPoint) {
    return point.registrations
  }

  // The upload chart draws failures on the upload scale and labels them on a
  // right-hand axis; both axes share tick positions, so the labels stay integers.
  const uploadAxes = computed(() => buildPairedAxes(
    chartData.value.map((point) => point.uploads),
    chartData.value.map((point) => point.uploadFailures),
  ))
  const uploadYDomain = computed<[number, number]>(() => [0, uploadAxes.value.leftMax])
  const uploadTickValues = computed(() => uploadAxes.value.tickValues)

  function yFailures(point: TimeseriesPoint) {
    return uploadAxes.value.toLeft(point.uploadFailures)
  }

  function uploadsTickFormat(tick: number | Date) {
    return formatNumberCN(Number(tick))
  }

  function failuresTickFormat(tick: number | Date) {
    return formatNumberCN(uploadAxes.value.toRight(Number(tick)))
  }

  function formatShortDate(value?: string) {
    return formatLocalizedDate(value, { month: "short", day: "numeric" }, "")
  }

  function successRate(point: TimeseriesPoint) {
    if (point.uploads <= 0) return "—"
    return `${((point.uploadSuccesses / point.uploads) * 100).toFixed(1)}%`
  }

  function crosshairHeader(point: TimeseriesPoint) {
    return `<div style="font-weight:600;margin-bottom:2px">${formatShortDate(point.time)}</div>`
  }

  // Content only — the unovis tooltip wrapper (themed via --vis-tooltip-* CSS
  // vars) provides the box, so we must not draw a second box here.
  function uploadCrosshairTemplate(point: TimeseriesPoint) {
    return `<div style="font-size:12px;line-height:1.55">
    ${crosshairHeader(point)}
    <div style="color:${SERIES_COLORS.uploads}">${t("adminStatistics.dashboard.chart.uploads")}: ${point.uploads}</div>
    <div style="color:${SERIES_COLORS.failures}">${t("adminStatistics.dashboard.chart.failures")}: ${point.uploadFailures}</div>
    <div style="opacity:0.7;margin-top:2px">${t("adminStatistics.dashboard.chart.successRate")}: ${successRate(point)}</div>
  </div>`
  }

  function registrationCrosshairTemplate(point: TimeseriesPoint) {
    return `<div style="font-size:12px;line-height:1.55">
    ${crosshairHeader(point)}
    <div style="color:${SERIES_COLORS.registrations}">${t("adminStatistics.dashboard.chart.registrations")}: ${point.registrations}</div>
  </div>`
  }

  function xTickFormat(index: number) {
    const time = chartData.value[index]?.time
    return formatShortDate(time)
  }

  onMounted(() => {
    reload()
  })

  return {
    loading,
    dashboard,
    dashboardError,
    chartData,
    chartLoading,
    chartError,
    rangeDays,
    bucket,
    rangeOptions,
    bucketOptions,
    onRangeChange,
    onBucketChange,
    statCards,
    serverBreakdown,
    methodBreakdown,
    dataTypeBreakdown,
    uploadWindowHours,
    reload,
    loadDashboard,
    loadChart,
    x,
    yUploads,
    yRegistrations,
    yFailures,
    uploadYDomain,
    uploadTickValues,
    uploadsTickFormat,
    failuresTickFormat,
    uploadCrosshairTemplate,
    registrationCrosshairTemplate,
    xTickFormat,
  }
}
