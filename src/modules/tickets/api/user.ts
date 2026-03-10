import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { buildUserApiPath } from "@/core/http/path"
import type { QueryParams } from "@/core/http/query"
import { asRecord, type UnknownRecord } from "@/lib/record-utils"
import { translate } from "@/shared/i18n"
import type { PaginatedResponse } from "@/types/admin"
import type { APIResponse } from "@/types/response"
import type {
  CreateTicketRequest,
  Ticket,
  TicketDetail,
  TicketMessageRequest,
} from "@/types/ticket"
import { normalizeMessage, normalizeTicket } from "./normalize"

export async function getUserTickets(userId: string, params?: QueryParams) {
  const res = await request<APIResponse<PaginatedResponse<Ticket>>>(`${buildUserApiPath(userId, "tickets")}/`, {
    method: "GET",
    params,
  })
  return unwrapUpdatedData(res, translate("tickets.list.toast.loadFailedTitle"))
}

export function createTicket(userId: string, data: CreateTicketRequest) {
  return request(`${buildUserApiPath(userId, "tickets")}/`, { method: "POST", data })
}

export async function getUserTicketDetail(userId: string, ticketId: string): Promise<TicketDetail> {
  const res = await request<APIResponse<UnknownRecord>>(buildUserApiPath(userId, "tickets", ticketId), { method: "GET" })
  const updatedData = asRecord(unwrapUpdatedData(res, translate("tickets.detail.toast.loadFailedTitle"))) ?? {}
  const raw = asRecord(updatedData.ticket) ?? updatedData
  const ticket = normalizeTicket(raw)

  const rawMessages = Array.isArray(updatedData.messages)
    ? updatedData.messages.map((item) => asRecord(item)).filter((item): item is UnknownRecord => item !== null)
    : []

  return {
    ...ticket,
    messages: rawMessages.map(normalizeMessage),
    metadata: asRecord(raw.metadata) ?? {},
  }
}

export function addUserTicketMessage(userId: string, ticketId: string, data: TicketMessageRequest) {
  return request(buildUserApiPath(userId, "tickets", ticketId, "messages"), { method: "POST", data })
}

export function closeTicket(userId: string, ticketId: string) {
  return request(buildUserApiPath(userId, "tickets", ticketId, "close"), { method: "POST" })
}
