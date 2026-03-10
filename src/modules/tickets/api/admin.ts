import { readUpdatedItems, readUpdatedTotal, request, unwrapUpdatedData } from "@/core/http/call-api"
import { encodePathSegment } from "@/core/http/url"
import type { QueryParams } from "@/core/http/query"
import { asRecord, type UnknownRecord } from "@/lib/record-utils"
import { translate } from "@/shared/i18n"
import type { APIResponse } from "@/types/response"
import type {
  TicketAssignRequest,
  TicketDetail,
  TicketMessageRequest,
  TicketStatusUpdateRequest,
} from "@/types/ticket"
import { normalizeMessage, normalizeTicket } from "./normalize"

const ADMIN_BASE = "/api/admin/tickets"

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
