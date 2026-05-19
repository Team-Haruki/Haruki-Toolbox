import { readUpdatedItems, readUpdatedTotal, request, unwrapUpdatedData } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import type { QueryParams } from "@/core/http/query"
import { asRecord, readBoolean, readString, type UnknownRecord } from "@/lib/record-utils"
import { userBase } from "@/modules/admin-users/api/shared"
import { translate } from "@/shared/i18n"
import type { AdminTicketNotificationRecipient } from "@/types/admin"
import type { APIResponse } from "@/types/response"
import type {
  AdminTicketNotificationPreference,
  TicketAssignRequest,
  TicketDetail,
  TicketMessageRequest,
  TicketStatusUpdateRequest,
} from "@/types/ticket"
import { normalizeMessage, normalizeTicket } from "./normalize"

const ADMIN_BASE = "/api/admin/tickets"
const ADMIN_ME_BASE = "/api/admin/me"
const ADMIN_USERS_BASE = "/api/admin/users"

export async function getAdminTickets(params?: QueryParams) {
  const res = await request<APIResponse<{ total?: number; items?: UnknownRecord[] }>>(`${ADMIN_BASE}`, {
    method: "GET",
    params,
  })
  const rawItems = readUpdatedItems(res.updatedData)
  return {
    items: rawItems.map((item) => normalizeTicket(item)),
    total: readUpdatedTotal(res.updatedData),
  }
}

export async function getAdminTicketDetail(ticketId: string) {
  const encodedTicketId = encodePathSegment(ticketId)
  const res = await request<APIResponse<UnknownRecord>>(`${ADMIN_BASE}/${encodedTicketId}`, { method: "GET" })
  const updatedData = asRecord(unwrapUpdatedData(res, translate("tickets.adminDetail.toast.loadFailedTitle"))) ?? {}
  const raw = asRecord(updatedData.ticket) ?? updatedData
  const ticket = normalizeTicket(raw)
  const rawMessagesSource = Array.isArray(raw.messages)
    ? raw.messages
    : Array.isArray(updatedData.messages)
      ? updatedData.messages
      : []
  const rawMessages = rawMessagesSource
    .map((item) => asRecord(item))
    .filter((item): item is UnknownRecord => item !== null)

  const detail: TicketDetail = {
    ...ticket,
    messages: rawMessages.map(normalizeMessage),
    metadata: asRecord(raw.metadata ?? updatedData.metadata) ?? undefined,
  }
  return detail
}

export function addAdminTicketMessage(ticketId: string, data: TicketMessageRequest) {
  return request(`${ADMIN_BASE}/${encodePathSegment(ticketId)}/messages`, { method: "POST", data })
}

export function updateTicketStatus(ticketId: string, data: TicketStatusUpdateRequest) {
  return request(`${ADMIN_BASE}/${encodePathSegment(ticketId)}/status`, { method: "PUT", data })
}

export function assignTicket(ticketId: string, data: TicketAssignRequest) {
  return request(`${ADMIN_BASE}/${encodePathSegment(ticketId)}/assign`, { method: "PUT", data })
}

function normalizeTicketNotificationPreference(raw: UnknownRecord | null): AdminTicketNotificationPreference {
  return {
    ticketEmailNotificationsEnabled: raw
      ? readBoolean(raw, ["ticketEmailNotificationsEnabled", "ticket_email_notifications_enabled"])
      : false,
  }
}

function normalizeAdminTicketNotificationRecipient(raw: UnknownRecord): AdminTicketNotificationRecipient | null {
  const role = readString(raw, ["role"]).trim()
  if (role !== "admin" && role !== "super_admin") {
    return null
  }

  const userId = readString(raw, ["userId", "user_id", "id"]).trim()
  if (!userId) {
    return null
  }

  return {
    userId,
    name: readString(raw, ["name"]).trim(),
    email: readString(raw, ["email"]).trim(),
    role: role as AdminTicketNotificationRecipient["role"],
    banned: readBoolean(raw, ["banned"]),
    ticketEmailNotificationsEnabled: readBoolean(raw, [
      "ticketEmailNotificationsEnabled",
      "ticket_email_notifications_enabled",
    ]),
  }
}

export async function getAdminTicketNotificationPreference(): Promise<AdminTicketNotificationPreference> {
  const res = await request<APIResponse<UnknownRecord>>(`${ADMIN_ME_BASE}/ticket-notifications`, { method: "GET" })
  const updatedData = asRecord(unwrapUpdatedData(res, translate("tickets.adminList.notifications.loadFailedTitle")))
  return normalizeTicketNotificationPreference(updatedData)
}

export async function updateAdminTicketNotificationPreference(enabled: boolean): Promise<AdminTicketNotificationPreference> {
  const res = await request<APIResponse<UnknownRecord>>(`${ADMIN_ME_BASE}/ticket-notifications`, {
    method: "PUT",
    data: {
      ticketEmailNotificationsEnabled: enabled,
    },
  })
  const updatedData = asRecord(unwrapUpdatedData(res, translate("tickets.adminList.notifications.saveFailedTitle")))
  return normalizeTicketNotificationPreference(updatedData)
}

export async function getAdminTicketNotificationRecipients(): Promise<AdminTicketNotificationRecipient[]> {
  const res = await request<APIResponse<UnknownRecord>>(`${ADMIN_USERS_BASE}/ticket-notification-recipients`, {
    method: "GET",
  })
  const updatedData = asRecord(
    unwrapUpdatedData(res, translate("tickets.adminList.notifications.manageLoadFailedTitle"))
  )
  const rawItems = readUpdatedItems(updatedData)
  return rawItems
    .map((item) => asRecord(item))
    .filter((item): item is UnknownRecord => item !== null)
    .map((item) => normalizeAdminTicketNotificationRecipient(item))
    .filter((item): item is AdminTicketNotificationRecipient => item !== null)
}

export async function updateAdminUserTicketNotificationPreference(
  userId: string,
  enabled: boolean
): Promise<AdminTicketNotificationRecipient> {
  const res = await request<APIResponse<UnknownRecord>>(`${userBase(userId)}/ticket-notifications`, {
    method: "PUT",
    data: {
      ticketEmailNotificationsEnabled: enabled,
    },
  })
  const updatedData = asRecord(
    unwrapUpdatedData(res, translate("tickets.adminList.notifications.manageSaveFailedTitle"))
  )
  const normalized = updatedData ? normalizeAdminTicketNotificationRecipient(updatedData) : null
  if (normalized == null) {
    throw new Error(translate("tickets.adminList.notifications.manageSaveFailedFallback"))
  }
  return normalized
}
