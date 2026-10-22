import { computed, nextTick, reactive, ref, watch } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { runAsyncAction } from "@/composables/useAsyncAction"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { resolveRequiredUserId } from "@/modules/user-settings/lib/current-user"
import { invalidateAccessibleGameAccounts } from "@/shared/sekai/user-snapshot/accessible-accounts"
import {
  deleteGameAccountDataGrant,
  getOwnedGameAccountDataGrants,
  getReceivedGameAccountDataGrants,
  upsertGameAccountDataGrant,
} from "@/modules/user-settings/api/game-account-grants"
import {
  buildGrantPermissions,
  canGrantWrite,
  isFutureIsoDateTime,
  isGrantDataType,
} from "@/modules/user-settings/lib/game-account-grants"
import type {
  GameAccountBinding,
  GameAccountDataGrant,
  GameAccountGrantDataType,
} from "@/types"

export type GrantFormField = "granteeUserId" | "permissions" | "expiresAt"

/** DOM ids of the grant form fields; validation focuses the first invalid one. */
export const GRANT_FORM_FIELD_IDS: Record<GrantFormField, string> = {
  granteeUserId: "grant-user-id",
  permissions: "grant-permission-read",
  expiresAt: "grant-expires-at",
}

function defaultExpiryDate(): Date {
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  nextMonth.setSeconds(0, 0)
  return nextMonth
}

