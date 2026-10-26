// Where the story player finds things. The page sets the JP asset root once
// (configureStoryRoot); the player library reads game assets through
// createStoryResolver(), whose per-episode calls get the episode's context
// (asset index, kind, event bundle) as `ctx.data`.
//
// Game assets come from the JP tree of the asset host. The player's own
// converted files (effects, UI sprites, fonts, the Cubism core) sit under
// "jp-assets/story-player/v1/" on the same host. The fallback host (`global`
// behind the China CDN) holds the same files at the same paths: the player
// asks the resolver's fallback() for a file's copy there whenever the host
// fails (network, timeout, 5xx, cut short; never a 404), and the page's own
// lookups use storyUrls.fallback.

import type { AssetResolver, LoadContext, ModelManifestEntry, VoiceInfo } from "pjsk-scenario-player"
import { resolveAssetHostTwinUrl } from "@/shared/sekai/asset-image-fallback"

/** One Live2D costume of the JP tree (the backend's jp-index entry). */
export interface StoryModelEntry {
  dir: string
  model3: string
  physics?: string
  motionBase?: string
  /** costume-only clips in "<dir>/motions/" (lower-case names) */
  motions?: string[]
}

export interface StoryAssetIndex {
  version: string
  models: Record<string, StoryModelEntry>
  movies: Record<string, string>
  se: Record<string, string>
}

/** The episode being played: `load(…, { context })` of the player. */
export interface StoryEpisodeContext {
  index: StoryAssetIndex
  /** "event" | "unit" | "card" | "special" | "area" */
  kind: string
  /** event stories: the event bundle (event-only SEs live next to its scenarios) */
  eventBundle?: string
  /** character2dId → model asset and unit, for part voices (master character2ds) */
  character2ds?: ReadonlyMap<number, { assetName: string; unit: string }>
}

const PLAYER_DIR = "story-player/v1"

let jpRoot = ""
let jpFallbackRoot = ""

function trimSlashes(root: string): string {
  let end = root.length
  while (end > 0 && root[end - 1] === "/") end--
  return root.slice(0, end)
}

/**
 * e.g. "https://sekai-assets-cn03-she01-cdn.haruki.seiunx.com/jp-assets" (the
 * user's asset host) and, for the China CDN, the global host's JP tree as the
 * fallback.
 */
export function configureStoryRoot(root: string, fallback: string | null = null) {
  jpRoot = trimSlashes(root)
  const fallbackRoot = fallback ? trimSlashes(fallback) : ""
  jpFallbackRoot = fallbackRoot === jpRoot ? "" : fallbackRoot
}

const jp = (path: string) => `${jpRoot}/${path}`

/**
 * `url` on the fallback host, or null (no fallback, or not a URL of an asset
 * host). URLs made before the session moved to the fallback host (the
 * player's UI sprites and fonts, the Cubism core) still map to it.
 */
function fallbackOf(url: string): string | null {
  if (jpFallbackRoot && url.startsWith(`${jpRoot}/`)) return `${jpFallbackRoot}${url.slice(jpRoot.length)}`
  return resolveAssetHostTwinUrl(url)
}

/** The host's own lookups (story browser, talk log, fonts, Cubism core). */
export const storyUrls = {
  /** any file of the JP tree */
  asset: (path: string) => jp(path),
  /** converted UI sprites ("menu/btn.png", "chr_ts/map.json", ...) */
  ui: (path: string) => jp(`${PLAYER_DIR}/ui/${path}`),
  /** converted scenario effects ("<name>/effect.json", "bg/index.json") */
  fx: (path: string) => jp(`${PLAYER_DIR}/fx/${path}`),
  fonts: (file: string) => jp(`${PLAYER_DIR}/fonts/${file}`),
  /** third-party runtime files (the Live2D Cubism core) */
  lib: (file: string) => jp(`${PLAYER_DIR}/lib/${file}`),
  /** the same file on the fallback host, or null */
  fallback: (url: string) => fallbackOf(url),
}

const episodeOf = (ctx: LoadContext) => ctx.data as StoryEpisodeContext
const modelOf = (entry: ModelManifestEntry) => entry as unknown as StoryModelEntry

/**
 * A motion or facial clip. Exports are lower-case. A body clip the shared
 * library lacks may be costume-only (BuildModelData AdditionalMotionData):
 * this costume's motions/ first, then the other costumes of the character.
 */
