import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { resolveSekaiCardThumbnailUrl, resolveSekaiGameAssetUrl } from "@/shared/sekai/data-sources"
import { resolveEventBannerUrl, resolveEventLogoUrl } from "@/modules/events/lib/event-assets"
import { buildGachaImageCandidates, buildGachaLogoCandidates } from "@/modules/gachas/lib/gacha-catalog"
import { resolveMusicJacketUrl } from "@/modules/music-library/lib/music-assets"
import type { SearchIndexEntry } from "./search-index"

export type SearchThumb = {
  /** Candidate URLs, first that loads wins. */
  sources: (string | null)[]
  /** `square` jackets and card art, `wide` banners and logos, `round` character icons. */
  shape: "square" | "wide" | "round"
  fit: "cover" | "contain"
}

/** Story art is addressed inside the jp asset tree whatever the catalog region. */
const STORY_ASSET_REGION: SekaiRegion = "jp"

/** The picture a row leads with; null for a page, which shows its icon. */
export function resolveSearchThumb(
  entry: SearchIndexEntry,
  region: SekaiRegion,
  preference: SekaiAssetEndpointPreference,
): SearchThumb | null {
  switch (entry.type) {
    case "music":
      return {
        sources: [resolveMusicJacketUrl(region, entry.music.assetbundleName, preference)],
        shape: "square",
        fit: "cover",
      }
    case "card":
      return {
        sources: entry.card.assetbundleName
          ? [resolveSekaiCardThumbnailUrl(region, entry.card.assetbundleName, entry.card.trainedByDefault, preference)]
          : [],
        shape: "square",
        fit: "cover",
      }
    case "event":
      return {
        sources: [
          resolveEventBannerUrl(region, entry.event.assetbundleName, preference),
          resolveEventLogoUrl(region, entry.event.assetbundleName, preference),
        ],
        shape: "wide",
        fit: "contain",
      }
    case "gacha": {
      const gacha = { id: entry.id, seq: entry.gacha.seq, assetbundleName: entry.gacha.assetbundleName }
      return {
        sources: [...new Set([
          ...buildGachaLogoCandidates(gacha, region, preference),
          ...buildGachaImageCandidates(gacha, region, preference, entry.gacha.aliasId),
        ])],
        shape: "wide",
        fit: "contain",
      }
    }
    case "character":
      return { sources: [entry.character.iconUrl], shape: "round", fit: "cover" }
    case "story": {
      const paths = [entry.story.logo, entry.story.thumb].filter((path): path is string => !!path)
      return {
        sources: paths.map((path) => resolveSekaiGameAssetUrl(STORY_ASSET_REGION, path, preference)),
        shape: "wide",
        fit: entry.story.logo ? "contain" : "cover",
      }
    }
    default:
      return null
  }
}
