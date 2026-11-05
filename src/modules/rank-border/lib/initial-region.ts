import { isSekaiRegion } from "@/lib/sekai-region"
import type { SekaiCatalogRegionMode } from "@/shared/stores/settings"
import type { SekaiRegion } from "@/types"

export type ResolveInitialRankBorderRegionInput = {
  /** Region remembered from the last visit, if any. */
  persisted?: unknown
  /** The catalog region setting: a fixed region, or "follow" the selected game account. */
  mode: SekaiCatalogRegionMode
  catalogRegion: SekaiRegion
  /** Server of the default bound game account, when there is one. */
  accountServer?: SekaiRegion | null
}

/**
 * Region the rank-border page opens on. A remembered choice wins; otherwise it
 * follows the same rule as the catalog pages (bound account in follow mode,
 * else the configured catalog region), so a first visit lands on the server
 * the player actually uses instead of a hard-coded one.
 */
export function resolveInitialRankBorderRegion(input: ResolveInitialRankBorderRegionInput): SekaiRegion {
  if (isSekaiRegion(input.persisted)) {
    return input.persisted
  }
  if (input.mode === "follow" && input.accountServer) {
    return input.accountServer
  }
  return input.catalogRegion
}
