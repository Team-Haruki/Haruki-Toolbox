import { describe, expect, it } from "bun:test"
import { resolveCardFullArtPath, resolveCardFullArtUrl, resolveCardFullArtUrls } from "./card-assets"

describe("card assets", () => {
  it("builds the normal full art path", () => {
    expect(resolveCardFullArtPath("res001_no001", false))
      .toBe("startapp/character/member/res001_no001/card_normal.png")
  })

  it("builds the trained full art path", () => {
    expect(resolveCardFullArtPath("res009_no021", true))
      .toBe("startapp/character/member/res009_no021/card_after_training.png")
  })

  it("returns null for a blank asset bundle name", () => {
    expect(resolveCardFullArtPath("   ", false)).toBeNull()
    expect(resolveCardFullArtUrl("kr", "", true)).toBeNull()
  })

  it("builds region-scoped asset URLs", () => {
    expect(resolveCardFullArtUrl("kr", "res001_no001", false))
      .toBe("https://sekai-assets.haruki.seiunx.com/kr-assets/startapp/character/member/res001_no001/card_normal.png")
    expect(resolveCardFullArtUrl("jp", "res001_no001", true, "global"))
      .toBe("https://sekai-assets-bdf29c81.seiunx.net/jp-assets/startapp/character/member/res001_no001/card_after_training.png")
  })

  it("prefers ondemand for en and startapp elsewhere in candidate order", () => {
    expect(resolveCardFullArtUrls("en", "res001_no001", false)).toEqual([
      "https://sekai-assets.haruki.seiunx.com/en-assets/ondemand/character/member/res001_no001/card_normal.png",
      "https://sekai-assets.haruki.seiunx.com/en-assets/startapp/character/member/res001_no001/card_normal.png",
    ])
    expect(resolveCardFullArtUrls("jp", "res001_no001", true)).toEqual([
      "https://sekai-assets.haruki.seiunx.com/jp-assets/startapp/character/member/res001_no001/card_after_training.png",
      "https://sekai-assets.haruki.seiunx.com/jp-assets/ondemand/character/member/res001_no001/card_after_training.png",
    ])
    expect(resolveCardFullArtUrls("en", "  ", false)).toEqual([])
  })
})
