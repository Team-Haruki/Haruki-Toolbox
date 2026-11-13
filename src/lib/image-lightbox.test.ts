import { describe, expect, it } from "bun:test"
import type { ImageEditOp } from "image-edit-kit"
import {
  ANNOTATION_COLORS,
  DEFAULT_ANNOTATION_COLOR,
  NEUTRAL_ADJUST_VALUES,
  TEXT_FONTS,
  buildAdjustOps,
  buildDrawOp,
  buildExportResizeOps,
  buildMaskOp,
  buildTextOp,
  formatFileSize,
  formatSignedValue,
  initialMaskRect,
  initialTextAt,
  isLightColor,
  moveTextAt,
  realignTextAt,
  resolveAppendedOps,
  resolveDrawWidths,
  resizeTextAt,
  resolveExportFileName,
  resolveHandleRotation,
  resolveHistoryShortcut,
  resolveTextFontFamily,
  resolveTextSizeRange,
  type TextDraft,
} from "./image-lightbox"

const icon = { width: 512, height: 512 }
const cardArt = { width: 4096, height: 2048 }

describe("formatSignedValue", () => {
  it("shows the sign of a value and none for zero", () => {
    expect(formatSignedValue(12.5, "°")).toBe("+12.5°")
    expect(formatSignedValue(-3, "°")).toBe("−3°")
    expect(formatSignedValue(0, "°")).toBe("0°")
    expect(formatSignedValue(-40)).toBe("−40")
    expect(formatSignedValue(Number.NaN)).toBe("0")
  })
})

describe("buildAdjustOps", () => {
  it("is empty while every control is neutral", () => {
    expect(buildAdjustOps(NEUTRAL_ADJUST_VALUES, "none")).toEqual([])
  })

  it("keeps only the controls that were moved", () => {
    expect(buildAdjustOps({ ...NEUTRAL_ADJUST_VALUES, brightness: 20, temperature: -35 }, "none")).toEqual([
      { kind: "adjust", brightness: 20, temperature: -35 },
    ])
  })

  it("puts the look after the tone", () => {
    expect(buildAdjustOps({ ...NEUTRAL_ADJUST_VALUES, contrast: 10 }, "sepia")).toEqual([
      { kind: "adjust", contrast: 10 },
      { kind: "filter", name: "sepia" },
    ])
    expect(buildAdjustOps(NEUTRAL_ADJUST_VALUES, "invert")).toEqual([{ kind: "filter", name: "invert" }])
  })
})

describe("mask", () => {
  it("starts from the middle 40% of the picture", () => {
    expect(initialMaskRect({ width: 1000, height: 500 })).toEqual({ x: 300, y: 150, width: 400, height: 200 })
  })

  it("scales the mosaic block with the picture's short side", () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 }
    expect(buildMaskOp("pixelate", 50, rect, icon)).toEqual({ kind: "pixelate", size: 15, rect })
    expect(buildMaskOp("pixelate", 50, rect, cardArt)).toEqual({ kind: "pixelate", size: 61, rect })
    expect(buildMaskOp("pixelate", 100, rect, icon)).toEqual({ kind: "pixelate", size: 31, rect })
  })

  it("never makes a block smaller than four pixels", () => {
    expect(buildMaskOp("pixelate", 10, { x: 0, y: 0, width: 20, height: 20 }, { width: 64, height: 64 }))
      .toMatchObject({ kind: "pixelate", size: 4 })
  })

  it("scales the blur radius with the picture and stops at the library's limit", () => {
    const rect = { x: 10, y: 10, width: 50, height: 50 }
    expect(buildMaskOp("blur", 50, rect, icon)).toEqual({ kind: "blur", radius: 10, rect })
    expect(buildMaskOp("blur", 50, rect, cardArt)).toEqual({ kind: "blur", radius: 41, rect })
    expect(buildMaskOp("blur", 100, rect, { width: 16000, height: 16000 })).toMatchObject({ radius: 256 })
    expect(buildMaskOp("blur", 10, rect, { width: 64, height: 64 })).toMatchObject({ radius: 2 })
  })

  it("reads an unusable strength as the initial one", () => {
    expect(buildMaskOp("pixelate", Number.NaN, { x: 0, y: 0, width: 10, height: 10 }, icon)).toMatchObject({ size: 15 })
  })
})

