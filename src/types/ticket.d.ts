export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'normal' | 'medium' | 'high' | 'urgent'
export type TicketCategory = 'upload' | 'account' | 'bug' | 'feature' | 'other'

export interface Ticket {
    ticketId: string
    subject: string
    category: TicketCategory
    priority: TicketPriority
    status: TicketStatus
    creatorUserId: string
    creatorUserName?: string
    assigneeAdminId?: string
    assigneeAdminName?: string
    createdAt: string
    updatedAt: string
    closedAt?: string
}

export interface TicketMessage {
    id: string
    ticketId: string
    senderId: string
    senderName?: string
    senderRole: 'user' | 'admin'
    message: string
    internal: boolean
    createdAt: string
}

export interface TicketDetail extends Ticket {
    messages: TicketMessage[]
    metadata?: Record<string, unknown>
}

export interface CreateTicketRequest {
    subject: string
    category: TicketCategory
    priority: TicketPriority
    message: string
    metadata?: Record<string, unknown>
}

export interface TicketMessageRequest {
    message: string
    internal?: boolean
}

export interface TicketStatusUpdateRequest {
    status: TicketStatus
}

export interface TicketAssignRequest {
    assigneeAdminId?: string
}
