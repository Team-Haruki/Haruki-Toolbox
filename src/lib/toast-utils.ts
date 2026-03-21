import { toast } from "vue-sonner"
import { extractErrorMessage } from "@/lib/error-utils"

export function toastErrorWithExtractedMessage(
  title: string,
  error: unknown,
  fallbackMessage = title
) {
  toast.error(title, {
    description: extractErrorMessage(error, fallbackMessage),
  })
}
