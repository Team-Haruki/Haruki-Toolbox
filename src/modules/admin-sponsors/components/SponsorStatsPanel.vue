<script setup lang="ts">
/**
 * The figures on top of the sponsor page: four tiles and three breakdowns.
 * All of them are counted over the whole sponsor list (the backend sends it
 * in one piece), never over the rows a search or a page happens to show.
 */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideBadgeCheck, LucideHeartHandshake, LucideLink2, LucideWallet } from "lucide-vue-next"
import AdminMeterList, { type AdminMeterItem } from "@/modules/admin/components/AdminMeterList.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import AdminSparkline from "@/modules/admin/components/AdminSparkline.vue"
import AdminStatGrid from "@/modules/admin/components/AdminStatGrid.vue"
import AdminStatTile from "@/modules/admin/components/AdminStatTile.vue"
import { sharePercent } from "@/modules/admin/lib/stat-visuals"
import { formatNumberCN, formatPercent } from "@/lib/number-format"
import {
  SPONSOR_EXPIRY_BUCKETS,
  bucketSponsorExpiries,
  countSponsorsByPlan,
  countSponsorsBySource,
  formatSponsorAmount,
  monthlyNewSponsors,
  summarizeSponsors,
} from "@/modules/admin-sponsors/lib/sponsor-stats"
import type { AdminSponsorProfile } from "@/types/admin"

const props = defineProps<{
  sponsors: readonly AdminSponsorProfile[]
  /** The list's `total` as the backend reports it. */
  total: number
  loading: boolean
  /** The list failed to load: the tiles show a dash instead of zeros. */
  failed: boolean
}>()

const { t, te, locale } = useI18n()

const overview = computed(() => summarizeSponsors(props.sponsors))
// Taken once per data change, so the buckets do not shift under the reader.
const now = computed(() => {
  void props.sponsors
  return Date.now()
})
const expiry = computed(() => bucketSponsorExpiries(props.sponsors, now.value))
const monthly = computed(() => monthlyNewSponsors(props.sponsors, now.value, 12))
const newInYear = computed(() => monthly.value.reduce((sum, count) => sum + count, 0))
const hasTrend = computed(() => newInYear.value > 0)

function countText(count: number, total: number): string {
  return t("adminSponsors.breakdown.share", {
    count: formatNumberCN(count),
    percent: formatPercent(sharePercent(count, total), 0),
  })
}

function formatAmount(value: number): string {
  return t("adminSponsors.contribution.amount", { amount: formatSponsorAmount(value, locale.value) })
}

function sourceLabel(source: string): string {
  if (!source) return t("adminSponsors.breakdown.source.unknown")
  const key = `adminSponsors.source.${source}`
  return te(key) ? t(key) : source
}

const sourceItems = computed<AdminMeterItem[]>(() =>
  countSponsorsBySource(props.sponsors).map((entry) => ({
    key: entry.key || "unknown",
    label: sourceLabel(entry.key),
    value: entry.count,
    text: countText(entry.count, overview.value.total),
  })))

const planItems = computed<AdminMeterItem[]>(() => {
  const breakdown = countSponsorsByPlan(props.sponsors, 5)
  const items: AdminMeterItem[] = breakdown.top.map((entry) => ({
    key: `plan:${entry.key}`,
    label: entry.key || t("adminSponsors.breakdown.plan.unnamed"),
    value: entry.count,
    text: countText(entry.count, overview.value.total),
  }))
  if (breakdown.otherCount > 0) {
    items.push({
      key: "other",
      label: t("adminSponsors.breakdown.plan.other", { count: breakdown.otherPlans }),
      value: breakdown.otherCount,
      text: countText(breakdown.otherCount, overview.value.total),
      color: "var(--muted-foreground)",
    })
  }
  return items
})

const expiryItems = computed<AdminMeterItem[]>(() =>
  SPONSOR_EXPIRY_BUCKETS
    // "No expiry" only earns a line when someone is in it.
    .filter((bucket) => bucket !== "none" || expiry.value.none > 0)
    .map((bucket) => ({
      key: bucket,
      label: t(`adminSponsors.breakdown.expiry.${bucket}`),
      value: expiry.value[bucket],
      text: countText(expiry.value[bucket], overview.value.current),
      // The week ahead is the one that asks for attention.
      color: bucket === "within7" ? "var(--color-amber-500)" : undefined,
    })))

// An empty list has nothing to break down: no context lines, no breakdowns.
const showFigures = computed(() => !props.loading && !props.failed && overview.value.total > 0)
const showBreakdowns = computed(() => !props.failed && (props.loading || overview.value.total > 0))
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="sponsor-stats">
    <AdminStatGrid :columns="4">
      <AdminStatTile
        :label="t('adminSponsors.stats.total')"
        :value="failed ? null : total"
        :icon="LucideHeartHandshake"
        tone="primary"
        :loading="loading"
        :detail="showFigures ? t('adminSponsors.stats.newRecords', { count: formatNumberCN(newInYear) }) : null"
      >
        <AdminSparkline
          v-if="showFigures && hasTrend"
          :values="monthly"
          :width="48"
          class="text-primary"
          :label="t('adminSponsors.stats.newRecordsTrend')"
        />
      </AdminStatTile>
      <AdminStatTile
        :label="t('adminSponsors.stats.active')"
        :value="failed ? null : overview.current"
        :icon="LucideBadgeCheck"
        tone="success"
        :loading="loading"
        :detail="showFigures ? t('adminSponsors.stats.formerDetail', { count: formatNumberCN(overview.former) }) : null"
      />
      <AdminStatTile
        :label="t('adminSponsors.stats.bound')"
        :value="failed ? null : overview.bound"
        :icon="LucideLink2"
        tone="info"
        :loading="loading"
        :detail="showFigures ? t('adminSponsors.stats.boundShare', { percent: formatPercent(sharePercent(overview.bound, overview.total), 0) }) : null"
      />
      <AdminStatTile
        :label="t('adminSponsors.stats.amount')"
        :value="failed ? null : overview.amountTotal"
        :format="formatAmount"
        :icon="LucideWallet"
        tone="warning"
        :loading="loading"
        :detail="showFigures ? t('adminSponsors.stats.amountDetail', { count: formatNumberCN(overview.amountCount) }) : null"
      />
    </AdminStatGrid>

    <div v-if="showBreakdowns" class="@container">
      <div class="grid gap-4 @min-[52rem]:grid-cols-3">
        <AdminPanel :title="t('adminSponsors.breakdown.source.title')" :description="t('adminSponsors.breakdown.source.description')">
          <AdminMeterList :items="sourceItems" :total="overview.total" :loading="loading" :empty-text="t('adminSponsors.breakdown.empty')" />
        </AdminPanel>
        <AdminPanel :title="t('adminSponsors.breakdown.plan.title')" :description="t('adminSponsors.breakdown.plan.description')">
          <AdminMeterList :items="planItems" :total="overview.total" :loading="loading" :empty-text="t('adminSponsors.breakdown.empty')" />
        </AdminPanel>
        <AdminPanel :title="t('adminSponsors.breakdown.expiry.title')" :description="t('adminSponsors.breakdown.expiry.description')">
          <AdminMeterList
            :items="overview.current > 0 ? expiryItems : []"
            :total="overview.current"
            :loading="loading"
            :empty-text="t('adminSponsors.breakdown.empty')"
          />
        </AdminPanel>
      </div>
    </div>
  </div>
</template>
