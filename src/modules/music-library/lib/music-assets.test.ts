import { describe, expect, it } from "bun:test"
import { buildMusicJacketAssetPath, resolveMusicJacketUrl } from "./music-assets"
import {
  MUSIC_DIFFICULTIES,
  MUSIC_DIFFICULTY_COLORS,
  isMusicDifficulty,
  normalizeMusicDifficulty,
} from "./music-difficulties"
import {
  resolveMusicCategoryLabelKey,
  resolveMusicTagLabelKey,
  resolveMusicVocalTypeLabelKey,
} from "./music-labels"

describe("buildMusicJacketAssetPath", () => {
  it("builds the verified jacket path pattern", () => {
    expect(buildMusicJacketAssetPath("jacket_s_001")).toBe(
      "startapp/music/jacket/jacket_s_001/jacket_s_001.png",
    )
  })

  it("returns null for blank asset bundle names", () => {
    expect(buildMusicJacketAssetPath("")).toBeNull()
    expect(buildMusicJacketAssetPath("   ")).toBeNull()
  })
})

describe("resolveMusicJacketUrl", () => {
  it("resolves a full region asset URL", () => {
    expect(resolveMusicJacketUrl("kr", "jacket_s_001", "china")).toBe(
      "https://sekai-assets.haruki.seiunx.com/kr-assets/startapp/music/jacket/jacket_s_001/jacket_s_001.png",
    )
  })

  it("returns null when the asset bundle name is missing", () => {
    expect(resolveMusicJacketUrl("jp", "")).toBeNull()
  })
})

describe("music difficulties", () => {
  it("covers all six difficulties with colors", () => {
    expect(MUSIC_DIFFICULTIES).toEqual(["easy", "normal", "hard", "expert", "master", "append"])
    for (const difficulty of MUSIC_DIFFICULTIES) {
      expect(MUSIC_DIFFICULTY_COLORS[difficulty]).toMatch(/^#[0-9A-F]{6}$/i)
    }
  })

  it("validates and normalizes difficulty values", () => {
    expect(isMusicDifficulty("master")).toBe(true)
    expect(isMusicDifficulty("ultra")).toBe(false)
    expect(normalizeMusicDifficulty(" Expert ")).toBe("expert")
    expect(normalizeMusicDifficulty(42)).toBeNull()
  })
})

describe("music label keys", () => {
  it("maps known values to i18n keys", () => {
    expect(resolveMusicTagLabelKey("vocaloid")).toBe("musicLibrary.tags.vocaloid")
    expect(resolveMusicCategoryLabelKey("mv_2d")).toBe("musicLibrary.categories.mv_2d")
    expect(resolveMusicVocalTypeLabelKey("sekai")).toBe("musicLibrary.vocalTypes.sekai")
  })

  it("returns null for unknown values so views can fall back to raw text", () => {
    expect(resolveMusicTagLabelKey("brand_new_tag")).toBeNull()
    expect(resolveMusicCategoryLabelKey("hologram")).toBeNull()
    expect(resolveMusicVocalTypeLabelKey("april_fool_2030")).toBeNull()
  })
})
