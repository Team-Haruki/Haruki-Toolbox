import {
    LucideCheckCircle2,
    LucideChevronDown,
    LucideChevronUp,
    LucideCircleDot,
    LucideClock,
    LucideFlame,
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

export function ticketUserStatusHint(status: TicketStatus): string {
    switch (status) {
        case "open":
        case "pending_admin":
            return translate("tickets.userStatusHint.waitingAdmin")
        case "pending_user":
            return translate("tickets.userStatusHint.waitingUser")
        case "resolved":
            return translate("tickets.userStatusHint.resolved")
        case "closed":
            return translate("tickets.userStatusHint.closed")
    }
}

export function ticketStatusTextClass(status: TicketStatus): string {
    switch (status) {
        case "open":
            return "text-blue-500"
        case "pending_admin":
            return "text-orange-500"
        case "pending_user":
            return "text-purple-500"
        case "resolved":
            return "text-green-500"
        case "closed":
            return "text-gray-500"
    }
}

export function ticketStatusBadgeClass(status: TicketStatus): string {
    switch (status) {
        case "open":
            return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        case "pending_admin":
            return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
        case "pending_user":
            return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
        case "resolved":
            return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        case "closed":
            return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
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
            return String(priority)
    }
}

export function ticketPriorityTextClass(priority: TicketPriorityLike): string {
    switch (priority) {
        case "urgent":
            return "text-red-500"
        case "high":
            return "text-orange-500"
        case "normal":
            return "text-blue-500"
        case "low":
            return "text-gray-500"
        default:
            return "text-muted-foreground"
    }
}

export function ticketPriorityBadgeClass(priority: TicketPriorityLike): string {
    switch (priority) {
        case "urgent":
            return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        case "high":
            return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
        case "normal":
            return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        case "low":
            return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
        default:
            return "bg-gray-100 text-gray-700"
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
