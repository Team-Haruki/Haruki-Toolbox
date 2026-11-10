<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideCircleCheck, LucideCircleX, LucideGauge, LucideScrollText } from "lucide-vue-next"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import AdminStatGrid from "@/modules/admin/components/AdminStatGrid.vue"
import AdminStatTile from "@/modules/admin/components/AdminStatTile.vue"
import LogsBreakdownPanel from "@/modules/admin-statistics/components/LogsBreakdownPanel.vue"
import type { ErrorDescription } from "@/lib/error-utils"
import { formatNumberCN, formatPercent } from "@/lib/number-format"
import type { SystemLogEntry, SystemLogSummaryDetail } from "@/modules/admin-statistics/api/system-log"
import {
  countRowsBy,
  formatShare,
  rankCategoryCounts,
  successRatePercent,
} from "@/modules/admin-statistics/lib/logs-stats"

/**
 * The stat block above the system-log table. The tiles and the first three
 * breakdowns come from `GET /system-logs/summary` and cover every log
 * matching the filters inside the time range; the last breakdown counts the
 * rows of the current page only, and says so.
 */
const props = defineProps<{
  summary: SystemLogSummaryDetail | null
  loading: boolean
  error: ErrorDescription | null
  /** "from – to" of the window the summary covers. */
  rangeLabel: string
  /** The rows the table shows, for the per-page breakdown. */
  logs: readonly SystemLogEntry[]
  logsLoading: boolean
}>()

const emit = defineEmits<{ retry: [] }>()

const { t, te } = useI18n()

const BREAKDOWN_LIMIT = 6
// Below this a share of failures is worth a second look; the tile turns amber.
const HEALTHY_SUCCESS_RATE = 95

// Skeletons only before the first answer: on a refresh the figures stay and glide to the new values.
const pending = computed(() => props.loading && !props.summary)

const total = computed(() => props.summary?.total ?? null)
const success = computed(() => props.summary?.success ?? null)
const failure = computed(() => props.summary?.failure ?? null)
const rate = computed(() =>
  props.summary ? successRatePercent(props.summary.success, props.summary.failure) : null,
)

const actions = computed(() => rankCategoryCounts(props.summary?.byAction, BREAKDOWN_LIMIT))
const actionKinds = computed(() => actions.value.items.length + actions.value.otherKinds)
const actorTypes = computed(() => rankCategoryCounts(props.summary?.byActorType))
const reasons = computed(() => rankCategoryCounts(props.summary?.byReason, BREAKDOWN_LIMIT))
const pageActors = computed(() =>
  rankCategoryCounts(
    countRowsBy(props.logs, (log) => log.actorUserId || `type:${log.actorType ?? ""}`),
    BREAKDOWN_LIMIT,
  ),
)

function share(part: number | null): string | null {
  if (part == null || !total.value) {
    return null
  }
  return t("adminStatistics.systemLogs.summary.share", { share: formatShare(part, total.value) })
}

const totalDetail = computed(() =>
  props.summary && actionKinds.value > 0 ? t("adminStatistics.systemLogs.summary.actionKinds", { count: formatNumberCN(actionKinds.value, "0") }) : null,
)
const failureDetail = computed(() => {
  const top = reasons.value.items[0]
  if (top && failure.value) {
    return t("adminStatistics.systemLogs.summary.topReason", { reason: reasonLabel(top.key) })
  }
  return share(failure.value)
})
const rateDetail = computed(() =>
  rate.value == null
    ? null
    : t("adminStatistics.systemLogs.summary.failureRate", { rate: formatPercent(100 - rate.value, 1) }),
)

function actorTypeLabel(key: string): string {
  const path = `adminStatistics.systemLogs.actorType.${key}`
  return key && te(path) ? t(path) : key || t("adminStatistics.systemLogs.actorType.unknown")
}

function reasonLabel(key: string): string {
  return !key || key === "unknown" ? t("adminStatistics.systemLogs.breakdown.unknownReason") : key
}

function pageActorLabel(key: string): string {
  return key.startsWith("type:") ? actorTypeLabel(key.slice(5)) : key
}

