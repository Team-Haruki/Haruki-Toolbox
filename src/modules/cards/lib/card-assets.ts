import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { resolveSekaiGameAssetUrl } from "@/shared/sekai/data-sources"

/**
 * Full card art is delivered as 2520x1440 PNGs (7:4). Verified against
 * `{assets}/kr-assets/startapp/character/member/res001_no001/card_normal.png`.
 */
export const CARD_FULL_ART_ASPECT_CLASS = "aspect-[7/4]"

export function resolveCardFullArtPath(assetbundleName: string, trained: boolean): string | null {
  const bundle = assetbundleName.trim()
  if (!bundle) {
    return null
  }

  const fileName = trained ? "card_after_training.png" : "card_normal.png"
  return `startapp/character/member/${bundle}/${fileName}`
}

export function resolveCardFullArtUrl(
  region: SekaiRegion,
  assetbundleName: string,
  trained: boolean,
  preference: SekaiAssetEndpointPreference = "china",
): string | null {
  const path = resolveCardFullArtPath(assetbundleName, trained)
  return path ? resolveSekaiGameAssetUrl(region, path, preference) : null
}
