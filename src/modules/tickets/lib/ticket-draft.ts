/**
 * The text a user sends in a ticket (subject, description, replies), checked
 * the way the backend checks it (tickets/validation.go): trimmed, counted in
 * Unicode code points, 1-200 for a subject and 1-4000 for a message.
 */
export const TICKET_SUBJECT_MAX_LENGTH = 200
export const TICKET_MESSAGE_MAX_LENGTH = 4000

/** Code points, like Go's `utf8.RuneCountInString`: an emoji counts once, not as two UTF-16 units. */
export function countCharacters(text: string): number {
  return Array.from(text).length
}

export type TicketTextIssue = "required" | "tooLong"

/** What is wrong with a field's text, or `null` when the backend would accept it. */
export function checkTicketText(text: string, maxLength: number): TicketTextIssue | null {
  const length = countCharacters(text.trim())
  if (length === 0) return "required"
  return length > maxLength ? "tooLong" : null
}

export type TicketDraftField = "subject" | "message"
export type TicketDraftIssues = Record<TicketDraftField, TicketTextIssue | null>

export function validateTicketDraft(draft: { subject: string; message: string }): TicketDraftIssues {
  return {
    subject: checkTicketText(draft.subject, TICKET_SUBJECT_MAX_LENGTH),
    message: checkTicketText(draft.message, TICKET_MESSAGE_MAX_LENGTH),
  }
}

/** The first field with an issue, in form order. */
export function firstInvalidField(issues: TicketDraftIssues): TicketDraftField | null {
  if (issues.subject) return "subject"
  return issues.message ? "message" : null
}

/**
 * Whether a field shows its "n / max" counter: a subject always does (the
 * limit is short), a long text only once the limit is in sight.
 */
export function showsCharacterCount(length: number, maxLength: number, always = false): boolean {
  return always || length >= maxLength * 0.9
}
