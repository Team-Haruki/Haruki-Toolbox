import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference, SekaiMasterVersionInfo } from "./types"
import { resolveUnitEmblemDataUrl } from "./unit-emblems"

export const SEKAI_MASTER_REPOS: Record<SekaiRegion, string> = {
  jp: "haruki-sekai-master",
  en: "haruki-sekai-en-master",
  tw: "haruki-sekai-tc-master",
  kr: "haruki-sekai-kr-master",
  cn: "haruki-sekai-sc-master",
}

/**
 * Master data comes from the Haruki master registry through its public CDN
 * face: `current` is the per-region manifest (revalidated on every check),
 * `blob/{sha256}` is an immutable file, `files/{name}.json` the mutable
 * fallback for files the manifest does not list.
 */
const SEKAI_REGISTRY_BASE_URL = "https://sekai-api-cdn.haruki.seiunx.com"
export const SEKAI_MUSIC_METAS_URLS: Record<SekaiRegion, string> = {
  jp: `${SEKAI_REGISTRY_BASE_URL}/v1/metas/jp/music_metas.json`,
  en: `${SEKAI_REGISTRY_BASE_URL}/v1/metas/en/music_metas.json`,
  tw: `${SEKAI_REGISTRY_BASE_URL}/v1/metas/tw/music_metas.json`,
  kr: `${SEKAI_REGISTRY_BASE_URL}/v1/metas/kr/music_metas.json`,
  cn: `${SEKAI_REGISTRY_BASE_URL}/v1/metas/cn/music_metas.json`,
}

export const SEKAI_ASSET_ENDPOINT_ROOTS: Record<SekaiAssetEndpointPreference, string> = {
  china: "https://sekai-assets.haruki.seiunx.com",
  global: "https://sekai-assets-bdf29c81.seiunx.net",
  china_cdn: "https://toolbox-sekai-assets.haruki.seiunx.com",
}
const TOOLBOX_STATIC_IMAGE_BASE_URL = "https://images.haruki.seiunx.com/sekai-toolbox"
/** Vite's base path; `import.meta.env.BASE_URL` is not defined under `bun test`. */
const APP_BASE_URL: string = import.meta.env.BASE_URL ?? "/"
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

/** The registry manifest; the cache-buster defeats an edge that ignores `no-cache`. */
export function resolveSekaiMasterVersionUrl(region: SekaiRegion, now = Date.now()): string {
  const nanoseconds = Math.trunc(now * 1_000_000)
  return `${SEKAI_REGISTRY_BASE_URL}/v1/master/${region}/current?t=${nanoseconds}`
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
    contentHash: normalizeVersionValue(record.contentHash) || null,
    files: normalizeManifestFiles(record.files),
  }
}

/**
 * The version the cache is keyed by. The registry's `contentHash` covers the
 * whole file set, so it wins; the dataVersion/cdnVersion rule is kept for a
 * manifest without one.
 */
export function resolveSekaiMasterFetchVersion(
  region: SekaiRegion,
  versionInfo: SekaiMasterVersionInfo,
): string {
  if (versionInfo.contentHash) {
    return versionInfo.contentHash
  }

  if (regionUsesCdnVersion(region) && versionInfo.cdnVersion) {
    return versionInfo.cdnVersion
  }

  return versionInfo.dataVersion
}

/**
 * Whether the manifest lists `name`; `null` when the manifest carries no
 * file list at all (nothing can be concluded).
 */
export function manifestListsSekaiMasterFile(
  versionInfo: SekaiMasterVersionInfo,
  name: string,
): boolean | null {
  if (Object.keys(versionInfo.files).length === 0) {
    return null
  }

  return normalizeSekaiMasterFileName(name) in versionInfo.files
}

export function formatSekaiMasterVersionLabel(
  region: SekaiRegion,
  dataVersion: string | null | undefined,
  cdnVersion: string | null | undefined,
): string | null {
  if (!dataVersion) {
    return null
  }

  if (regionUsesCdnVersion(region) && cdnVersion) {
    return `${dataVersion} (${cdnVersion})`
  }

  return dataVersion
}

/**
 * Immutable `blob/{sha256}` when the manifest lists the file (cacheable for
 * a year by every layer), otherwise the mutable `files/{name}.json` pointer
 * with the version as a cache key.
 */
export function resolveSekaiMasterFileUrl(
  region: SekaiRegion,
  name: string,
  versionInfo: SekaiMasterVersionInfo | string,
): string {
  const fileName = normalizeSekaiMasterFileName(name)
  if (typeof versionInfo !== "string") {
    const sha256 = versionInfo.files[fileName]
    if (sha256) {
      return `${SEKAI_REGISTRY_BASE_URL}/v1/master/${region}/blob/${sha256}`
    }
  }

  const version = typeof versionInfo === "string"
    ? versionInfo
    : resolveSekaiMasterFetchVersion(region, versionInfo)
  return `${SEKAI_REGISTRY_BASE_URL}/v1/master/${region}/files/${fileName}.json?version=${encodeURIComponent(version)}`
}

