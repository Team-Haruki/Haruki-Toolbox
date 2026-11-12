import type { AxiosRequestConfig } from "axios"
import { request, unwrapUpdatedData } from "@/core/http/call-api"
import { buildUserApiPath } from "@/core/http/path"
import type { QueryParams } from "@/core/http/query"
import { asRecord, readOptionalString, type UnknownRecord } from "@/lib/record-utils"
import { translate, translateIfExists } from "@/shared/i18n"
import type { PaginatedResponse } from "@/types/admin"
import type { APIResponse } from "@/types/response"
import type {
  CreateTicketRequest,
  Ticket,
  TicketDetail,
  TicketMessageRequest,
} from "@/types/ticket"
import { normalizeMessage, normalizeTicket } from "./normalize"

/**
 * The failure title for `unwrapUpdatedData`, resolved only when it is needed.
 * The sidebar badge calls `getUserTickets` on every signed-in page, before the
 * tickets bundle has loaded; the core "request failed" text stands in then.
 */
function lazyTicketContext(key: string): () => string {
  return () => translateIfExists(key) ?? translate("common.apiResponse")
}

export async function getUserTickets(userId: string, params?: QueryParams, options?: AxiosRequestConfig) {
  const res = await request<APIResponse<PaginatedResponse<Ticket>>>(buildUserApiPath(userId, "tickets"), {
    method: "GET",
    params,
    ...options,
  })
  return unwrapUpdatedData(res, lazyTicketContext("tickets.list.toast.loadFailedTitle"))
}

/** Creates a ticket and returns its public id (`TK-…`), or `null` if the response did not carry one. */
export async function createTicket(userId: string, data: CreateTicketRequest): Promise<string | null> {
  const res = await request<APIResponse<UnknownRecord>>(buildUserApiPath(userId, "tickets"), { method: "POST", data })
  const created = asRecord(res?.updatedData)
  return (created && readOptionalString(created, ["ticketId", "ticket_id"])) || null
}

export async function getUserTicketDetail(userId: string, ticketId: string): Promise<TicketDetail> {
  const res = await request<APIResponse<UnknownRecord>>(buildUserApiPath(userId, "tickets", ticketId), { method: "GET" })
  const updatedData = asRecord(unwrapUpdatedData(res, lazyTicketContext("tickets.detail.toast.loadFailedTitle"))) ?? {}
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
