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
import { useRouter } from "vue-router"
import { Button } from "@/components/ui/button"
import { LucideBot, LucideInbox, LucideInfo, LucidePlus } from "lucide-vue-next"
import PageHeader from "@/shared/components/PageHeader.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsLinkRow from "@/shared/components/settings/SettingsLinkRow.vue"

const {
  data,
  isCreating,
  generatedCode,
  showEditDialog,
  showVerifyDialog,
  showDeleteDialog,
  userIdInput,
  userIdError,
  verificationTriggered,
  verificationInvalidated,
  editTarget,
  deleteTarget,
  isSaving,
  isVerifying,
  setDefaultBinding,
  allowCNMysekai,
  regionLabels,
  regionOptions,
  setEditDialogOpen,
  setVerifyDialogOpen,
  startAdd,
  startEdit,
  confirmDelete,
  handleDelete,
  handleEditSave,
  handleVerify,
  clearUidError,
  copyCodeToClipboard,
} = useGameAccountBindingManagement()

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const {
  grantsOpen,
  grantsLoading,
  grantsLoadError,
  grantSaving,
  grantDeleting,
  selectedAccount,
  receivedGrants,
  selectedAccountGrants,
  granteeUserId,
  grantDataType,
  grantCanRead,
  grantCanWrite,
  expiresAt,
  editingGrant,
  fieldErrors,
  revokeTarget,
  revokeDialogOpen,
  clearFieldError,
  loadGrants,
  openGrantManager,
  openReceivedGrantManager,
  editGrant,
  cancelEdit,
  saveGrant,
  requestRevoke,
  revokeGrant,
} = useGameAccountDataGrants(() => userStore.userId)
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-0 py-4">
    <PageHeader
      size="compact"
      :title="t('userSettings.gameBinding.title')"
    >
      <template #actions>
        <Button @click="startAdd">
          <LucidePlus class="size-4" />
          {{ t("userSettings.gameBinding.addButton") }}
        </Button>
      </template>
    </PageHeader>

    <div class="flex flex-col gap-1.5">
      <GameBindingAccountTable
        :data="data"
        :region-labels="regionLabels"
        @add="startAdd"
        @edit="startEdit"
        @grants="openGrantManager"
        @delete="confirmDelete"
        @set-default="setDefaultBinding"
      />
      <!-- The one binding rule, as a footnote of the list it constrains. -->
      <p class="flex items-start gap-1.5 px-1 text-xs text-muted-foreground">
        <LucideInfo class="mt-0.5 size-3.5 shrink-0" />
        {{ t("userSettings.gameBinding.alert.line1") }}
      </p>
    </div>

    <!-- Where the bindings are used by other people and by HarukiBot. -->
    <SettingsGroup :title="t('userSettings.gameBinding.relatedTitle')" surface="card" data-testid="game-binding-related">
      <SettingsLinkRow
        :icon="LucideInbox"
        :label="t('userSettings.gameBinding.actions.receivedGrants')"
        @click="openReceivedGrantManager"
      />
      <SettingsLinkRow
        :icon="LucideBot"
        :label="t('userSettings.sections.harukiBotTitle')"
        :help="t('userSettings.gameBinding.alert.line2')"
        @click="router.push({ name: 'user.harukiBotAuthorization' })"
      />
    </SettingsGroup>

    <GameBindingEditDialog
      :open="showEditDialog"
      :is-creating="isCreating"
      :verification-triggered="verificationTriggered"
      :verification-invalidated="verificationInvalidated"
      :is-saving="isSaving"
      :is-verifying="isVerifying"
      :allow-c-n-mysekai="allowCNMysekai"
      :user-id-input="userIdInput"
      :user-id-error="userIdError"
      :edit-target="editTarget"
      :region-options="regionOptions"
      @update:open="setEditDialogOpen"
      @update:user-id-input="userIdInput = $event; clearUidError()"
      @update:edit-target="editTarget = $event"
      @verify="handleVerify"
      @save="handleEditSave"
    />

    <GameBindingDeleteDialog
      v-model:open="showDeleteDialog"
      :delete-target="deleteTarget"
      :region-labels="regionLabels"
      :on-confirm="handleDelete"
    />

    <GameBindingVerifyDialog
      :open="showVerifyDialog"
      :generated-code="generatedCode"
      @update:open="setVerifyDialogOpen"
      @copy="copyCodeToClipboard"
    />

    <GameBindingGrantsDialog
      v-model:open="grantsOpen"
      v-model:grantee-user-id="granteeUserId"
      v-model:data-type="grantDataType"
      v-model:can-read="grantCanRead"
      v-model:can-write="grantCanWrite"
      v-model:expires-at="expiresAt"
      v-model:revoke-dialog-open="revokeDialogOpen"
      :loading="grantsLoading"
      :load-error="grantsLoadError"
      :saving="grantSaving"
      :deleting="grantDeleting"
      :selected-account="selectedAccount"
      :selected-account-grants="selectedAccountGrants"
      :received-grants="receivedGrants"
      :editing-grant="editingGrant"
      :field-errors="fieldErrors"
      :revoke-target="revokeTarget"
      :region-labels="regionLabels"
      :current-user-id="userStore.userId"
      :on-revoke="revokeGrant"
      @clear-field-error="clearFieldError"
      @refresh="loadGrants"
      @save="saveGrant"
      @edit="editGrant"
      @cancel-edit="cancelEdit"
      @request-revoke="requestRevoke"
    />
  </div>
</template>
