import { describe, expect, test } from "bun:test"
import { buildStoryPlayerLink, firstPlayableScenario } from "@/modules/story/lib/story-link"

describe("buildStoryPlayerLink", () => {
  test("opens the story player on the episode", () => {
    expect(buildStoryPlayerLink("event_107_01")).toEqual({ name: "story.player", query: { scenario: "event_107_01" } })
  })
})

describe("firstPlayableScenario", () => {
  const episodes = [{ scenarioId: null }, { scenarioId: "event_107_01" }, { scenarioId: "event_107_02" }]

  test("picks the first episode with a scenario", () => {
    expect(firstPlayableScenario(episodes, 1000, 2000)).toBe("event_107_01")
    expect(firstPlayableScenario(episodes, null, 0)).toBe("event_107_01")
  })

  test("offers nothing before release or without scenarios", () => {
    expect(firstPlayableScenario(episodes, 3000, 2000)).toBeNull()
    expect(firstPlayableScenario([{ scenarioId: null }], 1000, 2000)).toBeNull()
    expect(firstPlayableScenario([], 1000, 2000)).toBeNull()
  })
})
