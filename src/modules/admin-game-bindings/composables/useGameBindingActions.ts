import { ref, type Ref } from "vue"
import { useI18n } from "vue-i18n"
import { runAsyncAction } from "@/composables/useAsyncAction"
import {
  batchDeleteGameBindings,
  deleteGlobalGameBinding,
  reassignGlobalGameBinding,
  type GlobalGameBinding,
} from "@/modules/admin-game-bindings/api/binding"
import { updateGameAccountBinding } from "@/modules/admin-users/api/game-binding"
import type { MysekaiDataPrivacySettings, SekaiRegion, SuiteDataPrivacySettings } from "@/types/store"

type ParsedBinding = {
  server: SekaiRegion
  gameUserId: string
}

type UseGameBindingActionsOptions = {
  loadBindings: () => Promise<void>
  selected: Ref<Set<string>>
  parseSelectedBindings: () => ParsedBinding[]
  editDialogOpen: Ref<boolean>
  editTargetUserId: Ref<string>
  editServer: Ref<SekaiRegion>
  editGameUserId: Ref<string>
  editOriginalServer: Ref<SekaiRegion>
  editOriginalGameUserId: Ref<string>
  editSuite: Ref<SuiteDataPrivacySettings>
  editMysekai: Ref<MysekaiDataPrivacySettings>
  isEditMode: Ref<boolean>
}

type RunActionOptions = {
  successMessage?: string
  errorTitle: string
  onSuccess?: () => void | Promise<void>
  /** Rethrow instead of toasting: the ConfirmDialog running it reports the failure inline. */
  throwOnError?: boolean
}

export function useGameBindingActions(options: UseGameBindingActionsOptions) {
  const { t } = useI18n()
  const reassignDialogOpen = ref(false)
  const reassignTarget = ref<GlobalGameBinding | null>(null)
  const reassignTargetUserId = ref("")
  const actionLoading = ref(false)

  const deleteDialogOpen = ref(false)
  const deleteTarget = ref<GlobalGameBinding | null>(null)

  async function runAction(task: () => Promise<unknown>, actionOptions: RunActionOptions) {
    await runAsyncAction(actionLoading, task, {
      successMessage: actionOptions.successMessage,
      successAfterOnSuccess: true,
      errorTitle: actionOptions.errorTitle,
      fallbackError: actionOptions.errorTitle,
      throwOnError: actionOptions.throwOnError,
      onSuccess: async () => {
        if (actionOptions.onSuccess) {
          await actionOptions.onSuccess()
        }
      },
    })
  }

  function openDeleteConfirm(binding: GlobalGameBinding) {
    deleteTarget.value = binding
    deleteDialogOpen.value = true
  }

  /** Runs from the delete ConfirmDialog, which closes itself on success and shows a failure inline. */
  async function handleDelete() {
    const target = deleteTarget.value
    if (!target) return

    await runAction(
      () => deleteGlobalGameBinding(target.server, target.gameUserId),
      {
        throwOnError: true,
        successMessage: t("adminGameBindings.toast.unbound"),
        errorTitle: t("adminGameBindings.toast.unbindFailedTitle"),
        onSuccess: async () => {
          deleteTarget.value = null
          await options.loadBindings()
        },
      }
    )
  }

  function openReassign(binding: GlobalGameBinding) {
    reassignTarget.value = binding
    reassignTargetUserId.value = ""
    reassignDialogOpen.value = true
  }

  async function handleReassign() {
    const target = reassignTarget.value
    const targetUserId = reassignTargetUserId.value.trim()
    if (!target || !targetUserId) return

    await runAction(
      () => reassignGlobalGameBinding(target.server, target.gameUserId, targetUserId),
      {
        successMessage: t("adminGameBindings.toast.reassigned"),
        errorTitle: t("adminGameBindings.toast.reassignFailedTitle"),
        onSuccess: async () => {
          reassignDialogOpen.value = false
          reassignTarget.value = null
          await options.loadBindings()
        },
      }
    )
  }

  /** Runs from the batch ConfirmDialog; an unusable selection is reported inline like a failure. */
  async function handleBatchDelete() {
    if (options.selected.value.size === 0) return

    const items = options.parseSelectedBindings()

    if (items.length === 0) {
      throw new Error(t("adminGameBindings.toast.invalidSelectedRecords"))
    }

    await runAction(
      () => batchDeleteGameBindings(items),
      {
        throwOnError: true,
        successMessage: t("adminGameBindings.toast.batchUnbound", { count: items.length }),
        errorTitle: t("adminGameBindings.toast.batchUnbindFailedTitle"),
        onSuccess: options.loadBindings,
      }
    )
  }

  async function handleSaveBinding() {
    const targetUserId = options.editTargetUserId.value.trim()
    const gameUserId = (options.isEditMode.value
      ? options.editOriginalGameUserId.value
      : options.editGameUserId.value).trim()
    const server = options.isEditMode.value
      ? options.editOriginalServer.value
      : options.editServer.value
    if (!targetUserId || !gameUserId) return

    await runAction(
      () =>
        updateGameAccountBinding(targetUserId, server, gameUserId, {
          suite: options.editSuite.value,
          mysekai: options.editMysekai.value,
        }),
      {
        successMessage: options.isEditMode.value
          ? t("adminGameBindings.toast.bindingUpdated")
          : t("adminGameBindings.toast.bindingCreated"),
        errorTitle: t("adminGameBindings.toast.saveFailedTitle"),
        onSuccess: async () => {
          options.editDialogOpen.value = false
          await options.loadBindings()
        },
      }
    )
  }

  return {
    reassignDialogOpen,
    reassignTarget,
    reassignTargetUserId,
    actionLoading,
    deleteDialogOpen,
    deleteTarget,
    openDeleteConfirm,
    handleDelete,
    openReassign,
    handleReassign,
    handleBatchDelete,
    handleSaveBinding,
  }
}
