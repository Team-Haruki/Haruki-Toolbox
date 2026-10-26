import { computed, nextTick, ref, watch } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { unwrapUpdatedData } from "@/core/http/call-api"
import type { GameAccountBinding, SekaiRegion } from "@/types/store"
import { copyTextToClipboard, isClipboardSupported } from "@/lib/clipboard"
import { extractErrorMessage } from "@/lib/error-utils"
import { normalizeMysekaiPermissions, normalizeSuitePermissions } from "@/lib/game-binding-permissions"
import { SEKAI_REGIONS } from "@/lib/sekai-region"
import { resolveRequiredUserId } from "@/modules/user-settings/lib/current-user"
import {
  addGameAccount,
  generateGameAccountVerificationCode,
  removeGameAccount,
  updateGameAccount,
} from "@/modules/user-settings/api/game-account"

/** DOM id of the UID field in the edit dialog; validation focuses it. */
export const BINDING_UID_INPUT_ID = "binding-user-id"

function toEditableAccount(account?: GameAccountBinding | null): GameAccountBinding {
  return {
    server: account?.server ?? "jp",
    userId: account?.userId ?? 0,
    verified: account?.verified ?? false,
    suite: normalizeSuitePermissions(account?.suite),
    mysekai: normalizeMysekaiPermissions(account?.mysekai),
  }
}

