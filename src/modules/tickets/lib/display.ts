import {
    LucideCheckCircle2,
    LucideChevronDown,
    LucideChevronUp,
    LucideCircleDot,
    LucideClock,
    LucideFlame,
    LucideMessageSquareReply,
    LucideMinus,
    LucideXCircle,
} from "lucide-vue-next"
import type { TicketPriority, TicketStatus } from "@/types/ticket"
import { translate } from "@/shared/i18n"

type TicketPriorityLike = TicketPriority | string

export function ticketStatusLabel(status: TicketStatus): string {
    switch (status) {
        case "open":
            return translate("tickets.status.open")
        case "pending_admin":
            return translate("tickets.status.pendingAdmin")
        case "pending_user":
            return translate("tickets.status.pendingUser")
        case "resolved":
            return translate("tickets.status.resolved")
        case "closed":
            return translate("tickets.status.closed")
    }
}

export function ticketStatusIcon(status: TicketStatus) {
    switch (status) {
        case "open":
            return LucideCircleDot
        case "pending_admin":
            return LucideClock
        case "pending_user":
            return LucideClock
        case "resolved":
            return LucideCheckCircle2
        case "closed":
            return LucideXCircle
    }
}

/**
 * The status icon on the creator's own pages: the same as the admin's,
 * except that "waiting for the user" is a reply to write, not a clock.
 */
export function userTicketStatusIcon(status: TicketStatus) {
    return status === "pending_user" ? LucideMessageSquareReply : ticketStatusIcon(status)
}

export function ticketPriorityLabel(priority: TicketPriorityLike): string {
    switch (priority) {
        case "urgent":
            return translate("tickets.priority.urgent")
        case "high":
            return translate("tickets.priority.high")
        case "normal":
            return translate("tickets.priority.normal")
        case "low":
            return translate("tickets.priority.low")
        default:
            // Never show a raw enum value from the backend.
            return translate("tickets.common.unknownValue")
    }
}

export function ticketPriorityIcon(priority: TicketPriorityLike) {
    switch (priority) {
        case "urgent":
            return LucideFlame
        case "high":
            return LucideChevronUp
        case "normal":
            return LucideMinus
        case "low":
            return LucideChevronDown
        default:
            return null
    }
}
