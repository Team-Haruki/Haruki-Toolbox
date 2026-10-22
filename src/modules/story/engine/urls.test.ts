import { beforeEach, describe, expect, test } from "bun:test"
import type { LoadContext, ModelManifestEntry, ScenarioSceneData } from "pjsk-scenario-player"
import {
  configureStoryRoot,
  createStoryResolver,
  storyClipUrl,
  type StoryAssetIndex,
  type StoryEpisodeContext,
} from "@/modules/story/engine/urls"

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
    expect((r.voice("s", "v", eventCtx) as string[])[0]).toBe(`${ROOT}/ondemand/sound/scenario/voice/s/v.mp3`)
    const card = r.voice("s", "v", ctx({ index, kind: "card" })) as string[]
    expect(card[0]).toBe(`${ROOT}/ondemand/sound/card_scenario/voice/s/v.mp3`)
    expect(card).toHaveLength(3)
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
