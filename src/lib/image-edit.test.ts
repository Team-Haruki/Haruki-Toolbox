import { describe, expect, it } from "bun:test"
import {
  adjustCropRect,
  adjustCropRectWithAspect,
  clampCropRect,
  fitCropRectToAspect,
  resolveCropAspectRatio,
  initialCropRect,
  isFullImageRect,
  resolveEditedFileName,
  resolveEditedImageSize,
  resolveImageFileName,
  type ImageEditOp,
} from "./image-edit"

const size = { width: 400, height: 200 }

describe("resolveEditedImageSize", () => {
  it("swaps the sides on a quarter turn, keeps them on a flip, and takes a crop's size", () => {
    const ops: ImageEditOp[] = [
      { kind: "rotate", turns: 1 },
      { kind: "flip", axis: "horizontal" },
      { kind: "crop", rect: { x: 10, y: 20, width: 100, height: 300 } },
      { kind: "rotate", turns: -1 },
      { kind: "flip", axis: "vertical" },
    ]
    expect(resolveEditedImageSize(size, ops.slice(0, 1))).toEqual({ width: 200, height: 400 })
    expect(resolveEditedImageSize(size, ops.slice(0, 2))).toEqual({ width: 200, height: 400 })
    expect(resolveEditedImageSize(size, ops)).toEqual({ width: 300, height: 100 })
    expect(resolveEditedImageSize(size, [])).toEqual(size)
  })
})

describe("crop rectangles", () => {
  it("clamps into the picture, to whole pixels and to the minimum size", () => {
    expect(clampCropRect({ x: -20, y: 180.6, width: 1000, height: 3 }, size)).toEqual({ x: 0, y: 181, width: 400, height: 16 })
    expect(clampCropRect({ x: 390, y: 10.4, width: 50.5, height: 20 }, size)).toEqual({ x: 349, y: 10, width: 51, height: 20 })
    expect(clampCropRect({ x: 0, y: 0, width: 1, height: 1 }, { width: 8, height: 8 })).toEqual({ x: 0, y: 0, width: 8, height: 8 })
  })

  it("starts inset by a tenth on every side", () => {
    expect(initialCropRect(size)).toEqual({ x: 40, y: 20, width: 320, height: 160 })
  })

  it("moves the whole selection and stops at the edges", () => {
    const rect = { x: 40, y: 20, width: 320, height: 160 }
    expect(adjustCropRect(rect, "move", 10, -5, size)).toEqual({ x: 50, y: 15, width: 320, height: 160 })
    expect(adjustCropRect(rect, "move", 999, 999, size)).toEqual({ x: 80, y: 40, width: 320, height: 160 })
    expect(adjustCropRect(rect, "move", -999, -999, size)).toEqual({ x: 0, y: 0, width: 320, height: 160 })
  })

  it("drags an edge or a corner without moving the opposite side", () => {
    const rect = { x: 40, y: 20, width: 320, height: 160 }
    expect(adjustCropRect(rect, "e", -100, 50, size)).toEqual({ x: 40, y: 20, width: 220, height: 160 })
    expect(adjustCropRect(rect, "n", 50, 30, size)).toEqual({ x: 40, y: 50, width: 320, height: 130 })
    expect(adjustCropRect(rect, "nw", 60, 40, size)).toEqual({ x: 100, y: 60, width: 260, height: 120 })
    expect(adjustCropRect(rect, "se", 999, 999, size)).toEqual({ x: 40, y: 20, width: 360, height: 180 })
  })

  it("never lets a side cross the opposite one", () => {
    const rect = { x: 40, y: 20, width: 320, height: 160 }
    expect(adjustCropRect(rect, "w", 999, 0, size)).toEqual({ x: 344, y: 20, width: 16, height: 160 })
    expect(adjustCropRect(rect, "s", 0, -999, size)).toEqual({ x: 40, y: 20, width: 320, height: 16 })
    expect(adjustCropRect(rect, "ne", -999, 999, size)).toEqual({ x: 40, y: 164, width: 16, height: 16 })
  })

  it("knows a selection of the whole picture", () => {
    expect(isFullImageRect({ x: 0, y: 0, width: 400, height: 200 }, size)).toBe(true)
    expect(isFullImageRect({ x: 0, y: 0, width: 399, height: 200 }, size)).toBe(false)
  })
})