describe("draw", () => {
  it("offers red first", () => {
    expect(DEFAULT_ANNOTATION_COLOR).toBe("#ef4444")
    expect(ANNOTATION_COLORS.map((color) => color.key)).toEqual(["red", "yellow", "green", "blue", "white", "black"])
  })

  it("derives three line widths from the picture's long side", () => {
    expect(resolveDrawWidths(icon)).toEqual({ small: 2, medium: 4, large: 8 })
    expect(resolveDrawWidths(cardArt)).toEqual({ small: 10, medium: 20, large: 40 })
  })

  it("sizes lines by how wide the picture is shown when that is known", () => {
    // 4096px art shown 390px wide (a phone): 3 / 6 / 12 screen pixels.
    expect(resolveDrawWidths(cardArt, 390)).toEqual({ small: 32, medium: 63, large: 126 })
    // Shown larger than it is: never thinner than a visible line.
    expect(resolveDrawWidths(icon, 2048)).toEqual({ small: 1, medium: 2, large: 4 })
    expect(resolveDrawWidths(icon, 0)).toEqual(resolveDrawWidths(icon))
    expect(resolveDrawWidths(icon, null)).toEqual(resolveDrawWidths(icon))
  })

  it("turns a pen drag into a thinned freehand line", () => {
    const points = [{ x: 0, y: 0 }, { x: 5, y: 0.1 }, { x: 10, y: 0 }, { x: 10, y: 10 }]
    expect(buildDrawOp("pen", points, "#ef4444", 4)).toEqual({
      kind: "stroke",
      points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }],
      color: "#ef4444",
      width: 4,
    })
  })

  it("lets a pen click leave a dot", () => {
    expect(buildDrawOp("pen", [{ x: 3, y: 4 }], "#ffffff", 2)).toEqual({
      kind: "stroke",
      points: [{ x: 3, y: 4 }],
      color: "#ffffff",
      width: 2,
    })
  })

  it("turns a shape drag into a shape between its ends", () => {
    const points = [{ x: 10, y: 20 }, { x: 50, y: 60 }, { x: 110, y: 220 }]
    expect(buildDrawOp("arrow", points, "#3b82f6", 4)).toEqual({
      kind: "shape",
      shape: "arrow",
      from: { x: 10, y: 20 },
      to: { x: 110, y: 220 },
      color: "#3b82f6",
      width: 4,
    })
    expect(buildDrawOp("rect", points, "#000000", 2)).toMatchObject({ kind: "shape", shape: "rect" })
    expect(buildDrawOp("ellipse", points, "#000000", 2)).toMatchObject({ kind: "shape", shape: "ellipse" })
  })

  it("ignores a shape drag that is only a click, and a drag with no samples", () => {
    expect(buildDrawOp("rect", [{ x: 10, y: 10 }, { x: 11, y: 10 }], "#000000", 4)).toBeNull()
    expect(buildDrawOp("arrow", [{ x: 10, y: 10 }], "#000000", 4)).toBeNull()
    expect(buildDrawOp("pen", [], "#000000", 4)).toBeNull()
  })
})

