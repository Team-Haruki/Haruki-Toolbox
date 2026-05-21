import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference, SekaiMasterVersionInfo } from "./types"

export const SEKAI_MASTER_REPOS: Record<SekaiRegion, string> = {
  jp: "haruki-sekai-master",
  en: "haruki-sekai-en-master",
  tw: "haruki-sekai-tc-master",
  kr: "haruki-sekai-kr-master",
  cn: "haruki-sekai-sc-master",
}

export const SEKAI_MUSIC_METAS_URLS: Record<SekaiRegion, string> = {
  jp: "https://sekai-master-cdn.haruki.seiunx.com/music_metas.json",
  en: "https://sekai-master-cdn.haruki.seiunx.com/music_metas-en.json",
  tw: "https://sekai-master-cdn.haruki.seiunx.com/music_metas-tc.json",
  kr: "https://sekai-master-cdn.haruki.seiunx.com/music_metas-kr.json",
  cn: "https://sekai-master-cdn.haruki.seiunx.com/music_metas-cn.json",
}

const SEKAI_MASTER_CDN_BASE_URL = "https://sekai-master-cdn.haruki.seiunx.com"
const SEKAI_ASSET_ROOTS: Record<SekaiAssetEndpointPreference, string> = {
  china: "https://sekai-assets.haruki.seiunx.com",
  global: "https://sekai-assets-bdf29c81.seiunx.net",
}
const TOOLBOX_STATIC_IMAGE_BASE_URL = "https://images.haruki.seiunx.com/sekai-toolbox"
const CDN_VERSION_REGIONS: readonly SekaiRegion[] = ["tw", "kr", "cn"]
const CHARACTER_ICON_NICKNAMES: Record<number, string> = {
  1: "ick",
  2: "saki",
  3: "hnm",
  4: "shiho",
  5: "mnr",
  6: "hrk",
  7: "airi",
  8: "szk",
  9: "khn",
  10: "an",
  11: "akt",
  12: "toya",
  13: "tks",
  14: "emu",
  15: "nene",
  16: "rui",
  17: "knd",
  18: "mfy",
  19: "ena",
  20: "mzk",
  21: "miku",
  22: "rin",
  23: "len",
  24: "luka",
  25: "meiko",
  26: "kaito",
  27: "miku_light_sound",
  28: "miku_idol",
  29: "miku_street",
  30: "miku_theme_park",
  31: "miku_school_refusal",
}

export function resolveSekaiMasterRepo(region: SekaiRegion): string {
  return SEKAI_MASTER_REPOS[region]
}

export function normalizeSekaiMasterFileName(name: string): string {
  return name.trim().replace(/\.json$/i, "")
}

export function regionUsesCdnVersion(region: SekaiRegion): boolean {
  return CDN_VERSION_REGIONS.includes(region)
}

export function resolveSekaiMasterVersionUrl(region: SekaiRegion, now = Date.now()): string {
  const repo = resolveSekaiMasterRepo(region)
  const nanoseconds = Math.trunc(now * 1_000_000)
  return `${SEKAI_MASTER_CDN_BASE_URL}/${repo}/versions/current_version.json?t=${nanoseconds}`
}

export function normalizeSekaiMasterVersionInfo(raw: unknown): SekaiMasterVersionInfo {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid Sekai master version payload")
  }

  const record = raw as Record<string, unknown>
  const dataVersion = normalizeVersionValue(record.dataVersion)
  const cdnVersion = normalizeVersionValue(record.cdnVersion)
  if (!dataVersion) {
    throw new Error("Sekai master version payload is missing dataVersion")
  }

  return {
    dataVersion,
    cdnVersion: cdnVersion || null,
  }
}

export function resolveSekaiMasterFetchVersion(
  region: SekaiRegion,
  versionInfo: SekaiMasterVersionInfo,
): string {
  if (regionUsesCdnVersion(region) && versionInfo.cdnVersion) {
    return versionInfo.cdnVersion
  }

  return versionInfo.dataVersion
}

