import { describe, expect, it } from "bun:test"
import { SEKAI_CARD_ATTRS } from "./catalog"
import { resolveCardAttrIconUrl, resolveCardAttrRoundIconUrl } from "./data-sources"

describe("attribute icons", () => {
  it("serves the round icon from the app bundle and the thumbnail icon from the host", () => {
    for (const attr of SEKAI_CARD_ATTRS) {
      // The five round PNGs live in public/assets/attr/ and are precached.
      expect(resolveCardAttrRoundIconUrl(attr)).toBe(`/assets/attr/attr_icon_${attr}.png`)
      // The thumbnail-corner icon is a different asset and was not replaced.
      expect(resolveCardAttrIconUrl(attr)).toBe(
        `https://images.haruki.seiunx.com/sekai-toolbox/static_images/card/attr_${attr}.png`,
      )
    }
  })
})
