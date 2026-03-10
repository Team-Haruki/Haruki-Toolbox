import type { Ref } from "vue"
import { toast } from "vue-sonner"
import { extractErrorMessage } from "@/lib/error-utils"

type LoadingRef = Ref<boolean> | { value: boolean }

type AsyncActionOptions<TResult> = {
  successMessage?: string | ((result: TResult) => string | null | undefined)
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
    const result = await task()
    const successMessage = resolveSuccessMessage(options.successMessage, result)
    if (successMessage) {
      toast.success(successMessage)
    }
    if (options.onSuccess) {
      await options.onSuccess(result)
    }
    return result
  } catch (error: unknown) {
    if (options.onError) {
      await options.onError(error)
    } else {
      toast.error(options.errorTitle, {
        description: extractErrorMessage(error, options.fallbackError ?? options.errorTitle),
      })
    }
    return null
  } finally {
    loadingRef.value = false
    if (options.onFinally) {
      await options.onFinally()
    }
  }
}
