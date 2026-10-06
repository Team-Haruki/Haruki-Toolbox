import { computed, ref, watch } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { runAsyncAction } from "@/composables/useAsyncAction"
import { extractErrorMessage } from "@/lib/error-utils"
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

function toDateTimeLocal(value: Date): string {
  const offset = value.getTimezoneOffset()
  const local = new Date(value.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function fromDateTimeLocal(value: string): string {
  return new Date(value).toISOString()
}

function canParseDateTimeLocal(value: string): boolean {
  if (!value.trim()) return false
  return !Number.isNaN(new Date(value).getTime())
}

function defaultExpiryValue() {
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  return toDateTimeLocal(nextMonth)
}

export function useGameAccountDataGrants(currentUserId: () => string | null | undefined) {
  const { t } = useI18n()

  const grantsOpen = ref(false)
  const grantsLoading = ref(false)
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
  const expiresAtLocal = ref(defaultExpiryValue())

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
        fallbackError: t("userSettings.gameBinding.grants.toast.loadFailedTitle"),
      }
    )
    if (!response) return
    ownedGrants.value = response.owned.items
    receivedGrants.value = response.received.items
    // Received grants only change through other users' actions, so syncing
    // the selector aggregate whenever this list is (re)loaded is the one
    // client-side moment new grants can be picked up without a reload.
    invalidateAccessibleGameAccounts()
  }

  function resetForm() {
    granteeUserId.value = ""
    grantDataType.value = "suite"
    grantCanRead.value = true
    grantCanWrite.value = false
    expiresAtLocal.value = defaultExpiryValue()
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
    granteeUserId.value = grant.granteeUserId
    grantDataType.value = grant.dataType
    grantCanRead.value = grant.permissions.includes("read")
    grantCanWrite.value = grant.permissions.includes("write") && canGrantWrite(grant.dataType)
    expiresAtLocal.value = toDateTimeLocal(new Date(grant.expiresAt))
  }

  function validateForm(ownerUserId: string) {
    if (!selectedAccount.value?.verified) {
      toast.error(t("userSettings.gameBinding.grants.toast.saveFailedTitle"), {
        description: t("userSettings.gameBinding.grants.validation.verifiedOnly"),
      })
      return false
    }
    const grantee = granteeUserId.value.trim()
    if (!grantee) {
      toast.error(t("userSettings.gameBinding.grants.toast.saveFailedTitle"), {
        description: t("userSettings.gameBinding.grants.validation.granteeRequired"),
      })
      return false
    }
    if (grantee === ownerUserId) {
      toast.error(t("userSettings.gameBinding.grants.toast.saveFailedTitle"), {
        description: t("userSettings.gameBinding.grants.validation.selfGrant"),
      })
      return false
    }
    if (!isGrantDataType(grantDataType.value)) {
      toast.error(t("userSettings.gameBinding.grants.toast.saveFailedTitle"), {
        description: t("userSettings.gameBinding.grants.validation.dataType"),
      })
      return false
    }
    if (grantPermissions.value.length === 0) {
      toast.error(t("userSettings.gameBinding.grants.toast.saveFailedTitle"), {
        description: t("userSettings.gameBinding.grants.validation.permissionRequired"),
      })
      return false
    }
    if (grantCanWrite.value && !canGrantWrite(grantDataType.value)) {
      toast.error(t("userSettings.gameBinding.grants.toast.saveFailedTitle"), {
        description: t("userSettings.gameBinding.grants.validation.profileReadOnly"),
      })
      return false
    }
    if (!canParseDateTimeLocal(expiresAtLocal.value) || !isFutureIsoDateTime(fromDateTimeLocal(expiresAtLocal.value))) {
      toast.error(t("userSettings.gameBinding.grants.toast.saveFailedTitle"), {
        description: t("userSettings.gameBinding.grants.validation.futureExpiry"),
      })
      return false
    }
    return true
  }

  async function saveGrant() {
    const ownerUserId = requireUserId(t("userSettings.gameBinding.grants.toast.saveFailedTitle"))
    const account = selectedAccount.value
    if (!ownerUserId || !account || !validateForm(ownerUserId)) return

    const response = await runAsyncAction(
      grantSaving,
      () =>
        upsertGameAccountDataGrant(
          ownerUserId,
          account.server,
          String(account.userId),
          grantDataType.value,
          granteeUserId.value.trim(),
          fromDateTimeLocal(expiresAtLocal.value),
          grantPermissions.value
        ),
      {
        errorTitle: t("userSettings.gameBinding.grants.toast.saveFailedTitle"),
        fallbackError: t("userSettings.gameBinding.grants.toast.saveFailedTitle"),
        onError(error) {
          toast.error(t("userSettings.gameBinding.grants.toast.saveFailedTitle"), {
            description: extractErrorMessage(error, t("userSettings.gameBinding.grants.toast.saveFailedTitle")),
          })
        },
      }
    )
    if (!response) return

    // Re-read the list rather than patching it: the backend normalizes
    // permissions and expiry, so the form must not keep its pre-save values.
    await loadGrants()
    resetForm()
    toast.success(t("userSettings.gameBinding.grants.toast.saved"))
  }

  async function revokeGrant(grant: GameAccountDataGrant) {
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
        fallbackError: t("userSettings.gameBinding.grants.toast.deleteFailedTitle"),
      }
    )
    if (!response) return

    ownedGrants.value = ownedGrants.value.filter((item) => item.id !== grant.id)
    toast.success(t("userSettings.gameBinding.grants.toast.deleted"))
  }

  return {
    grantsOpen,
    grantsLoading,
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
    expiresAtLocal,
    loadGrants,
    openGrantManager,
    openReceivedGrantManager,
    editGrant,
    saveGrant,
    revokeGrant,
  }
}
