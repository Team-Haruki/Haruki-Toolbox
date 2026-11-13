import type { SekaiRegion } from "@/types"
import { resolveSekaiAssetRootUrl } from "@/shared/sekai/data-sources"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import type { HarukiCostumeShopContent } from "../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js"
import { BundleLoadTracker, trackBundleLoads } from "./costume-load-progress"

/** A different root of the raw-bundle mirror (a staging or local copy); unset, the asset CDN's `/raw-bundles`. */
const CONTENT_ROOT_OVERRIDE: string | undefined = import.meta.env?.VITE_HARUKI_COSTUME3D_CONTENT_ROOT

/**
 * The 3D costume kernel reads the game's own content: the AssetBundleInfo, original bundles and master rows, from the
 * raw-bundle mirror on the asset CDN: `<root>/<region>/android/` with `current.json`, `catalogs/`, `bundles/` and one
 * character's master rows at `master/characters/<id>.json`.
 */
export function resolveCostumeContentBaseUrl(
  preference: SekaiAssetEndpointPreference,
  region: SekaiRegion,
  rootOverride: string | undefined = CONTENT_ROOT_OVERRIDE,
): string {
  const root = rootOverride?.trim() ? rootOverride.trim().replace(/\/+$/, "") : `${resolveSekaiAssetRootUrl(preference)}/raw-bundles`
  return `${root}/${region}/android/`
}

/** The engine bundle (~0.6 MB, plus shader tables loaded per material) is loaded on demand. */
export function loadCostumeEngine() {
  return import("../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js")
}

const contents = new Map<string, Promise<HarukiCostumeShopContent>>()
const trackers = new Map<string, BundleLoadTracker>()

/** The bundle downloads of a content root's content (the viewer's loading bar). */
export function costumeLoadTracker(baseUrl: string): BundleLoadTracker {
  let tracker = trackers.get(baseUrl)
  if (!tracker) {
    tracker = new BundleLoadTracker()
    trackers.set(baseUrl, tracker)
  }
  return tracker
}

/**
 * One content object per content root: the viewer's kernel and the part lists share its worker, so the
 * AssetBundleInfo is read once per page.
 */
export function loadCostumeContent(baseUrl: string): Promise<HarukiCostumeShopContent> {
  const cached = contents.get(baseUrl)
  if (cached) {
    return cached
  }
  const content = loadCostumeEngine()
    .then((engine) => engine.createMirrorContent(baseUrl, { masterLayout: "characters" }))
    .then((mirror) => trackBundleLoads(mirror, costumeLoadTracker(baseUrl)))
  content.catch(() => {
    // A failed load (mirror unreachable) must not stay cached.
    contents.delete(baseUrl)
  })
  contents.set(baseUrl, content)
  return content
}
