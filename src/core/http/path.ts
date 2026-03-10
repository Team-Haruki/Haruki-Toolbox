import { encodePathSegment } from "@/core/http/url"

export function buildEncodedPath(...segments: Array<string | number>): string {
    return segments.map((segment) => encodePathSegment(segment)).join("/")
}

export function userApiBase(userId: string | number): string {
    return `/api/user/${encodePathSegment(userId)}`
}

export function buildUserApiPath(
    userId: string | number,
    ...segments: Array<string | number>
): string {
    const base = userApiBase(userId)
    const suffix = buildEncodedPath(...segments)
    return suffix === "" ? base : `${base}/${suffix}`
}
