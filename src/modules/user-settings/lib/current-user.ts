import { toast } from "vue-sonner"
import { translate } from "@/shared/i18n"

export function resolveRequiredUserId(
  userId: string | null | undefined,
  actionTitle = translate("userSettings.common.actionFailedTitle")
): string | null {
  if (!userId) {
    toast.error(actionTitle, {
      description: translate("userSettings.common.missingUserDescription"),
    })
    return null
  }

  return userId
}
