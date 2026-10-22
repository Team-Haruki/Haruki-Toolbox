import type { TicketMessage } from "@/types/ticket"
import { translate } from "@/shared/i18n"
import { isTicketStatus } from "@/modules/tickets/lib/meta"
import { ticketStatusLabel } from "@/modules/tickets/lib/display"

export type MessageSegment =
  | { type: "text"; value: string }
  | { type: "link"; value: string; href: string }

// Only absolute http(s) URLs become links: anything else stays text, so a
// message can never smuggle a javascript: or data: href into the thread.
// Full-width CJK punctuation ends a URL too: "见 https://a.b/c。" is a sentence.
const URL_PATTERN = /https?:\/\/[^\s<>"'`，。！？；：、（）「」『』【】《》]+/gi
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"»”’]+$/

/**
 * Splits a message into text and link segments. Trailing punctuation that is
 * far more likely to end the sentence than the URL ("see https://a.b/c.")
 * stays in the text segment.
 */
export function splitMessageLinks(text: string): MessageSegment[] {
  const segments: MessageSegment[] = []
  let cursor = 0
  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0
    let url = match[0]
    const trailing = TRAILING_PUNCTUATION.exec(url)
    if (trailing) {
      // Keep a closing bracket that balances an opening one inside the URL.
      const stripped = url.slice(0, trailing.index)
      const opens = (stripped.match(/\(/g) ?? []).length
      const closes = (stripped.match(/\)/g) ?? []).length
      url = trailing[0].startsWith(")") && opens > closes ? `${stripped})` : stripped
    }
    if (!url) continue
    if (start > cursor) {
      segments.push({ type: "text", value: text.slice(cursor, start) })
    }
    segments.push({ type: "link", value: url, href: url })
    cursor = start + url.length
  }
  if (cursor < text.length) {
    segments.push({ type: "text", value: text.slice(cursor) })
  }
  return segments
}

const STATUS_CHANGED_PATTERN = /^status changed to\s+([a-z_]+)\.?$/i

/**
 * Localizes the backend's system messages ("Status changed to pending_admin")
 * into the ticket vocabulary; anything unrecognised is shown verbatim.
 */
export function describeSystemMessage(message: string): string {
  const trimmed = message.trim()
  const statusMatch = STATUS_CHANGED_PATTERN.exec(trimmed)
  if (statusMatch) {
    const status = statusMatch[1].toLowerCase()
    const label = isTicketStatus(status) ? ticketStatusLabel(status) : status
    return translate("tickets.systemMessage.statusChanged", { status: label })
  }
  return trimmed
}

/** Messages a ticket's creator may see: internal admin notes never render for users. */
export function visibleUserMessages(messages: readonly TicketMessage[]): TicketMessage[] {
  return messages.filter((message) => !message.internal)
}
