<script setup lang="ts">
/**
 * The stat panel of the admin ticket list: four headline tiles, then the
 * split by status, by priority and by category.
 *
 * Scope, as each panel says under its title: the tiles and the status and
 * priority splits count every ticket the admin can see (`summary`, from
 * `useAdminTicketListStats`); the backend cannot filter by category, so that
 * split only describes `rows`, the page of the list on screen.
 *
 * It renders two blocks (tiles, breakdowns) as siblings so the page can
 * place them apart: on a narrow page the breakdowns go under the list.
 */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideCircleDot, LucideClock, LucideTicket, LucideUserRoundX } from "lucide-vue-next"
import AdminMeterList, { type AdminMeterItem } from "@/modules/admin/components/AdminMeterList.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import AdminStatGrid from "@/modules/admin/components/AdminStatGrid.vue"
import AdminStatTile from "@/modules/admin/components/AdminStatTile.vue"
import { formatNumberCN } from "@/lib/number-format"
import { adminTicketStatusBarColor } from "@/modules/tickets/lib/admin-ticket-display"
import {
  countTicketCategories,
  wholePercent,
  type AdminTicketStatSummary,
} from "@/modules/tickets/lib/admin-ticket-stats"
import { ticketPriorityLabel, ticketStatusLabel } from "@/modules/tickets/lib/display"
import { ticketCategoryLabel } from "@/modules/tickets/lib/meta"
import type { Ticket } from "@/types/ticket"

// The page's class (its place in the page's order) goes on the breakdown block.
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  summary: AdminTicketStatSummary
  /** The whole-set counts have not answered yet. */
  loading: boolean
  /** At least one whole-set count could not be loaded. */
  failed: boolean
  /** The tickets on screen, for the category split. */
  rows: readonly Ticket[]
  rowsLoading: boolean
}>()

const emit = defineEmits<{ retry: [] }>()

const { t } = useI18n()

function shareText(count: number, total: number | null): string {
  const percent = wholePercent(count, total)
  const figure = formatNumberCN(count)
  return percent == null ? figure : t("tickets.adminList.stats.share", { count: figure, percent })
}

function labelCount(label: string, count: number | null): string | null {
  return count == null ? null : t("tickets.adminList.stats.labelCount", { label, count: formatNumberCN(count) })
}

const pendingAdminDetail = computed(() => labelCount(ticketStatusLabel("pending_user"), props.summary.status.pending_user))
const unassignedDetail = computed(() => labelCount(t("tickets.adminList.stats.mine"), props.summary.mine))
const totalDetail = computed(() => {
  const { active, total } = props.summary
  if (active == null || total == null) return null
  return t("tickets.adminList.stats.totalDetail", { active: formatNumberCN(active), done: formatNumberCN(total - active) })
})

const wholeSetScope = computed(() =>
  props.summary.total == null
    ? t("tickets.adminList.stats.scopeAllUnknown")
    : t("tickets.adminList.stats.scopeAll", { total: formatNumberCN(props.summary.total) }),
)

// With no ticket at all there is nothing to split: say so instead of five empty bars.
const hasTickets = computed(() => props.summary.total !== 0)

const statusItems = computed<AdminMeterItem[]>(() =>
  (hasTickets.value ? props.summary.byStatus : []).map((entry) => ({
    key: entry.key,
    label: ticketStatusLabel(entry.key),
    value: entry.count,
    text: shareText(entry.count, props.summary.total),
    color: adminTicketStatusBarColor(entry.key),
  })),
)

const priorityItems = computed<AdminMeterItem[]>(() =>
  (hasTickets.value ? props.summary.byPriority : []).map((entry) => ({
    key: entry.key,
    label: ticketPriorityLabel(entry.key),
    value: entry.count,
    text: shareText(entry.count, props.summary.total),
  })),
)

const categoryItems = computed<AdminMeterItem[]>(() =>
  countTicketCategories(props.rows).map((entry) => ({
    key: entry.key,
    label: ticketCategoryLabel(entry.key, t),
    value: entry.count,
    text: shareText(entry.count, props.rows.length),
  })),
)

