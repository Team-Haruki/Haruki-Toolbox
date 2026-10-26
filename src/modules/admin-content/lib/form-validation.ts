import { normalizeExternalHttpUrl } from "@/lib/external-url"

/**
 * Field checks for the content dialogs. Each returns the per-field error
 * codes (i18n keys under `adminContent.validation`) in field order, so the
 * first entry is the field to focus; required-field errors come before the
 * semantic URL check on the same field.
 */

export type ContentValidationCode = "nameRequired" | "urlRequired" | "invalidUrl" | "groupNameRequired"

export type LinkFormField = "name" | "url"
export type ItemFormField = "name" | "url"
export type GroupFormField = "name"

export type LinkFormErrors = Partial<Record<LinkFormField, ContentValidationCode>>
export type ItemFormErrors = Partial<Record<ItemFormField, ContentValidationCode>>
export type GroupFormErrors = Partial<Record<GroupFormField, ContentValidationCode>>

export const CONTENT_FIELD_IDS = {
  link: { name: "content-link-name", url: "content-link-url" },
  item: { name: "content-item-name", url: "content-item-url" },
  group: { name: "content-group-name" },
} as const

type LinkValidation =
  | { errors: LinkFormErrors; normalizedUrl?: undefined }
  | { errors?: undefined; normalizedUrl: string }

/** A friend link needs a name and a valid http(s) URL. */
export function validateLinkForm(form: { name: string; url: string }): LinkValidation {
  const errors: LinkFormErrors = {}
  if (!form.name.trim()) errors.name = "nameRequired"
  const url = form.url.trim()
  let normalizedUrl: string | null = null
  if (!url) {
    errors.url = "urlRequired"
  } else {
    normalizedUrl = normalizeExternalHttpUrl(url)
    if (!normalizedUrl) errors.url = "invalidUrl"
  }
  if (Object.keys(errors).length > 0 || normalizedUrl === null) return { errors }
  return { normalizedUrl }
}

type ItemValidation =
  | { errors: ItemFormErrors; normalizedUrl?: undefined }
  | { errors?: undefined; normalizedUrl: string | undefined }

/** A group item needs a name; its URL is optional but must be http(s) when given. */
export function validateItemForm(form: { name: string; url: string }): ItemValidation {
  const errors: ItemFormErrors = {}
  if (!form.name.trim()) errors.name = "nameRequired"
  const url = form.url.trim()
  let normalizedUrl: string | undefined
  if (url) {
    const normalized = normalizeExternalHttpUrl(url)
    if (!normalized) {
      errors.url = "invalidUrl"
    } else {
      normalizedUrl = normalized
    }
  }
  if (Object.keys(errors).length > 0) return { errors }
  return { normalizedUrl }
}

export function validateGroupForm(form: { name: string }): GroupFormErrors {
  return form.name.trim() ? {} : { name: "groupNameRequired" }
}

/** The first field with an error, in the form's field order. */
export function firstInvalidField<TField extends string>(
  errors: Partial<Record<TField, unknown>>,
  order: readonly TField[]
): TField | null {
  return order.find((field) => errors[field] !== undefined) ?? null
}