export function resolveSekaiMasterFileUrl(
  region: SekaiRegion,
  name: string,
  versionInfo: SekaiMasterVersionInfo | string,
): string {
  const repo = resolveSekaiMasterRepo(region)
  const fileName = normalizeSekaiMasterFileName(name)
  const version = typeof versionInfo === "string"
    ? versionInfo
    : resolveSekaiMasterFetchVersion(region, versionInfo)
  return `${SEKAI_MASTER_CDN_BASE_URL}/${repo}/master/${fileName}.json?version=${encodeURIComponent(version)}`
}

export function resolveSekaiMusicMetasUrl(region: SekaiRegion, cacheKey?: string | number): string {
  const url = SEKAI_MUSIC_METAS_URLS[region]
  if (cacheKey == null || cacheKey === "") {
    return url
  }

  return appendQueryParam(url, "v", String(cacheKey))
}

export function resolveSekaiAssetRootUrl(preference: SekaiAssetEndpointPreference): string {
  return SEKAI_ASSET_ROOTS[preference]
}

export function resolveSekaiRegionAssetsUrl(
  region: SekaiRegion,
  preference: SekaiAssetEndpointPreference,
): string {
  return `${resolveSekaiAssetRootUrl(preference)}/${region}-assets`
}

export function resolveSekaiGameAssetUrl(
  region: SekaiRegion,
  assetPath: string,
  preference: SekaiAssetEndpointPreference = "china",
): string {
  return joinUrl(resolveSekaiRegionAssetsUrl(region, preference), assetPath)
}

export function resolveSekaiCardThumbnailUrl(
  region: SekaiRegion,
  assetBundleName: string,
  trainedArt: boolean,
  preference: SekaiAssetEndpointPreference = "china",
): string {
  const suffix = trainedArt ? "_after_training.png" : "_normal.png"
  return resolveSekaiGameAssetUrl(
    region,
    `startapp/thumbnail/chara/${assetBundleName.trim()}${suffix}`,
    preference,
  )
}

export function resolveToolboxStaticImageUrl(path: string): string {
  return joinUrl(TOOLBOX_STATIC_IMAGE_BASE_URL, path)
}

export function resolveRarityTrainingIconUrl(rarity: string): string {
  if (rarity === "rarity_birthday") {
    return resolveRareBirthdayImageUrl()
  }

  if (rarity === "rarity_3" || rarity === "rarity_4") {
    return resolveRareStarImageUrl(true)
  }

  return resolveRareStarImageUrl(false)
}

export function resolveCardFrameImageUrl(rarity: string): string {
  return resolveToolboxStaticImageUrl(`static_images/card/frame_${rarity}.png`)
}

export function resolveCardAttrIconUrl(attribute: string): string {
  return resolveToolboxStaticImageUrl(`static_images/card/attr_icon_${attribute}.png`)
}

export function resolveRareStarImageUrl(afterTraining: boolean): string {
  return resolveToolboxStaticImageUrl(
    `static_images/card/${afterTraining ? "rare_star_after_training" : "rare_star_normal"}.png`,
  )
}

export function resolveRareBirthdayImageUrl(): string {
  return resolveToolboxStaticImageUrl("static_images/card/rare_birthday.png")
}

export function resolveTrainRankImageUrl(rank: number): string {
  return resolveToolboxStaticImageUrl(`static_images/card/train_rank_${rank}.png`)
}

export function resolveMySekaiCanvasIconUrl(): string {
  return resolveToolboxStaticImageUrl("static_images/mysekai/icon/icon_canvas.png")
}

export function resolveCharacterIconUrl(characterId: number): string {
  const nickname = CHARACTER_ICON_NICKNAMES[characterId] ?? `chr_icon_${characterId}`
  return resolveToolboxStaticImageUrl(`static_images/chara_icon/${nickname}.png`)
}

function normalizeVersionValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim()
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }

  return ""
}

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`
}

function appendQueryParam(url: string, key: string, value: string): string {
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`
}
