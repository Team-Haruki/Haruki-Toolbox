import { describe, expect, it } from "bun:test"
import {
  normalizeSekaiMasterVersionInfo,
  resolveCharacterIconUrl,
  resolveSekaiMasterFetchVersion,
  resolveSekaiMasterFileUrl,
  resolveSekaiMasterVersionUrl,
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

  it("normalizes version payloads and character icon URLs", () => {
    expect(normalizeSekaiMasterVersionInfo({ dataVersion: 123, cdnVersion: "" })).toEqual({
      dataVersion: "123",
      cdnVersion: null,
    })
    expect(resolveCharacterIconUrl(5)).toBe(
      "https://images.haruki.seiunx.com/sekai-toolbox/static_images/chara_icon/mnr.png",
    )
  })
})
