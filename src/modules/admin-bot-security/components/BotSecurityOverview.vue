<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideCalendarDays,
  LucideCheckCheck,
  LucideClock,
  LucideShieldAlert,
  LucideShieldCheck,
} from "lucide-vue-next"
import { Skeleton } from "@/components/ui/skeleton"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import type { ErrorDescription } from "@/lib/error-utils"
import { formatNumberCN, formatPercent } from "@/lib/number-format"
import AdminMeterList, { type AdminMeterItem } from "@/modules/admin/components/AdminMeterList.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import AdminSparkline from "@/modules/admin/components/AdminSparkline.vue"
import AdminStatGrid from "@/modules/admin/components/AdminStatGrid.vue"
import AdminStatTile from "@/modules/admin/components/AdminStatTile.vue"
import { sharePercent } from "@/modules/admin/lib/stat-visuals"
import type { BotSecurityHandledTotals } from "@/modules/admin-bot-security/composables/useBotSecurityAlerts"
import { formatBotSecurityWindow } from "@/modules/admin-bot-security/lib/alert-meta"
import {
  type BotSecurityRowStats,
  type BotSecurityTimeline,
  dailyAlertAverage,
  handledAlertTotal,
} from "@/modules/admin-bot-security/lib/alert-stats"
import type { BotSecuritySummary } from "@/types/admin"

/**
 * The figures above the alert list. The tiles and the first two panels cover
 * every alert (the summary endpoint, plus the list's total per status); the
 * third panel only describes the rows the list is showing, and says so.
 */
const props = defineProps<{
  loading: boolean
  summary: BotSecuritySummary | null
  /** A failed summary load; shown in place of the figures with a retry. */
  error?: ErrorDescription | null
  handledTotals: BotSecurityHandledTotals
  /** The two totals load beside the summary and may arrive after it. */
  handledTotalsLoading: boolean
  rowsLoading: boolean
  /** The list failed to load: there are no rows to describe. */
  rowsFailed: boolean
  rowStats: BotSecurityRowStats
  rowTimeline: BotSecurityTimeline | null
  kindLabel: (kind: string) => string
  statusLabel: (status: string) => string
  formatShortTime: (value?: string | null) => string
}>()

const emit = defineEmits<{
  (event: "select-kind", kind: string): void
  (event: "retry"): void
}>()

const { t } = useI18n()

const STATUS_COLORS = {
  open: "var(--destructive)",
  resolved: "var(--color-emerald-500)",
  ignored: "color-mix(in oklab, var(--muted-foreground) 55%, transparent)",
} as const

function withShare(count: number, total: number): string {
  return total > 0 ? `${formatNumberCN(count, "0")} · ${formatPercent(sharePercent(count, total), 0)}` : formatNumberCN(count, "0")
}

const open = computed(() => props.summary?.open ?? null)
const handled = computed(() => handledAlertTotal(props.handledTotals.resolved, props.handledTotals.ignored))

const openDetail = computed(() => {
  const summary = props.summary
  if (!summary) return null
  return summary.byKind.length > 0
    ? t("adminBotSecurity.overview.openKinds", { count: summary.byKind.length })
    : t("adminBotSecurity.summary.noOpen")
})

const last24hDetail = computed(() =>
  props.summary
    ? t("adminBotSecurity.overview.dailyAverage", { count: formatNumberCN(dailyAlertAverage(props.summary.last7d), "0") })
    : null
)

const handledDetail = computed(() => {
  const { resolved, ignored } = props.handledTotals
  if (resolved == null || ignored == null) return null
  return t("adminBotSecurity.overview.handledSplit", {
    resolved: formatNumberCN(resolved, "0"),
    ignored: formatNumberCN(ignored, "0"),
  })
})

// Open alerts per kind, as the summary sends them (largest first).
const kindRows = computed(() => {
  const summary = props.summary
  if (!summary) return []
  return summary.byKind.map((entry) => ({
    kind: entry.kind,
    label: props.kindLabel(entry.kind),
    text: withShare(entry.count, summary.open),
    percent: sharePercent(entry.count, summary.open),
  }))
})

const statusTotal = computed(() => {
  const total = handled.value
  return open.value == null || total == null ? null : open.value + total
})

