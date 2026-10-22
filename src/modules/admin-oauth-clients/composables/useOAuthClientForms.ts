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
  OAUTH_CLIENT_FIELD_IDS,
  type OAuthClientFormErrors,
  type OAuthClientFormField,
  type ValidatePayloadError,
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
import { focusInvalidField } from "@/lib/form-focus"

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
  // One inline message at a time: the first failing check, under its control.
  const createFormErrors = ref<OAuthClientFormErrors>({})
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
  const editFormErrors = ref<OAuthClientFormErrors>({})
  // What the edited client has registered: an edit sends only the grant members that differ.
  let editInitialGrantTypes: string[] = [...DEFAULT_GRANT_TYPES]
  let editInitialDevicePolicy: OAuthClientDevicePolicy = { ...DEFAULT_DEVICE_POLICY }
  let editInitialScopes: string[] = []
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
    createFormErrors.value = {}
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
    editInitialScopes = []
    editFormErrors.value = {}
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

  function clearCreateFormError(field: OAuthClientFormField) {
    if (createFormErrors.value[field]) {
      createFormErrors.value = {}
    }
  }

  function clearEditFormError(field: OAuthClientFormField) {
    if (editFormErrors.value[field]) {
      editFormErrors.value = {}
    }
  }

  /** Shows the failing check under its control and moves focus there. */
  function reportValidationError(target: typeof createFormErrors, error: ValidatePayloadError) {
    target.value = { [error.field]: t(`adminOAuthClients.toast.validation.${error.errorCode}`) }
    focusInvalidField(OAUTH_CLIENT_FIELD_IDS[error.field])
  }

  function updateNewClientId(value: string) {
    newClientId.value = value
    clearCreateFormError("clientId")
  }

  function updateNewName(value: string) {
    newName.value = value
    clearCreateFormError("name")
  }

  function updateEditName(value: string) {
    editName.value = value
    clearEditFormError("name")
  }

  function updateNewClientType(value: OAuthClientType) {
    newClientType.value = value
    clearCreateFormError("deviceAllowWrite")
  }

  function updateEditClientType(value: OAuthClientType) {
    editClientType.value = value
    clearEditFormError("deviceAllowWrite")
  }

  function updateNewRedirectUri(payload: RedirectUriUpdatePayload) {
    newRedirectUris.value[payload.index] = payload.value
    clearCreateFormError("redirectUris")
    clearCreateFormError("postLogoutRedirectUris")
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
    clearEditFormError("redirectUris")
    clearEditFormError("postLogoutRedirectUris")
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
    clearCreateFormError("postLogoutRedirectUris")
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
    clearEditFormError("postLogoutRedirectUris")
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
    clearCreateFormError("scopes")
    clearCreateFormError("deviceAllowWrite")
  }

  function toggleEditScope(scopeId: string, checked: boolean) {
    editScopes.value = toggleScopeSelection(editScopes.value, scopeId, checked)
    clearEditFormError("scopes")
    clearEditFormError("deviceAllowWrite")
  }

  function toggleNewGrantType(grantType: ManagedGrantType, checked: boolean) {
    newGrantTypes.value = toggleGrantTypeSelection(newGrantTypes.value, grantType, checked)
    createFormErrors.value = {}
  }

  function toggleEditGrantType(grantType: ManagedGrantType, checked: boolean) {
    editGrantTypes.value = toggleGrantTypeSelection(editGrantTypes.value, grantType, checked)
    editFormErrors.value = {}
  }

  function updateNewDevicePolicy(update: DevicePolicyUpdate) {
    newDevicePolicy.value = { ...newDevicePolicy.value, ...update }
    if ("allowWrite" in update) clearCreateFormError("deviceAllowWrite")
    if ("maxCodesPer10m" in update) clearCreateFormError("deviceMaxCodes")
  }

  function updateEditDevicePolicy(update: DevicePolicyUpdate) {
    editDevicePolicy.value = { ...editDevicePolicy.value, ...update }
    if ("allowWrite" in update) clearEditFormError("deviceAllowWrite")
    if ("maxCodesPer10m" in update) clearEditFormError("deviceMaxCodes")
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
      reportValidationError(createFormErrors, validation)
      return
    }
    createFormErrors.value = {}
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
    editInitialScopes = [...(client.scopes ?? [])]
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
    editFormErrors.value = {}
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
      initialScopes: editInitialScopes,
      initialGrantTypes: editInitialGrantTypes,
    })
    if ("errorCode" in validation) {
      reportValidationError(editFormErrors, validation)
      return
    }
    editFormErrors.value = {}
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
    createFormErrors,
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
    editFormErrors,
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
