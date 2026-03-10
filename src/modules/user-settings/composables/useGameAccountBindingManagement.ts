import { computed, onMounted, ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import { useUserStore } from "@/shared/stores/user"
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
  const router = useRouter()
  const userStore = useUserStore()
  const allowCNMysekai = computed(() => userStore.allowCNMysekai)
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
  const userIdInput = ref("")
  const verificationTriggered = ref(false)
  const editTarget = ref<GameAccountBinding | null>(null)
  const deleteTarget = ref<GameAccountBinding | null>(null)
  const isSaving = ref(false)

  const data = computed<GameAccountBinding[]>(() =>
    Array.isArray(userStore.gameAccountBindings) ? userStore.gameAccountBindings : []
  )

  function redirectWhenSocialAccountNotVerified() {
    const info = userStore.socialPlatformInfo
    if (!info?.verified) {
      toast.warning(t("userSettings.gameBinding.toast.socialBindingRequiredTitle"), {
        description: t("userSettings.gameBinding.toast.socialBindingRequiredDescription"),
      })
      void router.push("/user/settings")
    }
  }

  function requireCurrentUserId(errorTitle: string) {
    return resolveRequiredUserId(userStore.userId, errorTitle)
  }

  function startAdd() {
    isCreating.value = true
    verificationTriggered.value = false
    generatedCode.value = ""
    editTarget.value = toEditableAccount()
    userIdInput.value = ""
    showEditDialog.value = true
  }

  function startEdit(account: GameAccountBinding) {
    isCreating.value = false
    verificationTriggered.value = false
    generatedCode.value = ""
    editTarget.value = toEditableAccount(account)
    userIdInput.value = String(account.userId)
    showEditDialog.value = true
  }

  function confirmDelete(account: GameAccountBinding) {
    deleteTarget.value = account
    showDeleteDialog.value = true
  }

  async function handleDelete() {
    if (!deleteTarget.value) return

    const currentUserId = requireCurrentUserId(t("userSettings.gameBinding.toast.deleteFailedTitle"))
    if (!currentUserId) return

    try {
      const resp = await removeGameAccount(
        deleteTarget.value.server,
        String(deleteTarget.value.userId),
        currentUserId,
        { skipErrorToast: true }
      )
      const updated = resp.updatedData?.gameAccountBindings
      userStore.setUser({ gameAccountBindings: updated })
      toast.success(t("userSettings.gameBinding.toast.deleteSuccessTitle"), {
        description: t("userSettings.gameBinding.toast.deleteSuccessDescription"),
      })
    } catch (error: unknown) {
      toast.error(t("userSettings.gameBinding.toast.deleteFailedTitle"), {
        description: extractErrorMessage(error, t("userSettings.gameBinding.toast.deleteFailedTitle")),
      })
    } finally {
      showDeleteDialog.value = false
    }
  }

  async function handleEditSave() {
    if (!editTarget.value) return

    if (isCreating.value && !verificationTriggered.value) {
      toast.error(t("userSettings.gameBinding.toast.saveFailedTitle"), {
        description: t("userSettings.gameBinding.toast.verifyBeforeCreateDescription"),
      })
      return
    }

    const currentUserId = requireCurrentUserId(t("userSettings.gameBinding.toast.saveFailedTitle"))
    if (!currentUserId) return

    isSaving.value = true
    try {
      const server = editTarget.value.server
      const gameUid = userIdInput.value.trim()
      if (!/^\d+$/.test(gameUid)) {
        toast.error(t("userSettings.gameBinding.toast.saveFailedTitle"), {
          description: t("userSettings.gameBinding.toast.uidMustBeNumericDescription"),
        })
        return
      }

      const suitePayload = normalizeSuitePermissions(editTarget.value.suite)
      const mysekaiPayload =
        server === "cn" && userStore.allowCNMysekai === false
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

      const updated = resp.updatedData?.gameAccountBindings
      if (Array.isArray(updated)) {
        userStore.setUser({ gameAccountBindings: updated })
      }

      toast.success(t("userSettings.gameBinding.toast.saveSuccessTitle"), {
        description: t("userSettings.gameBinding.toast.saveSuccessDescription"),
      })
      showEditDialog.value = false
    } catch (error: unknown) {
      toast.error(t("userSettings.gameBinding.toast.saveFailedTitle"), {
        description: extractErrorMessage(error, t("userSettings.gameBinding.toast.saveFailedTitle")),
      })
    } finally {
      isSaving.value = false
    }
  }

  async function handleVerify() {
    const uidStr = userIdInput.value.trim()
    if (!/^\d+$/.test(uidStr)) {
      toast.error(t("userSettings.gameBinding.toast.generateCodeFailedTitle"), {
        description: t("userSettings.gameBinding.toast.uidMustBeNumericDescription"),
      })
      return
    }

    if (!editTarget.value?.server) {
      toast.error(t("userSettings.gameBinding.toast.generateCodeFailedTitle"), {
        description: t("userSettings.gameBinding.toast.selectServerAndUidDescription"),
      })
      return
    }

    const currentUserId = requireCurrentUserId(t("userSettings.gameBinding.toast.generateCodeFailedTitle"))
    if (!currentUserId) return

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
      verificationTriggered.value = true
    } catch (error: unknown) {
      toast.error(t("userSettings.gameBinding.toast.generateCodeFailedTitle"), {
        description: extractErrorMessage(error, t("userSettings.gameBinding.toast.generateCodeFailedTitle")),
      })
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

  onMounted(() => {
    redirectWhenSocialAccountNotVerified()
  })

  return {
    data,
    isCreating,
    generatedCode,
    showEditDialog,
    showVerifyDialog,
    showDeleteDialog,
    userIdInput,
    verificationTriggered,
    editTarget,
    deleteTarget,
    isSaving,
    allowCNMysekai,
    regionLabels,
    regionOptions,
    startAdd,
    startEdit,
    confirmDelete,
    handleDelete,
    handleEditSave,
    handleVerify,
    copyCodeToClipboard,
  }
}
