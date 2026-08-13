import type { RouteLocationRaw, Router } from "vue-router"

/**
 * Detail pages are reachable both from their list page and from cross-links
 * on other detail pages; going back should return to wherever the user came
 * from, and only fall back to the list when there is no in-app history
 * (deep link, new tab).
 */
export function hasInAppHistory(): boolean {
  return typeof window !== "undefined" && window.history.state?.back != null
}

export function goBackOr(router: Router, fallback: RouteLocationRaw): void {
  if (hasInAppHistory()) {
    router.back()
  } else {
    void router.push(fallback)
  }
}
