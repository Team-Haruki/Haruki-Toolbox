import { ref, watch } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { runAsyncAction } from "@/composables/useAsyncAction"
import type { OAuthClient, OAuthClientDevicePolicy } from "@/types/admin"
import { createOAuthClient, updateOAuthClient } from "@/modules/admin-oauth-clients/api/client"
import { describeOAuthClientActionError } from "@/modules/admin-oauth-clients/lib/client-actions"
import {
  DEFAULT_CLIENT_TYPE,
  DEFAULT_SCOPE,
  diffGrantFields,
  toggleGrantTypeSelection,
  toggleScopeSelection,
  validateClientPayload,
} from "@/modules/admin-oauth-clients/lib/form"
import {
  DEFAULT_DEVICE_POLICY,
  DEFAULT_GRANT_TYPES,
  type ManagedGrantType,
  toManagedGrantTypes,
} from "@/modules/admin-oauth-clients/lib/grant-types"

type OAuthClientType = NonNullable<OAuthClient["clientType"]>
type RedirectUriUpdatePayload = { index: number; value: string }
type DevicePolicyUpdate = Partial<OAuthClientDevicePolicy>

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
  const newPostLogoutRedirectUris = ref<string[]>([""])
  const newGrantTypes = ref<ManagedGrantType[]>([...DEFAULT_GRANT_TYPES])
  const newDevicePolicy = ref<OAuthClientDevicePolicy>({ ...DEFAULT_DEVICE_POLICY })
  const creating = ref(false)

  const editOpen = ref(false)
  const editClientId = ref("")
  const editName = ref("")
  const editClientType = ref<OAuthClientType>(DEFAULT_CLIENT_TYPE)
  const editScopes = ref<string[]>([])
  const editRedirectUris = ref<string[]>([])
  const editPostLogoutRedirectUris = ref<string[]>([])
  const editGrantTypes = ref<ManagedGrantType[]>([...DEFAULT_GRANT_TYPES])
  const editDevicePolicy = ref<OAuthClientDevicePolicy>({ ...DEFAULT_DEVICE_POLICY })
  // What the edited client has registered: an edit sends only the grant members that differ.
  let editInitialGrantTypes: string[] = [...DEFAULT_GRANT_TYPES]
  let editInitialDevicePolicy: OAuthClientDevicePolicy = { ...DEFAULT_DEVICE_POLICY }
  const saving = ref(false)

  function resetCreateForm() {
    newClientId.value = ""
    newName.value = ""
    newClientType.value = DEFAULT_CLIENT_TYPE
    newScopes.value = [DEFAULT_SCOPE]
    newRedirectUris.value = [""]
    newPostLogoutRedirectUris.value = [""]
    newGrantTypes.value = [...DEFAULT_GRANT_TYPES]
    newDevicePolicy.value = { ...DEFAULT_DEVICE_POLICY }
  }

  function resetEditForm() {
    editClientId.value = ""
    editName.value = ""
    editClientType.value = DEFAULT_CLIENT_TYPE
    editScopes.value = []
    editRedirectUris.value = []
    editPostLogoutRedirectUris.value = []
    editGrantTypes.value = [...DEFAULT_GRANT_TYPES]
    editDevicePolicy.value = { ...DEFAULT_DEVICE_POLICY }
    editInitialGrantTypes = [...DEFAULT_GRANT_TYPES]
    editInitialDevicePolicy = { ...DEFAULT_DEVICE_POLICY }
  }

  function setCreateOpen(value: boolean) {
    createOpen.value = value
  }

  function setEditOpen(value: boolean) {
    editOpen.value = value
  }

  watch(createOpen, (open) => {
    if (!open) {
      resetCreateForm()
    }
  })

  watch(editOpen, (open) => {
    if (!open) {
      resetEditForm()
    }
  })

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

  function updateNewPostLogoutRedirectUri(payload: RedirectUriUpdatePayload) {
    newPostLogoutRedirectUris.value[payload.index] = payload.value
  }

  function addNewPostLogoutRedirectUri() {
    newPostLogoutRedirectUris.value.push("")
  }

  function removeNewPostLogoutRedirectUri(index: number) {
    if (newPostLogoutRedirectUris.value.length <= 1) return
    newPostLogoutRedirectUris.value.splice(index, 1)
  }

  function updateEditPostLogoutRedirectUri(payload: RedirectUriUpdatePayload) {
    editPostLogoutRedirectUris.value[payload.index] = payload.value
  }

  function addEditPostLogoutRedirectUri() {
    editPostLogoutRedirectUris.value.push("")
  }

  function removeEditPostLogoutRedirectUri(index: number) {
    if (editPostLogoutRedirectUris.value.length <= 1) return
    editPostLogoutRedirectUris.value.splice(index, 1)
  }

  function toggleNewScope(scopeId: string, checked: boolean) {
    newScopes.value = toggleScopeSelection(newScopes.value, scopeId, checked)
  }

  function toggleEditScope(scopeId: string, checked: boolean) {
    editScopes.value = toggleScopeSelection(editScopes.value, scopeId, checked)
  }

  function toggleNewGrantType(grantType: ManagedGrantType, checked: boolean) {
    newGrantTypes.value = toggleGrantTypeSelection(newGrantTypes.value, grantType, checked)
  }

  function toggleEditGrantType(grantType: ManagedGrantType, checked: boolean) {
    editGrantTypes.value = toggleGrantTypeSelection(editGrantTypes.value, grantType, checked)
  }

  function updateNewDevicePolicy(update: DevicePolicyUpdate) {
    newDevicePolicy.value = { ...newDevicePolicy.value, ...update }
  }

  function updateEditDevicePolicy(update: DevicePolicyUpdate) {
    editDevicePolicy.value = { ...editDevicePolicy.value, ...update }
  }

  async function handleCreate() {
    const validation = validateClientPayload({
      clientId: newClientId.value,
      name: newName.value,
      clientType: newClientType.value,
      scopes: newScopes.value,
      grantTypes: newGrantTypes.value,
      redirectUris: newRedirectUris.value,
      postLogoutRedirectUris: newPostLogoutRedirectUris.value,
      devicePolicy: newDevicePolicy.value,
    })
    if ("errorCode" in validation) {
      toast.error(t(`adminOAuthClients.toast.validation.${validation.errorCode}`))
      return
    }
    const uris = validation.normalizedUris
    const postLogoutUris = validation.normalizedPostLogoutUris
    const errorTitle = t("adminOAuthClients.toast.createFailedTitle")

    await runAsyncAction(
      creating,
      async () => {
        const response = await createOAuthClient({
          clientId: newClientId.value.trim(),
          name: newName.value.trim(),
          clientType: newClientType.value,
          redirectUris: uris,
          postLogoutRedirectUris: postLogoutUris,
          scopes: newScopes.value,
          grantTypes: validation.grantTypes,
          devicePolicy: validation.devicePolicy,
        })
        return response?.clientSecret ?? ""
      },
      {
        errorTitle,
        onError: (error) => {
          toast.error(errorTitle, { description: describeOAuthClientActionError(error, t, errorTitle) })
        },
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
    editPostLogoutRedirectUris.value = [...(client.postLogoutRedirectUris ?? [])]
    if (editPostLogoutRedirectUris.value.length === 0) {
      editPostLogoutRedirectUris.value = [""]
    }
    editInitialGrantTypes = [...(client.grantTypes ?? DEFAULT_GRANT_TYPES)]
    editInitialDevicePolicy = { ...(client.devicePolicy ?? DEFAULT_DEVICE_POLICY) }
    editGrantTypes.value = toManagedGrantTypes(editInitialGrantTypes)
    editDevicePolicy.value = { ...editInitialDevicePolicy }
    editOpen.value = true
  }

  async function handleSaveEdit() {
    const validation = validateClientPayload({
      name: editName.value,
      clientType: editClientType.value,
      scopes: editScopes.value,
      grantTypes: editGrantTypes.value,
      redirectUris: editRedirectUris.value,
      postLogoutRedirectUris: editPostLogoutRedirectUris.value,
      devicePolicy: editDevicePolicy.value,
      initialDevicePolicy: editInitialDevicePolicy,
    })
    if ("errorCode" in validation) {
      toast.error(t(`adminOAuthClients.toast.validation.${validation.errorCode}`))
      return
    }
    const uris = validation.normalizedUris
    const grantPatch = diffGrantFields(validation, {
      grantTypes: editInitialGrantTypes,
      devicePolicy: editInitialDevicePolicy,
    })
    const errorTitle = t("adminOAuthClients.toast.saveFailedTitle")

    await runAsyncAction(
      saving,
      () =>
        updateOAuthClient(editClientId.value, {
          name: editName.value.trim(),
          clientType: editClientType.value,
          scopes: editScopes.value,
          redirectUris: uris,
          postLogoutRedirectUris: validation.normalizedPostLogoutUris,
          ...grantPatch,
        }),
      {
        // A switch to confidential issues a secret that is returned only once:
        // show it like create does, instead of the plain toast.
        successMessage: ({ clientSecret }) => (clientSecret ? null : t("adminOAuthClients.toast.saved")),
        successAfterOnSuccess: true,
        errorTitle,
        onError: (error) => {
          toast.error(errorTitle, { description: describeOAuthClientActionError(error, t, errorTitle) })
        },
        onSuccess: async ({ clientSecret }) => {
          editOpen.value = false
          if (clientSecret) {
            options.onSecretGenerated(clientSecret)
          }
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
    newPostLogoutRedirectUris,
    newGrantTypes,
    newDevicePolicy,
    creating,
    editOpen,
    editClientId,
    editName,
    editClientType,
    editScopes,
    editRedirectUris,
    editPostLogoutRedirectUris,
    editGrantTypes,
    editDevicePolicy,
    saving,
    toggleNewScope,
    toggleEditScope,
    toggleNewGrantType,
    toggleEditGrantType,
    updateNewDevicePolicy,
    updateEditDevicePolicy,
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
    updateNewPostLogoutRedirectUri,
    addNewPostLogoutRedirectUri,
    removeNewPostLogoutRedirectUri,
    updateEditPostLogoutRedirectUri,
    addEditPostLogoutRedirectUri,
    removeEditPostLogoutRedirectUri,
    handleCreate,
    openEdit,
    handleSaveEdit,
  }
}