function ratePercentText(value: number): string {
  return formatPercent(value, 1)
}
</script>

<template>
  <section class="flex min-w-0 flex-col gap-3" :aria-label="t('adminStatistics.systemLogs.overview.title')" data-testid="system-logs-summary">
    <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
      <h2 class="text-sm font-semibold">{{ t("adminStatistics.systemLogs.overview.title") }}</h2>
      <p class="min-w-0 text-xs text-muted-foreground" data-testid="system-logs-scope">
        <template v-if="rangeLabel">
          <span class="tabular-nums">{{ rangeLabel }}</span>
          <span aria-hidden="true"> · </span>
        </template>
        {{ t("adminStatistics.systemLogs.overview.scope") }}
      </p>
    </div>

    <div v-if="error && !loading" class="rounded-xl border bg-card">
      <LoadErrorState
        :title="t('adminStatistics.systemLogs.toast.loadSummaryFailedTitle')"
        :description="error.message"
        :detail="error.detail"
        :retrying="loading"
        @retry="emit('retry')"
      />
    </div>
    <template v-else>
      <AdminStatGrid :columns="4">
        <AdminStatTile
          :label="t('adminStatistics.systemLogs.summary.total')"
          :value="total"
          :icon="LucideScrollText"
          tone="primary"
          :detail="totalDetail"
          :loading="pending"
        />
        <AdminStatTile
          :label="t('adminStatistics.common.success')"
          :value="success"
          :icon="LucideCircleCheck"
          tone="success"
          :detail="share(success)"
          :loading="pending"
        />
        <AdminStatTile
          :label="t('adminStatistics.common.failure')"
          :value="failure"
          :icon="LucideCircleX"
          tone="danger"
          :detail="failureDetail"
          :loading="pending"
        />
        <AdminStatTile
          :label="t('adminStatistics.systemLogs.summary.successRate')"
          :value="rate"
          :format="ratePercentText"
          :icon="LucideGauge"
          :tone="rate != null && rate < HEALTHY_SUCCESS_RATE ? 'warning' : 'success'"
          :detail="rateDetail"
          :loading="pending"
        />
      </AdminStatGrid>

      <!-- Nothing to break down when the range holds no logs at all. -->
      <div v-if="pending || (summary?.total ?? 0) > 0 || logs.length > 0" class="@container" data-testid="system-logs-breakdowns">
        <div class="grid grid-cols-1 gap-3 @min-[40rem]:grid-cols-2 @min-[72rem]:grid-cols-4">
          <LogsBreakdownPanel
            :title="t('adminStatistics.systemLogs.breakdown.actions')"
            :description="t('adminStatistics.systemLogs.breakdown.actionsHint')"
            :ranked="actions"
            :label-of="(key) => key || t('adminStatistics.common.fallback')"
            :empty-text="t('adminStatistics.systemLogs.breakdown.empty')"
            :loading="pending"
          />
          <LogsBreakdownPanel
            :title="t('adminStatistics.systemLogs.breakdown.actorTypes')"
            :description="t('adminStatistics.systemLogs.breakdown.actorTypesHint')"
            :ranked="actorTypes"
            :label-of="actorTypeLabel"
            :empty-text="t('adminStatistics.systemLogs.breakdown.empty')"
            :loading="pending"
          />
          <LogsBreakdownPanel
            :title="t('adminStatistics.systemLogs.breakdown.reasons')"
            :description="t('adminStatistics.systemLogs.breakdown.reasonsHint')"
            :ranked="reasons"
            :label-of="reasonLabel"
            :empty-text="t('adminStatistics.systemLogs.breakdown.noFailures')"
            :loading="pending"
          />
          <LogsBreakdownPanel
            :title="t('adminStatistics.systemLogs.breakdown.pageActors')"
            :description="t('adminStatistics.systemLogs.breakdown.pageActorsHint', { count: formatNumberCN(logs.length, '0') })"
            :ranked="pageActors"
            :label-of="pageActorLabel"
            :empty-text="t('adminStatistics.systemLogs.breakdown.empty')"
            :loading="logsLoading"
            data-testid="system-logs-page-actors"
          />
        </div>
      </div>
    </template>
  </section>
</template>
