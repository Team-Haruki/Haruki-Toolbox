import { reactive } from "vue"
import type { SekaiRegion } from "@/types"
import type { DeckRecommendUserDataMode } from "../api/recommend-data"

/**
 * Accounts whose uploaded data the backend reported missing this session,
 * keyed by server/uid/mode. Every user-data fetch feeds it (a 404 adds, a
 * success removes), so the deck pages can disable "开始推荐" with a hint
 * instead of letting the user run into the same 404 again.
 *
 * The flag is only as fresh as the last fetch: an upload in this tab clears
 * it (`markDeckRecommendUserDataAvailable` / `resetDeckRecommendUserDataAvailability`
 * from the upload flows), and the deck page re-probes a flagged account when
 * it mounts or the selection changes, so uploads from elsewhere self-heal.
 */
const knownMissing = reactive(new Set<string>())

function availabilityKey(server: SekaiRegion, uid: string | number, mode: DeckRecommendUserDataMode): string {
  return `${server}:${uid}:${mode}`
}

export function markDeckRecommendUserDataMissing(server: SekaiRegion, uid: string | number, mode: DeckRecommendUserDataMode): void {
  knownMissing.add(availabilityKey(server, uid, mode))
}

export function markDeckRecommendUserDataAvailable(server: SekaiRegion, uid: string | number, mode: DeckRecommendUserDataMode): void {
  knownMissing.delete(availabilityKey(server, uid, mode))
}

/** True when the last fetch for this account/mode came back "no data uploaded". Reactive. */
export function isDeckRecommendUserDataKnownMissing(
  server: SekaiRegion | null | undefined,
  uid: string | number | null | undefined,
  mode: DeckRecommendUserDataMode,
): boolean {
  if (!server || uid == null || uid === "") {
    return false
  }
  return knownMissing.has(availabilityKey(server, uid, mode))
}

/**
 * Drops the flags for one account (both modes), every account on a server
 * (an inherit upload resolves its uid server-side), or everything.
 */
export function resetDeckRecommendUserDataAvailability(server?: SekaiRegion, uid?: string | number): void {
  if (!server) {
    knownMissing.clear()
    return
  }
  const prefix = uid == null || uid === "" ? `${server}:` : `${server}:${uid}:`
  for (const key of [...knownMissing]) {
    if (key.startsWith(prefix)) {
      knownMissing.delete(key)
    }
  }
}
