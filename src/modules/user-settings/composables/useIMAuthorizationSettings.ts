import { computed, nextTick, ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { unwrapUpdatedData } from "@/core/http/call-api"
import { extractErrorMessage } from "@/lib/error-utils"
import { asRecord, normalizeEntityId, readString, readBoolean } from "@/lib/record-utils"
import { DEFAULT_SOCIAL_PLATFORM, isSocialPlatform, isVerifiedQQBinding } from "@/lib/social-platform"
import type { EntityId } from "@/types/common"
import type { SocialPlatform as SocialPlatformType } from "@/types/social-platform"
import { resolveRequiredUserId } from "@/modules/user-settings/lib/current-user"
import { validateSocialAccountId } from "@/modules/user-settings/lib/social-account-validation"
import {
  createAuthorizeSocialPlatformAccount,
  addAuthorizeSocialPlatformAccount,
  removeAuthorizeSocialPlatformAccount,
} from "@/modules/user-settings/api/im-auth"

export type SocialPlatform = SocialPlatformType

export interface SocialAuth {
  id: EntityId
  platform: SocialPlatform
  userId: string
  comment: string
  allowFastVerification: boolean
}

/** DOM id of the account field in the authorization dialog; validation focuses it. */
export const IM_AUTH_ACCOUNT_INPUT_ID = "im-auth-account"

function normalizeSocialAuthList(value: unknown): SocialAuth[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      const record = asRecord(item)
      if (!record) return null

      const platformValue = readString(record, ["platform"])
      return {
        id: normalizeEntityId(record.id ?? record.ID ?? record.platformId),
        platform: isSocialPlatform(platformValue) ? platformValue : DEFAULT_SOCIAL_PLATFORM,
        userId: readString(record, ["userId", "user_id"]),
        comment: readString(record, ["comment"]),
        allowFastVerification: readBoolean(record, ["allowFastVerification"]),
      } satisfies SocialAuth
    })
    .filter((item): item is SocialAuth => item !== null)
}

