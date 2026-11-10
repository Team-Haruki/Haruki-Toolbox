<script setup lang="ts">
import {
  GameBindingDeleteDialog,
  GameBindingEditDialog,
  GameBindingFilters,
  GameBindingReassignDialog,
  GameBindingStats,
  GameBindingsTable,
} from "@/modules/admin-game-bindings/components"
import { useGameBindingManagement } from "@/modules/admin-game-bindings/composables/useGameBindingManagement"
import type { MysekaiPermissionKey, SuitePermissionKey } from "@/lib/game-binding-permission-meta"

const {
  loading,
  loadError,
  bindings,
  total,
  page,
  pageSize,
  totalPages,
  filterQ,
  filterServer,
  filterUserId,
  filterGameUserId,
  filterVerified,
  filterSort,
  stats,
  statsLoading,
  statsFailed,
  loadStats,
  pageSharing,
  selected,
  selectAll,
  reassignDialogOpen,
  reassignTarget,
  reassignTargetUserId,
  actionLoading,
  deleteDialogOpen,
  deleteTarget,
  editDialogOpen,
  editTargetUserId,
  editServer,
  editGameUserId,
  editSuite,
  editMysekai,
  isEditMode,
  servers,
  editServers,
  sortOptions,
  verifiedOptions,
  bindingKey,
  serverLabel,
  applyFilters,
  resetFilters,
  reload,
  prevPage,
  nextPage,
  goToPage,
  toggleSelect,
  toggleSelectAll,
  openDeleteConfirm,
  handleDelete,
  openReassign,
  handleReassign,
  handleBatchDelete,
  openAddBinding,
  openEditBinding,
  handleSaveBinding,
} = useGameBindingManagement()

function updateSuitePermission(payload: { key: SuitePermissionKey; value: boolean }) {
  editSuite.value[payload.key] = payload.value
}

function updateMysekaiPermission(payload: { key: MysekaiPermissionKey; value: boolean }) {
  editMysekai.value[payload.key] = payload.value
}
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <GameBindingStats
      :loading="statsLoading"
      :stats="stats"
      :failed="statsFailed"
      :rows-loading="loading"
      :row-count="bindings.length"
      :matching="loadError ? null : total"
      :page="page"
      :total-pages="totalPages"
      :page-sharing="pageSharing"
      :server-label="serverLabel"
      @retry="loadStats"
    />

    <GameBindingFilters
      v-model:filter-q="filterQ"
      v-model:filter-server="filterServer"
      v-model:filter-user-id="filterUserId"
      v-model:filter-game-user-id="filterGameUserId"
      v-model:filter-verified="filterVerified"
      v-model:filter-sort="filterSort"
      :servers="servers"
      :verified-options="verifiedOptions"
      :sort-options="sortOptions"
      :loading="loading"
      @apply="applyFilters"
      @reset="resetFilters"
      @add="openAddBinding"
    />

    <GameBindingsTable
      :loading="loading"
      :error="loadError"
      :bindings="bindings"
      :selected="selected"
      :select-all="selectAll"
      :total="total"
      :page="page"
      :page-size="pageSize"
      :total-pages="totalPages"
      :action-loading="actionLoading"
      :binding-key="bindingKey"
      :server-label="serverLabel"
      :batch-delete="handleBatchDelete"
      @toggle-select="toggleSelect"
      @toggle-select-all="toggleSelectAll"
      @open-edit="openEditBinding"
      @open-reassign="openReassign"
      @open-delete="openDeleteConfirm"
      @retry="reload"
      @prev-page="prevPage"
      @next-page="nextPage"
      @go-to-page="goToPage"
      @update:page-size="pageSize = $event"
    />

    <GameBindingReassignDialog
      v-model:open="reassignDialogOpen"
      v-model:target-user-id="reassignTargetUserId"
      :target="reassignTarget"
      :action-loading="actionLoading"
      :server-label="serverLabel"
      @confirm="handleReassign"
    />

    <GameBindingEditDialog
      v-model:open="editDialogOpen"
      v-model:edit-target-user-id="editTargetUserId"
      v-model:edit-server="editServer"
      v-model:edit-game-user-id="editGameUserId"
      :is-edit-mode="isEditMode"
      :action-loading="actionLoading"
      :edit-suite="editSuite"
      :edit-mysekai="editMysekai"
      :edit-servers="editServers"
      @update:suite="updateSuitePermission"
      @update:mysekai="updateMysekaiPermission"
      @save="handleSaveBinding"
    />

    <GameBindingDeleteDialog
      v-model:open="deleteDialogOpen"
      :target="deleteTarget"
      :server-label="serverLabel"
      :on-confirm="handleDelete"
    />
  </div>
</template>
