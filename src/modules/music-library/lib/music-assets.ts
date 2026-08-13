import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { resolveSekaiGameAssetUrl } from "@/shared/sekai/data-sources"

/**
 * Jacket asset path pattern, verified against the asset CDN:
 * `startapp/music/jacket/{assetbundleName}/{assetbundleName}.png`
 * e.g. https://sekai-assets.haruki.seiunx.com/kr-assets/startapp/music/jacket/jacket_s_001/jacket_s_001.png
 */
export function buildMusicJacketAssetPath(assetbundleName: string): string | null {
  const name = typeof assetbundleName === "string" ? assetbundleName.trim() : ""
  if (!name) {
    return null
  }

  return `startapp/music/jacket/${name}/${name}.png`
}

export function resolveMusicJacketUrl(
  region: SekaiRegion,
  assetbundleName: string,
  preference: SekaiAssetEndpointPreference = "china",
): string | null {
  const assetPath = buildMusicJacketAssetPath(assetbundleName)
  if (!assetPath) {
    return null
  }

  return resolveSekaiGameAssetUrl(region, assetPath, preference)
}

/**
 * Full-length vocal audio path, verified against the asset CDN:
 * `ondemand/music/long/{vocalAssetbundleName}/{vocalAssetbundleName}.mp3`
 * (the CDN answers range requests, so the URL streams directly in <audio>).
 */
export function buildMusicLongAudioAssetPath(vocalAssetbundleName: string): string | null {
  const name = typeof vocalAssetbundleName === "string" ? vocalAssetbundleName.trim() : ""
  if (!name) {
    return null
  }

  return `ondemand/music/long/${name}/${name}.mp3`
}

export function resolveMusicLongAudioUrl(
  region: SekaiRegion,
  vocalAssetbundleName: string,
  preference: SekaiAssetEndpointPreference = "china",
): string | null {
  const assetPath = buildMusicLongAudioAssetPath(vocalAssetbundleName)
  if (!assetPath) {
    return null
  }

  return resolveSekaiGameAssetUrl(region, assetPath, preference)
}
