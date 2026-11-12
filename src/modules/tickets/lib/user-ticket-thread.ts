/**
 * A user's ticket conversation as the detail page lays it out: the latest
 * messages first in reach (older ones fold away behind a button) and a date
 * line wherever the day changes. Pure, so the view only formats.
 */
import type { TicketMessage } from "@/types/ticket"

/** A thread this long or shorter is shown whole. */
export const THREAD_FOLD_THRESHOLD = 8
/** How many of the latest messages stay on screen when a thread folds. */
export const THREAD_FOLD_TAIL = 6

export type FoldedThread<T> = {
  /** Older messages kept off screen until the user asks for them. */
  hidden: number
  visible: T[]
}

/**
 * Keeps the last messages of a long thread and counts the rest. Folding only
 * starts past the threshold, so it never hides just one or two messages.
 */
export function foldThread<T>(
  messages: readonly T[],
  expanded: boolean,
  tail = THREAD_FOLD_TAIL,
  threshold = THREAD_FOLD_THRESHOLD,
): FoldedThread<T> {
  if (expanded || messages.length <= Math.max(threshold, tail)) {
    return { hidden: 0, visible: [...messages] }
  }
  return { hidden: messages.length - tail, visible: messages.slice(messages.length - tail) }
}

export type ThreadEntry =
  /** The first message of a (local) day follows this line; `at` is that message's timestamp. */
  | { kind: "day"; key: string; at: string }
  | { kind: "message"; key: string; message: TicketMessage }

function localDayKey(value: string): string | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

/**
 * The messages in order with a day line before the first message of each
 * local day. A message without a readable timestamp stays under the day
 * before it.
 */
export function buildThreadEntries(messages: readonly TicketMessage[]): ThreadEntry[] {
  const entries: ThreadEntry[] = []
  let currentDay: string | null = null
  messages.forEach((message, index) => {
    const day = localDayKey(message.createdAt)
    if (day && day !== currentDay) {
      currentDay = day
      entries.push({ kind: "day", key: `day-${day}-${index}`, at: message.createdAt })
    }
    entries.push({ kind: "message", key: `message-${message.id || index}`, message })
  })
  return entries
}

/**
 * Whether a message is the viewing user's own. The user-facing detail API
 * sends no sender id, so on a user's own ticket a "user" message is theirs.
 */
export function isOwnMessage(message: Pick<TicketMessage, "senderRole" | "senderId">, userId: string | null): boolean {
  if (message.senderRole === "system") return false
  if (message.senderId) return message.senderId === userId
  return message.senderRole === "user"
}
