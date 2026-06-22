import { computed, onMounted, ref, watch } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import {
  LucideLink,
  LucideShield,
  LucideUploadCloud,
  LucideUsers,
} from "lucide-vue-next"
import { formatLocalizedDate } from "@/lib/date-time"
import { getDashboard, getTimeseries } from "@/modules/admin-statistics/api/dashboard"
import type { DashboardData, TimeseriesPoint } from "@/types/admin"
import { extractErrorMessage } from "@/lib/error-utils"

const DAY_MS = 24 * 60 * 60 * 1000

export function useDashboardStats() {
  const { t } = useI18n()
  const loading = ref(true)
  const dashboard = ref<DashboardData | null>(null)
  const chartData = ref<TimeseriesPoint[]>([])
  const chartLoading = ref(true)
  const rangeDays = ref(30)
  const bucket = ref("day")

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
    loading.value = true
    try {
      dashboard.value = await getDashboard()
    } catch (error: unknown) {
      toast.error(t("adminStatistics.dashboard.toast.loadFailedTitle"), {
        description: extractErrorMessage(error, t("adminStatistics.dashboard.toast.loadFailedFallback")),
      })
    } finally {
      loading.value = false
    }
  }

  async function loadChart() {
    chartLoading.value = true
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
      chartData.value = response.points || []
    } catch (error: unknown) {
      toast.error(t("adminStatistics.dashboard.toast.loadChartFailedTitle"), {
        description: extractErrorMessage(error, t("adminStatistics.dashboard.toast.loadFailedFallback")),
      })
    } finally {
      chartLoading.value = false
    }
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
      getter: () => dashboard.value?.users.total ?? 0,
    },
    {
      key: "superAdmin",
      label: t("adminStatistics.dashboard.stat.superAdmin"),
      icon: LucideShield,
      color: "text-purple-500",
      getter: () => dashboard.value?.users.superAdmin ?? 0,
    },
    {
      key: "totalBindings",
      label: t("adminStatistics.dashboard.stat.totalBindings"),
      icon: LucideLink,
      color: "text-green-500",
      getter: () => dashboard.value?.bindings.total ?? 0,
    },
    {
      key: "totalUploads",
      label: t("adminStatistics.dashboard.stat.totalUploads"),
      icon: LucideUploadCloud,
      color: "text-orange-500",
      getter: () => dashboard.value?.uploads.totalAllTime ?? 0,
    },
  ])

  function x(_: TimeseriesPoint, index: number) {
    return index
  }

  function yUploads(point: TimeseriesPoint) {
    return point.uploads
  }

  function yRegistrations(point: TimeseriesPoint) {
    return point.registrations
  }

  function yFailures(point: TimeseriesPoint) {
    return point.uploadFailures
  }

  function formatShortDate(value?: string) {
    return formatLocalizedDate(value, { month: "short", day: "numeric" }, "")
  }

  function successRate(point: TimeseriesPoint) {
    if (point.uploads <= 0) return "—"
    return `${((point.uploadSuccesses / point.uploads) * 100).toFixed(1)}%`
  }

  function crosshairTemplate(point: TimeseriesPoint) {
    const date = formatShortDate(point.time)
    // Content only — the unovis tooltip wrapper (themed via --vis-tooltip-* CSS
    // vars) provides the box, so we must not draw a second box here.
    return `<div style="font-size:12px;line-height:1.55">
    <div style="font-weight:600;margin-bottom:2px">${date}</div>
    <div style="color:#3b82f6">${t("adminStatistics.dashboard.chart.uploads")}: ${point.uploads}</div>
    <div style="color:#ef4444">${t("adminStatistics.dashboard.chart.failures")}: ${point.uploadFailures}</div>
    <div style="color:#22c55e">${t("adminStatistics.dashboard.chart.registrations")}: ${point.registrations}</div>
    <div style="opacity:0.7;margin-top:2px">${t("adminStatistics.dashboard.chart.successRate")}: ${successRate(point)}</div>
  </div>`
  }

  function xTickFormat(index: number) {
    const time = chartData.value[index]?.time
    return formatShortDate(time)
  }

  onMounted(() => {
    void loadDashboard()
    void loadChart()
  })

  return {
    loading,
    dashboard,
    chartData,
    chartLoading,
    rangeDays,
    bucket,
    rangeOptions,
    bucketOptions,
    onRangeChange,
    onBucketChange,
    statCards,
    x,
    yUploads,
    yRegistrations,
    yFailures,
    crosshairTemplate,
    xTickFormat,
  }
}
