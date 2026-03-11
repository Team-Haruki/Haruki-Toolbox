import type { CreateActionsParams } from "@/modules/admin-users/composables/useAdminUserDetailActionTypes"
import { createAdminUserDetailGameActions } from "@/modules/admin-users/composables/useAdminUserDetailGameActions"
import { createAdminUserDetailPrimaryActions } from "@/modules/admin-users/composables/useAdminUserDetailPrimaryActions"
import { createAdminUserDetailSocialActions } from "@/modules/admin-users/composables/useAdminUserDetailSocialActions"

export function createAdminUserDetailActions(params: CreateActionsParams) {
  return {
    ...createAdminUserDetailPrimaryActions(params),
    ...createAdminUserDetailGameActions(params),
    ...createAdminUserDetailSocialActions(params),
  }
}
