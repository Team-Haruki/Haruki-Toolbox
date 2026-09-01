import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { resolveSekaiGameAssetUrl } from "@/shared/sekai/data-sources"

/**
 * Event asset URL patterns verified against the Haruki asset mirror
 * (e.g. https://sekai-assets.haruki.seiunx.com/kr-assets/...):
 *
 * - logo:   ondemand/event/{assetbundleName}/logo/logo.png
 * - banner: ondemand/event_story/{assetbundleName}/screen_image/banner_event_story.png
 * - bg:     ondemand/event/{assetbundleName}/screen/bg.png
 * - cheerful carnival team: ondemand/event/{assetbundleName}/team_image/{team.assetbundleName}.png
 * - event honor rank plate:  startapp/honor/{honor.assetbundleName}/rank_main.png
 *   (drawn over the honor group background served by `resolveSekaiHonorImageUrl`)
 *
 * The `ondemand/event/{assetbundleName}/screen/banner.png` path only exists for
 * a handful of very early events, so the event-story banner is used instead.
 */

function normalizeAssetbundleName(assetbundleName: string | null | undefined): string | null {
  if (typeof assetbundleName !== "string") {
    return null
  }

  const trimmed = assetbundleName.trim()
  return trimmed === "" ? null : trimmed
}

export function resolveEventLogoUrl(
  region: SekaiRegion,
  assetbundleName: string | null | undefined,
  preference: SekaiAssetEndpointPreference = "china",
): string | null {
  const name = normalizeAssetbundleName(assetbundleName)
  if (!name) {
    return null
  }

  return resolveSekaiGameAssetUrl(region, `ondemand/event/${name}/logo/logo.png`, preference)
}

export function resolveEventBannerUrl(
  region: SekaiRegion,
  assetbundleName: string | null | undefined,
  preference: SekaiAssetEndpointPreference = "china",
): string | null {
  const name = normalizeAssetbundleName(assetbundleName)
  if (!name) {
    return null
  }

  return resolveSekaiGameAssetUrl(
    region,
    `ondemand/event_story/${name}/screen_image/banner_event_story.png`,
    preference,
  )
}

export function resolveEventBackgroundUrl(
  region: SekaiRegion,
  assetbundleName: string | null | undefined,
  preference: SekaiAssetEndpointPreference = "china",
): string | null {
  const name = normalizeAssetbundleName(assetbundleName)
  if (!name) {
    return null
  }

  return resolveSekaiGameAssetUrl(region, `ondemand/event/${name}/screen/bg.png`, preference)
}

export function resolveEventTeamImageUrl(
  region: SekaiRegion,
  eventAssetbundleName: string | null | undefined,
  teamAssetbundleName: string | null | undefined,
  preference: SekaiAssetEndpointPreference = "china",
): string | null {
  const eventName = normalizeAssetbundleName(eventAssetbundleName)
  const teamName = normalizeAssetbundleName(teamAssetbundleName)
  if (!eventName || !teamName) {
    return null
  }

  return resolveSekaiGameAssetUrl(region, `ondemand/event/${eventName}/team_image/${teamName}.png`, preference)
}

/**
 * Event ranking honors (`honor_top_*`) ship no `degree_main.png` of their
 * own: the rank plate is a transparent overlay on the honor group's
 * background image.
 */
export function resolveEventHonorRankOverlayUrl(
  region: SekaiRegion,
  honorAssetbundleName: string | null | undefined,
  preference: SekaiAssetEndpointPreference = "china",
): string | null {
  const name = normalizeAssetbundleName(honorAssetbundleName)
  if (!name) {
    return null
  }

  return resolveSekaiGameAssetUrl(region, `startapp/honor/${name}/rank_main.png`, preference)
}
