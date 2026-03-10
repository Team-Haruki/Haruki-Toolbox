import { ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { runAsyncAction } from "@/composables/useAsyncAction"
import type { OAuthClient } from "@/types/admin"
import { createOAuthClient, updateOAuthClient } from "@/modules/admin-oauth-clients/api/client"
import {
  DEFAULT_CLIENT_TYPE,
  DEFAULT_SCOPE,
  toggleScopeSelection,
  validateClientPayload,
} from "@/modules/admin-oauth-clients/lib/form"

type OAuthClientType = NonNullable<OAuthClient["clientType"]>
type RedirectUriUpdatePayload = { index: number; value: string }

type UseOAuthClientFormsOptions = {
  loadClients: () => Promise<void>
  onSecretGenerated: (secret: string) => void
}

export function useOAuthClientForms(options: UseOAuthClientFormsOptions) {
  const { t } = useI18n()
  const createOpen = ref(false)
  const newClientId = ref("")
  const newName = ref("")
  const newClientType = ref<OAuthClientType>(DEFAULT_CLIENT_TYPE)
  const newScopes = ref<string[]>([DEFAULT_SCOPE])
  const newRedirectUris = ref<string[]>([""])
  const creating = ref(false)

  const editOpen = ref(false)
  const editClientId = ref("")
  const editName = ref("")
  const editClientType = ref<OAuthClientType>(DEFAULT_CLIENT_TYPE)
  const editScopes = ref<string[]>([])
  const editRedirectUris = ref<string[]>([])
  const saving = ref(false)

  function resetCreateForm() {
    newClientId.value = ""
    newName.value = ""
    newClientType.value = DEFAULT_CLIENT_TYPE
    newScopes.value = [DEFAULT_SCOPE]
    newRedirectUris.value = [""]
  }

  function setCreateOpen(value: boolean) {
    createOpen.value = value
  }

  function setEditOpen(value: boolean) {
    editOpen.value = value
  }

  function updateNewClientId(value: string) {
    newClientId.value = value
  }

  function updateNewName(value: string) {
    newName.value = value
  }

  function updateEditName(value: string) {
    editName.value = value
  }

  function updateNewClientType(value: OAuthClientType) {
    newClientType.value = value
  }

  function updateEditClientType(value: OAuthClientType) {
    editClientType.value = value
  }

  function updateNewRedirectUri(payload: RedirectUriUpdatePayload) {
    newRedirectUris.value[payload.index] = payload.value
  }

  function addNewRedirectUri() {
    newRedirectUris.value.push("")
  }

  function removeNewRedirectUri(index: number) {
    if (newRedirectUris.value.length <= 1) return
    newRedirectUris.value.splice(index, 1)
  }

  function updateEditRedirectUri(payload: RedirectUriUpdatePayload) {
    editRedirectUris.value[payload.index] = payload.value
  }

  function addEditRedirectUri() {
    editRedirectUris.value.push("")
  }

  function removeEditRedirectUri(index: number) {
    if (editRedirectUris.value.length <= 1) return
    editRedirectUris.value.splice(index, 1)
  }

  function toggleNewScope(scopeId: string, checked: boolean) {
    newScopes.value = toggleScopeSelection(newScopes.value, scopeId, checked)
  }

  function toggleEditScope(scopeId: string, checked: boolean) {
    editScopes.value = toggleScopeSelection(editScopes.value, scopeId, checked)
  }

  async function handleCreate() {
    const validation = validateClientPayload({
      clientId: newClientId.value,
      name: newName.value,
      scopes: newScopes.value,
      redirectUris: newRedirectUris.value,
    })
    if ("errorCode" in validation) {
      toast.error(t(`adminOAuthClients.toast.validation.${validation.errorCode}`))
      return
    }
    const uris = validation.normalizedUris

    await runAsyncAction(
      creating,
      async () => {
        const response = await createOAuthClient({
          clientId: newClientId.value.trim(),
          name: newName.value.trim(),
          clientType: newClientType.value,
          redirectUris: uris,
          scopes: newScopes.value,
        })
        return response?.clientSecret ?? ""
      },
      {
        errorTitle: t("adminOAuthClients.toast.createFailedTitle"),
        onSuccess: async (createdSecret) => {
          createOpen.value = false
          resetCreateForm()

          if (createdSecret) {
            options.onSecretGenerated(createdSecret)
            await options.loadClients()
            return
          }

          await options.loadClients()
          toast.success(t("adminOAuthClients.toast.clientCreated"))
        },
      }
    )
  }

  function openEdit(client: OAuthClient) {
    editClientId.value = client.clientId
    editName.value = client.name ?? ""
    editClientType.value = client.clientType ?? DEFAULT_CLIENT_TYPE
    editScopes.value = [...(client.scopes ?? [])]
    editRedirectUris.value = [...(client.redirectUris ?? (client.redirectUri ? [client.redirectUri] : []))]
    if (editRedirectUris.value.length === 0) {
      editRedirectUris.value = [""]
    }
    editOpen.value = true
  }

  async function handleSaveEdit() {
    const validation = validateClientPayload({
      name: editName.value,
      scopes: editScopes.value,
      redirectUris: editRedirectUris.value,
    })
    if ("errorCode" in validation) {
      toast.error(t(`adminOAuthClients.toast.validation.${validation.errorCode}`))
      return
    }
    const uris = validation.normalizedUris

    await runAsyncAction(
      saving,
      () =>
        updateOAuthClient(editClientId.value, {
          name: editName.value.trim(),
          clientType: editClientType.value,
          scopes: editScopes.value,
          redirectUris: uris,
        }),
      {
        successMessage: t("adminOAuthClients.toast.saved"),
        successAfterOnSuccess: true,
        errorTitle: t("adminOAuthClients.toast.saveFailedTitle"),
        onSuccess: async () => {
          editOpen.value = false
          await options.loadClients()
        },
      }
    )
  }

  return {
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
  }
}
