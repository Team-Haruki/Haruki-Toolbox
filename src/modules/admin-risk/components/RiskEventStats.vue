<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideCheckCheck,
  LucideFlame,
  LucideListChecks,
  LucideShieldAlert,
  LucideShieldCheck,
} from "lucide-vue-next"
import { formatNumberCN, formatPercent } from "@/lib/number-format"
import AdminMeterList, { type AdminMeterItem } from "@/modules/admin/components/AdminMeterList.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import AdminStatGrid from "@/modules/admin/components/AdminStatGrid.vue"
import AdminStatTile from "@/modules/admin/components/AdminStatTile.vue"
import { sharePercent } from "@/modules/admin/lib/stat-visuals"
import type { RiskEventStats } from "@/modules/admin-risk/composables/useRiskEvents"
import {
  RISK_EVENT_RANGE_LABEL_KEYS,
  RISK_SEVERITIES,
  type RiskEventRange,
  riskResolutionRate,
  type RiskSeverity,
  type RiskSourceCount,
  sumKnown,
} from "@/modules/admin-risk/lib/event-stats"

/**
 * The figures above the event list. The tiles and the severity breakdown
 * count every event of the chosen time window (the list's `total` per
 * filter); the source breakdown only covers the rows the list is showing,
 * because the list cannot be filtered by source, and says so.
 */
const props = defineProps<{
  loading: boolean
  stats: RiskEventStats
  range: RiskEventRange
  rowsLoading: boolean
  /** The list failed to load: there are no rows to describe. */
  rowsFailed: boolean
  rowCount: number
  pageSources: readonly RiskSourceCount[]
}>()

const { t } = useI18n()

const SEVERITY_COLORS: Record<RiskSeverity, string> = {
  critical: "var(--destructive)",
  high: "var(--color-amber-500)",
  medium: "var(--color-sky-500)",
  low: "color-mix(in oklab, var(--muted-foreground) 55%, transparent)",
}

function withShare(count: number, total: number): string {
  return total > 0 ? `${formatNumberCN(count, "0")} · ${formatPercent(sharePercent(count, total), 0)}` : formatNumberCN(count, "0")
}

const rangeLabel = computed(() => t(RISK_EVENT_RANGE_LABEL_KEYS[props.range]))
const total = computed(() => sumKnown(props.stats.open, props.stats.resolved))
const urgent = computed(() => sumKnown(props.stats.openBySeverity.critical, props.stats.openBySeverity.high))

const urgentDetail = computed(() => {
  const { critical, high } = props.stats.openBySeverity
  if (critical == null || high == null) return null
  return t("adminRisk.stats.urgentSplit", { critical: formatNumberCN(critical, "0"), high: formatNumberCN(high, "0") })
})

const resolvedDetail = computed(() => {
  const rate = riskResolutionRate(props.stats.open, props.stats.resolved)
  return rate == null ? null : t("adminRisk.stats.resolutionRate", { rate: formatPercent(rate, 0) })
})

const severityItems = computed<AdminMeterItem[]>(() => {
  const open = props.stats.open
  const counts = props.stats.openBySeverity
  if (open == null || RISK_SEVERITIES.some((severity) => counts[severity] == null)) return []
  return RISK_SEVERITIES.map((severity) => ({
    key: severity,
    label: t(`adminRisk.severity.${severity}`),
    value: counts[severity] ?? 0,
    text: withShare(counts[severity] ?? 0, open),
    color: SEVERITY_COLORS[severity],
  }))
})

const sourceItems = computed<AdminMeterItem[]>(() =>
  props.pageSources.slice(0, 5).map((entry) => ({
    key: entry.source || "—",
    label: entry.source || t("adminRisk.stats.noSource"),
    value: entry.count,
    text: withShare(entry.count, props.rowCount),
  }))
)
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="risk-event-stats">
    <AdminStatGrid :columns="4">
      <AdminStatTile
        :label="t('adminRisk.stats.open')"
        :value="props.stats.open"
        :icon="props.stats.open ? LucideShieldAlert : LucideShieldCheck"
        :tone="props.stats.open ? 'danger' : 'success'"
        :detail="rangeLabel"
        :loading="props.loading"
      />
      <AdminStatTile
        :label="t('adminRisk.stats.urgent')"
        :value="urgent"
        :icon="LucideFlame"
        :tone="urgent ? 'warning' : 'default'"
        :detail="urgentDetail"
        :loading="props.loading"
      />
      <AdminStatTile
        :label="t('adminRisk.stats.resolved')"
        :value="props.stats.resolved"
        :icon="LucideCheckCheck"
        tone="success"
        :detail="resolvedDetail"
        :loading="props.loading"
      />
      <AdminStatTile
        :label="t('adminRisk.stats.total')"
        :value="total"
        :icon="LucideListChecks"
        tone="primary"
        :detail="rangeLabel"
        :loading="props.loading"
      />
    </AdminStatGrid>

    <div class="@container">
      <div class="grid grid-cols-1 gap-4 @min-[40rem]:grid-cols-2">
        <AdminPanel
          :title="t('adminRisk.stats.bySeverity')"
          :description="t('adminRisk.stats.bySeverityHint', { range: rangeLabel })"
        >
          <AdminMeterList
            :key="String(props.loading)"
            :items="severityItems"
            :total="props.stats.open ?? undefined"
            :loading="props.loading"
            :empty-text="t('adminRisk.stats.unavailable')"
          />
        </AdminPanel>
        <AdminPanel
          :title="t('adminRisk.stats.bySource')"
          :description="props.rowsLoading || props.rowsFailed ? undefined : t('adminRisk.stats.bySourceHint', { count: props.rowCount })"
        >
          <AdminMeterList
            :key="String(props.rowsLoading)"
            :items="sourceItems"
            :total="props.rowCount"
            :loading="props.rowsLoading"
            :empty-text="props.rowsFailed ? t('adminRisk.stats.bySourceFailed') : t('adminRisk.stats.bySourceEmpty')"
          />
        </AdminPanel>
      </div>
    </div>
  </div>
</template>
