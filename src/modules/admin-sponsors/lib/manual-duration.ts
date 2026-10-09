import type {
  AdminManualDuration,
  AdminManualDurationPayload,
  AdminManualDurationUnit,
  AdminSponsorCategory,
} from "@/types/admin"

const DATE_TIME_LOCAL_LENGTH = 16
// Same bounds as the backend.
const MAX_AMOUNT: Record<AdminManualDurationUnit, number> = { day: 36600, month: 1200 }
const NOTE_MAX_BYTES = 500

export type ManualDurationForm = {
  // A number input may hand back a number instead of the typed text.
  amount: string | number
  unit: AdminManualDurationUnit
  startsAt: string
  note: string
}

export type ManualDurationFormError = "amount" | "note"

export function toDateTimeLocalValue(value: string) {
  if (!value) {
    return ""
  }

  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) {
    return value.slice(0, DATE_TIME_LOCAL_LENGTH)
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.valueOf() - timezoneOffsetMs).toISOString().slice(0, DATE_TIME_LOCAL_LENGTH)
}

export function fromDateTimeLocalValue(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }

  const date = new Date(trimmed)
  return Number.isNaN(date.valueOf()) ? trimmed : date.toISOString()
}

export function emptyManualDurationForm(): ManualDurationForm {
  return { amount: "", unit: "month", startsAt: "", note: "" }
}

export function manualDurationFormFromEntry(entry: AdminManualDuration): ManualDurationForm {
  return {
    amount: String(entry.amount),
    unit: entry.unit,
    startsAt: toDateTimeLocalValue(entry.startsAt),
    note: entry.note,
  }
}

/**
 * Validates the form and builds the request body. An empty start time is left
 * out, so the backend uses the time of saving.
 */
export function manualDurationPayload(form: ManualDurationForm):
  | { ok: true, payload: AdminManualDurationPayload }
  | { ok: false, error: ManualDurationFormError } {
  const amount = Number(String(form.amount).trim())
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_AMOUNT[form.unit]) {
    return { ok: false, error: "amount" }
  }
  const note = form.note.trim()
  if (!note || new TextEncoder().encode(note).length > NOTE_MAX_BYTES) {
    return { ok: false, error: "note" }
  }
  const payload: AdminManualDurationPayload = { amount, unit: form.unit, note }
  const startsAt = fromDateTimeLocalValue(form.startsAt)
  if (startsAt) {
    payload.startsAt = startsAt
  }
  return { ok: true, payload }
}

/** Badge variant per category; the label comes from i18n. */
export function categoryBadgeVariant(category: AdminSponsorCategory) {
  return category === "current" ? "emerald" as const : "muted" as const
}
