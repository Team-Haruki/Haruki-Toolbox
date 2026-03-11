<script setup lang="ts">
import {
  GameBindingDeleteDialog,
  GameBindingEditDialog,
  GameBindingFiltersCard,
  GameBindingReassignDialog,
  GameBindingsTable,
} from "@/modules/admin-game-bindings/components"
import { useGameBindingManagement } from "@/modules/admin-game-bindings/composables/useGameBindingManagement"

const {
  loading,
  bindings,
  total,
  page,
  totalPages,
  filterQ,
  filterServer,
  filterUserId,
  filterGameUserId,
  filterSort,
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
  bindingKey,
  serverLabel,
  applyFilters,
  resetFilters,
  prevPage,
  nextPage,
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

function updateSuitePermission(payload: { key: string; value: boolean }) {
  editSuite.value[payload.key] = payload.value
}

function updateMysekaiPermission(payload: { key: string; value: boolean }) {
  editMysekai.value[payload.key] = payload.value
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <GameBindingFiltersCard
      v-model:filter-q="filterQ"
      v-model:filter-server="filterServer"
      v-model:filter-user-id="filterUserId"
      v-model:filter-game-user-id="filterGameUserId"
      v-model:filter-sort="filterSort"
      :servers="servers"
      :sort-options="sortOptions"
      @apply="applyFilters"
      @reset="resetFilters"
      @add="openAddBinding"
    />

    <GameBindingsTable
      :loading="loading"
      :bindings="bindings"
      :selected="selected"
      :select-all="selectAll"
      :total="total"
      :page="page"
      :total-pages="totalPages"
      :action-loading="actionLoading"
      :binding-key="bindingKey"
      :server-label="serverLabel"
      @toggle-select="toggleSelect"
      @toggle-select-all="toggleSelectAll"
      @open-edit="openEditBinding"
      @open-reassign="openReassign"
      @open-delete="openDeleteConfirm"
      @batch-delete="handleBatchDelete"
      @prev-page="prevPage"
      @next-page="nextPage"
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
      :action-loading="actionLoading"
      :server-label="serverLabel"
      @confirm="handleDelete"
    />
  </div>
</template>
