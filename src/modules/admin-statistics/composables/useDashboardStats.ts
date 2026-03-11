import { computed, onMounted, ref } from "vue"
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

export function useDashboardStats() {
  const { t } = useI18n()
  const loading = ref(true)
  const dashboard = ref<DashboardData | null>(null)
  const chartData = ref<TimeseriesPoint[]>([])
  const chartLoading = ref(true)

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
      const response = await getTimeseries({ bucket: "day" })
      chartData.value = response.points || []
    } catch (error: unknown) {
      toast.error(t("adminStatistics.dashboard.toast.loadChartFailedTitle"), {
        description: extractErrorMessage(error, t("adminStatistics.dashboard.toast.loadFailedFallback")),
      })
    } finally {
      chartLoading.value = false
    }
  }

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

  function formatShortDate(value?: string) {
    return formatLocalizedDate(value, { month: "short", day: "numeric" }, "")
  }

  function crosshairTemplate(point: TimeseriesPoint) {
    const date = formatShortDate(point.time)
    return `<div style="font-size:12px;padding:4px 8px;background:var(--background);border:1px solid var(--border);border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="font-weight:600;margin-bottom:2px">${date}</div>
    <div style="color:#3b82f6">${t("adminStatistics.dashboard.chart.uploads")}: ${point.uploads}</div>
    <div style="color:#22c55e">${t("adminStatistics.dashboard.chart.registrations")}: ${point.registrations}</div>
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
    statCards,
    x,
    yUploads,
    yRegistrations,
    crosshairTemplate,
    xTickFormat,
  }
}
