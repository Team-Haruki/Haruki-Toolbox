import { describe, expect, test } from "bun:test"
import {
  resolveEventBackgroundUrl,
  resolveEventBannerUrl,
  resolveEventHonorRankOverlayUrl,
  resolveEventLogoUrl,
  resolveEventTeamImageUrl,
} from "./event-assets"

describe("event-assets", () => {
  test("resolveEventLogoUrl builds the ondemand logo path", () => {
    expect(resolveEventLogoUrl("kr", "event_stella_2020")).toBe(
      "https://sekai-assets.haruki.seiunx.com/kr-assets/ondemand/event/event_stella_2020/logo/logo.png",
    )
  })

  test("resolveEventBannerUrl builds the event story banner path", () => {
    expect(resolveEventBannerUrl("jp", "event_colorcross_2025")).toBe(
      "https://sekai-assets.haruki.seiunx.com/jp-assets/ondemand/event_story/event_colorcross_2025/screen_image/banner_event_story.png",
    )
  })

  test("resolveEventBackgroundUrl builds the screen bg path", () => {
    expect(resolveEventBackgroundUrl("kr", "event_underwater_2023")).toBe(
      "https://sekai-assets.haruki.seiunx.com/kr-assets/ondemand/event/event_underwater_2023/screen/bg.png",
    )
  })

  test("uses the global endpoint root when requested", () => {
    expect(resolveEventLogoUrl("kr", "event_stella_2020", "global")).toBe(
      "https://sekai-assets-bdf29c81.seiunx.net/kr-assets/ondemand/event/event_stella_2020/logo/logo.png",
    )
  })

  test("returns null for missing assetbundleName", () => {
    expect(resolveEventLogoUrl("kr", null)).toBeNull()
    expect(resolveEventBannerUrl("kr", "")).toBeNull()
    expect(resolveEventBackgroundUrl("kr", "   ")).toBeNull()
  })

  test("trims assetbundleName", () => {
    expect(resolveEventLogoUrl("kr", " event_stella_2020 ")).toBe(
      "https://sekai-assets.haruki.seiunx.com/kr-assets/ondemand/event/event_stella_2020/logo/logo.png",
    )
  })

  test("resolveEventTeamImageUrl builds the cheerful carnival team path", () => {
    expect(resolveEventTeamImageUrl("jp", "event_cheerfutest2_2025", "event_cheerfutest2_2025_item_1")).toBe(
      "https://sekai-assets.haruki.seiunx.com/jp-assets/ondemand/event/event_cheerfutest2_2025/team_image/event_cheerfutest2_2025_item_1.png",
    )
    expect(resolveEventTeamImageUrl("jp", "event_cheerfutest2_2025", null)).toBeNull()
    expect(resolveEventTeamImageUrl("jp", "", "team")).toBeNull()
  })

  test("resolveEventHonorRankOverlayUrl builds the rank plate path", () => {
    expect(resolveEventHonorRankOverlayUrl("jp", "honor_top_000100")).toBe(
      "https://sekai-assets.haruki.seiunx.com/jp-assets/startapp/honor/honor_top_000100/rank_main.png",
    )
    expect(resolveEventHonorRankOverlayUrl("jp", "  ")).toBeNull()
  })
})
