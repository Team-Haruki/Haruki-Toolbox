// Endpoints of the Sekai Station API (Mafuyu v2), ported from Sekai Station's
// src/utils/api.ts (MIT © middlered).
//
// The page only reads the room stream, a Server-Sent Events endpoint that the
// feed store opens with a plain EventSource, which sends no credentials. This
// deliberately does not go through `request()` from core/http: that client
// always sends credentials, rewrites relative URLs to the Toolbox API and runs
// the Toolbox session and ban handling, none of which applies to this public,
// third-party API, and it cannot carry Server-Sent Events. Like rank-border's
// event tracker, the base URL comes from env.
import { getStationApiBase } from "@/modules/sekai-station/lib/sekai-station-constants"

export function isStationApiConfigured(base: string = getStationApiBase()): boolean {
  return base !== ""
}

/** URL of the room stream (Server-Sent Events), opened without credentials */
export function stationRealtimeUrl(base: string = getStationApiBase()): string {
  return `${base}/realtime`
}