export function useGameAccountDataGrants(currentUserId: () => string | null | undefined) {
  const { t } = useI18n()

  const grantsOpen = ref(false)
  const grantsLoading = ref(false)
  /** The last list-load failure; the dialog renders it with a retry button. */
  const grantsLoadError = ref<ErrorDescription | null>(null)
  const grantSaving = ref(false)
  const grantDeleting = ref(false)
  const selectedAccount = ref<GameAccountBinding | null>(null)
  const ownedGrants = ref<GameAccountDataGrant[]>([])
  const receivedGrants = ref<GameAccountDataGrant[]>([])
  const granteeUserId = ref("")
  const grantDataType = ref<GameAccountGrantDataType>("suite")
  // New grants default to read-only; write is always an explicit opt-in.
  const grantCanRead = ref(true)
  const grantCanWrite = ref(false)
  const expiresAt = ref<Date | undefined>(defaultExpiryDate())
  /**
   * The grant being edited. While set, grantee and data type are locked so a
   * typo cannot silently create a second grant instead of changing this one.
   */
  const editingGrant = ref<GameAccountDataGrant | null>(null)
  const isEditing = computed(() => editingGrant.value !== null)
  /** Inline validation messages per field; empty when valid. */
  const fieldErrors = reactive<Record<GrantFormField, string>>({ granteeUserId: "", permissions: "", expiresAt: "" })

  const revokeTarget = ref<GameAccountDataGrant | null>(null)
  const revokeDialogOpen = ref(false)

  const grantPermissions = computed(() => buildGrantPermissions(grantCanRead.value, grantCanWrite.value))

  // profile is live data and never writable: switching to it drops a pending write tick.
  watch(grantDataType, (dataType) => {
    if (!canGrantWrite(dataType)) {
      grantCanWrite.value = false
    }
  })

  const selectedAccountGrants = computed(() => {
    const account = selectedAccount.value
    if (!account) return []
    return ownedGrants.value.filter(
      (grant) =>
        grant.server === account.server &&
        grant.gameUserId === String(account.userId)
    )
  })

  function requireUserId(errorTitle: string) {
    return resolveRequiredUserId(currentUserId(), errorTitle)
  }

  async function loadGrants() {
    const userId = requireUserId(t("userSettings.gameBinding.grants.toast.loadFailedTitle"))
    if (!userId) return

    grantsLoadError.value = null
    try {
      const response = await runAsyncAction(
        grantsLoading,
        async () => {
          const [owned, received] = await Promise.all([
            getOwnedGameAccountDataGrants(userId),
            getReceivedGameAccountDataGrants(userId),
          ])
          return { owned, received }
        },
        {
          errorTitle: t("userSettings.gameBinding.grants.toast.loadFailedTitle"),
          throwOnError: true,
        }
      )
      if (!response) return
      ownedGrants.value = response.owned.items
      receivedGrants.value = response.received.items
      // Received grants only change through other users' actions, so syncing
      // the selector aggregate whenever this list is (re)loaded is the one
      // client-side moment new grants can be picked up without a reload.
      invalidateAccessibleGameAccounts()
    } catch (error: unknown) {
      // Stale rows would read as current state: clear them and show the failure.
      ownedGrants.value = []
      receivedGrants.value = []
      grantsLoadError.value = describeError(error, t("userSettings.gameBinding.grants.toast.loadFailedTitle"))
    }
  }

  function clearFieldErrors() {
    fieldErrors.granteeUserId = ""
    fieldErrors.permissions = ""
    fieldErrors.expiresAt = ""
  }

  function clearFieldError(field: GrantFormField) {
    fieldErrors[field] = ""
  }

  function resetForm() {
    editingGrant.value = null
    granteeUserId.value = ""
    grantDataType.value = "suite"
    grantCanRead.value = true
    grantCanWrite.value = false
    expiresAt.value = defaultExpiryDate()
    clearFieldErrors()
  }

  function openGrantManager(account?: GameAccountBinding) {
    selectedAccount.value = account ?? null
    resetForm()
    grantsOpen.value = true
    void loadGrants()
  }

  function openReceivedGrantManager() {
    openGrantManager()
  }

  function editGrant(grant: GameAccountDataGrant) {
    const account = selectedAccount.value
    if (!account || account.server !== grant.server || String(account.userId) !== grant.gameUserId) {
      selectedAccount.value = {
        server: grant.server,
        userId: Number(grant.gameUserId),
        verified: true,
      }
    }
    editingGrant.value = grant
    granteeUserId.value = grant.granteeUserId
    grantDataType.value = grant.dataType
    grantCanRead.value = grant.permissions.includes("read")
    grantCanWrite.value = grant.permissions.includes("write") && canGrantWrite(grant.dataType)
    const parsed = new Date(grant.expiresAt)
    expiresAt.value = Number.isNaN(parsed.getTime()) ? defaultExpiryDate() : parsed
    clearFieldErrors()
    void nextTick(() => {
      document.getElementById(GRANT_FORM_FIELD_IDS.permissions)?.focus()
    })
  }

  /** Leaves edit mode and clears the form; nothing is saved. */
  function cancelEdit() {
    resetForm()
  }

  function focusField(field: GrantFormField) {
    void nextTick(() => {
      document.getElementById(GRANT_FORM_FIELD_IDS[field])?.focus()
    })
  }

  function validateForm(ownerUserId: string): boolean {
    clearFieldErrors()
    if (!selectedAccount.value?.verified) {
      toast.error(t("userSettings.gameBinding.grants.toast.saveFailedTitle"), {
        description: t("userSettings.gameBinding.grants.validation.verifiedOnly"),
      })
      return false
    }
    const grantee = granteeUserId.value.trim()
    if (!grantee) {
      fieldErrors.granteeUserId = t("userSettings.gameBinding.grants.validation.granteeRequired")
    } else if (grantee === ownerUserId) {
      fieldErrors.granteeUserId = t("userSettings.gameBinding.grants.validation.selfGrant")
    }
    if (!isGrantDataType(grantDataType.value)) {
      // The select only offers valid values; this guards a corrupted state.
      toast.error(t("userSettings.gameBinding.grants.toast.saveFailedTitle"), {
        description: t("userSettings.gameBinding.grants.validation.dataType"),
      })
      return false
    }
    if (grantPermissions.value.length === 0) {
      fieldErrors.permissions = t("userSettings.gameBinding.grants.validation.permissionRequired")
    } else if (grantCanWrite.value && !canGrantWrite(grantDataType.value)) {
      fieldErrors.permissions = t("userSettings.gameBinding.grants.validation.profileReadOnly")
    }
    const expiry = expiresAt.value
    if (!expiry || Number.isNaN(expiry.getTime())) {
      fieldErrors.expiresAt = t("userSettings.gameBinding.grants.validation.expiryRequired")
    } else if (!isFutureIsoDateTime(expiry.toISOString())) {
      fieldErrors.expiresAt = t("userSettings.gameBinding.grants.validation.futureExpiry")
    }

    const firstInvalid = (["granteeUserId", "permissions", "expiresAt"] as const).find((field) => fieldErrors[field])
    if (firstInvalid) {
      focusField(firstInvalid)
      return false
    }
    return true
  }

  async function saveGrant() {
    const ownerUserId = requireUserId(t("userSettings.gameBinding.grants.toast.saveFailedTitle"))
    const account = selectedAccount.value
    if (!ownerUserId || !account || !validateForm(ownerUserId)) return
    const expiry = expiresAt.value
    if (!expiry) return

    // While editing, the locked identity comes from the grant itself.
    const editing = editingGrant.value
    const targetGrantee = editing ? editing.granteeUserId : granteeUserId.value.trim()
    const targetDataType = editing ? editing.dataType : grantDataType.value

    const response = await runAsyncAction(
      grantSaving,
      () =>
        upsertGameAccountDataGrant(
          ownerUserId,
          account.server,
          String(account.userId),
          targetDataType,
          targetGrantee,
          expiry.toISOString(),
          grantPermissions.value
        ),
      {
        errorTitle: t("userSettings.gameBinding.grants.toast.saveFailedTitle"),
        fallbackError: t("userSettings.gameBinding.grants.toast.saveFailedFallback"),
      }
    )
    if (!response) return

    // Re-read the list rather than patching it: the backend normalizes
    // permissions and expiry, so the form must not keep its pre-save values.
    await loadGrants()
    resetForm()
    toast.success(editing
      ? t("userSettings.gameBinding.grants.toast.updated")
      : t("userSettings.gameBinding.grants.toast.saved"))
  }

  function requestRevoke(grant: GameAccountDataGrant) {
    revokeTarget.value = grant
    revokeDialogOpen.value = true
  }

  /**
   * Revokes the grant the confirm dialog is showing. Rejects on failure so the
   * dialog stays open with the reason; never toasts the failure itself.
   */
  async function revokeGrant() {
    const grant = revokeTarget.value
    if (!grant) return
    const ownerUserId = requireUserId(t("userSettings.gameBinding.grants.toast.deleteFailedTitle"))
    if (!ownerUserId) return

    const response = await runAsyncAction(
      grantDeleting,
      () =>
        deleteGameAccountDataGrant(
          ownerUserId,
          grant.server,
          grant.gameUserId,
          grant.dataType,
          grant.granteeUserId
        ),
      {
        errorTitle: t("userSettings.gameBinding.grants.toast.deleteFailedTitle"),
        throwOnError: true,
      }
    )
    if (!response) return

    ownedGrants.value = ownedGrants.value.filter((item) => item.id !== grant.id)
    if (editingGrant.value?.id === grant.id) {
      resetForm()
    }
    revokeTarget.value = null
    toast.success(t("userSettings.gameBinding.grants.toast.deleted"))
  }

  return {
    grantsOpen,
    grantsLoading,
    grantsLoadError,
    grantSaving,
    grantDeleting,
    selectedAccount,
    ownedGrants,
    receivedGrants,
    selectedAccountGrants,
    granteeUserId,
    grantDataType,
    grantCanRead,
    grantCanWrite,
    expiresAt,
    editingGrant,
    isEditing,
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
  }
}
