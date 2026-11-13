// What the page says about the room stream, and the countdowns shown next to
// it. Pure, so the wording can be tested without a store or a clock.

export type StationConnectionStatus = "open" | "lost" | "connecting" | "idle"

/**
 * One status for the header. A failed attempt wins over "connecting", so the
 * label does not flip on every retry; "idle" (closed without a failure) only
 * lasts for a moment before the page connects.
 */
export function resolveConnectionStatus(
  connectionState: "connecting" | "open" | "closed",
  connectFailed: boolean,
): StationConnectionStatus {
  if (connectionState === "open") {
    return "open"
  }
  if (connectFailed) {
    return "lost"
  }
  return connectionState === "connecting" ? "connecting" : "idle"
}

/** Whole seconds until the next reconnect attempt; never below 1 while one is waiting */
export function retrySecondsLeft(retryAtMs: number, nowMs: number): number {
  return Math.max(1, Math.ceil((retryAtMs - nowMs) / 1000))
}

/**
 * Whole minutes until a temporary block ends, between 1 and the block's full
 * length: the shared clock can be a second old, which would round a fresh
 * 10-minute block up to 11.
 */
export function blockMinutesLeft(untilMs: number, nowMs: number, blockDurationMs: number): number {
  const full = Math.ceil(blockDurationMs / 60_000)
  return Math.min(full, Math.max(1, Math.ceil((untilMs - nowMs) / 60_000)))
}