export function storyClipUrl(index: StoryAssetIndex, m: StoryModelEntry, kind: "motion" | "facial", name: string): string | null {
  const n = name.toLowerCase()
  if (kind === "motion") {
    const owner = m.motions?.includes(n) ? m : findSiblingClip(index, m, n)
    if (owner) return jp(`${owner.dir}/motions/${n}.motion3.json`)
  }
  return m.motionBase ? jp(`${m.motionBase}/${kind}/${n}.motion3.json`) : null
}

function findSiblingClip(index: StoryAssetIndex, m: StoryModelEntry, clip: string): StoryModelEntry | undefined {
  const parent = m.dir.slice(0, m.dir.lastIndexOf("/") + 1)
  for (const e of Object.values(index.models))
    if (e !== m && e.dir.startsWith(parent) && e.motions?.includes(clip)) return e
  return undefined
}

/**
 * Folders of a part voice (special and card stories: partvoice_*), filed by
 * the speaker's model asset and unit ("none" is filed as piapro). Worked out
 * from the asset tree and checked against its files, not against the client.
 */
export function partVoiceDirs(ep: StoryEpisodeContext, info: VoiceInfo | undefined): string[] {
  const c = info?.character2dId != null ? ep.character2ds?.get(info.character2dId) : undefined
  if (!c) return []
  const asset = c.assetName
  const unit = !c.unit || c.unit === "none" ? "piapro" : c.unit
  const dirs = asset.startsWith("v2_") ? [] : [`startapp/sound/scenario/voice/part_voice_v2_${asset}_${unit}`]
  dirs.push(
    `startapp/sound/scenario/voice/part_voice_${asset}_${unit}`,
    `startapp/sound/scenario/voice/part_voice_${asset}`,
    `tutorial/sound/scenario/part_voice/${asset}_${unit}`,
  )
  return dirs
}

/** The library resolver for the JP tree (candidate folders, the episode's index). */
export function createStoryResolver(): AssetResolver {
  return {
    // the page fetches scenarios and the index itself
    scenario: (id) => jp(`${id}.json`),
    modelManifest: () => jp("story-player/index.json"),
    model: (entry) => {
      const m = modelOf(entry)
      return jp(`${m.dir}/${m.model3}`)
    },
    // the model3 names "<stem>.physics3.json"; the export writes "<stem>.physics3"
    physics: (entry) => modelOf(entry).physics ?? null,
    motion: (entry, kind, name, ctx) => storyClipUrl(episodeOf(ctx).index, modelOf(entry), kind, name),
    bgm: (id) => [jp(`ondemand/sound/scenario/bgm/${id}/${id}.mp3`), jp(`startapp/sound/scenario/bgm/${id}/${id}.mp3`)],
    // shared SEs by name; a name the shared packs lack is an event-only SE
    se: (id, ctx) => {
      const ep = episodeOf(ctx)
      const shared = ep.index.se[id]
      if (shared) return [jp(shared)]
      return ep.eventBundle ? [jp(`ondemand/event_story/${ep.eventBundle}/scenario_se/${id}.mp3`)] : []
    },
    voice: (scenarioId, voiceId, ctx, info) => {
      const ep = episodeOf(ctx)
      const dirs = ["ondemand/sound/scenario/voice", "ondemand/sound/card_scenario/voice", "startapp/sound/scenario/voice"]
      if (ep.kind === "card") dirs.unshift(dirs.splice(1, 1)[0])
      const urls = dirs.map((d) => jp(`${d}/${scenarioId}/${voiceId}.mp3`))
      // area talk voices sit in the additional voice pack
      if (ep.kind === "area") urls.unshift(jp(`additionalvoice/sound/actionset/voice/${scenarioId}/${voiceId}.mp3`))
      if (voiceId.startsWith("partvoice")) urls.unshift(...partVoiceDirs(ep, info).map((d) => jp(`${d}/${voiceId}.mp3`)))
      return urls
    },
    background: (id) => [
      jp(`ondemand/scenario/background/${id}/${id}.png`),
      jp(`startapp/scenario/background/${id}/${id}.png`),
      // prefab backgrounds (ScenarioBGData): the base image
      jp(`ondemand/scenario/background/${id}/scenariobgdata.assets/texture2d/${id}.png`),
    ],
    movie: (name, ctx) => {
      const p = episodeOf(ctx).index.movies[name]
      return p ? jp(p) : null
    },
    fx: (path) => storyUrls.fx(path),
    ui: (path) => storyUrls.ui(path),
    font: (file) => storyUrls.fonts(file),
    fallback: (url) => fallbackOf(url),
  }
}
