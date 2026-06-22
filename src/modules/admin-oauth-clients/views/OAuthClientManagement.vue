<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "vue-i18n"
import {
  OAuthClientConfirmActionDialog,
  OAuthClientCreateDialog,
  OAuthClientDeleteDialog,
  OAuthClientEditDialog,
  OAuthClientSecretDialog,
  OAuthClientStatsDialog,
  OAuthClientTable,
  OAuthClientWebhooksDialog,
} from "@/modules/admin-oauth-clients/components"
import { useOAuthClientManagement } from "@/modules/admin-oauth-clients/composables/useOAuthClientManagement"

const { t } = useI18n()

const {
  userStore,
  loading,
  clients,
  actionLoading,
  createOpen,
  newClientId,
  newName,
  newClientType,
  newScopes,
  newRedirectUris,
  creating,
  editOpen,
  editClientId,
  editName,
  editClientType,
  editScopes,
  editRedirectUris,
  saving,
  statsOpen,
  statsLoading,
  statsFrom,
  statsTo,
  statsBucket,
  stats,
  secretDisplayOpen,
  displayedSecret,
  deleteConfirmOpen,
  clientToDelete,
  rotateConfirmOpen,
  clientToRotate,
  revokeConfirmOpen,
  clientToRevoke,
  webhookOpen,
  webhookClientId,
  webhooks,
  webhookLoading,
  webhookSaving,
  webhookDeleting,
  editingWebhook,
  webhookFormOpen,
  callbackUrl,
  bearer,
  enabled,
  clearBearer,
  webhookDeleteConfirmOpen,
  webhookToDelete,
  AVAILABLE_SCOPES,
  confirmDelete,
  executeDelete,
  toggleNewScope,
  toggleEditScope,
  updateNewClientId,
  updateNewName,
  updateEditName,
  updateNewClientType,
  updateEditClientType,
  updateNewRedirectUri,
  addNewRedirectUri,
  removeNewRedirectUri,
  updateEditRedirectUri,
  addEditRedirectUri,
  removeEditRedirectUri,
  handleCreate,
  openEdit,
  handleSaveEdit,
  toggleActive,
  confirmRotateSecret,
  handleRotateSecret,
  handleRestore,
  confirmRevoke,
  handleRevoke,
  showStats,
  applyStatsFilters,
  resetStatsFilters,
  loadWebhooks,
  openWebhookManager,
  openCreateWebhook,
  openEditWebhook,
  saveWebhook,
  confirmDeleteWebhook,
  deleteWebhook,
  copySecret,
} = useOAuthClientManagement()
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <CardTitle class="text-lg">{{ t("adminOAuthClients.title") }}</CardTitle>
        <OAuthClientCreateDialog
          v-if="userStore.isSuperAdmin"
          v-model:open="createOpen"
          :creating="creating"
          :client-id="newClientId"
          :name="newName"
          :client-type="newClientType"
          :scopes="newScopes"
          :redirect-uris="newRedirectUris"
          :available-scopes="AVAILABLE_SCOPES"
          @update:client-id="updateNewClientId"
          @update:name="updateNewName"
          @update:client-type="updateNewClientType"
          @toggle-scope="toggleNewScope"
          @add-redirect-uri="addNewRedirectUri"
          @remove-redirect-uri="removeNewRedirectUri"
          @update-redirect-uri="updateNewRedirectUri"
          @submit="handleCreate"
        />
      </CardHeader>
      <CardContent class="p-0">
        <OAuthClientTable
          :loading="loading"
          :clients="clients"
          :action-loading="actionLoading"
          :is-super-admin="userStore.isSuperAdmin"
          @open-edit="openEdit"
          @manage-webhooks="openWebhookManager"
          @show-stats="showStats"
          @toggle-active="toggleActive"
          @rotate-secret="confirmRotateSecret"
          @revoke="confirmRevoke"
          @restore="handleRestore"
          @confirm-delete="confirmDelete"
        />
      </CardContent>
    </Card>

    <OAuthClientStatsDialog
      v-model:open="statsOpen"
      :loading="statsLoading"
      v-model:stats-from="statsFrom"
      v-model:stats-to="statsTo"
      v-model:stats-bucket="statsBucket"
      :stats="stats"
      @apply="applyStatsFilters"
      @reset="resetStatsFilters"
    />

    <OAuthClientEditDialog
      v-model:open="editOpen"
      :saving="saving"
      :edit-client-id="editClientId"
      :name="editName"
      :client-type="editClientType"
      :scopes="editScopes"
      :redirect-uris="editRedirectUris"
      :available-scopes="AVAILABLE_SCOPES"
      @update:name="updateEditName"
      @update:client-type="updateEditClientType"
      @toggle-scope="toggleEditScope"
      @add-redirect-uri="addEditRedirectUri"
      @remove-redirect-uri="removeEditRedirectUri"
      @update-redirect-uri="updateEditRedirectUri"
      @submit="handleSaveEdit"
    />

    <OAuthClientDeleteDialog
      v-model:open="deleteConfirmOpen"
      :client-id="clientToDelete"
      @confirm="executeDelete"
    />

    <OAuthClientConfirmActionDialog
      v-model:open="rotateConfirmOpen"
      :title="t('adminOAuthClients.rotateDialog.title')"
      :description="t('adminOAuthClients.rotateDialog.description', { clientId: clientToRotate })"
      :cancel-label="t('adminOAuthClients.rotateDialog.cancel')"
      :confirm-label="t('adminOAuthClients.rotateDialog.confirm')"
      @confirm="handleRotateSecret"
    />

    <OAuthClientConfirmActionDialog
      v-model:open="revokeConfirmOpen"
      :title="t('adminOAuthClients.revokeDialog.title')"
      :description="t('adminOAuthClients.revokeDialog.description', { clientId: clientToRevoke })"
      :cancel-label="t('adminOAuthClients.revokeDialog.cancel')"
      :confirm-label="t('adminOAuthClients.revokeDialog.confirm')"
      @confirm="handleRevoke"
    />

    <OAuthClientSecretDialog
      v-model:open="secretDisplayOpen"
      :secret="displayedSecret"
      @copy="copySecret"
    />

    <OAuthClientWebhooksDialog
      v-model:open="webhookOpen"
      v-model:form-open="webhookFormOpen"
      v-model:callback-url="callbackUrl"
      v-model:bearer="bearer"
      v-model:enabled="enabled"
      v-model:clear-bearer="clearBearer"
      :client-id="webhookClientId"
      :loading="webhookLoading"
      :saving="webhookSaving"
      :deleting="webhookDeleting"
      :editing-webhook="editingWebhook"
      :webhooks="webhooks"
      @refresh="loadWebhooks"
      @create="openCreateWebhook"
      @edit="openEditWebhook"
      @delete="confirmDeleteWebhook"
      @save="saveWebhook"
    />

    <OAuthClientConfirmActionDialog
      v-model:open="webhookDeleteConfirmOpen"
      :title="t('adminOAuthClients.webhooks.deleteDialog.title')"
      :description="t('adminOAuthClients.webhooks.deleteDialog.description', { callbackUrl: webhookToDelete?.callbackUrl ?? '' })"
      :cancel-label="t('adminOAuthClients.webhooks.deleteDialog.cancel')"
      :confirm-label="t('adminOAuthClients.webhooks.deleteDialog.confirm')"
      @confirm="deleteWebhook"
    />
  </div>
</template>
