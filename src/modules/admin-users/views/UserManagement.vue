<script setup lang="ts">
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  UserManagementBatchActions,
  UserManagementFilters,
  UserManagementPagination,
  UserManagementTable,
} from "@/modules/admin-users/components"
import { useAdminUserManagement } from "@/modules/admin-users/composables/useAdminUserManagement"

const router = useRouter()
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
  selectedIds,
  batchLoading,
  batchRoleTarget,
  batchAllowCNTarget,
  totalPages,
  prevPage,
  nextPage,
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
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-lg">{{ t("adminUsers.management.title") }}</CardTitle>
      </CardHeader>
      <CardContent>
        <UserManagementFilters
          v-model:search="search"
          v-model:role-filter="roleFilter"
          v-model:banned-filter="bannedFilter"
          v-model:allow-cn-mysekai-filter="allowCNMysekaiFilter"
          v-model:sort-filter="sortFilter"
          v-model:created-from="createdFrom"
          v-model:created-to="createdTo"
        />
        <UserManagementBatchActions
          :selected-count="selectedIds.length"
          :batch-loading="batchLoading"
          v-model:batch-role-target="batchRoleTarget"
          v-model:batch-allow-cn-target="batchAllowCNTarget"
          @batch-ban="doBatchBan"
          @batch-unban="doBatchUnban"
          @batch-force-logout="doBatchForceLogout"
          @batch-role="doBatchRole"
          @batch-allow-cn="doBatchAllowCNMysekai"
        />
      </CardContent>
    </Card>

    <Card>
      <CardContent class="p-0">
        <UserManagementTable
          :loading="loading"
          :users="users"
          :selected-ids="selectedIds"
          @toggle-select-all="toggleSelectAll"
          @toggle-select="toggleSelect"
          @go-to-user="goToUser"
        />
      </CardContent>
    </Card>

    <UserManagementPagination
      :total="total"
      :page="page"
      :page-size="pageSize"
      :total-pages="totalPages()"
      @update:page-size="pageSize = $event"
      @prev-page="prevPage"
      @next-page="nextPage"
    />
  </div>
</template>
