import type { SearchPageSource } from "./search-index"

/** The part of a route record the page index reads. */
export type SearchRouteRecord = {
  path: string
  redirect?: unknown
  meta?: {
    titleKey?: unknown
    guestOnly?: unknown
    requiresAdmin?: unknown
    requiresSuperAdmin?: unknown
  }
}

export type SearchPageContext = {
  isAdmin: boolean
  isSuperAdmin: boolean
  /** Translates a route's `meta.titleKey`. */
  translate: (key: string) => string
  /** The sidebar section a path sits under, when it is in the sidebar. */
  sectionOf?: (path: string) => string | null
}

/**
 * Pages that are a step in a flow rather than somewhere to go: sign-in and
 * recovery, OAuth consent and device approval, callbacks, error pages, and
 * shells that only redirect.
 */
const EXCLUDED_PATHS = [
  /^\/oauth2\//,
  /^\/device(\/|$)/,
  /^\/logout$/,
  /^\/user\/(error|recovery|verification|afdian)(\/|$)/,
  /^\/admin$/,
  /^\/rank-border\/detail$/,
]

/**
 * Every page a viewer can open by name, from the router's own records: one
 * with a title, no parameter in its path, and not a redirect. Admin pages are
 * listed for admins only. A page added to the router is searchable without
 * touching this file.
 */
export function buildSearchPageSources(
  routes: readonly SearchRouteRecord[],
  context: SearchPageContext,
): SearchPageSource[] {
  const pages: SearchPageSource[] = []
  const seen = new Set<string>()
  for (const route of routes) {
    const meta = route.meta ?? {}
    const titleKey = typeof meta.titleKey === "string" ? meta.titleKey : ""
    if (
      !titleKey
      || route.redirect !== undefined
      || /[:*]/.test(route.path)
      || meta.guestOnly === true
      || seen.has(route.path)
      || EXCLUDED_PATHS.some((pattern) => pattern.test(route.path))
      || (meta.requiresSuperAdmin === true && !context.isSuperAdmin)
      || (meta.requiresAdmin === true && !context.isAdmin)
      || (route.path.startsWith("/admin/") && !context.isAdmin)
    ) {
      continue
    }
    const title = context.translate(titleKey)
    if (!title || title === titleKey) {
      continue
    }
    seen.add(route.path)
    pages.push({ path: route.path, title, section: context.sectionOf?.(route.path) ?? null })
  }
  return pages
}
