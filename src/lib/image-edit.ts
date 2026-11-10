/**
 * The geometry of the image viewer's edits. An edit is a list of operations
 * replayed in order on the original picture; everything here is pure, the
 * pixels are drawn by the viewer.
 */

export type ImageSize = { width: number; height: number }
export type ImageRect = { x: number; y: number; width: number; height: number }

export type ImageEditOp =
  /** A quarter turn: 1 clockwise, -1 counter-clockwise. */
  | { kind: "rotate"; turns: 1 | -1 }
  /** `horizontal` mirrors left ↔ right, `vertical` top ↔ bottom. */
  | { kind: "flip"; axis: "horizontal" | "vertical" }
  /** A crop, in pixels of the picture as it is when the crop is applied. */
  | { kind: "crop"; rect: ImageRect }

/** The picture's size after one operation. */
export function applyImageOpSize(size: ImageSize, op: ImageEditOp): ImageSize {
  switch (op.kind) {
    case "rotate":
      return { width: size.height, height: size.width }
    case "flip":
      return size
    case "crop":
      return { width: op.rect.width, height: op.rect.height }
  }
}

export function resolveEditedImageSize(size: ImageSize, ops: readonly ImageEditOp[]): ImageSize {
  return ops.reduce((current, op) => applyImageOpSize(current, op), size)
}

/** Smallest side a crop may have, in image pixels. */
export const MIN_CROP_SIZE = 16

/** Whole pixels, inside the picture, at least `MIN_CROP_SIZE` on each side (or the picture's own side when smaller). */
export function clampCropRect(rect: ImageRect, size: ImageSize): ImageRect {
  const minWidth = Math.min(MIN_CROP_SIZE, size.width)
  const minHeight = Math.min(MIN_CROP_SIZE, size.height)
  const width = Math.min(size.width, Math.max(minWidth, Math.round(rect.width)))
  const height = Math.min(size.height, Math.max(minHeight, Math.round(rect.height)))
  return {
    x: Math.min(size.width - width, Math.max(0, Math.round(rect.x))),
    y: Math.min(size.height - height, Math.max(0, Math.round(rect.y))),
    width,
    height,
  }
}

/** The selection a crop starts from: the picture inset by a tenth on every side. */
export function initialCropRect(size: ImageSize): ImageRect {
  return clampCropRect({
    x: size.width * 0.1,
    y: size.height * 0.1,
    width: size.width * 0.8,
    height: size.height * 0.8,
  }, size)
}

export const CROP_HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const
export type CropHandle = (typeof CROP_HANDLES)[number] | "move"

/**
 * The selection after dragging `handle` by (`dx`, `dy`) image pixels from
 * `rect`. `move` slides the whole selection and stops at the picture's edge;
 * an edge or corner moves only its own sides and stops at the opposite side
 * (less the minimum size) and at the picture's edge.
 */
export function adjustCropRect(rect: ImageRect, handle: CropHandle, dx: number, dy: number, size: ImageSize): ImageRect {
  if (handle === "move") {
    return clampCropRect({ ...rect, x: rect.x + dx, y: rect.y + dy }, size)
  }
  const minWidth = Math.min(MIN_CROP_SIZE, size.width)
  const minHeight = Math.min(MIN_CROP_SIZE, size.height)
  let left = rect.x
  let top = rect.y
  let right = rect.x + rect.width
  let bottom = rect.y + rect.height
  if (handle.includes("w")) left = Math.min(Math.max(0, left + dx), right - minWidth)
  if (handle.includes("e")) right = Math.max(Math.min(size.width, right + dx), left + minWidth)
  if (handle.includes("n")) top = Math.min(Math.max(0, top + dy), bottom - minHeight)
  if (handle.includes("s")) bottom = Math.max(Math.min(size.height, bottom + dy), top + minHeight)
  return clampCropRect({ x: left, y: top, width: right - left, height: bottom - top }, size)
}

/** Crop shapes on offer: free, then the usual screen and photo ratios (width : height). */
export const CROP_ASPECTS = [
  { key: "free", ratio: null },
  { key: "1:1", ratio: 1 },
  { key: "4:3", ratio: 4 / 3 },
  { key: "3:4", ratio: 3 / 4 },
  { key: "16:9", ratio: 16 / 9 },
  { key: "9:16", ratio: 9 / 16 },
] as const