const statusLoading = computed(() => props.loading || props.handledTotalsLoading)

const statusItems = computed<AdminMeterItem[]>(() => {
  const total = statusTotal.value
  if (total == null || open.value == null) return []
  const counts = {
    open: open.value,
    resolved: props.handledTotals.resolved ?? 0,
    ignored: props.handledTotals.ignored ?? 0,
  }
  return (["open", "resolved", "ignored"] as const).map((status) => ({
    key: status,
    label: props.statusLabel(status),
    value: counts[status],
    text: withShare(counts[status], total),
    color: STATUS_COLORS[status],
  }))
})

const enforcementItems = computed<AdminMeterItem[]>(() => {
  const { total, enforced, logOnly } = props.rowStats
  return [
    { key: "enforced", label: t("adminBotSecurity.enforcement.enforced"), value: enforced, text: withShare(enforced, total), color: "var(--color-amber-500)" },
    { key: "logOnly", label: t("adminBotSecurity.enforcement.logOnly"), value: logOnly, text: withShare(logOnly, total), color: "var(--color-sky-500)" },
  ]
})

const windowItems = computed<AdminMeterItem[]>(() =>
  props.rowStats.byWindow.slice(0, 3).map((entry) => ({
    key: String(entry.seconds),
    label: t("adminBotSecurity.table.within", { window: formatBotSecurityWindow(entry.seconds, t) }),
    value: entry.count,
    text: withShare(entry.count, props.rowStats.total),
  }))
)

const timelineRange = computed(() => {
  const timeline = props.rowTimeline
  if (!timeline) return null
  return t("adminBotSecurity.overview.timelineRange", {
    from: props.formatShortTime(new Date(timeline.from).toISOString()),
    to: props.formatShortTime(new Date(timeline.to).toISOString()),
  })
})

// The kind bars grow in once the figures arrive, like the kit's meter list
// (which is remounted per load below, so its bars grow from zero as well).
const grown = ref(false)
function growBars() {
  grown.value = false
  requestAnimationFrame(() => {
    grown.value = true
  })
}
onMounted(growBars)
watch(() => props.loading, (loading) => {
  if (!loading) growBars()
})
</script>

