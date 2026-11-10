<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Skeleton } from "@/components/ui/skeleton"
import type { ErrorDescription } from "@/lib/error-utils"
import { formatNumberCN, formatPercent } from "@/lib/number-format"
import AdminAnimatedNumber from "@/modules/admin/components/AdminAnimatedNumber.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import type { UploadAnalytics } from "@/modules/admin-statistics/lib/dashboard-analytics"
import { formatDurationMs } from "@/modules/admin-statistics/lib/dashboard-metrics"
import { resolveUploadMethodLabel } from "@/modules/admin-statistics/lib/upload-log-meta"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"

/**
 * Upload quality over the last 24 hours, from the upload analytics endpoint:
 * processing-time percentiles, active game accounts and the HarukiProxy
 * protocol split on top, then one row per upload method.
 */
const props = defineProps<{
  analytics: UploadAnalytics | null
  loading: boolean
  error: ErrorDescription | null
  /** The viewer is not a super admin: the backend leaves some uploads out of these numbers. */
  restricted: boolean
}>()

const emit = defineEmits<{ retry: [] }>()

const { t } = useI18n()

const fallback = computed(() => t("adminStatistics.common.fallback"))

function formatDuration(value: number | null): string {
  return formatDurationMs(value) ?? fallback.value
}

function formatRate(rate: number | null): string {
  return rate === null ? fallback.value : formatPercent(rate * 100, 2)
}

const description = computed(() => [
  t("adminStatistics.dashboard.quality.description"),
  props.restricted ? t("adminStatistics.dashboard.quality.restrictedHint") : "",
].filter(Boolean).join(" "))

const figures = computed(() => {
  const summary = props.analytics?.summary
  const migration = props.analytics?.migration
  return [
    {
      key: "p50",
      label: t("adminStatistics.dashboard.quality.latencyP50"),
      value: summary?.latencyP50Ms ?? null,
      format: formatDuration,
      detail: t("adminStatistics.dashboard.quality.latencyP50Hint"),
    },
    {
      key: "p95",
      label: t("adminStatistics.dashboard.quality.latencyP95"),
      value: summary?.latencyP95Ms ?? null,
      format: formatDuration,
      detail: t("adminStatistics.dashboard.quality.latencyP95Hint"),
    },
    {
      key: "accounts",
      label: t("adminStatistics.dashboard.quality.activeAccounts"),
      value: summary ? summary.activeGameAccounts : null,
      format: (value: number) => formatNumberCN(Math.round(value)),
      detail: t("adminStatistics.dashboard.quality.activeAccountsHint"),
    },
    {
      key: "v3",
      label: t("adminStatistics.dashboard.quality.v3Share"),
      value: migration?.v3Share ?? null,
      format: (value: number) => formatPercent(value * 100),
      detail: t("adminStatistics.dashboard.quality.v2OnlyAccounts", { count: formatNumberCN(migration?.v2OnlyAccounts ?? 0) }),
    },
  ]
})

const rows = computed(() => (props.analytics?.methods ?? []).map((row) => ({
  ...row,
  key: row.method || "unknown",
  label: resolveUploadMethodLabel(row.method || undefined, t),
})))
</script>

