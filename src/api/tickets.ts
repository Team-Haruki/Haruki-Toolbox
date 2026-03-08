import { request } from "@/api/call-api"
import type {
    Ticket,
    TicketDetail,
    TicketMessage,
    CreateTicketRequest,
    TicketMessageRequest,
    TicketStatusUpdateRequest,
    TicketAssignRequest,
} from "@/types/ticket"
import type { PaginatedResponse } from "@/types/admin"
import type { APIResponse } from "@/types/response"

// ===== 用户侧 =====

const userBase = (userId: string) => `/api/user/${userId}/tickets`

export async function getUserTickets(userId: string, params?: Record<string, string | number>) {
    const res = await request<APIResponse<PaginatedResponse<Ticket>>>(`${userBase(userId)}/`, {
        method: "GET",
        params,
    })
    return res.updatedData!
}

export function createTicket(userId: string, data: CreateTicketRequest) {
    return request(`${userBase(userId)}/`, { method: "POST", data })
}

export async function getUserTicketDetail(userId: string, ticketId: string): Promise<TicketDetail> {
    const res = await request<APIResponse<Record<string, unknown>>>(`${userBase(userId)}/${ticketId}`, { method: "GET" })
    const raw = (res.updatedData?.ticket ?? res.updatedData ?? {}) as Record<string, unknown>
    const ticket = normalizeTicket(raw)

    const rawMessages = (res.updatedData?.messages ?? []) as Array<Record<string, unknown>>
    return {
        ...ticket,
        messages: rawMessages.map(normalizeMessage),
        metadata: (raw.metadata as Record<string, unknown>) ?? {},
    }
}

export function addUserTicketMessage(userId: string, ticketId: string, data: TicketMessageRequest) {
    return request(`${userBase(userId)}/${ticketId}/messages`, { method: "POST", data })
}

export function closeTicket(userId: string, ticketId: string) {
    return request(`${userBase(userId)}/${ticketId}/close`, { method: "POST" })
}

// ===== 管理员侧 =====

const ADMIN_BASE = "/api/admin/tickets"

function normalizeTicket(raw: Record<string, unknown>): Ticket {
    // Try many possible field names for creator ID
    const creatorId = (raw.creatorUserId ?? raw.creator_user_id ?? raw.userId ?? raw.user_id ?? raw.submittedBy ?? raw.submitted_by ?? '') as string
    const creatorName = (raw.creatorUserName ?? raw.creator_user_name ?? raw.userName ?? raw.user_name ?? raw.submitterName ?? raw.submitter_name) as string | undefined
    // Try to get assignee name similarly
    const assigneeId = (raw.assigneeAdminId ?? raw.assignee_admin_id ?? raw.assigneeId ?? raw.assignee_id) as string | undefined
    const assigneeName = (raw.assigneeAdminName ?? raw.assignee_admin_name ?? raw.assigneeName ?? raw.assignee_name) as string | undefined

    return {
        ticketId: (raw.ticketId ?? raw.ticket_id ?? '') as string,
        subject: (raw.subject ?? '') as string,
        category: (raw.category ?? 'other') as Ticket['category'],
        priority: (raw.priority ?? 'medium') as Ticket['priority'],
        status: (raw.status ?? 'open') as Ticket['status'],
        creatorUserId: creatorId,
        creatorUserName: creatorName,
        assigneeAdminId: assigneeId,
        assigneeAdminName: assigneeName,
        createdAt: (raw.createdAt ?? raw.created_at ?? '') as string,
        updatedAt: (raw.updatedAt ?? raw.updated_at ?? '') as string,
        closedAt: (raw.closedAt ?? raw.closed_at) as string | undefined,
    }
}

function normalizeMessage(raw: Record<string, unknown>): TicketMessage {
    return {
        id: (raw.id ?? raw.ID ?? '') as string,
        ticketId: (raw.ticketId ?? raw.ticket_id ?? '') as string,
        senderId: (raw.senderId ?? raw.sender_id ?? raw.senderUserId ?? raw.sender_user_id ?? '') as string,
        senderName: (raw.senderName ?? raw.sender_name ?? raw.senderUserName ?? raw.sender_user_name) as string | undefined,
        senderRole: (raw.senderRole ?? raw.sender_role ?? 'user') as 'user' | 'admin',
        message: (raw.message ?? '') as string,
        internal: !!(raw.internal),
        createdAt: (raw.createdAt ?? raw.created_at ?? '') as string,
    }
}

export async function getAdminTickets(params?: Record<string, string | number>) {
    const res = await request<APIResponse<{ total?: number; items?: Array<Record<string, unknown>> }>>(`${ADMIN_BASE}`, {
        method: "GET",
        params,
    })
    const data = res.updatedData
    const rawItems = data?.items ?? (Array.isArray(data) ? data : [])
    return {
        items: rawItems.map(normalizeTicket),
        total: data?.total ?? 0,
    }
}

export async function getAdminTicketDetail(ticketId: string) {
    const res = await request<APIResponse<Record<string, unknown>>>(`${ADMIN_BASE}/${ticketId}`, { method: "GET" })
    const raw = (res.updatedData?.ticket ?? res.updatedData ?? {}) as Record<string, unknown>
    const ticket = normalizeTicket(raw)
    const rawMessages = (raw.messages ?? (res.updatedData as any)?.messages ?? []) as Array<Record<string, unknown>>
    return {
        ...ticket,
        messages: rawMessages.map(normalizeMessage),
        metadata: (raw.metadata ?? (res.updatedData as any)?.metadata) as Record<string, unknown> | undefined,
    } as TicketDetail
}

export function addAdminTicketMessage(ticketId: string, data: TicketMessageRequest) {
    return request(`${ADMIN_BASE}/${ticketId}/messages`, { method: "POST", data })
}

export function updateTicketStatus(ticketId: string, data: TicketStatusUpdateRequest) {
    return request(`${ADMIN_BASE}/${ticketId}/status`, { method: "PUT", data })
}

export function assignTicket(ticketId: string, data: TicketAssignRequest) {
    return request(`${ADMIN_BASE}/${ticketId}/assign`, { method: "PUT", data })
}
