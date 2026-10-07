export function encodePathSegment(value: string | number): string {
    return encodeURIComponent(String(value))
}

/**
 * The base URL of one request: an explicit per-request `baseURL` wins (the
 * OAuth2 device endpoints always use the direct API host), otherwise the
 * endpoint the person selected in the settings.
 */
export function resolveRequestBaseURL(override: string | undefined, selected: string): string {
    const explicit = override?.trim() ?? ""
    return explicit !== "" ? explicit : selected
}
