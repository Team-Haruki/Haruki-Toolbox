export type TicketStatus = 'open' | 'pending_user' | 'pending_admin' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TicketCategory = 'upload' | 'account' | 'bug' | 'feature' | 'other'
export type TicketSenderRole = 'user' | 'admin' | 'system'

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
    lastMessageSenderRole?: TicketSenderRole
    lastMessagePreview?: string
    lastMessageInternal?: boolean
    lastMessageAt?: string
    createdAt: string
    updatedAt: string
    closedAt?: string
}

export interface TicketMessage {
    id: string
    ticketId: string
    senderId: string
    senderName?: string
    senderRole: TicketSenderRole
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

export interface AdminTicketNotificationPreference {
    ticketEmailNotificationsEnabled: boolean
}
