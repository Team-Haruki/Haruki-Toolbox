import type { NavItem, NavSection } from "@/config/navigation"

/**
 * Whether `url` covers `path`: exact match, or `path` is nested under `url`
 * at a segment boundary (`/cards` covers `/cards/123`, not `/cardsx`).
 */
export function navUrlCoversPath(url: string, path: string): boolean {
  if (url === path) return true
  if (url === "/") return false
  return path.startsWith(url.endsWith("/") ? url : `${url}/`)
}

/**
 * The nav link that best represents `path`: the longest configured url that
 * covers it. A leaf link (e.g. `/cards`) and a sub page (`/cards/box`) can
 * share a prefix, so the longest match wins and only one link is active.
 */
export function resolveActiveNavUrl(path: string, urls: readonly string[]): string | null {
  let best: string | null = null
  for (const url of urls) {
    if (!navUrlCoversPath(url, path)) continue
    if (best === null || url.length > best.length) {
      best = url
    }
  }
  return best
}

export function collectNavUrls(sections: readonly NavSection[], extra: readonly string[] = []): string[] {
  const urls = new Set<string>(extra)
  for (const section of sections) {
    for (const item of section.items) {
      if (item.url) urls.add(item.url)
      for (const subItem of item.items ?? []) {
        urls.add(subItem.url)
      }
    }
  }
  return [...urls]
}

export function navGroupContainsUrl(item: NavItem, url: string | null): boolean {
  if (!url) return false
  return (item.items ?? []).some((subItem) => subItem.url === url)
}
