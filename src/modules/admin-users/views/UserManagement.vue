<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import AdminPagination from "@/modules/admin/components/AdminPagination.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import {
  UserManagementBatchActions,
  UserManagementFilters,
  UserManagementStats,
  UserManagementTable,
} from "@/modules/admin-users/components"
import type { UserBatchActions } from "@/modules/admin-users/components/UserManagementBatchActions.vue"
import { useAdminUserManagement } from "@/modules/admin-users/composables/useAdminUserManagement"
import { REGISTRATION_TREND_DAYS, useAdminUserDirectoryStats } from "@/modules/admin-users/composables/useAdminUserDirectoryStats"
import { summarizeUserPage } from "@/modules/admin-users/lib/user-stats"

const router = useRouter()
const userStore = useUserStore()
const { t, locale } = useI18n()

const {
  loading,
  users,
  total,
  page,
  pageSize,
  search,
  roleFilter,
  bannedFilter,
  allowCNMysekaiFilter,
  sortFilter,
  createdFrom,
  createdTo,
  hasActiveFilters,
  selectedIds,
  loadError,
  batchLoading,
  batchRoleTarget,
  batchAllowCNTarget,
  totalPages,
  reloadUsers,
  applySearch,
  resetFilters,
  prevPage,
  nextPage,
  goToPage,
  toggleSelect,
  toggleSelectAll,
  doBatchBan,
  doBatchUnban,
  doBatchForceLogout,
  doBatchRole,
  doBatchAllowCNMysekai,
} = useAdminUserManagement()

const { stats, statsLoading, statsError, registrations, reloadStats } = useAdminUserDirectoryStats()

// The list's own total is only a figure once the list has answered.
const listReady = ref(false)
watch(loading, (isLoading) => {
  if (!isLoading) listReady.value = true
})

// Sorting alone narrows nothing: the fourth tile only calls the total "filtered" when it is.
const hasNarrowingFilters = computed(() =>
  search.value.trim() !== ""
  || roleFilter.value !== "all"
  || bannedFilter.value !== "all"
  || allowCNMysekaiFilter.value !== "all"
  || !!createdFrom.value
  || !!createdTo.value
)

// Counted from the rows on screen, and labelled as such.
const pageSummary = computed(() => summarizeUserPage(users.value))

function formatCount(value: number): string {
  return new Intl.NumberFormat(locale.value).format(value)
}

function goToUser(userId: string) {
  void router.push({ name: "admin.userDetail", params: { userId } })
}

// A batch action changes the site-wide counters (banned, staff), so they
// are read again once it has gone through.
async function thenReloadStats(action: () => Promise<void>) {
  await action()
  reloadStats()
}

const batchActions: UserBatchActions = {
  ban: () => thenReloadStats(doBatchBan),
  unban: () => thenReloadStats(doBatchUnban),
  forceLogout: doBatchForceLogout,
  setRole: () => thenReloadStats(doBatchRole),
  setAllowCN: doBatchAllowCNMysekai,
}
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <UserManagementStats
      :stats="stats"
      :stats-loading="statsLoading"
      :stats-error="statsError"
      :registrations="registrations"
      :trend-days="REGISTRATION_TREND_DAYS"
      :list-total="total"
      :list-ready="listReady"
      :list-failed="!!loadError"
      :has-active-filters="hasNarrowingFilters"
      :is-super-admin="userStore.isSuperAdmin"
      @retry="reloadStats"
    />

    <AdminPanel flush>
      <!-- The toolbar, the batch bar and the rows all fold by this width. -->
      <div class="@container/users">
        <UserManagementFilters
          v-model:search="search"
          v-model:role-filter="roleFilter"
          v-model:banned-filter="bannedFilter"
          v-model:allow-cn-mysekai-filter="allowCNMysekaiFilter"
          v-model:sort-filter="sortFilter"
          v-model:created-from="createdFrom"
          v-model:created-to="createdTo"
          :has-active-filters="hasActiveFilters"
          :loading="loading"
          @apply="applySearch"
          @reset="resetFilters"
        />
        <UserManagementBatchActions
          :selected-count="selectedIds.length"
          :batch-loading="batchLoading"
          :is-super-admin="userStore.isSuperAdmin"
          v-model:batch-role-target="batchRoleTarget"
          v-model:batch-allow-cn-target="batchAllowCNTarget"
          :actions="batchActions"
        />
        <UserManagementTable
          :loading="loading"
          :error="loadError"
          :users="users"
          :selected-ids="selectedIds"
          :has-active-filters="hasActiveFilters"
          @toggle-select-all="toggleSelectAll"
          @toggle-select="toggleSelect"
          @go-to-user="goToUser"
          @retry="reloadUsers"
          @reset-filters="resetFilters"
        />
      </div>

      <template v-if="!loadError" #footer>
        <div class="flex flex-col gap-2">
          <p
            v-if="pageSummary.count > 0"
            class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs tabular-nums text-muted-foreground"
            data-testid="admin-users-page-summary"
          >
            <span class="font-medium text-foreground">{{ t("adminUsers.management.pageSummary.count", { count: formatCount(pageSummary.count) }) }}</span>
            <span>{{ t("adminUsers.management.pageSummary.staff", { count: formatCount(pageSummary.staff) }) }}</span>
            <span>{{ t("adminUsers.management.pageSummary.banned", { count: formatCount(pageSummary.banned) }) }}</span>
            <span>{{ t("adminUsers.management.pageSummary.allowCN", { count: formatCount(pageSummary.allowCN) }) }}</span>
          </p>
          <AdminPagination
            :total="total"
            :page="page"
            :page-size="pageSize"
            :total-pages="totalPages()"
            :disabled="loading"
            :total-label="t('adminUsers.management.pagination.totalUsers', { total })"
            @update:page-size="pageSize = $event"
            @prev-page="prevPage"
            @next-page="nextPage"
            @go-to-page="goToPage"
          />
        </div>
      </template>
    </AdminPanel>
  </div>
</template>
