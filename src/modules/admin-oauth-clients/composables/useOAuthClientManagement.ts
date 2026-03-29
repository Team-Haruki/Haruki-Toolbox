import { computed, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { AVAILABLE_SCOPE_IDS } from "@/modules/admin-oauth-clients/lib/form"
import { useOAuthClientForms } from "@/modules/admin-oauth-clients/composables/useOAuthClientForms"
import { useOAuthClientList } from "@/modules/admin-oauth-clients/composables/useOAuthClientList"
import { useOAuthClientRowActions } from "@/modules/admin-oauth-clients/composables/useOAuthClientRowActions"
import { useOAuthClientSecretDialog } from "@/modules/admin-oauth-clients/composables/useOAuthClientSecretDialog"
import { useOAuthClientStats } from "@/modules/admin-oauth-clients/composables/useOAuthClientStats"

const SCOPE_LABEL_KEY: Record<(typeof AVAILABLE_SCOPE_IDS)[number], string> = {
  "user:read": "adminOAuthClients.scope.userRead",
  "bindings:read": "adminOAuthClients.scope.bindingsRead",
  "game-data:read": "adminOAuthClients.scope.gameDataRead",
  "game-data:write": "adminOAuthClients.scope.gameDataWrite",
  "offline_access": "adminOAuthClients.scope.offlineAccess",
}

export function useOAuthClientManagement() {
  const userStore = useUserStore()
  const { t } = useI18n()
  const AVAILABLE_SCOPES = computed(() =>
    AVAILABLE_SCOPE_IDS.map((id) => ({
      id,
      label: t(SCOPE_LABEL_KEY[id]),
    }))
  )

  const { loading, clients, loadClients } = useOAuthClientList()
  async function refreshClientsStrict() {
    await loadClients({ throwOnError: true, notifyOnError: false })
  }
  const { secretDisplayOpen, displayedSecret, showSecret, copySecret } = useOAuthClientSecretDialog()
  const {
    actionLoading,
    deleteConfirmOpen,
    clientToDelete,
    confirmDelete,
    executeDelete,
    toggleActive,
    handleRotateSecret,
    handleRestore,
    handleRevoke,
  } = useOAuthClientRowActions({
    loadClients: refreshClientsStrict,
    onSecretGenerated: showSecret,
  })
  const {
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
    toggleNewScope,
    toggleEditScope,
    setCreateOpen,
    setEditOpen,
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
  } = useOAuthClientForms({
    loadClients: refreshClientsStrict,
    onSecretGenerated: showSecret,
  })
  const {
    statsOpen,
    statsLoading,
    statsClientId,
    stats,
    statsFrom,
    statsTo,
    statsBucket,
    showStats,
    applyStatsFilters,
    resetStatsFilters,
  } = useOAuthClientStats()

  onMounted(() => {
    void loadClients()
  })

  return {
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
    statsClientId,
    stats,
    statsFrom,
    statsTo,
    statsBucket,
    secretDisplayOpen,
    displayedSecret,
    deleteConfirmOpen,
    clientToDelete,
    AVAILABLE_SCOPES,
    confirmDelete,
    executeDelete,
    toggleNewScope,
    toggleEditScope,
    setCreateOpen,
    setEditOpen,
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
    applyStatsFilters,
    resetStatsFilters,
    copySecret,
  }
}
