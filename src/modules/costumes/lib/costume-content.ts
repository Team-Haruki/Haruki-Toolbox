import type { SekaiRegion } from "@/types"
import type { HarukiCostumeShopContent } from "../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js"

/**
 * The 3D costume kernel reads the game's own content: the AssetBundleInfo, original bundles and master rows. The
 * Toolbox backend serves them per region under `/api/misc/costume3d/<region>/`, laid out like the raw-bundle mirror
 * (`current.json`, `catalogs/`, `bundles/`) with one character's master rows at `master/characters/<id>.json`.
 */
export function resolveCostumeContentBaseUrl(apiEndpoint: string, region: SekaiRegion): string {
  return `${apiEndpoint.replace(/\/+$/, "")}/api/misc/costume3d/${region}/`
}

/** The engine bundle (~0.6 MB, plus shader tables loaded per material) is loaded on demand. */
export function loadCostumeEngine() {
  return import("../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js")
}

const contents = new Map<string, Promise<HarukiCostumeShopContent>>()

/**
 * One content object per backend root: the viewer's kernel and the part lists share its worker, so the
 * AssetBundleInfo is read once per page.
 */
export function loadCostumeContent(baseUrl: string): Promise<HarukiCostumeShopContent> {
  const cached = contents.get(baseUrl)
  if (cached) {
    return cached
  }
  const content = loadCostumeEngine().then((engine) =>
    engine.createMirrorContent(baseUrl, { masterLayout: "characters" }),
  )
  content.catch(() => {
    // A failed load (backend unreachable) must not stay cached.
    contents.delete(baseUrl)
  })
  contents.set(baseUrl, content)
  return content
}
