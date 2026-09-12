import { describe, expect, it } from "bun:test"
import {
  formatSekaiMasterVersionLabel,
  manifestListsSekaiMasterFile,
  normalizeSekaiMasterVersionInfo,
  resolveCardAttrIconUrl,
  resolveCharacterIconUrl,
  resolveMySekaiCanvasIconUrl,
  resolvePjsk3dRuntimeBaseUrl,
  resolveRarityTrainingIconUrl,
  resolveSekaiMasterFetchVersion,
  resolveSekaiMasterFileUrl,
  resolveSekaiMasterVersionUrl,
  resolveSekaiCardThumbnailUrl,
  resolveSekaiMusicMetasUrl,
} from "./data-sources"

const EVENTS_SHA = "964435fc0cbde3934ea91d389f292f87633e77c5815dca0da6f4e1648a23bc37"
const CONTENT_HASH = "340301d8014615b16d25976083546c36774a0d2b400b2d54486dff3bce5880e7"

function legacyVersionInfo(dataVersion: string, cdnVersion: string | null) {
  return { dataVersion, cdnVersion, contentHash: null, files: {} }
}

describe("Sekai data source helpers", () => {
  it("uses dataVersion for JP and EN master files without a manifest hash", () => {
    const versionInfo = legacyVersionInfo("2026052001", "cdn-1")
    expect(resolveSekaiMasterFetchVersion("jp", versionInfo)).toBe("2026052001")
    expect(resolveSekaiMasterFetchVersion("en", versionInfo)).toBe("2026052001")
  })

  it("uses cdnVersion for TW, KR, and CN master files when available", () => {
    const versionInfo = legacyVersionInfo("2026052001", "cdn-1")
    expect(resolveSekaiMasterFetchVersion("tw", versionInfo)).toBe("cdn-1")
    expect(resolveSekaiMasterFetchVersion("kr", versionInfo)).toBe("cdn-1")
    expect(resolveSekaiMasterFetchVersion("cn", versionInfo)).toBe("cdn-1")
  })

  it("keys the cache by the registry contentHash whenever the manifest carries one", () => {
    const versionInfo = { ...legacyVersionInfo("2026052001", "cdn-1"), contentHash: CONTENT_HASH }
    expect(resolveSekaiMasterFetchVersion("jp", versionInfo)).toBe(CONTENT_HASH)
    expect(resolveSekaiMasterFetchVersion("cn", versionInfo)).toBe(CONTENT_HASH)
  })

  it("formats user-facing master versions by region", () => {
    expect(formatSekaiMasterVersionLabel("jp", "6.5.0.51", "123")).toBe("6.5.0.51")
    expect(formatSekaiMasterVersionLabel("en", "6.5.0.51", "123")).toBe("6.5.0.51")
    expect(formatSekaiMasterVersionLabel("tw", "6.0.0.33", "145")).toBe("6.0.0.33 (145)")
    expect(formatSekaiMasterVersionLabel("kr", "6.0.0.33", "145")).toBe("6.0.0.33 (145)")
    expect(formatSekaiMasterVersionLabel("cn", "6.0.0.33", "145")).toBe("6.0.0.33 (145)")
  })

  it("builds the registry manifest URL and master file URLs", () => {
    expect(resolveSekaiMasterVersionUrl("jp", 1)).toBe(
      "https://sekai-api-cdn.haruki.seiunx.com/v1/master/jp/current?t=1000000",
    )
    // Files the manifest lists resolve to the immutable blob.
    const manifest = {
      ...legacyVersionInfo("1", "2"),
      contentHash: CONTENT_HASH,
      files: { events: EVENTS_SHA },
    }
    expect(resolveSekaiMasterFileUrl("cn", "events.json", manifest)).toBe(
      `https://sekai-api-cdn.haruki.seiunx.com/v1/master/cn/blob/${EVENTS_SHA}`,
    )
    // Unlisted files and legacy manifests fall back to the mutable pointer.
    expect(resolveSekaiMasterFileUrl("cn", "resourceBoxes", manifest)).toBe(
      `https://sekai-api-cdn.haruki.seiunx.com/v1/master/cn/files/resourceBoxes.json?version=${CONTENT_HASH}`,
    )
    expect(resolveSekaiMasterFileUrl("cn", "events.json", legacyVersionInfo("1", "2"))).toBe(
      "https://sekai-api-cdn.haruki.seiunx.com/v1/master/cn/files/events.json?version=2",
    )
    expect(resolveSekaiMasterFileUrl("jp", "cards", "v-9")).toBe(
      "https://sekai-api-cdn.haruki.seiunx.com/v1/master/jp/files/cards.json?version=v-9",
    )
  })

  it("reports manifest membership only when the manifest lists files", () => {
    const manifest = { ...legacyVersionInfo("1", null), files: { events: EVENTS_SHA } }
    expect(manifestListsSekaiMasterFile(manifest, "events.json")).toBe(true)
    expect(manifestListsSekaiMasterFile(manifest, "resourceBoxes")).toBe(false)
    expect(manifestListsSekaiMasterFile(legacyVersionInfo("1", null), "events")).toBeNull()
  })

  it("builds music metas URLs with optional cache keys", () => {
    expect(resolveSekaiMusicMetasUrl("jp")).toBe(
      "https://sekai-api-cdn.haruki.seiunx.com/v1/metas/jp/music_metas.json",
    )
    expect(resolveSekaiMusicMetasUrl("tw", "etag 1")).toBe(
      "https://sekai-api-cdn.haruki.seiunx.com/v1/metas/tw/music_metas.json?v=etag%201",
    )
  })

  it("normalizes registry manifests, legacy payloads, and character icon URLs", () => {
    expect(normalizeSekaiMasterVersionInfo({ dataVersion: 123, cdnVersion: "" })).toEqual({
      dataVersion: "123",
      cdnVersion: null,
      contentHash: null,
      files: {},
    })
    expect(
      normalizeSekaiMasterVersionInfo({
        server: "cn",
        dataVersion: "6.0.0.58",
        cdnVersion: 167,
        contentHash: ` ${CONTENT_HASH} `,
        gitCommit: "14abed6c",
        files: [
          { name: "events.json", size: 5502, sha256: EVENTS_SHA },
          { name: "broken.json", size: 1 },
          { name: "bad.json", size: 1, sha256: "not-a-digest" },
          "junk",
        ],
      }),
    ).toEqual({
      dataVersion: "6.0.0.58",
      cdnVersion: "167",
      contentHash: CONTENT_HASH,
      files: { events: EVENTS_SHA },
    })
    expect(() => normalizeSekaiMasterVersionInfo({ cdnVersion: "1" })).toThrow()
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

  it("serves the 3D runtime from the china endpoint when china_cdn is selected", () => {
    expect(resolvePjsk3dRuntimeBaseUrl("jp", "china_cdn")).toBe(
      "https://sekai-assets.haruki.seiunx.com/pjsk-3d-output/jp/",
    )
    expect(resolvePjsk3dRuntimeBaseUrl("jp", "global")).toBe(
      "https://sekai-assets-bdf29c81.seiunx.net/pjsk-3d-output/jp/",
    )
    expect(resolvePjsk3dRuntimeBaseUrl("cn")).toBe(
      "https://sekai-assets.haruki.seiunx.com/pjsk-3d-output/cn/",
    )
  })
})
