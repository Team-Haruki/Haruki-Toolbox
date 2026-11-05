import type { SekaiRegion } from "@/types"
import type { RankBorderMode } from "./rank-border"
import type { RowExpansionKey } from "./row-expansion"

/**
 * The expanded leaderboard row survives a round trip to the detail page: the
 * view writes its scope + row key here before navigating, and restores the
 * row only if it comes back to the very same scope (region, event, mode,
 * chapter) — a different event must not reopen a row that no longer exists.
 */
export const EXPANSION_MEMORY_STORAGE_KEY = "haruki:rank-border:expanded-row"

export type ExpansionMemoryScope = {
  region: SekaiRegion
  eventId: string | null
  mode: RankBorderMode
  worldBloomCharacterId: string | null
}

export type ExpansionMemory = ExpansionMemoryScope & { key: RowExpansionKey }

export function serializeExpansionMemory(scope: ExpansionMemoryScope, key: RowExpansionKey): string {
  return JSON.stringify({ ...scope, key } satisfies ExpansionMemory)
}

/** The remembered row key when `raw` was written for exactly `scope`, else null. */
export function matchExpansionMemory(raw: string | null | undefined, scope: ExpansionMemoryScope): RowExpansionKey | null {
  if (!raw) {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof parsed !== "object" || parsed === null) {
    return null
  }
  const memory = parsed as Partial<ExpansionMemory>
  if (
    memory.region !== scope.region
    || (memory.eventId ?? null) !== (scope.eventId ?? null)
    || memory.mode !== scope.mode
    || (memory.worldBloomCharacterId ?? null) !== (scope.worldBloomCharacterId ?? null)
  ) {
    return null
  }
  const key = memory.key
  return typeof key === "string" && (key.startsWith("user:") || key.startsWith("rank:")) ? key as RowExpansionKey : null
}