<template>
  <AdminPanel :title="t('adminStatistics.dashboard.quality.title')" :description="description" flush>
    <div v-if="error" class="px-4">
      <LoadErrorState
        :title="t('adminStatistics.dashboard.toast.loadQualityFailedTitle')"
        :description="error.message"
        :detail="error.detail"
        :retrying="loading"
        @retry="emit('retry')"
      />
    </div>

    <div v-else-if="!analytics" class="flex flex-col gap-2.5 p-4" aria-busy="true">
      <Skeleton class="h-14 w-full" />
      <Skeleton v-for="index in 3" :key="index" class="h-7 w-full" />
    </div>

    <div
      v-else
      :class="['@container transition-opacity duration-200', loading ? 'opacity-60' : '']"
      :aria-busy="loading"
      data-testid="statistics-upload-quality"
    >
      <dl class="grid grid-cols-2 gap-px border-b border-border/60 bg-border/60 @min-[40rem]:grid-cols-4">
        <div v-for="figure in figures" :key="figure.key" class="min-w-0 bg-card px-4 py-3">
          <dt class="truncate text-xs text-muted-foreground" :title="figure.label">{{ figure.label }}</dt>
          <dd class="mt-0.5 text-lg leading-tight font-semibold">
            <AdminAnimatedNumber v-if="figure.value !== null" :value="figure.value" :format="figure.format" />
            <span v-else class="text-muted-foreground">{{ fallback }}</span>
          </dd>
          <dd class="mt-0.5 text-xs text-muted-foreground">{{ figure.detail }}</dd>
        </div>
      </dl>

      <p v-if="rows.length === 0" class="px-4 py-8 text-center text-xs text-muted-foreground">
        {{ t("adminStatistics.dashboard.quality.empty") }}
      </p>
      <table v-else class="w-full border-collapse text-xs">
        <thead>
          <tr class="border-b border-border/60 bg-muted/40 text-muted-foreground">
            <th scope="col" class="px-4 py-2 text-left font-medium">{{ t("adminStatistics.dashboard.matrix.method") }}</th>
            <th scope="col" class="px-2 py-2 text-right font-medium">{{ t("adminStatistics.dashboard.quality.attempts") }}</th>
            <th scope="col" class="px-2 py-2 text-right font-medium">{{ t("adminStatistics.dashboard.quality.failed") }}</th>
            <th scope="col" class="w-[22%] px-2 py-2 text-right font-medium">{{ t("adminStatistics.dashboard.chart.successRate") }}</th>
            <th scope="col" class="hidden px-2 py-2 text-right font-medium @min-[30rem]:table-cell">P50</th>
            <th scope="col" class="py-2 pr-4 pl-2 text-right font-medium @min-[36rem]:pr-2">P95</th>
            <th scope="col" class="hidden py-2 pr-4 pl-2 text-right font-medium @min-[36rem]:table-cell">
              {{ t("adminStatistics.dashboard.quality.accounts") }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/60">
          <tr v-for="row in rows" :key="row.key">
            <th scope="row" class="px-4 py-2 text-left font-normal [overflow-wrap:anywhere]">{{ row.label }}</th>
            <td class="px-2 py-2 text-right tabular-nums">{{ formatNumberCN(row.attemptCount) }}</td>
            <td :class="['px-2 py-2 text-right tabular-nums', row.failureCount > 0 ? '' : 'text-muted-foreground']">
              {{ formatNumberCN(row.failureCount) }}
            </td>
            <td class="px-2 py-2 text-right tabular-nums">
              {{ formatRate(row.successRate) }}
              <!-- The split of this row's attempts, beside its figures. -->
              <div v-if="row.attemptCount > 0" class="mt-1 ml-auto flex h-1 max-w-24 gap-0.5" aria-hidden="true">
                <div class="min-w-0 rounded-full bg-(--dash-uploads)" :style="{ flex: `${row.successCount} 0 0` }" />
                <div
                  v-if="row.failureCount > 0"
                  class="min-w-1 rounded-full bg-(--dash-failures)"
                  :style="{ flex: `${row.failureCount} 0 0` }"
                />
              </div>
            </td>
            <td class="hidden px-2 py-2 text-right tabular-nums text-muted-foreground @min-[30rem]:table-cell">
              {{ formatDuration(row.latencyP50Ms) }}
            </td>
            <td class="py-2 pr-4 pl-2 text-right tabular-nums @min-[36rem]:pr-2">{{ formatDuration(row.latencyP95Ms) }}</td>
            <td class="hidden py-2 pr-4 pl-2 text-right tabular-nums @min-[36rem]:table-cell">
              {{ formatNumberCN(row.activeGameAccounts) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminPanel>
</template>