// `AdminMeterList` grows its bars once, when it mounts. The figures arrive
// after that, so each list is remounted the moment its first data is in;
// later changes glide through the bars' width transition.
const meterKey = computed(() => (props.loading ? "loading" : "ready"))
// A reload keeps the previous page's split on screen instead of a skeleton.
const categoryLoading = computed(() => props.rowsLoading && props.rows.length === 0)
const categoryMeterKey = computed(() => (categoryLoading.value ? "loading" : "ready"))

const wholeSetEmptyText = computed(() =>
  props.failed ? t("tickets.adminList.stats.loadFailed") : t("tickets.adminList.stats.empty"),
)
</script>

<template>
  <section class="flex flex-col gap-2" :aria-label="t('tickets.adminList.stats.label')" data-testid="admin-ticket-stats">
    <AdminStatGrid :columns="4">
      <AdminStatTile
        :label="ticketStatusLabel('pending_admin')"
        :value="summary.status.pending_admin"
        :icon="LucideClock"
        tone="warning"
        :detail="pendingAdminDetail"
        :loading="loading"
        data-stat="pending-admin"
      />
      <AdminStatTile
        :label="ticketStatusLabel('open')"
        :value="summary.status.open"
        :icon="LucideCircleDot"
        tone="info"
        :detail="t('tickets.adminList.stats.openDetail')"
        :loading="loading"
        data-stat="open"
      />
      <AdminStatTile
        :label="t('tickets.adminList.unassigned')"
        :value="summary.unassigned"
        :icon="LucideUserRoundX"
        :detail="unassignedDetail"
        :loading="loading"
        data-stat="unassigned"
      />
      <AdminStatTile
        :label="t('tickets.adminList.quickFilters.all')"
        :value="summary.total"
        :icon="LucideTicket"
        tone="primary"
        :detail="totalDetail"
        :loading="loading"
        data-stat="total"
      />
    </AdminStatGrid>
    <!-- A secondary widget: its failure stays inline (no toast) and never hides the list. -->
    <p v-if="failed && !loading" class="px-1 text-xs text-destructive-tint-foreground" role="alert">
      {{ t("tickets.adminList.stats.partialFailed") }}
      <button
        type="button"
        class="ml-1 inline-flex min-h-6 items-center underline underline-offset-4 pointer-coarse:min-h-10"
        @click="emit('retry')"
      >
        {{ t("core.loadError.retry") }}
      </button>
    </p>
  </section>

  <!-- Bar colours of the status split, one validated set per theme (see lib/admin-ticket-display). -->
  <div
    class="grid gap-4 [--ticket-bar-closed:#475569] [--ticket-bar-open:#0284c7] [--ticket-bar-pending-admin:#d97706] [--ticket-bar-pending-user:#7c3aed] [--ticket-bar-resolved:#059669] @min-[40rem]:grid-cols-3 dark:[--ticket-bar-closed:#5f6875] dark:[--ticket-bar-pending-user:#8b5cf6] dark:[--ticket-bar-resolved:#10a674]"
    data-testid="admin-ticket-breakdowns"
    v-bind="$attrs"
  >
    <AdminPanel :title="t('tickets.adminList.stats.byStatus')" :description="wholeSetScope" data-breakdown="status">
      <AdminMeterList
        :key="meterKey"
        :items="statusItems"
        :total="summary.total ?? undefined"
        :loading="loading"
        :empty-text="wholeSetEmptyText"
      />
    </AdminPanel>
    <AdminPanel :title="t('tickets.adminList.stats.byPriority')" :description="wholeSetScope" data-breakdown="priority">
      <AdminMeterList
        :key="meterKey"
        :items="priorityItems"
        :total="summary.total ?? undefined"
        :loading="loading"
        :empty-text="wholeSetEmptyText"
      />
    </AdminPanel>
    <AdminPanel
      :title="t('tickets.adminList.stats.byCategory')"
      :description="t('tickets.adminList.stats.scopePage', { count: formatNumberCN(rows.length) })"
      data-breakdown="category"
    >
      <AdminMeterList
        :key="categoryMeterKey"
        :items="categoryItems"
        :total="rows.length"
        :loading="categoryLoading"
        :empty-text="t('tickets.adminList.stats.empty')"
      />
    </AdminPanel>
  </div>
</template>
