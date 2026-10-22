import { ref, shallowRef, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { getStoryAssetIndex, getStoryTranslation } from "@/modules/story/api/story"
import type { StoryCatalog, StoryEpisode } from "@/modules/story/lib/story-catalog"
import { ScenarioCache, fetchScenarioJson } from "@/modules/story/lib/story-fetch"
import {
  STORY_LANG_REGIONS,
  applyRegionText,
  applyTranslation,
  isPlaceholderText,
  storyFontScript,
  type StoryTextLang,
} from "@/modules/story/lib/story-text"
import type { ScenarioSceneData } from "@/modules/story/engine/types"
import type { StoryAssetIndex } from "@/modules/story/engine/urls"
import type { StoryRuntime } from "@/modules/story/engine/story-runtime"

export type StoryPlaybackState =
  | { phase: "idle" }
  | { phase: "loading"; sid: string }
  | { phase: "playing"; sid: string; lang: StoryTextLang; episode: StoryEpisode }
  | { phase: "error"; sid: string; reason: "notFound" | "missing" | "failed"; detail?: string }

export type StoryPlaybackOptions = {
  /** Selected scenario id (null = nothing picked). */
  sid: Ref<string | null>
  /** JP catalog (paths); null while loading. */
  catalog: Ref<StoryCatalog | null>
  /** Languages to try in order. */
  langChain: Ref<StoryTextLang[]>
  /** "<asset host>" without the region suffix. */
  assetRoot: Ref<string>
}

/**
 * Feeds the runtime: on every pick (or language change) it loads the JP
 * scenario, puts the first available text language on it and starts the
 * episode. The first episode of a visit waits for a click unless the browser
 * already allows sound; later picks come from a click and play right away.
 */
export function useStoryPlayback(options: StoryPlaybackOptions) {
  const runtime = shallowRef<StoryRuntime | null>(null)
  const state = ref<StoryPlaybackState>({ phase: "idle" })
  /** The AI translation of the current episode is still being made. */
  const aiPending = ref(false)
  const scenarios = new ScenarioCache<ScenarioSceneData>()
  let index: Promise<StoryAssetIndex> | null = null
  let seq = 0
  let interacted = false

  const loadIndex = () => {
    index ??= getStoryAssetIndex().catch((error: unknown) => {
      index = null
      throw error
    })
    return index
  }

  const scenarioOf = (region: SekaiRegion, episode: StoryEpisode) =>
    scenarios.get(`${region}:${episode.sid}`, () =>
      fetchScenarioJson<ScenarioSceneData>(options.assetRoot.value, region, episode.paths))

  async function textFor(jp: ScenarioSceneData, episode: StoryEpisode): Promise<{ scn: ScenarioSceneData; lang: StoryTextLang }> {
    aiPending.value = false
    for (const lang of options.langChain.value) {
      if (lang === "ja") return { scn: jp, lang }
      try {
        if (lang === "zh-Hans-ai") {
          const result = await getStoryTranslation(episode.sid)
          if (result.status === "pending") aiPending.value = true
          if (result.status !== "done") continue
          const scn = applyTranslation(jp, result.translation)
          if (scn) return { scn, lang }
          continue
        }
        const region = STORY_LANG_REGIONS[lang]
        if (!region) continue
        const other = await scenarioOf(region, episode)
        if (!other || isPlaceholderText(other)) continue
        const scn = applyRegionText(jp, other)
        if (scn) return { scn, lang }
      } catch (error) {
        console.warn("story text unavailable", lang, error)
      }
    }
    return { scn: jp, lang: "ja" }
  }

  async function play(sid: string | null) {
    const rt = runtime.value
    const catalog = options.catalog.value
    const mine = ++seq
    if (!rt) return
    if (!sid) {
      state.value = { phase: "idle" }
      rt.showPick()
      return
    }
    if (!catalog) {
      state.value = { phase: "loading", sid }
      rt.showLoading()
      return // played once the catalog arrives
    }
    const hit = catalog.bySid.get(sid)
    if (!hit) {
      state.value = { phase: "error", sid, reason: "notFound" }
      return
    }
    state.value = { phase: "loading", sid }
    rt.showLoading()
    try {
      const [idx, jp] = await Promise.all([loadIndex(), scenarioOf("jp", hit.episode)])
      if (mine !== seq) return
      if (!jp) {
        state.value = { phase: "error", sid, reason: "missing" }
        return
      }
      const { scn, lang } = await textFor(jp, hit.episode)
      if (mine !== seq) return
      rt.setScript(storyFontScript(lang))
      state.value = { phase: "playing", sid, lang, episode: hit.episode }
      const { canAutoplay } = await import("@/modules/story/engine/story-runtime")
      const autoplay = interacted || (await canAutoplay())
      if (mine !== seq) return
      await rt.load(sid, scn, { index: idx, kind: hit.episode.kind, eventBundle: hit.episode.bundle }, autoplay)
    } catch (error) {
      if (mine !== seq) return
      state.value = { phase: "error", sid, reason: "failed", detail: error instanceof Error ? error.message : String(error) }
    }
  }

  /** The user picked in the page: that click allows sound from now on. */
  function markInteracted() {
    interacted = true
  }

  watch(
    [runtime, options.sid, () => options.catalog.value != null, options.langChain],
    () => void play(options.sid.value),
  )

  return { runtime, state, aiPending, markInteracted, replay: () => play(options.sid.value) }
}
