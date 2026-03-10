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
  throwOnError?: boolean
  notifyOnError?: boolean
  onSuccess?: (result: T) => void | Promise<void>
  onError?: () => void | Promise<void>
}

export function createAdminUserDetailAsync(actionLoading: Ref<boolean>, taskLoading: Ref<boolean>) {
  const latestLoadRequestIds = new WeakMap<object, number>()
  let loadGeneration = 0

  function nextLoadRequestId(loadRef: object) {
    const nextId = (latestLoadRequestIds.get(loadRef) ?? 0) + 1
    latestLoadRequestIds.set(loadRef, nextId)
    return nextId
  }

  function isLatestLoadRequest(loadRef: object, requestId: number) {
    return latestLoadRequestIds.get(loadRef) === requestId
  }

  function isActiveLoadRequest(loadRef: object, requestId: number, generation: number) {
    return loadGeneration === generation && isLatestLoadRequest(loadRef, requestId)
  }

  function invalidateLoads() {
    loadGeneration += 1
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
    const generation = loadGeneration
    const requestId = nextLoadRequestId(loadRef)
    loadRef.value = true
    try {
      const result = await task()
      if (!isActiveLoadRequest(loadRef, requestId, generation)) return
      if (options.onSuccess) {
        await options.onSuccess(result)
      }
    } catch (error: unknown) {
      if (!isActiveLoadRequest(loadRef, requestId, generation)) return
      if (options.onError) {
        await options.onError()
      }
      const notifyOnError = options.notifyOnError ?? !options.silent
      if (notifyOnError && options.errorTitle) {
        toast.error(options.errorTitle, {
          description: extractErrorMessage(error, translate("adminUsers.detail.toast.actionFailedFallback")),
        })
      }
      if (options.throwOnError) {
        throw error
      }
    } finally {
      if (!isActiveLoadRequest(loadRef, requestId, generation)) return
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
    invalidateLoads,
  }
}
