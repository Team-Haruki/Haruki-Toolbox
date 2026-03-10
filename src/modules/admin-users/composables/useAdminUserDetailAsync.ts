import { toast } from "vue-sonner"
import type { Ref } from "vue"
import { extractErrorMessage } from "@/lib/error-utils"
import { translate } from "@/shared/i18n"

export interface ActionOptions<T = void> {
  successMessage?: string
  afterSuccess?: (result: T) => Promise<void> | void
  successAfterAfterSuccess?: boolean
}

export interface LoadOptions<T> {
  errorTitle?: string
  silent?: boolean
  onSuccess?: (result: T) => void | Promise<void>
  onError?: () => void | Promise<void>
}

export function createAdminUserDetailAsync(actionLoading: Ref<boolean>, taskLoading: Ref<boolean>) {
  const latestLoadRequestIds = new WeakMap<object, number>()

  function nextLoadRequestId(loadRef: object) {
    const nextId = (latestLoadRequestIds.get(loadRef) ?? 0) + 1
    latestLoadRequestIds.set(loadRef, nextId)
    return nextId
  }

  function isLatestLoadRequest(loadRef: object, requestId: number) {
    return latestLoadRequestIds.get(loadRef) === requestId
  }

  async function executeTask<T>(
    errorTitle: string,
    task: () => Promise<T>,
    options: ActionOptions<T> = {}
  ) {
    let result: T
    try {
      result = await task()
    } catch (error: unknown) {
      toast.error(errorTitle, {
        description: extractErrorMessage(error, translate("adminUsers.detail.toast.actionFailedFallback")),
      })
      return
    }

    const successAfterAfterSuccess = options.successAfterAfterSuccess ?? true
    if (!successAfterAfterSuccess && options.successMessage) {
      toast.success(options.successMessage)
    }

    let afterSuccessFailed = false
    if (options.afterSuccess) {
      try {
        await options.afterSuccess(result)
      } catch (error: unknown) {
        afterSuccessFailed = true
        console.error("[admin-user-detail] post-success callback failed:", error)
        toast.warning(translate("common.postSuccessWarningTitle"), {
          description: extractErrorMessage(error, translate("common.postSuccessWarningDescription")),
        })
      }
    }

    if (successAfterAfterSuccess && options.successMessage && !afterSuccessFailed) {
      toast.success(options.successMessage)
    }
  }

  async function runLoad<T>(
    loadRef: { value: boolean },
    task: () => Promise<T>,
    options: LoadOptions<T> = {}
  ) {
    const requestId = nextLoadRequestId(loadRef)
    loadRef.value = true
    try {
      const result = await task()
      if (!isLatestLoadRequest(loadRef, requestId)) return
      if (options.onSuccess) {
        await options.onSuccess(result)
      }
    } catch (error: unknown) {
      if (!isLatestLoadRequest(loadRef, requestId)) return
      if (options.onError) {
        await options.onError()
      }
      if (!options.silent && options.errorTitle) {
        toast.error(options.errorTitle, {
          description: extractErrorMessage(error, translate("adminUsers.detail.toast.actionFailedFallback")),
        })
      }
    } finally {
      if (!isLatestLoadRequest(loadRef, requestId)) return
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
