import { computed, ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { unwrapUpdatedData } from "@/core/http/call-api"
import { extractErrorMessage } from "@/lib/error-utils"
import { asRecord, normalizeEntityId, readString } from "@/lib/record-utils"
import { DEFAULT_SOCIAL_PLATFORM, isSocialPlatform } from "@/lib/social-platform"
import type { EntityId } from "@/types/common"
import type { SocialPlatform as SocialPlatformType } from "@/types/social-platform"
import { resolveRequiredUserId } from "@/modules/user-settings/lib/current-user"
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
}

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

  const tableData = computed<SocialAuth[]>(() => normalizeSocialAuthList(userStore.authorizeSocialPlatformInfo))

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
    showEditDialog.value = true
  }

  function startAdd() {
    editTarget.value = {
      id: nextPlatformId(),
      platform: DEFAULT_SOCIAL_PLATFORM,
      userId: "",
      comment: "",
    }
    isCreateMode.value = true
    showEditDialog.value = true
  }

  async function handleEditSave() {
    if (!editTarget.value || isSaving.value) return
    const target = editTarget.value

    const userId = requireUserId()
    if (!userId) return

    const normalizedUserId = target.userId.trim()
    if (!normalizedUserId) {
      toast.error(t("userSettings.imAuthorization.toast.saveFailedTitle"), {
        description: t("userSettings.imAuthorization.toast.accountRequiredDescription"),
      })
      return
    }

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
              { skipErrorToast: true }
            )
          })()
      const updatedData = unwrapUpdatedData(response, t("userSettings.imAuthorization.title"))
      userStore.setUser({ authorizeSocialPlatformInfo: updatedData })

      toast.success(t("userSettings.imAuthorization.toast.saveSuccessTitle"), {
        description: t("userSettings.imAuthorization.toast.saveSuccessDescription"),
      })
      showEditDialog.value = false
    } catch (error: unknown) {
      toast.error(t("userSettings.imAuthorization.toast.saveFailedTitle"), {
        description: extractErrorMessage(error, t("userSettings.imAuthorization.toast.saveFailedTitle")),
      })
    } finally {
      isSaving.value = false
    }
  }

  function confirmDelete(row: SocialAuth) {
    deleteTarget.value = row
    showDeleteDialog.value = true
  }

  async function handleDelete() {
    if (!deleteTarget.value || isDeleting.value) return

    const userId = requireUserId()
    if (!userId) return

    const authId = resolveNumericId(deleteTarget.value.id)
    if (authId == null) {
      toast.error(t("userSettings.imAuthorization.toast.deleteFailedTitle"), {
        description: t("userSettings.imAuthorization.toast.deleteFailedTitle"),
      })
      return
    }

    isDeleting.value = true
    try {
      const response = await removeAuthorizeSocialPlatformAccount(userId, authId, {
        skipErrorToast: true,
      })
      const updatedData = unwrapUpdatedData(response, t("userSettings.imAuthorization.title"))
      userStore.setUser({ authorizeSocialPlatformInfo: updatedData })

      toast.success(t("userSettings.imAuthorization.toast.deleteSuccessTitle"), {
        description: t("userSettings.imAuthorization.toast.deleteSuccessDescription"),
      })
      showDeleteDialog.value = false
      deleteTarget.value = null
    } catch (error: unknown) {
      toast.error(t("userSettings.imAuthorization.toast.deleteFailedTitle"), {
        description: extractErrorMessage(error, t("userSettings.imAuthorization.toast.deleteFailedTitle")),
      })
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
    tableData,
    getPlatformLabel,
    startEdit,
    startAdd,
    handleEditSave,
    confirmDelete,
    handleDelete,
  }
}