describe("crop shapes", () => {
  const big = { width: 2000, height: 1000 }
  const rect = { x: 200, y: 100, width: 1600, height: 800 }

  it("resolves the ratio behind each choice", () => {
    expect(resolveCropAspectRatio("free")).toBeNull()
    expect(resolveCropAspectRatio("1:1")).toBe(1)
    expect(resolveCropAspectRatio("16:9")).toBeCloseTo(16 / 9, 10)
    expect(resolveCropAspectRatio("9:16")).toBeCloseTo(9 / 16, 10)
  })

  it("trims the selection to the shape around the same centre", () => {
    expect(fitCropRectToAspect(rect, 1, big)).toEqual({ x: 600, y: 100, width: 800, height: 800 })
    expect(fitCropRectToAspect(rect, 16 / 9, big)).toEqual({ x: 289, y: 100, width: 1422, height: 800 })
    expect(fitCropRectToAspect({ x: 0, y: 0, width: 400, height: 900 }, 4 / 3, big)).toEqual({ x: 0, y: 300, width: 400, height: 300 })
  })

  it("keeps the shape while a corner is dragged, anchored at the opposite corner", () => {
    const square = { x: 600, y: 100, width: 800, height: 800 }
    expect(adjustCropRectWithAspect(square, "se", -200, -50, big, 1)).toEqual({ x: 600, y: 100, width: 750, height: 750 })
    expect(adjustCropRectWithAspect(square, "nw", 300, 300, big, 1)).toEqual({ x: 900, y: 400, width: 500, height: 500 })
    // Stops where the shape reaches the picture's edge.
    expect(adjustCropRectWithAspect(square, "se", 999, 999, big, 1)).toEqual({ x: 600, y: 100, width: 900, height: 900 })
  })

  it("keeps the selection centred across the other axis for an edge handle", () => {
    const wide = { x: 400, y: 300, width: 800, height: 400 }
    expect(adjustCropRectWithAspect(wide, "e", 200, 0, big, 2)).toEqual({ x: 400, y: 250, width: 1000, height: 500 })
    expect(adjustCropRectWithAspect(wide, "n", 0, -100, big, 2)).toEqual({ x: 300, y: 200, width: 1000, height: 500 })
  })

  it("never shrinks below the minimum and moves like the free selection", () => {
    const square = { x: 600, y: 100, width: 800, height: 800 }
    expect(adjustCropRectWithAspect(square, "se", -5000, -5000, big, 1)).toEqual({ x: 600, y: 100, width: 16, height: 16 })
    expect(adjustCropRectWithAspect(square, "move", 50, 20, big, 1)).toEqual({ x: 650, y: 120, width: 800, height: 800 })
  })
})

describe("file names", () => {
  it("takes the name at the end of the URL", () => {
    expect(resolveImageFileName("https://assets.test/jp-assets/member/res009_no042/card_normal.png?v=2")).toBe("card_normal.png")
    expect(resolveImageFileName("/a/b/%E5%91%8A%E7%99%BD.png")).toBe("告白.png")
    expect(resolveImageFileName("https://assets.test/folder/")).toBe("image.png")
    expect(resolveImageFileName("https://assets.test/noextension", "art.png")).toBe("art.png")
    expect(resolveImageFileName(null)).toBe("image.png")
  })

  it("names the edited copy after the original, as PNG", () => {
    expect(resolveEditedFileName("card_normal.png")).toBe("card_normal-edited.png")
    expect(resolveEditedFileName("banner.webp")).toBe("banner-edited.png")
    expect(resolveEditedFileName("noextension")).toBe("noextension-edited.png")
    expect(resolveEditedFileName("")).toBe("image-edited.png")
  })
})