export type CropAspectKey = (typeof CROP_ASPECTS)[number]["key"]

export function resolveCropAspectRatio(key: CropAspectKey): number | null {
  return CROP_ASPECTS.find((aspect) => aspect.key === key)?.ratio ?? null
}

/**
 * The largest selection of the given shape that fits inside the current one,
 * around the same centre: choosing a ratio trims the selection, it never
 * jumps somewhere else.
 */
export function fitCropRectToAspect(rect: ImageRect, ratio: number, size: ImageSize): ImageRect {
  let width = Math.min(rect.width, size.width)
  let height = width / ratio
  if (height > Math.min(rect.height, size.height)) {
    height = Math.min(rect.height, size.height)
    width = height * ratio
  }
  return clampCropRect({
    x: rect.x + (rect.width - width) / 2,
    y: rect.y + (rect.height - height) / 2,
    width,
    height,
  }, size)
}

/**
 * `adjustCropRect` with the shape locked to `ratio`. The side opposite the
 * handle stays put (an edge handle keeps the selection centred across the
 * other axis), a corner follows whichever of the two movements asks for the
 * larger selection, and the result stops at the picture's edges.
 */
export function adjustCropRectWithAspect(
  rect: ImageRect,
  handle: CropHandle,
  dx: number,
  dy: number,
  size: ImageSize,
  ratio: number,
): ImageRect {
  if (handle === "move") {
    return adjustCropRect(rect, handle, dx, dy, size)
  }
  const horizontal = handle.includes("e") ? 1 : handle.includes("w") ? -1 : 0
  const vertical = handle.includes("s") ? 1 : handle.includes("n") ? -1 : 0
  const right = rect.x + rect.width
  const bottom = rect.y + rect.height
  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2

  const fromWidth = horizontal !== 0 ? rect.width + horizontal * dx : Number.NEGATIVE_INFINITY
  const fromHeight = vertical !== 0 ? (rect.height + vertical * dy) * ratio : Number.NEGATIVE_INFINITY
  const wanted = Math.max(fromWidth, fromHeight)

  const maxWidth = horizontal === 1 ? size.width - rect.x : horizontal === -1 ? right : 2 * Math.min(centerX, size.width - centerX)
  const maxHeight = vertical === 1 ? size.height - rect.y : vertical === -1 ? bottom : 2 * Math.min(centerY, size.height - centerY)
  const minWidth = Math.max(MIN_CROP_SIZE, MIN_CROP_SIZE * ratio)
  const limit = Math.min(maxWidth, maxHeight * ratio)
  const width = Math.min(limit, Math.max(Math.min(minWidth, limit), wanted))
  const height = width / ratio

  return clampCropRect({
    x: horizontal === 1 ? rect.x : horizontal === -1 ? right - width : centerX - width / 2,
    y: vertical === 1 ? rect.y : vertical === -1 ? bottom - height : centerY - height / 2,
    width,
    height,
  }, size)
}

/** True when the selection is the whole picture (applying it would change nothing). */
export function isFullImageRect(rect: ImageRect, size: ImageSize): boolean {
  return rect.x === 0 && rect.y === 0 && rect.width === size.width && rect.height === size.height
}

/** The file name at the end of a URL ("card_normal.png"), or the fallback. */
export function resolveImageFileName(url: string | null | undefined, fallback = "image.png"): string {
  if (!url) {
    return fallback
  }
  try {
    const name = decodeURIComponent(new URL(url, "https://local.invalid").pathname.split("/").pop() ?? "")
    return name && name.includes(".") ? name : fallback
  } catch {
    return fallback
  }
}

/** "card_normal.png" → "card_normal-edited.png" (edits are always saved as PNG). */
export function resolveEditedFileName(originalName: string): string {
  const dot = originalName.lastIndexOf(".")
  const base = dot > 0 ? originalName.slice(0, dot) : originalName
  return `${base || "image"}-edited.png`
}
