import type { AfdianBinding } from "@/modules/user-settings/api/sponsor"

/**
 * Why the frames page is read-only for this person, or `null` when they can
 * save: `blocked` (an administrator disabled sponsor access), `orderOnly`
 * (not verified yet and Afdian sign-in is not configured, so the order number
 * is the only way in) or `unverified` (not verified yet; either method works).
 */
export type SponsorFramesLockReason = "blocked" | "orderOnly" | "unverified"

export function resolveSponsorFramesLockReason(status: Pick<AfdianBinding, "eligible" | "accessOverride" | "oauthEnabled">): SponsorFramesLockReason | null {
  if (status.eligible) {
    return null
  }
  if (status.accessOverride === "blocked") {
    return "blocked"
  }
  return status.oauthEnabled ? "unverified" : "orderOnly"
}
