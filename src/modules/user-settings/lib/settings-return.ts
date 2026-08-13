/**
 * Absolute return-to URL for Kratos browser flows that land back on the
 * settings page; `_identity_saved=1` triggers the saved toast + refresh.
 */
export function resolveSettingsReturnTo(section: string): string {
  const path = `/user/settings?section=${encodeURIComponent(section)}&_identity_saved=1`
  if (typeof window === "undefined") {
    return path
  }

  return new URL(path, window.location.origin).toString()
}
