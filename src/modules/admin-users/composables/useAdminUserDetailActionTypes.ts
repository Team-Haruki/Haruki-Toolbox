import type { EntityId } from "@/types/common"
import type { ActionOptions } from "@/modules/admin-users/composables/useAdminUserDetailAsync"
import type { AdminUserDetailState } from "@/modules/admin-users/composables/useAdminUserDetailState"

export type RunTaskFn = <T>(
  errorTitle: string,
  task: () => Promise<T>,
  options?: ActionOptions<T>
) => Promise<void>

export type RunActionFn = <T>(
  errorTitle: string,
  task: () => Promise<T>,
  options?: ActionOptions<T>
) => Promise<void>

export interface LoaderDeps {
  loadUser: () => Promise<void>
  loadOAuth: () => Promise<void>
  loadGameBindings: () => Promise<void>
  loadSocialPlatform: () => Promise<void>
  loadAuthorizedSocials: () => Promise<void>
}

export interface CreateActionsParams {
  userId: string
  state: AdminUserDetailState
  runTask: RunTaskFn
  runAction: RunActionFn
  loaders: LoaderDeps
}

export interface EditableAuthSocial {
  id: EntityId
  platform: string
  userId: string
  comment?: string
}
