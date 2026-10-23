import { beforeEach, describe, expect, test } from "bun:test"
import type { LoadContext, ModelManifestEntry, ScenarioSceneData } from "pjsk-scenario-player"
import {
  configureStoryRoot,
  createStoryResolver,
  partVoiceDirs,
  storyClipUrl,
  storyUrls,
  type StoryAssetIndex,
  type StoryEpisodeContext,
} from "@/modules/story/engine/urls"
import { SEKAI_ASSET_ENDPOINT_ROOTS } from "@/shared/sekai/data-sources"

const index: StoryAssetIndex = {
  version: "v",
  models: {
    "10an_normal": {
      dir: "startapp/live2d/model/v1/main/10_an/10an_normal",
      model3: "10an_normal_t05.model3",
      physics: "10an_normal_t05.physics3",
      motionBase: "startapp/live2d/motion/v1/main/10_an/10an_motion_base",
      motions: ["w-own-clip01"],
    },
    "10an_casual": {
      dir: "startapp/live2d/model/v1/main/10_an/10an_casual",
      model3: "10an_casual_t01.model3",
      motionBase: "startapp/live2d/motion/v1/main/10_an/10an_motion_base",
      motions: ["w-sibling-clip01"],
    },
  },
  movies: { op: "ondemand/movie/op/op.mp4" },
  se: { se_door: "startapp/sound/scenario/se/se/se_door.mp3" },
}

const ROOT = "https://assets.example/jp-assets"
const ctx = (episode: StoryEpisodeContext): LoadContext => ({ scenario: {} as ScenarioSceneData, data: episode })
const eventCtx = ctx({ index, kind: "event", eventBundle: "event_x" })
const an = index.models["10an_normal"]
const anEntry = an as unknown as ModelManifestEntry

beforeEach(() => {
  configureStoryRoot(`${ROOT}/`)
})

describe("storyClipUrl", () => {
  test("resolves clips: own motions, a sibling costume's, then the shared library (lower-case)", () => {
    expect(storyClipUrl(index, an, "motion", "W-Own-Clip01")).toBe(`${ROOT}/${an.dir}/motions/w-own-clip01.motion3.json`)
    expect(storyClipUrl(index, an, "motion", "w-sibling-clip01")).toBe(`${ROOT}/startapp/live2d/model/v1/main/10_an/10an_casual/motions/w-sibling-clip01.motion3.json`)
    expect(storyClipUrl(index, an, "motion", "w-normal-pose01")).toBe(`${ROOT}/${an.motionBase}/motion/w-normal-pose01.motion3.json`)
    expect(storyClipUrl(index, an, "facial", "Face_Smile_01")).toBe(`${ROOT}/${an.motionBase}/facial/face_smile_01.motion3.json`)
  })

  test("has no clip for a costume without a motion library", () => {
    expect(storyClipUrl(index, { dir: "startapp/live2d/model/x", model3: "x.model3" }, "facial", "face")).toBeNull()
  })
})

describe("createStoryResolver", () => {
  const r = createStoryResolver()

  test("points the player at the model3 and its physics", () => {
    expect(r.model(anEntry, eventCtx)).toBe(`${ROOT}/${an.dir}/${an.model3}`)
    expect(r.physics?.(anEntry, eventCtx)).toBe("10an_normal_t05.physics3")
    expect(r.physics?.(index.models["10an_casual"] as unknown as ModelManifestEntry, eventCtx)).toBeNull()
  })

  test("uses the shared SE when it exists, else the event's own folder", () => {
    expect(r.se("se_door", eventCtx)).toEqual([`${ROOT}/startapp/sound/scenario/se/se/se_door.mp3`])
    expect(r.se("se_event_only", eventCtx)).toEqual([`${ROOT}/ondemand/event_story/event_x/scenario_se/se_event_only.mp3`])
    expect(r.se("se_event_only", ctx({ index, kind: "unit" }))).toEqual([])
  })

  test("tries card voices first for card stories", () => {
    expect((r.voice("s", "v", eventCtx, {}) as string[])[0]).toBe(`${ROOT}/ondemand/sound/scenario/voice/s/v.mp3`)
    const card = r.voice("s", "v", ctx({ index, kind: "card" }), {}) as string[]
    expect(card[0]).toBe(`${ROOT}/ondemand/sound/card_scenario/voice/s/v.mp3`)
    expect(card).toHaveLength(3)
  })

  test("looks in the additional voice pack first for area talk", () => {
    const area = r.voice("areatalk02_007", "areatalk_2_007_001", ctx({ index, kind: "area" }), {}) as string[]
    expect(area[0]).toBe(`${ROOT}/additionalvoice/sound/actionset/voice/areatalk02_007/areatalk_2_007_001.mp3`)
    expect(area).toHaveLength(4)
  })

  test("files part voices by the speaker's model asset and unit", () => {
    const character2ds = new Map([
      [1, { assetName: "01ichika", unit: "light_sound" }],
      [21, { assetName: "21miku", unit: "none" }],
      [300, { assetName: "v2_10an", unit: "street" }],
    ])
    const sp = ctx({ index, kind: "special", character2ds })
    const urls = r.voice("sp_01", "partvoice_01_001", sp, { character2dId: 1 }) as string[]
    expect(urls.slice(0, 4)).toEqual([
      `${ROOT}/startapp/sound/scenario/voice/part_voice_v2_01ichika_light_sound/partvoice_01_001.mp3`,
      `${ROOT}/startapp/sound/scenario/voice/part_voice_01ichika_light_sound/partvoice_01_001.mp3`,
      `${ROOT}/startapp/sound/scenario/voice/part_voice_01ichika/partvoice_01_001.mp3`,
      `${ROOT}/tutorial/sound/scenario/part_voice/01ichika_light_sound/partvoice_01_001.mp3`,
    ])
    expect(urls).toHaveLength(7) // then the scenario folders
    const ep = { index, kind: "special", character2ds }
    expect(partVoiceDirs(ep, { character2dId: 21 })[0]).toBe("startapp/sound/scenario/voice/part_voice_v2_21miku_piapro")
    expect(partVoiceDirs(ep, { character2dId: 300 })[0]).toBe("startapp/sound/scenario/voice/part_voice_v2_10an_street")
    expect(partVoiceDirs(ep, { character2dId: 999 })).toEqual([])
    expect(r.voice("s", "v001", sp, { character2dId: 1 })).toHaveLength(3) // not a part voice
  })

  test("maps movies through the index", () => {
    expect(r.movie("op", eventCtx)).toBe(`${ROOT}/ondemand/movie/op/op.mp4`)
    expect(r.movie("missing", eventCtx)).toBeNull()
  })

  test("serves the player's own files from story-player/v1", () => {
    expect(r.ui("menu/btn.png")).toBe(`${ROOT}/story-player/v1/ui/menu/btn.png`)
    expect(r.fx("bg/index.json")).toBe(`${ROOT}/story-player/v1/fx/bg/index.json`)
  })
})

