import { ref, shallowRef, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { getStoryTranslation } from "@/modules/story/api/story"
import type { StoryCatalog, StoryEpisode } from "@/modules/story/lib/story-catalog"
import { ScenarioCache, fetchScenarioJson, fetchStoryAssetIndex } from "@/modules/story/lib/story-fetch"
import {
  STORY_LANG_REGIONS,
  STORY_TEXT_LANGS,
  applyRegionText,
  applyTranslation,
  isPlaceholderText,
  storyFontScript,
  type StoryTextLang,
} from "@/modules/story/lib/story-text"
import type { ScenarioSceneData } from "pjsk-scenario-player"
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
  /** Text languages the current episode has, in selector order. */
  const available = ref<StoryTextLang[]>([])
  const scenarios = new ScenarioCache<ScenarioSceneData>()
  let index: Promise<StoryAssetIndex> | null = null
  let seq = 0
  let interacted = false

  const loadIndex = () => {
    index ??= fetchStoryAssetIndex(`${options.assetRoot.value}/jp-assets`).catch((error: unknown) => {
      index = null
      throw error
    })
    return index
  }

  const scenarioOf = (region: SekaiRegion, episode: StoryEpisode) =>
    scenarios.get(`${region}:${episode.sid}`, () =>
      fetchScenarioJson<ScenarioSceneData>(options.assetRoot.value, region, episode.paths))

  /**
   * Every text language this episode has: JP, each region whose file holds
   * real (aligned, non-placeholder) text, and the AI translation only when
   * there is no official Simplified Chinese. Fetched in parallel and cached.
   */
  async function textsFor(jp: ScenarioSceneData, episode: StoryEpisode): Promise<Map<StoryTextLang, ScenarioSceneData>> {
    const texts = new Map<StoryTextLang, ScenarioSceneData>([["ja", jp]])
    await Promise.all(STORY_TEXT_LANGS.map(async (lang) => {
      const region = STORY_LANG_REGIONS[lang]
      if (!region || region === "jp") return
      try {
        const other = await scenarioOf(region, episode)
        const scn = other && !isPlaceholderText(other) ? applyRegionText(jp, other) : null
        if (scn) texts.set(lang, scn)
      } catch (error) {
        console.warn("story text unavailable", lang, error)
      }
    }))
    aiPending.value = false
    if (!texts.has("zh-Hans")) {
      try {
        const result = await getStoryTranslation(episode.sid)
        aiPending.value = result.status === "pending"
        const scn = result.status === "done" ? applyTranslation(jp, result.translation) : null
        if (scn) texts.set("zh-Hans-ai", scn)
      } catch (error) {
        console.warn("story AI translation unavailable", error)
      }
    }
    return texts
  }

  async function play(sid: string | null) {
    const rt = runtime.value
    const catalog = options.catalog.value
    const mine = ++seq
    if (!rt) return
    if (!sid) {
      available.value = []
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
      const texts = await textsFor(jp, hit.episode)
      if (mine !== seq) return
      available.value = STORY_TEXT_LANGS.filter((l) => texts.has(l))
      const lang = options.langChain.value.find((l) => texts.has(l)) ?? "ja"
      const scn = texts.get(lang) ?? jp
      rt.setScript(storyFontScript(lang))
      state.value = { phase: "playing", sid, lang, episode: hit.episode }
      const { canAutoplay } = await import("@/modules/story/engine/story-runtime")
      const autoplay = interacted || (await canAutoplay())
      if (mine !== seq) return
      const context = { index: idx, kind: hit.episode.kind, eventBundle: hit.episode.bundle, character2ds: catalog.character2ds }
      await rt.load(sid, scn, context, autoplay)
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

  return { runtime, state, aiPending, available, markInteracted, replay: () => play(options.sid.value) }
}