describe("text", () => {
  it("derives the range of font sizes from the picture's short side", () => {
    expect(resolveTextSizeRange(icon)).toEqual({ min: 9, max: 171, initial: 37 })
    expect(resolveTextSizeRange(cardArt)).toEqual({ min: 34, max: 683, initial: 146 })
    // A tiny picture still gets a range to move in, and a start inside it.
    expect(resolveTextSizeRange({ width: 100, height: 12 })).toEqual({ min: 8, max: 9, initial: 8 })
  })

  it("tells light colours from dark ones", () => {
    expect(isLightColor("#ffffff")).toBe(true)
    expect(isLightColor("#facc15")).toBe(true)
    expect(isLightColor("#000000")).toBe(false)
    expect(isLightColor("#ef4444")).toBe(false)
    expect(isLightColor("#3B82F6")).toBe(false)
    expect(isLightColor("red")).toBe(false)
  })

  it("starts as one centred line in the middle and stays on the picture when dragged", () => {
    expect(initialTextAt({ width: 800, height: 400 }, 40)).toEqual({ x: 400, y: 180 })
    expect(moveTextAt({ x: 400, y: 180 }, 50, -30, { width: 800, height: 400 })).toEqual({ x: 450, y: 150 })
    expect(moveTextAt({ x: 400, y: 180 }, 900, -900, { width: 800, height: 400 })).toEqual({ x: 800, y: 0 })
  })

  it("keeps the first line's middle when the size changes", () => {
    expect(resizeTextAt({ x: 400, y: 180 }, 40, 80)).toEqual({ x: 400, y: 160 })
    expect(resizeTextAt({ x: 400, y: 160 }, 80, 40)).toEqual({ x: 400, y: 180 })
  })

  it("moves the anchor, not the text, when the alignment changes", () => {
    const lines = { x: 300, y: 180, width: 200, height: 90 }
    expect(realignTextAt({ x: 400, y: 180 }, lines, "left")).toEqual({ x: 300, y: 180 })
    expect(realignTextAt({ x: 300, y: 180 }, lines, "center")).toEqual({ x: 400, y: 180 })
    expect(realignTextAt({ x: 400, y: 180 }, lines, "right")).toEqual({ x: 500, y: 180 })
  })

  it("maps the three typefaces to font stacks", () => {
    expect(TEXT_FONTS.map((font) => font.key)).toEqual(["sans", "serif", "mono"])
    expect(resolveTextFontFamily("sans")).toBe("system-ui, sans-serif")
    expect(resolveTextFontFamily("serif")).toContain("Songti SC")
    expect(resolveTextFontFamily("mono")).toContain("ui-monospace")
  })

  const draft: TextDraft = {
    text: "  Miku  ",
    at: { x: 400, y: 176 },
    size: 48,
    color: "#ffffff",
    font: "sans",
    bold: true,
    italic: false,
    align: "center",
    effect: "outline",
    rotation: 0,
  }

  it("outlines a text against its colour", () => {
    expect(buildTextOp(draft)).toEqual({
      kind: "text",
      text: "Miku",
      at: { x: 400, y: 176 },
      size: 48,
      color: "#ffffff",
      font: "system-ui, sans-serif",
      weight: 700,
      align: "center",
      outline: { color: "#000000", width: 4 },
    })
    expect(buildTextOp({ ...draft, size: 6, color: "#000000" }).outline).toEqual({ color: "#ffffff", width: 1 })
  })

  it("puts a contrasting plate behind the lines instead of an outline", () => {
    const light = buildTextOp({ ...draft, effect: "plate" })
    expect(light.background).toEqual({ color: "rgba(0, 0, 0, 0.6)" })
    expect(light.outline).toBeUndefined()
    expect(buildTextOp({ ...draft, effect: "plate", color: "#ef4444" }).background).toEqual({ color: "rgba(255, 255, 255, 0.75)" })
  })

  it("leaves a plain text with neither", () => {
    const op = buildTextOp({ ...draft, effect: "none" })
    expect(op.outline).toBeUndefined()
    expect(op.background).toBeUndefined()
  })

  it("carries the style: weight, slant, typeface, alignment and several lines", () => {
    expect(buildTextOp({ ...draft, text: "one\ntwo\n", bold: false, italic: true, font: "serif", align: "right" })).toMatchObject({
      text: "one\ntwo",
      weight: 400,
      italic: true,
      font: resolveTextFontFamily("serif"),
      align: "right",
    })
    expect(buildTextOp(draft)).not.toHaveProperty("italic")
  })

  it("carries a rotation only when the text is turned", () => {
    expect(buildTextOp({ ...draft, rotation: -30 }).rotation).toBe(-30)
    expect(buildTextOp(draft)).not.toHaveProperty("rotation")
  })

  it("reads the turn handle's angle clockwise from straight up", () => {
    const centre = { x: 100, y: 100 }
    expect(resolveHandleRotation({ x: 100, y: 40 }, centre)).toBe(0)
    expect(resolveHandleRotation({ x: 160, y: 100 }, centre)).toBe(90)
    expect(resolveHandleRotation({ x: 100, y: 160 }, centre)).toBe(180)
    expect(resolveHandleRotation({ x: 40, y: 100 }, centre)).toBe(-90)
    expect(resolveHandleRotation({ x: 150, y: 13.4 }, centre)).toBe(30)
    expect(resolveHandleRotation(centre, centre)).toBe(0)
  })

  it("settles on the straight and diagonal angles when close", () => {
    const centre = { x: 0, y: 0 }
    const at = (degrees: number) => ({
      x: Math.sin((degrees * Math.PI) / 180) * 100,
      y: -Math.cos((degrees * Math.PI) / 180) * 100,
    })
    expect(resolveHandleRotation(at(2), centre)).toBe(0)
    expect(resolveHandleRotation(at(-3), centre)).toBe(0)
    expect(resolveHandleRotation(at(43), centre)).toBe(45)
    expect(resolveHandleRotation(at(-88), centre)).toBe(-90)
    expect(resolveHandleRotation(at(178), centre)).toBe(180)
    expect(resolveHandleRotation(at(-178), centre)).toBe(-180)
    expect(resolveHandleRotation(at(4), centre)).toBe(4)
    expect(resolveHandleRotation(at(50), centre)).toBe(50)
  })
})

