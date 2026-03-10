import { toast } from "vue-sonner"
import type { Ref } from "vue"
import { extractErrorMessage } from "@/lib/error-utils"
import { translate } from "@/shared/i18n"

export interface ActionOptions<T = void> {
  successMessage?: string
  afterSuccess?: (result: T) => Promise<void> | void
}

export interface LoadOptions<T> {
  errorTitle?: string
  silent?: boolean
  onSuccess?: (result: T) => void
  onError?: () => void
}

export function createAdminUserDetailAsync(actionLoading: Ref<boolean>, taskLoading: Ref<boolean>) {
  async function executeTask<T>(
    errorTitle: string,
    task: () => Promise<T>,
    options: ActionOptions<T> = {}
  ) {
    try {
      const result = await task()
      if (options.successMessage) {
        toast.success(options.successMessage)
      }
      await options.afterSuccess?.(result)
    } catch (error: unknown) {
      toast.error(errorTitle, {
        description: extractErrorMessage(error, translate("adminUsers.detail.toast.actionFailedFallback")),
      })
    }
  }

  async function runLoad<T>(
    loadRef: { value: boolean },
    task: () => Promise<T>,
    options: LoadOptions<T> = {}
  ) {
    loadRef.value = true
    try {
      const result = await task()
      options.onSuccess?.(result)
    } catch (error: unknown) {
      options.onError?.()
      if (!options.silent && options.errorTitle) {
        toast.error(options.errorTitle, {
          description: extractErrorMessage(error, translate("adminUsers.detail.toast.actionFailedFallback")),
        })
      }
    } finally {
      loadRef.value = false
    }
  }

  async function runTask<T>(
    errorTitle: string,
    task: () => Promise<T>,
    options: ActionOptions<T> = {}
  ) {
    if (taskLoading.value) return
    taskLoading.value = true
    try {
      await executeTask(errorTitle, task, options)
    } finally {
      taskLoading.value = false
    }
  }

  async function runAction<T>(
    errorTitle: string,
    task: () => Promise<T>,
    options: ActionOptions<T> = {}
  ) {
    if (actionLoading.value) return
    actionLoading.value = true
    try {
      await executeTask(errorTitle, task, options)
    } finally {
      actionLoading.value = false
    }
  }

  return {
    runLoad,
    runTask,
    runAction,
  }
}
