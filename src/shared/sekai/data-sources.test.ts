import { describe, expect, it } from "bun:test"
import {
  normalizeSekaiMasterVersionInfo,
  resolveCardAttrIconUrl,
  resolveCharacterIconUrl,
  resolveMySekaiCanvasIconUrl,
  resolveRarityTrainingIconUrl,
  resolveSekaiMasterFetchVersion,
  resolveSekaiMasterFileUrl,
  resolveSekaiMasterVersionUrl,
  resolveSekaiCardThumbnailUrl,
  resolveSekaiMusicMetasUrl,
} from "./data-sources"

describe("Sekai data source helpers", () => {
  it("uses dataVersion for JP and EN master files", () => {
    const versionInfo = { dataVersion: "2026052001", cdnVersion: "cdn-1" }
    expect(resolveSekaiMasterFetchVersion("jp", versionInfo)).toBe("2026052001")
    expect(resolveSekaiMasterFetchVersion("en", versionInfo)).toBe("2026052001")
  })

  it("uses cdnVersion for TW, KR, and CN master files when available", () => {
    const versionInfo = { dataVersion: "2026052001", cdnVersion: "cdn-1" }
    expect(resolveSekaiMasterFetchVersion("tw", versionInfo)).toBe("cdn-1")
    expect(resolveSekaiMasterFetchVersion("kr", versionInfo)).toBe("cdn-1")
    expect(resolveSekaiMasterFetchVersion("cn", versionInfo)).toBe("cdn-1")
  })

  it("builds version and master file URLs", () => {
    expect(resolveSekaiMasterVersionUrl("jp", 1)).toBe(
      "https://sekai-master-cdn.haruki.seiunx.com/haruki-sekai-master/versions/current_version.json?t=1000000",
    )
    expect(resolveSekaiMasterFileUrl("cn", "events.json", { dataVersion: "1", cdnVersion: "2" })).toBe(
      "https://sekai-master-cdn.haruki.seiunx.com/haruki-sekai-sc-master/master/events.json?version=2",
    )
  })

  it("builds music metas URLs with optional cache keys", () => {
    expect(resolveSekaiMusicMetasUrl("jp")).toBe(
      "https://sekai-master-cdn.haruki.seiunx.com/music_metas.json",
    )
    expect(resolveSekaiMusicMetasUrl("tw", "etag 1")).toBe(
      "https://sekai-master-cdn.haruki.seiunx.com/music_metas-tc.json?v=etag%201",
    )
  })

  it("normalizes version payloads and character icon URLs", () => {
    expect(normalizeSekaiMasterVersionInfo({ dataVersion: 123, cdnVersion: "" })).toEqual({
      dataVersion: "123",
      cdnVersion: null,
    })
    expect(resolveCharacterIconUrl(5)).toBe(
      "https://images.haruki.seiunx.com/sekai-toolbox/static_images/chara_icon/mnr.png",
    )
  })

  it("builds toolbox static image URLs for deck recommend UI assets", () => {
    expect(resolveRarityTrainingIconUrl("rarity_4")).toBe(
      "https://images.haruki.seiunx.com/sekai-toolbox/static_images/card/rare_star_after_training.png",
    )
    expect(resolveRarityTrainingIconUrl("rarity_2")).toBe(
      "https://images.haruki.seiunx.com/sekai-toolbox/static_images/card/rare_star_normal.png",
    )
    expect(resolveRarityTrainingIconUrl("rarity_birthday")).toBe(
      "https://images.haruki.seiunx.com/sekai-toolbox/static_images/card/rare_birthday.png",
    )
    expect(resolveCardAttrIconUrl("cute")).toBe(
      "https://images.haruki.seiunx.com/sekai-toolbox/static_images/card/attr_cute.png",
    )
    expect(resolveMySekaiCanvasIconUrl()).toBe(
      "https://images.haruki.seiunx.com/sekai-toolbox/static_images/mysekai/icon/icon_canvas.png",
    )
  })

  it("builds game asset URLs from the selected asset endpoint", () => {
    expect(resolveSekaiCardThumbnailUrl("jp", "res005_no001", true, "china")).toBe(
      "https://sekai-assets.haruki.seiunx.com/jp-assets/startapp/thumbnail/chara/res005_no001_after_training.png",
    )
    expect(resolveSekaiCardThumbnailUrl("jp", "res005_no001", false, "global")).toBe(
      "https://sekai-assets-bdf29c81.seiunx.net/jp-assets/startapp/thumbnail/chara/res005_no001_normal.png",
    )
  })

  it("defaults game asset URLs to the China-accelerated overseas CDN", () => {
    expect(resolveSekaiCardThumbnailUrl("jp", "res005_no001", false)).toBe(
      "https://sekai-assets.haruki.seiunx.com/jp-assets/startapp/thumbnail/chara/res005_no001_normal.png",
    )
  })
})
