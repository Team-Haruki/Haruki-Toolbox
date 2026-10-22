import { beforeEach, describe, expect, test } from "bun:test"
import { configureStoryEpisode, configureStoryRoot, storyUrls, type StoryAssetIndex } from "@/modules/story/engine/urls"

const index: StoryAssetIndex = {
  version: "v",
  models: {
    "10an_normal": {
      dir: "startapp/live2d/model/v1/main/10_an/10an_normal",
      model3: "10an_normal_t05.model3",
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

beforeEach(() => {
  configureStoryRoot(`${ROOT}/`)
  configureStoryEpisode({ index, kind: "event", eventBundle: "event_x" })
})

describe("storyUrls", () => {
  test("resolves clips: own motions, a sibling costume's, then the shared library (lower-case)", () => {
    const an = index.models["10an_normal"]
    expect(storyUrls.clip(an, "motion", "W-Own-Clip01")).toBe(`${ROOT}/${an.dir}/motions/w-own-clip01.motion3.json`)
    expect(storyUrls.clip(an, "motion", "w-sibling-clip01")).toBe(`${ROOT}/startapp/live2d/model/v1/main/10_an/10an_casual/motions/w-sibling-clip01.motion3.json`)
    expect(storyUrls.clip(an, "motion", "w-normal-pose01")).toBe(`${ROOT}/${an.motionBase}/motion/w-normal-pose01.motion3.json`)
    expect(storyUrls.clip(an, "facial", "Face_Smile_01")).toBe(`${ROOT}/${an.motionBase}/facial/face_smile_01.motion3.json`)
  })

  test("uses the shared SE when it exists, else the event's own folder", () => {
    expect(storyUrls.se("se_door")).toEqual([`${ROOT}/startapp/sound/scenario/se/se/se_door.mp3`])
    expect(storyUrls.se("se_event_only")).toEqual([`${ROOT}/ondemand/event_story/event_x/scenario_se/se_event_only.mp3`])
  })

  test("tries card voices first for card stories", () => {
    expect(storyUrls.voice("s", "v")[0]).toBe(`${ROOT}/ondemand/sound/scenario/voice/s/v.mp3`)
    configureStoryEpisode({ index, kind: "card" })
    expect(storyUrls.voice("s", "v")[0]).toBe(`${ROOT}/ondemand/sound/card_scenario/voice/s/v.mp3`)
    expect(storyUrls.voice("s", "v")).toHaveLength(3)
  })

  test("maps movies through the index", () => {
    expect(storyUrls.movie("op")).toBe(`${ROOT}/ondemand/movie/op/op.mp4`)
    expect(storyUrls.movie("missing")).toBeNull()
  })
})
