import { describe, expect, it } from "bun:test"
import { resolveCostumeContentBaseUrl } from "./costume-content"

describe("resolveCostumeContentBaseUrl", () => {
  it("points the 3D kernel at the region's content on the selected API endpoint", () => {
    expect(resolveCostumeContentBaseUrl("https://toolbox-api.example", "jp")).toBe(
      "https://toolbox-api.example/api/misc/costume3d/jp/",
    )
    expect(resolveCostumeContentBaseUrl("https://toolbox-api.example/", "tw")).toBe(
      "https://toolbox-api.example/api/misc/costume3d/tw/",
    )
  })
})
