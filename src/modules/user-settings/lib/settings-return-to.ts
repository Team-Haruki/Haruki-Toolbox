import { resolvePublicFrontendOrigin } from "@/modules/auth/lib/return-to"

export function resolveSettingsReturnTo(section: string): string {
  const path = `/user/settings?section=${encodeURIComponent(section)}&_identity_saved=1`
  if (typeof window === "undefined") {
    return path
  }

  const frontendOrigin = resolvePublicFrontendOrigin(window.location.origin) || window.location.origin
  return new URL(path, frontendOrigin).toString()
}