export function resolveSekaiMusicMetasUrl(region: SekaiRegion, cacheKey?: string | number): string {
  const url = SEKAI_MUSIC_METAS_URLS[region]
  if (cacheKey == null || cacheKey === "") {
    return url
  }

  return appendQueryParam(url, "v", String(cacheKey))
}

export function resolveSekaiAssetRootUrl(preference: SekaiAssetEndpointPreference): string {
  return SEKAI_ASSET_ENDPOINT_ROOTS[preference]
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

export function resolveSekaiHonorImageUrl(
  region: SekaiRegion,
  assetBundleName: string,
  preference: SekaiAssetEndpointPreference = "china",
): string {
  return resolveSekaiGameAssetUrl(
    region,
    `startapp/honor/${assetBundleName.trim()}/degree_main.png`,
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

/**
 * Browser runtime root of the Haruki 3D exporter output for one region,
 * served from the public asset endpoints under `/pjsk-3d-output/`. The
 * china_cdn endpoint does not host the 3D tree at all (exporter output is
 * not synced there), so 3D loads fall back to the china endpoint.
 */
export function resolvePjsk3dRuntimeBaseUrl(
  region: SekaiRegion,
  preference: SekaiAssetEndpointPreference = "china",
): string {
  const effective = preference === "china_cdn" ? "china" : preference
  return `${SEKAI_ASSET_ENDPOINT_ROOTS[effective]}/pjsk-3d-output/${region}/`
}

export function resolveCardFrameImageUrl(rarity: string): string {
  return resolveToolboxStaticImageUrl(`static_images/card/frame_${rarity}.png`)
}

export function resolveCardAttrIconUrl(attribute: string): string {
  return resolveToolboxStaticImageUrl(`static_images/card/attr_${attribute}.png`)
}

/** Round badge variant of the attribute icon (`attr_icon_{attr}.png`). */
/**
 * Bundled with the app (`public/assets/attr/`), not fetched from the image
 * host: the round attribute icons appear on nearly every page — filter chips,
 * detail badges, deck and honor views — so they are precached with the build
 * and never hit the runtime image cache or its purge-and-retry path. The
 * thumbnail-corner icon (`resolveCardAttrIconUrl`) is a different asset and
 * still comes from the host.
 */
export function resolveCardAttrRoundIconUrl(attribute: string): string {
  return `${APP_BASE_URL}assets/attr/attr_icon_${attribute}.png`
}

export function resolveCostumeThumbnailUrl(
  region: SekaiRegion,
  assetbundleName: string,
  preference: SekaiAssetEndpointPreference = "china",
): string {
  return resolveSekaiGameAssetUrl(
    region,
    `startapp/thumbnail/costume/${assetbundleName.trim()}.png`,
    preference,
  )
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

/**
 * The hosted PNG, unless the unit has an inline SVG emblem (see
 * `unit-emblems.ts`) — in which case it resolves to a request-free `data:`
 * URL. The emblem table is empty today, so this is the PNG for every unit;
 * it is the single point where dropping emblem SVGs in switches every
 * consumer over.
 */
export function resolveUnitLogoUrl(unit: string): string {
  return resolveUnitEmblemDataUrl(unit) ?? resolveToolboxStaticImageUrl(`static_images/icon_${unit}.png`)
}

export function resolveCharacterIconUrl(characterId: number): string {
  const nickname = CHARACTER_ICON_NICKNAMES[characterId] ?? `chr_icon_${characterId}`
  return resolveToolboxStaticImageUrl(`static_images/chara_icon/${nickname}.png`)
}

function normalizeManifestFiles(value: unknown): Record<string, string> {
  const files: Record<string, string> = {}
  if (!Array.isArray(value)) {
    return files
  }

  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue
    }
    const { name, sha256 } = entry as Record<string, unknown>
    if (typeof name !== "string" || typeof sha256 !== "string") {
      continue
    }
    const fileName = normalizeSekaiMasterFileName(name)
    const digest = sha256.trim()
    if (fileName && /^[0-9a-f]{64}$/i.test(digest)) {
      files[fileName] = digest
    }
  }

  return files
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
  let baseEnd = base.length
  while (baseEnd > 0 && base[baseEnd - 1] === "/") {
    baseEnd -= 1
  }

  let pathStart = 0
  while (pathStart < path.length && path[pathStart] === "/") {
    pathStart += 1
  }
  return `${base.slice(0, baseEnd)}/${path.slice(pathStart)}`
}

function appendQueryParam(url: string, key: string, value: string): string {
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`
}
