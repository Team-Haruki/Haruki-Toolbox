import type { EntityId } from "@/types/common"
import type { ActionOptions, LoadOptions } from "@/modules/admin-users/composables/useAdminUserDetailAsync"
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

export type LoaderRunOptions = Pick<LoadOptions<unknown>, "throwOnError" | "notifyOnError">

export interface LoaderDeps {
  loadUser: (options?: LoaderRunOptions) => Promise<void>
  loadOAuth: (options?: LoaderRunOptions) => Promise<void>
  loadGameBindings: (options?: LoaderRunOptions) => Promise<void>
  loadSocialPlatform: (options?: LoaderRunOptions) => Promise<void>
  loadAuthorizedSocials: (options?: LoaderRunOptions) => Promise<void>
}

export interface CreateActionsParams {
  userId: () => string
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
