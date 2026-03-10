<script setup lang="ts">
import {
  GameBindingAccountTable,
  GameBindingDeleteDialog,
  GameBindingEditDialog,
  GameBindingVerifyDialog,
} from "@/modules/user-settings/components/game-binding"
import { useGameAccountBindingManagement } from "@/modules/user-settings/composables/useGameAccountBindingManagement"

const {
  data,
  isCreating,
  generatedCode,
  showEditDialog,
  showVerifyDialog,
  showDeleteDialog,
  userIdInput,
  verificationTriggered,
  editTarget,
  deleteTarget,
  isSaving,
  isDeleting,
  isVerifying,
  allowCNMysekai,
  regionLabels,
  regionOptions,
  startAdd,
  startEdit,
  confirmDelete,
  handleDelete,
  handleEditSave,
  handleVerify,
  copyCodeToClipboard,
} = useGameAccountBindingManagement()
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center px-0 py-4">
    <GameBindingAccountTable
      :data="data"
      :region-labels="regionLabels"
      @add="startAdd"
      @edit="startEdit"
      @delete="confirmDelete"
    />

    <GameBindingEditDialog
      v-model:open="showEditDialog"
      :is-creating="isCreating"
      :verification-triggered="verificationTriggered"
      :is-saving="isSaving"
      :is-verifying="isVerifying"
      :allow-c-n-mysekai="allowCNMysekai"
      :user-id-input="userIdInput"
      :edit-target="editTarget"
      :region-options="regionOptions"
      @update:user-id-input="userIdInput = $event"
      @update:edit-target="editTarget = $event"
      @verify="handleVerify"
      @save="handleEditSave"
    />

    <GameBindingDeleteDialog
      v-model:open="showDeleteDialog"
      :delete-target="deleteTarget"
      :region-labels="regionLabels"
      :is-deleting="isDeleting"
      @confirm="handleDelete"
    />

    <GameBindingVerifyDialog
      v-model:open="showVerifyDialog"
      :generated-code="generatedCode"
      @copy="copyCodeToClipboard"
    />
  </div>
</template>
