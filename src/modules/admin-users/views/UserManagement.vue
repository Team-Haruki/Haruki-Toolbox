<script setup lang="ts">
import { useRouter } from "vue-router"
import { useUserStore } from "@/shared/stores/user"
import { Card, CardContent } from "@/components/ui/card"
import AdminPagination from "@/modules/admin/components/AdminPagination.vue"
import {
  UserManagementBatchActions,
  UserManagementFilters,
  UserManagementTable,
} from "@/modules/admin-users/components"
import type { UserBatchActions } from "@/modules/admin-users/components/UserManagementBatchActions.vue"
import { useAdminUserManagement } from "@/modules/admin-users/composables/useAdminUserManagement"
import { useI18n } from "vue-i18n"

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

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

function goToUser(userId: string) {
  void router.push({ name: "admin.userDetail", params: { userId } })
}

const batchActions: UserBatchActions = {
  ban: doBatchBan,
  unban: doBatchUnban,
  forceLogout: doBatchForceLogout,
  setRole: doBatchRole,
  setAllowCN: doBatchAllowCNMysekai,
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <Card class="rounded-lg">
      <CardContent>
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
      </CardContent>
    </Card>

    <Card class="rounded-lg gap-0 overflow-hidden py-0">
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
        @toggle-select-all="toggleSelectAll"
        @toggle-select="toggleSelect"
        @go-to-user="goToUser"
        @retry="reloadUsers"
      />
      <div v-if="!loadError" class="border-t px-4 py-3 sm:px-6">
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
    </Card>
  </div>
</template>