describe("the fallback host", () => {
  const FALLBACK = "https://global.example/jp-assets"
  const r = createStoryResolver()

  beforeEach(() => {
    configureStoryRoot(`${ROOT}/`, `${FALLBACK}/`)
  })

  test("keeps candidate lists on the chosen host (the player asks fallback() when a host fails)", () => {
    expect(r.bgm("01_an_02", eventCtx)).toEqual([
      `${ROOT}/ondemand/sound/scenario/bgm/01_an_02/01_an_02.mp3`,
      `${ROOT}/startapp/sound/scenario/bgm/01_an_02/01_an_02.mp3`,
    ])
    expect(r.se("se_door", eventCtx)).toEqual([`${ROOT}/startapp/sound/scenario/se/se/se_door.mp3`])
    expect(r.se("se_event_only", ctx({ index, kind: "unit" }))).toEqual([])
    expect(r.voice("areatalk02_007", "areatalk_2_007_001", ctx({ index, kind: "area" }), {})).toHaveLength(4)
    expect(r.background("bg_a000301", eventCtx)).toHaveLength(3)
  })

  test("names every file's copy on the fallback host through fallback()", () => {
    const voice = `${ROOT}/additionalvoice/sound/actionset/voice/areatalk02_007/areatalk_2_007_001.mp3`
    expect(r.fallback?.(voice)).toBe(`${FALLBACK}/additionalvoice/sound/actionset/voice/areatalk02_007/areatalk_2_007_001.mp3`)
    // files a model3 names, relative to it
    expect(r.fallback?.(`${ROOT}/${an.dir}/an.4096/texture_00.png`)).toBe(`${FALLBACK}/${an.dir}/an.4096/texture_00.png`)
    expect(r.fallback?.(r.ui("menu/btn.png"))).toBe(`${FALLBACK}/story-player/v1/ui/menu/btn.png`)
    expect(r.fallback?.("https://elsewhere.example/a.png")).toBeNull()
  })

  test("leaves single-URL assets on the chosen host", () => {
    expect(r.model(anEntry, eventCtx)).toBe(`${ROOT}/${an.dir}/${an.model3}`)
    expect(r.movie("op", eventCtx)).toBe(`${ROOT}/ondemand/movie/op/op.mp4`)
  })

  test("maps the host's own URLs to the fallback host", () => {
    expect(storyUrls.fallback(storyUrls.fonts("SourceHanSansJP-Bold.otf"))).toBe(
      `${FALLBACK}/story-player/v1/fonts/SourceHanSansJP-Bold.otf`,
    )
    expect(storyUrls.fallback(storyUrls.asset("startapp/story/episode_image/a.png"))).toBe(
      `${FALLBACK}/startapp/story/episode_image/a.png`,
    )
    expect(storyUrls.fallback("https://elsewhere.example/a.png")).toBeNull()
  })

  test("maps a China CDN URL made before the session moved to the global host", () => {
    const cn = `${SEKAI_ASSET_ENDPOINT_ROOTS.china_cdn}/jp-assets`
    const global = `${SEKAI_ASSET_ENDPOINT_ROOTS.global}/jp-assets`
    configureStoryRoot(global) // the session plays from the fallback host now
    expect(r.fallback?.(`${cn}/story-player/v1/lib/live2dcubismcore.min.js`)).toBe(`${global}/story-player/v1/lib/live2dcubismcore.min.js`)
    expect(r.fallback?.(`${global}/story-player/v1/ui/menu/btn.png`)).toBeNull()
  })

  test("has no fallback on the global host itself or without one", () => {
    configureStoryRoot(FALLBACK, FALLBACK)
    expect(storyUrls.fallback(storyUrls.asset("a.png"))).toBeNull()
    expect(r.fallback?.(storyUrls.asset("a.png"))).toBeNull()
    configureStoryRoot(ROOT)
    expect(storyUrls.fallback(storyUrls.asset("a.png"))).toBeNull()
    expect(r.fallback?.(storyUrls.asset("a.png"))).toBeNull()
  })
})
