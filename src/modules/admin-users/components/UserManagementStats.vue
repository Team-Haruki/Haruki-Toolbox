<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideBan, LucideListFilter, LucideRefreshCcw, LucideShieldCheck, LucideUsers } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import type { ErrorDescription } from "@/lib/error-utils"
import AdminSparkline from "@/modules/admin/components/AdminSparkline.vue"
import AdminStatGrid from "@/modules/admin/components/AdminStatGrid.vue"
import AdminStatTile from "@/modules/admin/components/AdminStatTile.vue"
import { sharePercent } from "@/modules/admin/lib/stat-visuals"
import { formatSharePercent, type DirectoryStats, type RegistrationTrend } from "@/modules/admin-users/lib/user-stats"

/**
 * The figures above the user list. The first three are site-wide (dashboard
 * statistics); the fourth is the list's own total for the current filter,
 * and says what it leaves out. Nothing here is counted from the rows of the
 * page on screen.
 */
const props = defineProps<{
  /** Site-wide counters; null while loading or after a failed load. */
  stats: DirectoryStats | null
  statsLoading: boolean
  statsError: ErrorDescription | null
  /** Daily registrations; null when the trend is unavailable. */
  registrations: RegistrationTrend | null
  trendDays: number
  /** The list's total for the current filter, over all pages. */
  listTotal: number
  /** False until the list has answered once. */
  listReady: boolean
  listFailed: boolean
  hasActiveFilters: boolean
  /** A plain admin's list leaves super admins out. */
  isSuperAdmin: boolean
}>()

const emit = defineEmits<{ (e: "retry"): void }>()

const { t, locale } = useI18n()

function formatCount(value: number): string {
  return new Intl.NumberFormat(locale.value).format(value)
}

const totalDetail = computed(() => {
  if (props.statsError) return t("adminUsers.management.stats.loadFailed")
  if (!props.registrations) return null
  return t("adminUsers.management.stats.newInDays", {
    days: props.trendDays,
    count: formatCount(props.registrations.total),
  })
})

const staffDetail = computed(() => props.stats
  ? t("adminUsers.management.stats.staffBreakdown", {
      superAdmin: formatCount(props.stats.superAdmin),
      admin: formatCount(props.stats.admin),
    })
  : null)

const bannedDetail = computed(() => props.stats
  ? t("adminUsers.management.stats.shareOfAll", { percent: formatSharePercent(props.stats.bannedPercent, locale.value) })
  : null)

const listDetail = computed(() => {
  if (props.listFailed) return null
  if (!props.hasActiveFilters) {
    return props.isSuperAdmin
      ? t("adminUsers.management.stats.listScopeSuperAdmin")
      : t("adminUsers.management.stats.listScopeAdmin")
  }
  if (!props.stats || !props.listReady) return null
  return t("adminUsers.management.stats.shareOfAll", {
    percent: formatSharePercent(sharePercent(props.listTotal, props.stats.total), locale.value),
  })
})
</script>

<template>
  <AdminStatGrid :columns="4" data-testid="admin-users-stats">
    <AdminStatTile
      :label="t('adminUsers.management.stats.totalUsers')"
      :value="stats?.total"
      :icon="LucideUsers"
      tone="primary"
      :detail="totalDetail"
      :loading="statsLoading && !stats"
      data-stat="total"
    >
      <Button
        v-if="statsError"
        type="button"
        variant="ghost"
        size="icon"
        class="-my-1 size-7 text-muted-foreground pointer-coarse:size-10"
        :disabled="statsLoading"
        :title="t('adminUsers.management.stats.retry')"
        :aria-label="t('adminUsers.management.stats.retry')"
        @click="emit('retry')"
      >
        <LucideRefreshCcw :class="['size-3.5', statsLoading ? 'animate-spin' : '']" aria-hidden="true" />
      </Button>
      <AdminSparkline
        v-else-if="registrations && registrations.series.length > 1"
        :values="registrations.series"
        :width="56"
        :height="20"
        class="text-primary"
        :label="t('adminUsers.management.stats.trendLabel', { days: trendDays })"
      />
    </AdminStatTile>

    <AdminStatTile
      :label="t('adminUsers.management.stats.staff')"
      :value="stats?.staff"
      :icon="LucideShieldCheck"
      tone="info"
      :detail="staffDetail"
      :loading="statsLoading && !stats"
      data-stat="staff"
    />

    <AdminStatTile
      :label="t('adminUsers.management.stats.banned')"
      :value="stats?.banned"
      :icon="LucideBan"
      :tone="stats && stats.banned > 0 ? 'danger' : 'default'"
      :detail="bannedDetail"
      :loading="statsLoading && !stats"
      data-stat="banned"
    />

    <AdminStatTile
      :label="hasActiveFilters ? t('adminUsers.management.stats.filtered') : t('adminUsers.management.stats.listed')"
      :value="listFailed ? null : listTotal"
      :icon="LucideListFilter"
      :tone="hasActiveFilters ? 'primary' : 'default'"
      :detail="listDetail"
      :loading="!listReady"
      data-stat="list"
    />
  </AdminStatGrid>
</template>