export function useGameAccountBindingManagement() {
  const { t } = useI18n()
  const userStore = useUserStore()
  const allowCNMysekai = computed(() => userStore.allowCNMysekai === true)
  const regionLabels = computed<Record<SekaiRegion, string>>(() => ({
    jp: t("userSettings.gameBinding.region.jp"),
    en: t("userSettings.gameBinding.region.en"),
    tw: t("userSettings.gameBinding.region.tw"),
    kr: t("userSettings.gameBinding.region.kr"),
    cn: t("userSettings.gameBinding.region.cn"),
  }))
  const regionOptions = computed<ReadonlyArray<{ value: SekaiRegion; label: string }>>(() =>
    SEKAI_REGIONS.map((value) => ({
      value,
      label: regionLabels.value[value],
    }))
  )

  const isCreating = ref(false)
  const generatedCode = ref("")
  const showEditDialog = ref(false)
  const showVerifyDialog = ref(false)
  const showDeleteDialog = ref(false)
  const suppressNextEditClose = ref(false)
  let suppressEditCloseTimer: ReturnType<typeof setTimeout> | null = null
  const userIdInput = ref("")
  /** Inline error under the UID field; empty when the field is valid. */
  const userIdError = ref("")
  const verificationTriggered = ref(false)
  /**
   * The UID or server changed after a verification code was generated, so the
   * earlier verification no longer applies and Save is disabled again.
   */
  const verificationInvalidated = ref(false)
  const editTarget = ref<GameAccountBinding | null>(null)
  const deleteTarget = ref<GameAccountBinding | null>(null)
  const isSaving = ref(false)
  const isDeleting = ref(false)
  const isVerifying = ref(false)
  const settingDefaultKey = ref<string | null>(null)
  const editIdentitySnapshot = ref<{ server: SekaiRegion; userId: string } | null>(null)
  const verifiedBindingSnapshot = ref<{ server: SekaiRegion; userId: string } | null>(null)

  const data = computed<GameAccountBinding[]>(() =>
    Array.isArray(userStore.gameAccountBindings) ? userStore.gameAccountBindings : []
  )

  function requireCurrentUserId(errorTitle: string) {
    return resolveRequiredUserId(userStore.userId, errorTitle)
  }

  function clearVerificationState() {
    verificationTriggered.value = false
    generatedCode.value = ""
    verifiedBindingSnapshot.value = null
  }

  function suppressTransientEditClose() {
    suppressNextEditClose.value = true
    if (suppressEditCloseTimer) {
      clearTimeout(suppressEditCloseTimer)
    }
    suppressEditCloseTimer = setTimeout(() => {
      suppressNextEditClose.value = false
      suppressEditCloseTimer = null
    }, 250)
  }

  function setEditDialogOpen(open: boolean) {
    if (open) {
      showEditDialog.value = true
      suppressNextEditClose.value = false
      return
    }

    if (showVerifyDialog.value || suppressNextEditClose.value) {
      suppressTransientEditClose()
      return
    }

    showEditDialog.value = false
  }

  function setVerifyDialogOpen(open: boolean) {
    if (open) {
      showVerifyDialog.value = true
      return
    }

    if (showVerifyDialog.value) {
      suppressTransientEditClose()
    }
    showVerifyDialog.value = false
  }

  function startAdd() {
    isCreating.value = true
    clearVerificationState()
    verificationInvalidated.value = false
    userIdError.value = ""
    suppressNextEditClose.value = false
    editIdentitySnapshot.value = null
    editTarget.value = toEditableAccount()
    userIdInput.value = ""
    showEditDialog.value = true
  }

  function startEdit(account: GameAccountBinding) {
    isCreating.value = false
    clearVerificationState()
    verificationInvalidated.value = false
    userIdError.value = ""
    suppressNextEditClose.value = false
    editIdentitySnapshot.value = {
      server: account.server,
      userId: String(account.userId),
    }
    editTarget.value = toEditableAccount(account)
    userIdInput.value = String(account.userId)
    showEditDialog.value = true
  }

  function confirmDelete(account: GameAccountBinding) {
    deleteTarget.value = account
    showDeleteDialog.value = true
  }

  /**
   * Removes the binding the delete dialog is showing. Rejects on failure so
   * the confirm dialog stays open with the reason; never toasts the failure.
   */
  async function handleDelete() {
    if (!deleteTarget.value || isDeleting.value) return

    const currentUserId = requireCurrentUserId(t("userSettings.gameBinding.toast.deleteFailedTitle"))
    if (!currentUserId) return

    isDeleting.value = true
    try {
      const resp = await removeGameAccount(
        deleteTarget.value.server,
        String(deleteTarget.value.userId),
        currentUserId,
        { skipErrorToast: true }
      )
      const updatedData = unwrapUpdatedData(resp, t("userSettings.gameBinding.title"))
      const updated = updatedData.gameAccountBindings
      userStore.setUser({ gameAccountBindings: updated })
      toast.success(t("userSettings.gameBinding.toast.deleteSuccessTitle"), {
        description: t("userSettings.gameBinding.toast.deleteSuccessDescription"),
      })
      deleteTarget.value = null
    } finally {
      isDeleting.value = false
    }
  }

  function focusUidField() {
    void nextTick(() => {
      document.getElementById(BINDING_UID_INPUT_ID)?.focus()
    })
  }

  /** Validates the UID field inline; returns the trimmed UID or null. */
  function validateUid(): string | null {
    const uid = userIdInput.value.trim()
    if (!uid) {
      userIdError.value = t("userSettings.gameBinding.validation.uidRequired")
      focusUidField()
      return null
    }
    if (!/^\d+$/.test(uid)) {
      userIdError.value = t("userSettings.gameBinding.toast.uidMustBeNumericDescription")
      focusUidField()
      return null
    }
    userIdError.value = ""
    return uid
  }

  function clearUidError() {
    userIdError.value = ""
  }

  async function handleEditSave() {
    if (!editTarget.value || isSaving.value) return

    if (isCreating.value && !verificationTriggered.value) {
      toast.error(t("userSettings.gameBinding.toast.saveFailedTitle"), {
        description: verificationInvalidated.value
          ? t("userSettings.gameBinding.validation.uidChangedReverify")
          : t("userSettings.gameBinding.toast.verifyBeforeCreateDescription"),
      })
      return
    }

    const currentUserId = requireCurrentUserId(t("userSettings.gameBinding.toast.saveFailedTitle"))
    if (!currentUserId) return

    const currentGameUid = validateUid()
    if (!currentGameUid) return

    isSaving.value = true
    try {
      const currentServer = editTarget.value.server
      const identity = !isCreating.value ? editIdentitySnapshot.value : null
      const server = identity?.server ?? currentServer
      const gameUid = identity?.userId ?? currentGameUid

      const suitePayload = normalizeSuitePermissions(editTarget.value.suite)
      const mysekaiPayload =
        currentServer === "cn" && userStore.allowCNMysekai !== true
          ? normalizeMysekaiPermissions(null)
          : normalizeMysekaiPermissions(editTarget.value.mysekai)

      const payload = {
        suite: suitePayload,
        mysekai: mysekaiPayload,
      }
      const requestOptions = { skipErrorToast: true }

      const resp = isCreating.value
        ? await addGameAccount(server, gameUid, currentUserId, payload, requestOptions)
        : await updateGameAccount(server, gameUid, currentUserId, payload, requestOptions)

      const updatedData = unwrapUpdatedData(resp, t("userSettings.gameBinding.title"))
      const updated = updatedData.gameAccountBindings
      userStore.setUser({ gameAccountBindings: updated })

      toast.success(t("userSettings.gameBinding.toast.saveSuccessTitle"), {
        description: t("userSettings.gameBinding.toast.saveSuccessDescription"),
      })
      showEditDialog.value = false
    } catch (error: unknown) {
      toast.error(t("userSettings.gameBinding.toast.saveFailedTitle"), {
        description: extractErrorMessage(error, t("userSettings.gameBinding.toast.saveFailedFallback")),
      })
    } finally {
      isSaving.value = false
    }
  }

  async function setDefaultBinding(account: GameAccountBinding) {
    if (settingDefaultKey.value) return
    const currentUserId = requireCurrentUserId(t("userSettings.gameBinding.toast.setDefaultFailedTitle"))
    if (!currentUserId) return

    settingDefaultKey.value = `${account.server}:${account.userId}`
    try {
      const resp = await updateGameAccount(account.server, String(account.userId), currentUserId, {
        suite: normalizeSuitePermissions(account.suite),
        mysekai: normalizeMysekaiPermissions(account.mysekai),
        isDefault: true,
      }, { skipErrorToast: true })

      const updatedData = unwrapUpdatedData(resp, t("userSettings.gameBinding.title"))
      userStore.setUser({ gameAccountBindings: updatedData.gameAccountBindings })
      toast.success(t("userSettings.gameBinding.toast.setDefaultSuccessTitle"), {
        description: t("userSettings.gameBinding.toast.setDefaultSuccessDescription"),
      })
    } catch (error: unknown) {
      toast.error(t("userSettings.gameBinding.toast.setDefaultFailedTitle"), {
        description: extractErrorMessage(error, t("userSettings.gameBinding.toast.setDefaultFailedFallback")),
      })
    } finally {
      settingDefaultKey.value = null
    }
  }

  async function handleVerify() {
    if (isVerifying.value) return
    const uidStr = validateUid()
    if (!uidStr) return

    if (!editTarget.value?.server) {
      toast.error(t("userSettings.gameBinding.toast.generateCodeFailedTitle"), {
        description: t("userSettings.gameBinding.toast.selectServerAndUidDescription"),
      })
      return
    }

    const currentUserId = requireCurrentUserId(t("userSettings.gameBinding.toast.generateCodeFailedTitle"))
    if (!currentUserId) return

    isVerifying.value = true
    try {
      const resp = await generateGameAccountVerificationCode(editTarget.value.server, uidStr, currentUserId, {
        skipErrorToast: true,
      })
      generatedCode.value = resp.updatedData?.oneTimePassword ?? resp.oneTimePassword ?? ""
      if (!generatedCode.value) {
        toast.error(t("userSettings.gameBinding.toast.generateCodeFailedTitle"), {
          description: t("userSettings.gameBinding.toast.missingCodeDescription"),
        })
        return
      }

      showVerifyDialog.value = true
      verifiedBindingSnapshot.value = {
        server: editTarget.value.server,
        userId: uidStr,
      }
      verificationTriggered.value = true
      verificationInvalidated.value = false
    } catch (error: unknown) {
      toast.error(t("userSettings.gameBinding.toast.generateCodeFailedTitle"), {
        description: extractErrorMessage(error, t("userSettings.gameBinding.toast.generateCodeFailedFallback")),
      })
    } finally {
      isVerifying.value = false
    }
  }

  async function copyCodeToClipboard() {
    if (!generatedCode.value) return

    if (!isClipboardSupported()) {
      toast.error(t("userSettings.gameBinding.toast.copyFailedTitle"), {
        description: t("userSettings.gameBinding.toast.clipboardUnsupportedDescription"),
      })
      return
    }

    if (await copyTextToClipboard(generatedCode.value)) {
      toast.success(t("userSettings.gameBinding.toast.copySuccessTitle"), {
        description: t("userSettings.gameBinding.toast.copySuccessDescription"),
      })
      return
    }

    toast.error(t("userSettings.gameBinding.toast.copyFailedTitle"), {
      description: t("userSettings.gameBinding.toast.copyFallbackDescription"),
    })
  }

  watch(
    [isCreating, () => editTarget.value?.server, userIdInput],
    ([creating, server, currentUserId]) => {
      if (!creating || !verifiedBindingSnapshot.value || !server) {
        return
      }

      const snapshot = verifiedBindingSnapshot.value
      if (snapshot.server !== server || snapshot.userId !== currentUserId.trim()) {
        clearVerificationState()
        // Say why Save went grey instead of silently disabling it.
        verificationInvalidated.value = true
      }
    }
  )

  return {
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
    isDeleting,
    isVerifying,
    settingDefaultKey,
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
  }
}
