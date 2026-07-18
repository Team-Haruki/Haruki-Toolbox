import { describe, expect, test } from "bun:test"
import {
  resolveEventBackgroundUrl,
  resolveEventBannerUrl,
  resolveEventLogoUrl,
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
})
