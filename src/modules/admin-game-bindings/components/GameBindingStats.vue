<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideBadgeCheck,
  LucideFilter,
  LucideLink2,
  LucideRefreshCw,
  LucideShieldQuestion,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { formatNumberCN, formatPercent } from "@/lib/number-format"
import AdminMeterList, { type AdminMeterItem } from "@/modules/admin/components/AdminMeterList.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import AdminStatGrid from "@/modules/admin/components/AdminStatGrid.vue"
import AdminStatTile from "@/modules/admin/components/AdminStatTile.vue"
import { sharePercent } from "@/modules/admin/lib/stat-visuals"
import {
  type GameBindingStats,
  PAGE_SHARING_KEYS,
  type PageSharingKey,
  unverifiedBindingCount,
} from "@/modules/admin-game-bindings/lib/binding-stats"

/**
 * The figures above the binding list. Total, verified, unverified and the
 * split by server are site-wide (the dashboard statistics); "matching" is the
 * list's own total for the applied filters; the sharing panel only describes
 * the rows the list is showing, and says so.
 */
const props = defineProps<{
  loading: boolean
  stats: GameBindingStats | null
  /** The site-wide counts could not be loaded. */
  failed: boolean
  rowsLoading: boolean
  rowCount: number
  /** Bindings matching the applied filters, from the list response; null when the list failed to load. */
  matching: number | null
  page: number
  totalPages: number
  pageSharing: Record<PageSharingKey, number>
  serverLabel: (server: string) => string
}>()

const emit = defineEmits<{
  (event: "retry"): void
}>()

const { t } = useI18n()

// The public API switches expose an upload to anyone who knows the UID.
const UNSAFE_SHARING: ReadonlySet<PageSharingKey> = new Set(["suitePublicApi", "mysekaiPublicApi"])

function withShare(count: number, total: number): string {
  return total > 0 ? `${formatNumberCN(count, "0")} · ${formatPercent(sharePercent(count, total), 0)}` : formatNumberCN(count, "0")
}

const unverified = computed(() => (props.stats ? unverifiedBindingCount(props.stats) : null))

const verifiedDetail = computed(() => {
  const stats = props.stats
  if (!stats || stats.total <= 0) return null
  return t("adminGameBindings.stats.verifiedShare", { share: formatPercent(sharePercent(stats.verified, stats.total), 1) })
})

const serverItems = computed<AdminMeterItem[]>(() => {
  const stats = props.stats
  if (!stats) return []
  return stats.byServer.map((entry) => ({
    key: entry.server,
    label: props.serverLabel(entry.server),
    value: entry.count,
    text: withShare(entry.count, stats.total),
  }))
})

const sharingItems = computed<AdminMeterItem[]>(() =>
  props.rowCount === 0
    ? []
    : PAGE_SHARING_KEYS.map((key) => ({
        key,
        label: t(`adminGameBindings.stats.sharing.${key}`),
        value: props.pageSharing[key],
        text: withShare(props.pageSharing[key], props.rowCount),
        color: UNSAFE_SHARING.has(key) ? "var(--destructive)" : undefined,
      }))
)
</script>

<template>
  <div class="flex flex-col gap-4" data-testid="game-binding-stats">
    <AdminStatGrid :columns="4">
      <AdminStatTile
        :label="t('adminGameBindings.stats.total')"
        :value="props.stats?.total ?? null"
        :icon="LucideLink2"
        tone="primary"
        :detail="t('adminGameBindings.stats.siteWide')"
        :loading="props.loading"
      />
      <AdminStatTile
        :label="t('adminGameBindings.stats.verified')"
        :value="props.stats?.verified ?? null"
        :icon="LucideBadgeCheck"
        tone="success"
        :detail="verifiedDetail ?? t('adminGameBindings.stats.siteWide')"
        :loading="props.loading"
      />
      <AdminStatTile
        :label="t('adminGameBindings.stats.unverified')"
        :value="unverified"
        :icon="LucideShieldQuestion"
        :tone="unverified ? 'warning' : 'default'"
        :detail="t('adminGameBindings.stats.siteWide')"
        :loading="props.loading"
      />
      <AdminStatTile
        :label="t('adminGameBindings.stats.matching')"
        :value="props.matching"
        :icon="LucideFilter"
        tone="info"
        :detail="props.matching == null ? null : t('adminGameBindings.stats.matchingPage', { page: props.page, pages: Math.max(props.totalPages, 1) })"
        :loading="props.rowsLoading"
      />
    </AdminStatGrid>

    <div class="@container">
      <div class="grid grid-cols-1 gap-4 @min-[40rem]:grid-cols-2">
        <AdminPanel :title="t('adminGameBindings.stats.byServer')" :description="t('adminGameBindings.stats.byServerHint')">
          <template v-if="props.failed && !props.loading" #actions>
            <Button variant="outline" size="sm" class="h-8 pointer-coarse:h-10" @click="emit('retry')">
              <LucideRefreshCw class="size-4" aria-hidden="true" />
              {{ t("adminGameBindings.stats.retry") }}
            </Button>
          </template>
          <AdminMeterList
            :key="String(props.loading)"
            :items="serverItems"
            :total="props.stats?.total"
            :loading="props.loading"
            :empty-text="props.failed ? t('adminGameBindings.stats.loadFailed') : t('adminGameBindings.stats.noBindings')"
          />
        </AdminPanel>
        <AdminPanel
          :title="t('adminGameBindings.stats.sharingTitle')"
          :description="props.rowsLoading || props.matching == null ? undefined : t('adminGameBindings.stats.sharingHint', { count: props.rowCount })"
        >
          <AdminMeterList
            :key="String(props.rowsLoading)"
            :items="sharingItems"
            :total="props.rowCount"
            :loading="props.rowsLoading"
            :empty-text="props.matching == null ? t('adminGameBindings.stats.sharingFailed') : t('adminGameBindings.stats.sharingEmpty')"
          />
        </AdminPanel>
      </div>
    </div>
  </div>
</template>
