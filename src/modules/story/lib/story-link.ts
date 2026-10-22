import type { RouteLocationRaw } from "vue-router"

/** `/story` opened on one episode. */
export function buildStoryPlayerLink(scenarioId: string): RouteLocationRaw {
  return { name: "story.player", query: { scenario: scenarioId } }
}

/**
 * The episode a "play story" button opens: the first one that has a scenario,
 * or null while the content is unreleased (its scenario files may not exist
 * yet, and the player hides unreleased stories).
 */
export function firstPlayableScenario(
  episodes: readonly { scenarioId: string | null }[],
  releasedAt: number | null | undefined,
  nowMs: number,
): string | null {
  if (releasedAt != null && nowMs < releasedAt) return null
  return episodes.find((episode) => episode.scenarioId)?.scenarioId ?? null
}
