import {
  type UnknownRecord,
  readBoolean,
  readOptionalString,
  readString,
} from "@/lib/record-utils"
import {
  isTicketCategory,
  isTicketPriority,
  isTicketSenderRole,
  isTicketStatus,
} from "@/modules/tickets/lib/meta"
import type { Ticket, TicketMessage } from "@/types/ticket"

function normalizeTicketCategory(value: unknown): Ticket["category"] {
  return isTicketCategory(value) ? value : "other"
}

function normalizeTicketPriority(value: unknown): Ticket["priority"] {
  return isTicketPriority(value) ? value : "medium"
}

function normalizeTicketStatus(value: unknown): Ticket["status"] {
  return isTicketStatus(value) ? value : "open"
}

function normalizeSenderRole(value: unknown): TicketMessage["senderRole"] {
  return isTicketSenderRole(value) ? value : "user"
}

export function normalizeTicket(raw: UnknownRecord): Ticket {
  const creatorId = readString(raw, ["creatorUserId", "creator_user_id", "userId", "user_id", "submittedBy", "submitted_by"])
  const creatorName = readOptionalString(raw, ["creatorUserName", "creator_user_name", "userName", "user_name", "submitterName", "submitter_name"])
  const assigneeId = readOptionalString(raw, ["assigneeAdminId", "assignee_admin_id", "assigneeId", "assignee_id"])
  const assigneeName = readOptionalString(raw, ["assigneeAdminName", "assignee_admin_name", "assigneeName", "assignee_name"])

  return {
    ticketId: readString(raw, ["ticketId", "ticket_id"]),
    subject: readString(raw, ["subject"]),
    category: normalizeTicketCategory(raw.category),
    priority: normalizeTicketPriority(raw.priority),
    status: normalizeTicketStatus(raw.status),
    creatorUserId: creatorId,
    creatorUserName: creatorName,
    assigneeAdminId: assigneeId,
    assigneeAdminName: assigneeName,
    createdAt: readString(raw, ["createdAt", "created_at"]),
    updatedAt: readString(raw, ["updatedAt", "updated_at"]),
    closedAt: readOptionalString(raw, ["closedAt", "closed_at"]),
  }
}

export function normalizeMessage(raw: UnknownRecord): TicketMessage {
  return {
    id: readString(raw, ["id", "ID"]),
    ticketId: readString(raw, ["ticketId", "ticket_id"]),
    senderId: readString(raw, ["senderId", "sender_id", "senderUserId", "sender_user_id"]),
    senderName: readOptionalString(raw, ["senderName", "sender_name", "senderUserName", "sender_user_name"]),
    senderRole: normalizeSenderRole(raw.senderRole ?? raw.sender_role),
    message: readString(raw, ["message"]),
    internal: readBoolean(raw, ["internal"]),
    createdAt: readString(raw, ["createdAt", "created_at"]),
  }
}
