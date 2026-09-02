import { describe, expect, it } from "bun:test"
import { isMasterCacheCovering, requiredMasterFiles } from "./master-coverage"

describe("master file coverage", () => {
  it("drops the tables some region dumps never ship", () => {
    expect(requiredMasterFiles(["musics", "musicAchievements", "resourceBoxes", "resourceBoxDetails"]))
      .toEqual(["musics", "musicAchievements"])
  })

  it("normalizes names and honours caller-declared optional files", () => {
    expect(requiredMasterFiles(["musics.json", "honorGroups"], ["honorGroups"])).toEqual(["musics"])
  })

  it("treats a jp cache without resourceBoxDetails as covered", () => {
    const jpCache = ["musics", "musicDifficulties", "musicAchievements", "resourceBoxes"]
    const requested = ["musics", "musicDifficulties", "musicAchievements", "resourceBoxes", "resourceBoxDetails"]
    expect(isMasterCacheCovering(jpCache, requested)).toBe(true)
  })

  it("still reports a cache that lacks a required file", () => {
    expect(isMasterCacheCovering(["musics"], ["musics", "musicDifficulties", "resourceBoxDetails"])).toBe(false)
  })
})
