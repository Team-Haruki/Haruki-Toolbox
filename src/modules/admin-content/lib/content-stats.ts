import type { AdminFriendGroup, AdminFriendLink } from "@/types/admin"

/**
 * Counts for the content page's stat tiles and breakdowns. Both lists come
 * from the backend in one piece (no paging), so every number covers the
 * whole set.
 */

export type ContentOverview = {
  links: number
  /** Links that carry no tag. */
  untaggedLinks: number
  /** Different tags across all links. */
  tags: number
  groups: number
  /** Group chat entries across all groups. */
  items: number
  /** Groups without any entry. */
  emptyGroups: number
}

function linkTags(link: AdminFriendLink): string[] {
  return [...new Set((link.tags ?? []).map((tag) => tag.trim()).filter(Boolean))]
}

export function summarizeContent(links: readonly AdminFriendLink[], groups: readonly AdminFriendGroup[]): ContentOverview {
  const tags = new Set<string>()
  let untaggedLinks = 0
  for (const link of links) {
    const own = linkTags(link)
    if (own.length === 0) untaggedLinks += 1
    for (const tag of own) tags.add(tag)
  }

  let items = 0
  let emptyGroups = 0
  for (const group of groups) {
    const size = group.groupList?.length ?? 0
    items += size
    if (size === 0) emptyGroups += 1
  }

  return { links: links.length, untaggedLinks, tags: tags.size, groups: groups.length, items, emptyGroups }
}

export type ContentCount = {
  key: string
  label: string
  count: number
}

/** How many links use each tag, most used first (ties by name). A link counts once per tag. */
export function countLinkTags(links: readonly AdminFriendLink[]): ContentCount[] {
  const counts = new Map<string, number>()
  for (const link of links) {
    for (const tag of linkTags(link)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ key: tag, label: tag, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

/** Entries per group, in the list's own order (the order visitors see). */
export function countGroupItems(groups: readonly AdminFriendGroup[]): ContentCount[] {
  return groups.map((group) => ({
    key: String(group.id),
    label: group.group,
    count: group.groupList?.length ?? 0,
  }))
}

/** The host of a link for display under its name; the raw text when it is not a URL. */
export function linkHost(url: string): string {
  try {
    return new URL(url).host || url
  } catch {
    return url
  }
}
