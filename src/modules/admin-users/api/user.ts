import { request, unwrapUpdatedData } from "@/core/http/call-api"
import type { QueryParams } from "@/core/http/query"
import { userBase } from "@/modules/admin-users/api/shared"
import { translate } from "@/shared/i18n"
import type {
  AdminUser,
  AdminUserDetail,
  BatchOperationRequest,
  PaginatedResponse,
  ResetPasswordRequest,
  UserActivityResponse,
} from "@/types/admin"
import type { UserRole } from "@/types/common"
import type { APIResponse } from "@/types/response"

export async function getUsers(params?: QueryParams) {
  const res = await request<APIResponse<PaginatedResponse<AdminUser>>>("/api/admin/users/", {
    method: "GET",
    params,
  })
  return unwrapUpdatedData(res, translate("adminUsers.management.toast.loadFailedTitle"))
}

export async function getUserDetail(userId: string) {
  const res = await request<APIResponse<AdminUserDetail>>(`${userBase(userId)}/detail`, { method: "GET" })
  return unwrapUpdatedData(res, translate("adminUsers.detail.toast.loadUserFailedTitle"))
}

export async function getUserActivity(userId: string, params?: QueryParams) {
  const res = await request<APIResponse<UserActivityResponse>>(`${userBase(userId)}/activity`, {
    method: "GET",
    params,
  })
  return unwrapUpdatedData(res, translate("adminUsers.detail.toast.loadActivityFailedTitle"))
}

export function banUser(userId: string, reason?: string) {
  return request(`${userBase(userId)}/ban`, {
    method: "PUT",
    data: reason ? { reason } : undefined,
  })
}

export function unbanUser(userId: string) {
  return request(`${userBase(userId)}/unban`, { method: "PUT" })
}

export function forceLogout(userId: string) {
  return request(`${userBase(userId)}/force-logout`, { method: "POST" })
}

export async function getUserRole(userId: string) {
  const res = await request<APIResponse<{ role: UserRole }>>(`${userBase(userId)}/role`, { method: "GET" })
  return unwrapUpdatedData(res, translate("adminUsers.detail.toast.updateRoleFailedTitle"))
}

export function updateUserRole(userId: string, role: UserRole) {
  return request(`${userBase(userId)}/role`, {
    method: "PUT",
    data: { role },
  })
}

export function deleteUser(userId: string) {
  return request(`${userBase(userId)}`, { method: "DELETE" })
}

export function restoreUser(userId: string) {
  return request(`${userBase(userId)}/restore`, { method: "POST" })
}

export function resetPassword(userId: string, data?: ResetPasswordRequest) {
  return request(`${userBase(userId)}/reset-password`, {
    method: "POST",
    data,
  })
}

export function updateUserEmail(userId: string, email: string) {
  return request(`${userBase(userId)}/email`, {
    method: "PUT",
    data: { email },
  })
}

export function batchBan(data: BatchOperationRequest) {
  return request("/api/admin/users/batch-ban", { method: "POST", data })
}

export function batchUnban(data: Pick<BatchOperationRequest, "userIds">) {
  return request("/api/admin/users/batch-unban", { method: "POST", data })
}

export function batchForceLogout(data: Pick<BatchOperationRequest, "userIds">) {
  return request("/api/admin/users/batch-force-logout", { method: "POST", data })
}

export function batchRole(data: { userIds: string[]; role: UserRole }) {
  return request("/api/admin/users/batch-role", { method: "POST", data })
}

export function batchAllowCNMysekai(data: { userIds: string[]; allowCNMysekai: boolean }) {
  return request("/api/admin/users/batch-allow-cn-mysekai", { method: "POST", data })
}