<template>
  <div v-if="props.error && !props.loading" class="rounded-xl border bg-card">
    <LoadErrorState
      :title="t('adminBotSecurity.toast.loadSummaryFailedTitle')"
      :description="props.error.message"
      :detail="props.error.detail"
      :retrying="props.loading"
      @retry="emit('retry')"
    />
  </div>
  <div v-else class="flex flex-col gap-4" data-testid="bot-security-overview">
    <AdminStatGrid :columns="4">
      <AdminStatTile
        :label="t('adminBotSecurity.summary.open')"
        :value="open"
        :icon="open ? LucideShieldAlert : LucideShieldCheck"
        :tone="open ? 'danger' : 'success'"
        :detail="openDetail"
        :loading="props.loading"
      />
      <AdminStatTile
        :label="t('adminBotSecurity.summary.last24h')"
        :value="props.summary?.last24h ?? null"
        :icon="LucideClock"
        tone="info"
        :detail="last24hDetail"
        :loading="props.loading"
      />
      <AdminStatTile
        :label="t('adminBotSecurity.summary.last7d')"
        :value="props.summary?.last7d ?? null"
        :icon="LucideCalendarDays"
        tone="primary"
        :detail="t('adminBotSecurity.overview.anyStatus')"
        :loading="props.loading"
      />
      <AdminStatTile
        :label="t('adminBotSecurity.overview.handled')"
        :value="handled"
        :icon="LucideCheckCheck"
        tone="success"
        :detail="handledDetail"
        :loading="props.handledTotalsLoading"
      />
    </AdminStatGrid>

    <div class="@container">
      <div class="grid grid-cols-1 gap-4 @min-[38rem]:grid-cols-2 @min-[52rem]:grid-cols-3">
        <AdminPanel
          :title="t('adminBotSecurity.summary.byKind')"
          :description="t('adminBotSecurity.overview.byKindHint')"
        >
          <div v-if="props.loading" class="flex flex-col gap-2.5">
            <Skeleton v-for="index in 3" :key="index" class="h-6 w-full" />
          </div>
          <p v-else-if="!props.summary" class="py-4 text-center text-xs text-muted-foreground">
            {{ t("adminBotSecurity.summary.unavailable") }}
          </p>
          <p v-else-if="kindRows.length === 0" class="py-4 text-center text-xs text-muted-foreground">
            {{ t("adminBotSecurity.summary.noOpen") }}
          </p>
          <ul v-else class="-mx-2 flex flex-col gap-0.5" role="list">
            <li v-for="row in kindRows" :key="row.kind">
              <button
                type="button"
                class="flex w-full flex-col gap-1 rounded-md px-2 py-1 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:py-2.5"
                :title="t('adminBotSecurity.summary.filterByKind', { kind: row.label })"
                @click="emit('select-kind', row.kind)"
              >
                <span class="flex items-baseline justify-between gap-3 text-xs">
                  <span class="min-w-0 truncate">{{ row.label }}</span>
                  <span class="shrink-0 tabular-nums text-muted-foreground">{{ row.text }}</span>
                </span>
                <span class="block h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <span
                    class="block h-full rounded-full bg-primary/70 transition-[width] duration-700 ease-out motion-reduce:transition-none"
                    :style="{ width: grown ? `${row.percent}%` : '0%' }"
                  />
                </span>
              </button>
            </li>
          </ul>
        </AdminPanel>

        <AdminPanel
          :title="t('adminBotSecurity.overview.byStatus')"
          :description="statusTotal == null
            ? t('adminBotSecurity.overview.byStatusHint')
            : t('adminBotSecurity.overview.byStatusTotal', { total: formatNumberCN(statusTotal, '0') })"
        >
          <AdminMeterList
            :key="String(statusLoading)"
            :items="statusItems"
            :total="statusTotal ?? undefined"
            :loading="statusLoading"
            :empty-text="t('adminBotSecurity.summary.unavailable')"
          />
        </AdminPanel>

        <AdminPanel
          class="@min-[38rem]:col-span-2 @min-[52rem]:col-span-1"
          :title="t('adminBotSecurity.overview.onThisPage')"
          :description="props.rowsLoading || props.rowsFailed
            ? undefined
            : t('adminBotSecurity.overview.onThisPageHint', { count: props.rowStats.total })"
        >
          <div v-if="props.rowsLoading" class="flex flex-col gap-2.5">
            <Skeleton v-for="index in 3" :key="index" class="h-6 w-full" />
          </div>
          <p v-else-if="props.rowStats.total === 0" class="py-4 text-center text-xs text-muted-foreground">
            {{ props.rowsFailed ? t("adminBotSecurity.overview.onThisPageFailed") : t("adminBotSecurity.overview.onThisPageEmpty") }}
          </p>
          <!-- Side by side while the panel spans the row, stacked in its own column. -->
          <div v-else class="@container" data-testid="bot-security-page-stats">
            <div class="grid grid-cols-1 gap-x-6 gap-y-4 @min-[30rem]:grid-cols-2">
              <div v-if="props.rowTimeline" class="flex items-center justify-between gap-3 @min-[30rem]:col-span-2">
                <div class="min-w-0">
                  <p class="text-xs">{{ t("adminBotSecurity.overview.timeline") }}</p>
                  <p class="mt-0.5 text-xs tabular-nums text-muted-foreground">{{ timelineRange }}</p>
                </div>
                <AdminSparkline
                  :values="props.rowTimeline.counts"
                  :width="96"
                  :height="28"
                  class="text-primary"
                  :label="t('adminBotSecurity.overview.timelineLabel', { count: props.rowStats.total })"
                />
              </div>
              <div>
                <h3 class="mb-2 text-xs font-medium text-muted-foreground">{{ t("adminBotSecurity.overview.enforcement") }}</h3>
                <AdminMeterList :items="enforcementItems" :total="props.rowStats.total" />
              </div>
              <div v-if="windowItems.length > 0">
                <h3 class="mb-2 text-xs font-medium text-muted-foreground">{{ t("adminBotSecurity.overview.window") }}</h3>
                <AdminMeterList :items="windowItems" :total="props.rowStats.total" />
              </div>
            </div>
          </div>
        </AdminPanel>
      </div>
    </div>
  </div>
</template>
