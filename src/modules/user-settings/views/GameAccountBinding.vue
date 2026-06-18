<script setup lang="ts">
import {
  GameBindingAccountTable,
  GameBindingDeleteDialog,
  GameBindingEditDialog,
  GameBindingGrantsDialog,
  GameBindingVerifyDialog,
} from "@/modules/user-settings/components/game-binding"
import { useGameAccountBindingManagement } from "@/modules/user-settings/composables/useGameAccountBindingManagement"
import { useGameAccountDataGrants } from "@/modules/user-settings/composables/useGameAccountDataGrants"
import { useUserStore } from "@/shared/stores/user"
import { useI18n } from "vue-i18n"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LucideInfo } from "lucide-vue-next"

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

const { t } = useI18n()
const userStore = useUserStore()
const {
  grantsOpen,
  grantsLoading,
  grantSaving,
  grantDeleting,
  selectedAccount,
  receivedGrants,
  selectedAccountGrants,
  granteeUserId,
  grantDataType,
  expiresAtLocal,
  loadGrants,
  openGrantManager,
  openReceivedGrantManager,
  editGrant,
  saveGrant,
  revokeGrant,
} = useGameAccountDataGrants(() => userStore.userId)
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center gap-4 px-0 py-4">
    <Alert variant="default" class="flex items-start gap-2 w-full max-w-2xl bg-muted/20">
      <LucideInfo class="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
      <div class="space-y-1 w-full">
        <AlertTitle>{{ t("userSettings.gameBinding.alert.title") }}</AlertTitle>
        <AlertDescription class="space-y-1.5 leading-relaxed text-muted-foreground mt-2">
          <p><span class="font-semibold text-foreground">{{ t("userSettings.gameBinding.alert.line1Server") }}</span>{{ t("userSettings.gameBinding.alert.line1Middle") }}<span class="font-semibold text-foreground">{{ t("userSettings.gameBinding.alert.line1GameId") }}</span>{{ t("userSettings.gameBinding.alert.line1After") }}</p>
        </AlertDescription>
      </div>
    </Alert>

    <GameBindingAccountTable
      :data="data"
      :region-labels="regionLabels"
      @add="startAdd"
      @edit="startEdit"
      @grants="openGrantManager"
      @received-grants="openReceivedGrantManager"
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

    <GameBindingGrantsDialog
      v-model:open="grantsOpen"
      v-model:grantee-user-id="granteeUserId"
      v-model:data-type="grantDataType"
      v-model:expires-at-local="expiresAtLocal"
      :loading="grantsLoading"
      :saving="grantSaving"
      :deleting="grantDeleting"
      :selected-account="selectedAccount"
      :selected-account-grants="selectedAccountGrants"
      :received-grants="receivedGrants"
      :region-labels="regionLabels"
      @refresh="loadGrants"
      @save="saveGrant"
      @edit="editGrant"
      @revoke="revokeGrant"
    />
  </div>
</template>
