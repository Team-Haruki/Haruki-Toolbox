import { toast } from "vue-sonner"
import { extractErrorMessage, shouldReportError } from "@/lib/error-utils"

export function toastErrorWithExtractedMessage(
  title: string,
  error: unknown,
  fallbackMessage = title
) {
  if (!shouldReportError(error)) return
  toast.error(title, {
    description: extractErrorMessage(error, fallbackMessage),
  })
}
