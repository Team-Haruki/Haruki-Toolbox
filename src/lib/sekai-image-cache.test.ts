import { describe, expect, test } from "bun:test"
import { isCachedSekaiImage } from "@/lib/sekai-image-cache"

const CN = "https://sekai-assets.haruki.seiunx.com"
const GLOBAL = "https://sekai-assets-bdf29c81.seiunx.net"

describe("isCachedSekaiImage", () => {
  test("caches catalog images on every asset host", () => {
    expect(isCachedSekaiImage(`${CN}/jp-assets/startapp/thumbnail/chara/res001_no001_normal.png`)).toBe(true)
    expect(isCachedSekaiImage(`${GLOBAL}/jp-assets/ondemand/event_story/event_whip_2024/episode_image/event_whip_2024_01.png`)).toBe(true)
    expect(isCachedSekaiImage("https://images.haruki.seiunx.com/jacket/jacket_s_001.webp?v=2")).toBe(true)
  })

  test("leaves latency probes and other hosts on the network", () => {
    expect(isCachedSekaiImage(`${CN}/asset-probe.png`)).toBe(false)
    expect(isCachedSekaiImage(`${CN}/asset-probe.png?_latency=1`)).toBe(false)
    expect(isCachedSekaiImage("https://example.com/jp-assets/startapp/thumbnail/a.png")).toBe(false)
    expect(isCachedSekaiImage(`${CN}/jp-assets/startapp/live2d/model/v1/main/10_an/10an_normal/10an_normal_3.0_t05.moc3`)).toBe(false)
  })

  test("leaves the story player's textures, backgrounds and sprites to the HTTP cache", () => {
    expect(isCachedSekaiImage(`${CN}/jp-assets/startapp/live2d/model/v2/main/22_rin/v2_22rin_normal/22rin_normal_3.0_f_t04.2048/texture_00.png`)).toBe(false)
    expect(isCachedSekaiImage(`${GLOBAL}/jp-assets/ondemand/scenario/background/bg_a000301/bg_a000301.png`)).toBe(false)
    expect(isCachedSekaiImage(`${CN}/jp-assets/startapp/scenario/background/bg_c000501/bg_c000501.png`)).toBe(false)
    expect(isCachedSekaiImage(`${CN}/jp-assets/story-player/v1/ui/menu/btn.png`)).toBe(false)
    expect(isCachedSekaiImage(`${CN}/cn-assets/startapp/live2d/model/v1/main/21_miku/21miku_normal/texture_00.png`)).toBe(false)
  })
})
