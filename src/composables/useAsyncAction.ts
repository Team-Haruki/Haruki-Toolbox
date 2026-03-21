import type { Ref } from "vue"
import { toast } from "vue-sonner"
import { extractErrorMessage } from "@/lib/error-utils"
import { createLogger } from "@/lib/logger"
import { translate } from "@/shared/i18n"

const logger = createLogger("async-action")

type LoadingRef = Ref<boolean> | { value: boolean }

type AsyncActionOptions<TResult> = {
  successMessage?: string | ((result: TResult) => string | null | undefined)
  successAfterOnSuccess?: boolean
  errorTitle: string
  fallbackError?: string
  onSuccess?: (result: TResult) => void | Promise<void>
  onError?: (error: unknown) => void | Promise<void>
  onFinally?: () => void | Promise<void>
}

function resolveSuccessMessage<TResult>(
  successMessage: AsyncActionOptions<TResult>["successMessage"],
  result: TResult
) {
  if (!successMessage) return ""
  return typeof successMessage === "function" ? successMessage(result) ?? "" : successMessage
}

export async function runAsyncAction<TResult>(
  loadingRef: LoadingRef,
  task: () => Promise<TResult>,
  options: AsyncActionOptions<TResult>
): Promise<TResult | null> {
  if (loadingRef.value) return null
  loadingRef.value = true

  try {
    let result: TResult
    try {
      result = await task()
    } catch (error: unknown) {
      if (options.onError) {
        await options.onError(error)
      } else {
        toast.error(options.errorTitle, {
          description: extractErrorMessage(error, options.fallbackError ?? options.errorTitle),
        })
      }
      return null
    }

    const successMessage = resolveSuccessMessage(options.successMessage, result)
    const successAfterOnSuccess = options.successAfterOnSuccess ?? false
    if (!successAfterOnSuccess && successMessage) {
      toast.success(successMessage)
    }

    let onSuccessFailed = false
    if (options.onSuccess) {
      try {
        await options.onSuccess(result)
      } catch (error: unknown) {
        onSuccessFailed = true
        logger.error("Post-success callback failed", error)
        toast.warning(translate("common.postSuccessWarningTitle"), {
          description: extractErrorMessage(error, translate("common.postSuccessWarningDescription")),
        })
      }
    }

    if (successAfterOnSuccess && successMessage && !onSuccessFailed) {
      toast.success(successMessage)
    }

    return result
  } finally {
    loadingRef.value = false
    if (options.onFinally) {
      await options.onFinally()
    }
  }
}
