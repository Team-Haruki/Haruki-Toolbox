<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideKey, LucideRefreshCw, LucideSearch } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  OAuthClientConfirmActionDialog,
  OAuthClientCreateDialog,
  OAuthClientDeleteDialog,
  OAuthClientEditDialog,
  OAuthClientList,
  OAuthClientSecretDialog,
  OAuthClientStatsDialog,
  OAuthClientWebhooksDialog,
} from "@/modules/admin-oauth-clients/components"
import { useOAuthClientManagement } from "@/modules/admin-oauth-clients/composables/useOAuthClientManagement"

const { t } = useI18n()

type StatusFilter = "all" | "enabled" | "disabled" | "deleted"

const search = ref("")
const statusFilter = ref<StatusFilter>("all")

function isStatusFilter(value: unknown): value is StatusFilter {
  return value === "all" || value === "enabled" || value === "disabled" || value === "deleted"
}

function handleStatusFilterChange(value: unknown) {
  if (isStatusFilter(value)) {
    statusFilter.value = value
  }
}

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
  newPostLogoutRedirectUris,
  creating,
  editOpen,
  editClientId,
  editName,
  editClientType,
  editScopes,
  editRedirectUris,
  editPostLogoutRedirectUris,
  saving,
  statsOpen,
  statsLoading,
  statsClientId,
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
  updateNewPostLogoutRedirectUri,
  addNewPostLogoutRedirectUri,
  removeNewPostLogoutRedirectUri,
  updateEditPostLogoutRedirectUri,
  addEditPostLogoutRedirectUri,
  removeEditPostLogoutRedirectUri,
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
  loadClients,
} = useOAuthClientManagement()

const filteredClients = computed(() => {
  const query = search.value.trim().toLowerCase()
  return clients.value.filter((client) => {
    if (statusFilter.value === "deleted" && !client.deleted) return false
    if (statusFilter.value === "enabled" && (client.deleted || !client.active)) return false
    if (statusFilter.value === "disabled" && (client.deleted || client.active)) return false
    if (!query) return true
    return client.clientId.toLowerCase().includes(query)
      || (client.name ?? "").toLowerCase().includes(query)
  })
})

const hasActiveFilters = computed(() => search.value.trim() !== "" || statusFilter.value !== "all")

function resetFilters() {
  search.value = ""
  statusFilter.value = "all"
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div class="relative min-w-0 flex-1 sm:max-w-xs">
        <LucideSearch class="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="search"
          class="pl-8"
          :placeholder="t('adminOAuthClients.list.searchPlaceholder')"
        />
      </div>
      <Select :model-value="statusFilter" @update:model-value="handleStatusFilterChange">
        <SelectTrigger class="w-full sm:w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ t("adminOAuthClients.list.allStatuses") }}</SelectItem>
          <SelectItem value="enabled">{{ t("adminOAuthClients.status.enabled") }}</SelectItem>
          <SelectItem value="disabled">{{ t("adminOAuthClients.status.disabled") }}</SelectItem>
          <SelectItem value="deleted">{{ t("adminOAuthClients.status.deleted") }}</SelectItem>
        </SelectContent>
      </Select>
      <div class="flex items-center justify-between gap-2 sm:ml-auto sm:justify-end">
        <span class="text-xs tabular-nums text-muted-foreground">
          {{ t("adminOAuthClients.list.count", { count: filteredClients.length }, filteredClients.length) }}
        </span>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="loading"
            :title="t('adminOAuthClients.list.refresh')"
            :aria-label="t('adminOAuthClients.list.refresh')"
            @click="loadClients()"
          >
            <LucideRefreshCw :class="['h-4 w-4', loading ? 'animate-spin' : '']" />
          </Button>
          <OAuthClientCreateDialog
            v-if="userStore.isSuperAdmin"
            v-model:open="createOpen"
            :creating="creating"
            :client-id="newClientId"
            :name="newName"
            :client-type="newClientType"
            :scopes="newScopes"
            :redirect-uris="newRedirectUris"
            :post-logout-redirect-uris="newPostLogoutRedirectUris"
            :available-scopes="AVAILABLE_SCOPES"
            @update:client-id="updateNewClientId"
            @update:name="updateNewName"
            @update:client-type="updateNewClientType"
            @toggle-scope="toggleNewScope"
            @add-redirect-uri="addNewRedirectUri"
            @remove-redirect-uri="removeNewRedirectUri"
            @update-redirect-uri="updateNewRedirectUri"
            @add-post-logout-redirect-uri="addNewPostLogoutRedirectUri"
            @remove-post-logout-redirect-uri="removeNewPostLogoutRedirectUri"
            @update-post-logout-redirect-uri="updateNewPostLogoutRedirectUri"
            @submit="handleCreate"
          />
        </div>
      </div>
    </div>

    <div v-if="loading" class="grid gap-3 xl:grid-cols-2">
      <Skeleton v-for="i in 4" :key="i" class="h-32 w-full rounded-lg" />
    </div>
    <div
      v-else-if="clients.length === 0"
      class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center"
    >
      <LucideKey class="h-8 w-8 text-muted-foreground/60" />
      <p class="text-sm text-muted-foreground">{{ t("adminOAuthClients.table.empty") }}</p>
    </div>
    <div
      v-else-if="filteredClients.length === 0"
      class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center"
    >
      <LucideSearch class="h-8 w-8 text-muted-foreground/60" />
      <p class="text-sm text-muted-foreground">{{ t("adminOAuthClients.list.noMatch") }}</p>
      <Button v-if="hasActiveFilters" variant="outline" size="sm" @click="resetFilters">
        {{ t("adminOAuthClients.list.resetFilters") }}
      </Button>
    </div>
    <OAuthClientList
      v-else
      :clients="filteredClients"
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

    <OAuthClientStatsDialog
      v-model:open="statsOpen"
      :loading="statsLoading"
      :client-id="statsClientId"
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
      :post-logout-redirect-uris="editPostLogoutRedirectUris"
      :available-scopes="AVAILABLE_SCOPES"
      @update:name="updateEditName"
      @update:client-type="updateEditClientType"
      @toggle-scope="toggleEditScope"
      @add-redirect-uri="addEditRedirectUri"
      @remove-redirect-uri="removeEditRedirectUri"
      @update-redirect-uri="updateEditRedirectUri"
      @add-post-logout-redirect-uri="addEditPostLogoutRedirectUri"
      @remove-post-logout-redirect-uri="removeEditPostLogoutRedirectUri"
      @update-post-logout-redirect-uri="updateEditPostLogoutRedirectUri"
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