describe("export", () => {
  it("adds no resize at full size", () => {
    expect(buildExportResizeOps(cardArt, 1)).toEqual([])
    expect(buildExportResizeOps(cardArt, 0)).toEqual([])
    expect(buildExportResizeOps(cardArt, Number.NaN)).toEqual([])
  })

  it("resizes to the chosen share of the picture", () => {
    expect(buildExportResizeOps(cardArt, 0.5)).toEqual([{ kind: "resize", width: 2048, height: 1024 }])
    expect(buildExportResizeOps({ width: 101, height: 50 }, 0.25)).toEqual([{ kind: "resize", width: 25, height: 13 }])
  })

  it("adds no resize when the picture cannot get smaller", () => {
    expect(buildExportResizeOps({ width: 1, height: 1 }, 0.5)).toEqual([])
  })

  it("names an edited picture as edited and a conversion after the original", () => {
    expect(resolveExportFileName("jacket_s_001.png", "jpeg", true)).toBe("jacket_s_001-edited.jpg")
    expect(resolveExportFileName("jacket_s_001.png", "jpeg", false)).toBe("jacket_s_001.jpg")
    expect(resolveExportFileName("card.webp", "png", false)).toBe("card.png")
  })

  it("formats a file size", () => {
    expect(formatFileSize(812)).toBe("812 B")
    expect(formatFileSize(1024)).toBe("1 KB")
    expect(formatFileSize(35_328)).toBe("34.5 KB")
    expect(formatFileSize(340 * 1024)).toBe("340 KB")
    expect(formatFileSize(1.2 * 1024 * 1024)).toBe("1.2 MB")
    expect(formatFileSize(5 * 1024 ** 4)).toBe("5120 GB")
    expect(formatFileSize(-1)).toBe("")
    expect(formatFileSize(Number.NaN)).toBe("")
  })
})

describe("history", () => {
  const rotate: ImageEditOp = { kind: "rotate", turns: 1 }
  const flip: ImageEditOp = { kind: "flip", axis: "horizontal" }

  it("finds the operations added at the end", () => {
    expect(resolveAppendedOps([], [rotate])).toEqual([rotate])
    expect(resolveAppendedOps([rotate], [rotate, flip, rotate])).toEqual([flip, rotate])
  })

  it("does not take an undo, a reset or a different list for an addition", () => {
    expect(resolveAppendedOps([rotate, flip], [rotate])).toBeNull()
    expect(resolveAppendedOps([rotate], [rotate])).toBeNull()
    expect(resolveAppendedOps([rotate], [flip, rotate])).toBeNull()
    expect(resolveAppendedOps([rotate], [{ kind: "rotate", turns: 1 }, flip])).toBeNull()
  })

  it("reads the undo and redo shortcuts", () => {
    const key = (init: Partial<Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey">>) => ({
      key: "z",
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      ...init,
    })
    expect(resolveHistoryShortcut(key({ ctrlKey: true }))).toBe("undo")
    expect(resolveHistoryShortcut(key({ metaKey: true }))).toBe("undo")
    expect(resolveHistoryShortcut(key({ metaKey: true, shiftKey: true, key: "Z" }))).toBe("redo")
    expect(resolveHistoryShortcut(key({ ctrlKey: true, shiftKey: true }))).toBe("redo")
    expect(resolveHistoryShortcut(key({ ctrlKey: true, key: "y" }))).toBe("redo")
    expect(resolveHistoryShortcut(key({ metaKey: true, key: "y" }))).toBeNull()
    expect(resolveHistoryShortcut(key({}))).toBeNull()
    expect(resolveHistoryShortcut(key({ ctrlKey: true, altKey: true }))).toBeNull()
    expect(resolveHistoryShortcut(key({ ctrlKey: true, key: "a" }))).toBeNull()
  })
})