function resolveNumericId(id: EntityId): number | null {
  if (typeof id === "number" && Number.isFinite(id)) return id
  if (typeof id === "string" && id.trim() !== "") {
    const parsed = Number(id)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export function useIMAuthorizationSettings() {
  const { t } = useI18n()
  const userStore = useUserStore()

  const showEditDialog = ref(false)
  const editTarget = ref<SocialAuth | null>(null)
  const isCreateMode = ref(false)
  const showDeleteDialog = ref(false)
  const deleteTarget = ref<SocialAuth | null>(null)
  const isSaving = ref(false)
  const isDeleting = ref(false)
  /** Inline error under the account field; empty when valid. */
  const accountError = ref("")

  const tableData = computed<SocialAuth[]>(() => normalizeSocialAuthList(userStore.authorizeSocialPlatformInfo))
  /** The person's own QQ is bound and verified: the dialog's "bind first" hint is off. */
  const hasVerifiedOwnBinding = computed(() => isVerifiedQQBinding(userStore.socialPlatformInfo))

  const platformLabels = computed<Record<SocialPlatform, string>>(() => ({
    qq: t("userSettings.imAuthorization.platforms.qq"),
    qqbot: t("userSettings.imAuthorization.platforms.qqbot"),
    discord: t("userSettings.imAuthorization.platforms.discord"),
    telegram: t("userSettings.imAuthorization.platforms.telegram"),
  }))

  function getPlatformLabel(platform: SocialPlatform): string {
    return platformLabels.value[platform] ?? platform
  }

  function requireUserId(actionTitle = t("userSettings.common.actionFailedTitle")): string | null {
    return resolveRequiredUserId(userStore.userId, actionTitle)
  }

  function nextPlatformId(): number {
    const existingIds = tableData.value
      .map((item) => resolveNumericId(item.id))
      .filter((id): id is number => id != null)
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0
    return maxId + 1
  }

  function startEdit(row: SocialAuth) {
    editTarget.value = { ...row }
    isCreateMode.value = false
    accountError.value = ""
    showEditDialog.value = true
  }

  function startAdd() {
    editTarget.value = {
      id: nextPlatformId(),
      platform: DEFAULT_SOCIAL_PLATFORM,
      userId: "",
      comment: "",
      allowFastVerification: false,
    }
    isCreateMode.value = true
    accountError.value = ""
    showEditDialog.value = true
  }

  function clearAccountError() {
    accountError.value = ""
  }

  function focusAccountField() {
    void nextTick(() => {
      document.getElementById(IM_AUTH_ACCOUNT_INPUT_ID)?.focus()
    })
  }

  /** Validates the account field inline; returns the trimmed id or null. */
  function validateAccount(target: SocialAuth): string | null {
    const normalizedUserId = target.userId.trim()
    if (!normalizedUserId) {
      accountError.value = t("userSettings.imAuthorization.toast.accountRequiredDescription")
      focusAccountField()
      return null
    }
    const validationError = validateSocialAccountId(target.platform, normalizedUserId)
    if (validationError) {
      accountError.value = validationError === "qq-not-numeric"
        ? t("userSettings.imAuthorization.toast.accountQQNumericDescription")
        : t("userSettings.imAuthorization.toast.accountQQBotLengthDescription")
      focusAccountField()
      return null
    }
    accountError.value = ""
    return normalizedUserId
  }

  async function handleEditSave() {
    if (!editTarget.value || isSaving.value) return
    const target = editTarget.value

    const userId = requireUserId()
    if (!userId) return

    const normalizedUserId = validateAccount(target)
    if (!normalizedUserId) return

    isSaving.value = true
    try {
      const response = isCreateMode.value
        ? await (async () => {
            const platformId = resolveNumericId(target.id)
            if (platformId == null) {
              throw new Error(t("userSettings.imAuthorization.toast.saveFailedTitle"))
            }
            return await createAuthorizeSocialPlatformAccount(
              userId,
              platformId,
              target.platform,
              normalizedUserId,
              target.comment.trim(),
              target.allowFastVerification,
              { skipErrorToast: true }
            )
          })()
        : await (async () => {
            const authId = resolveNumericId(target.id)
            if (authId == null) {
              throw new Error(t("userSettings.imAuthorization.toast.saveFailedTitle"))
            }
            return await addAuthorizeSocialPlatformAccount(
              userId,
              authId,
              target.platform,
              normalizedUserId,
              target.comment.trim(),
              target.allowFastVerification,
              { skipErrorToast: true }
            )
          })()
      const updatedData = unwrapUpdatedData(response, t("userSettings.imAuthorization.title"))
      userStore.setUser({ authorizeSocialPlatformInfo: updatedData.authorizeSocialPlatformInfo })

      toast.success(t("userSettings.imAuthorization.toast.saveSuccessTitle"), {
        description: t("userSettings.imAuthorization.toast.saveSuccessDescription"),
      })
      showEditDialog.value = false
    } catch (error: unknown) {
      toast.error(t("userSettings.imAuthorization.toast.saveFailedTitle"), {
        description: extractErrorMessage(error, t("userSettings.imAuthorization.toast.saveFailedFallback")),
      })
    } finally {
      isSaving.value = false
    }
  }

  function confirmDelete(row: SocialAuth) {
    deleteTarget.value = row
    showDeleteDialog.value = true
  }

  /**
   * Removes the authorization the delete dialog is showing. Rejects on
   * failure so the confirm dialog stays open with the reason.
   */
  async function handleDelete() {
    if (!deleteTarget.value || isDeleting.value) return

    const userId = requireUserId()
    if (!userId) return

    const authId = resolveNumericId(deleteTarget.value.id)
    if (authId == null) {
      throw new Error(t("userSettings.imAuthorization.toast.deleteFailedFallback"))
    }

    isDeleting.value = true
    try {
      const response = await removeAuthorizeSocialPlatformAccount(userId, authId, {
        skipErrorToast: true,
      })
      const updatedData = unwrapUpdatedData(response, t("userSettings.imAuthorization.title"))
      userStore.setUser({ authorizeSocialPlatformInfo: updatedData.authorizeSocialPlatformInfo })

      toast.success(t("userSettings.imAuthorization.toast.deleteSuccessTitle"), {
        description: t("userSettings.imAuthorization.toast.deleteSuccessDescription"),
      })
      deleteTarget.value = null
    } finally {
      isDeleting.value = false
    }
  }

  return {
    showEditDialog,
    editTarget,
    isCreateMode,
    showDeleteDialog,
    deleteTarget,
    isSaving,
    isDeleting,
    accountError,
    tableData,
    hasVerifiedOwnBinding,
    getPlatformLabel,
    startEdit,
    startAdd,
    clearAccountError,
    handleEditSave,
    confirmDelete,
    handleDelete,
  }
}
