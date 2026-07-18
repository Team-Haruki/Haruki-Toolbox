import { describe, expect, it } from "bun:test"
import { resolveCardFullArtPath, resolveCardFullArtUrl } from "./card-assets"

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
})
