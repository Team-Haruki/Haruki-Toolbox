<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "vue-i18n"
import {
  OAuthClientCreateDialog,
  OAuthClientDeleteDialog,
  OAuthClientEditDialog,
  OAuthClientSecretDialog,
  OAuthClientStatsDialog,
  OAuthClientTable,
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
  stats,
  secretDisplayOpen,
  displayedSecret,
  deleteConfirmOpen,
  clientToDelete,
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
  handleRotateSecret,
  handleRestore,
  handleRevoke,
  showStats,
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
          @show-stats="showStats"
          @toggle-active="toggleActive"
          @rotate-secret="handleRotateSecret"
          @revoke="handleRevoke"
          @restore="handleRestore"
          @confirm-delete="confirmDelete"
        />
      </CardContent>
    </Card>

    <OAuthClientStatsDialog
      v-model:open="statsOpen"
      :loading="statsLoading"
      :stats="stats"
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

    <OAuthClientSecretDialog
      v-model:open="secretDisplayOpen"
      :secret="displayedSecret"
      @copy="copySecret"
    />
  </div>
</template>
