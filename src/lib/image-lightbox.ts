/**
 * What the image viewer's editing modes decide before anything is drawn: the
 * operations a set of controls stands for, sizes that follow the picture's
 * own size (so a line looks the same on a small icon and on full card art),
 * and the texts of the readouts. Pure; the drawing is image-edit-kit's.
 */

import {
  IMAGE_FILTER_NAMES,
  MAX_BLUR_RADIUS,
  clampCropRect,
  clampNumber,
  isNeutralAdjustment,
  resolveConvertedFileName,
  resolveEditedFileName,
  scaleImageSize,
  simplifyPoints,
  type ImageAdjustmentKey,
  type ImageEditOp,
  type ImageExportFormat,
  type ImagePoint,
  type ImageRect,
  type ImageSize,
  type ImageTextAlign,
} from "image-edit-kit"

export type ImageLightboxMode = "none" | "crop" | "straighten" | "adjust" | "mask" | "draw" | "text" | "export"

// ---- Straighten

export const STRAIGHTEN_RANGE = { min: -45, max: 45, step: 0.5 } as const

/** "+12.5°", "−3", "0": a value around zero with its sign (a real minus, not a hyphen). */
export function formatSignedValue(value: number, unit = ""): string {
  if (!Number.isFinite(value) || value === 0) {
    return `0${unit}`
  }
  return `${value > 0 ? "+" : "−"}${Math.abs(value)}${unit}`
}

// ---- Adjust

export const ADJUST_KEYS = ["brightness", "contrast", "saturation", "temperature"] as const satisfies readonly ImageAdjustmentKey[]
export type AdjustKey = (typeof ADJUST_KEYS)[number]
export type AdjustValues = Record<AdjustKey, number>

export const ADJUST_RANGE = { min: -100, max: 100, step: 1 } as const
export const NEUTRAL_ADJUST_VALUES: AdjustValues = { brightness: 0, contrast: 0, saturation: 0, temperature: 0 }

export const IMAGE_LOOKS = ["none", ...IMAGE_FILTER_NAMES] as const
export type ImageLook = (typeof IMAGE_LOOKS)[number]

/** The tone controls, then the look: the operations the adjust panel stands for (none when everything is neutral). */
export function buildAdjustOps(values: AdjustValues, look: ImageLook): ImageEditOp[] {
  const ops: ImageEditOp[] = []
  const adjust: Extract<ImageEditOp, { kind: "adjust" }> = { kind: "adjust" }
  for (const key of ADJUST_KEYS) {
    if (values[key]) {
      adjust[key] = values[key]
    }
  }
  if (!isNeutralAdjustment(adjust)) {
    ops.push(adjust)
  }
  if (look !== "none") {
    ops.push({ kind: "filter", name: look })
  }
  return ops
}

// ---- Mask

export const MASK_KINDS = ["pixelate", "blur"] as const
export type MaskKind = (typeof MASK_KINDS)[number]

export const MASK_STRENGTH = { min: 10, max: 100, step: 5, initial: 50 } as const

/** The share of the picture's short side a mosaic block takes at full strength. */
const MASK_PIXELATE_SHARE = 0.06
/** The share of the picture's short side a blur spreads over at full strength. */
const MASK_BLUR_SHARE = 0.04

/** The region a mask starts from: the middle 40% of the picture. */
export function initialMaskRect(size: ImageSize): ImageRect {
  return clampCropRect({
    x: size.width * 0.3,
    y: size.height * 0.3,
    width: size.width * 0.4,
    height: size.height * 0.4,
  }, size)
}

/**
 * A mosaic or a blur over `rect`. `strength` (1 to 100) is a share of the
 * picture's short side, so the same strength hides as much of a 512px icon
 * as of 4096px card art.
 */
export function buildMaskOp(kind: MaskKind, strength: number, rect: ImageRect, size: ImageSize): ImageEditOp {
  const level = clampNumber(Number.isFinite(strength) ? strength : MASK_STRENGTH.initial, 1, 100) / 100
  const shortSide = Math.min(size.width, size.height)
  if (kind === "pixelate") {
    return { kind: "pixelate", size: Math.max(4, Math.round(shortSide * MASK_PIXELATE_SHARE * level)), rect }
  }
  return {
    kind: "blur",
    radius: Math.min(MAX_BLUR_RADIUS, Math.max(2, Math.round(shortSide * MASK_BLUR_SHARE * level))),
    rect,
  }
}

// ---- Draw and text

export const ANNOTATION_COLORS = [
  { key: "red", value: "#ef4444" },
  { key: "yellow", value: "#facc15" },
  { key: "green", value: "#22c55e" },
  { key: "blue", value: "#3b82f6" },
  { key: "white", value: "#ffffff" },
  { key: "black", value: "#000000" },
] as const
export type AnnotationColorKey = (typeof ANNOTATION_COLORS)[number]["key"]
export const DEFAULT_ANNOTATION_COLOR: string = ANNOTATION_COLORS[0].value

export const DRAW_TOOLS = ["pen", "arrow", "rect", "ellipse"] as const
export type DrawTool = (typeof DRAW_TOOLS)[number]

export const SIZE_STEPS = ["small", "medium", "large"] as const
export type SizeStep = (typeof SIZE_STEPS)[number]

/** How wide the three lines look on screen, in CSS pixels, with the picture fitted to the stage. */
export const DRAW_SCREEN_WIDTHS: Record<SizeStep, number> = { small: 3, medium: 6, large: 12 }

/**
 * Line widths in image pixels. They are chosen by how they look, not by the
 * picture's resolution: `shownWidth` is how wide the picture is drawn on
 * screen (unzoomed), so a line is as thick under the finger on a phone as on
 * a desktop. Without it the widths follow the picture's long side.
 */
export function resolveDrawWidths(size: ImageSize, shownWidth?: number | null): Record<SizeStep, number> {
  if (shownWidth != null && shownWidth > 0) {
    const scale = size.width / shownWidth
    return {
      small: Math.max(1, Math.round(DRAW_SCREEN_WIDTHS.small * scale)),
      medium: Math.max(2, Math.round(DRAW_SCREEN_WIDTHS.medium * scale)),
      large: Math.max(4, Math.round(DRAW_SCREEN_WIDTHS.large * scale)),
    }
  }
  const base = Math.max(2, Math.round(Math.max(size.width, size.height) / 400))
  return { small: base, medium: base * 2, large: base * 4 }
}

/**
 * The operation a drag stands for: a freehand line through its samples, or a
 * shape between its two ends. `null` for a drag too short to be a shape (a
 * click); a pen leaves a dot.
 */
export function buildDrawOp(tool: DrawTool, points: readonly ImagePoint[], color: string, width: number): ImageEditOp | null {
  const first = points[0]
  const last = points[points.length - 1]
  if (!first || !last) {
    return null
  }
  if (tool === "pen") {
    return { kind: "stroke", points: simplifyPoints(points, Math.max(0.75, width / 8)), color, width }
  }
  if (Math.hypot(last.x - first.x, last.y - first.y) < Math.max(2, width)) {
    return null
  }
  return { kind: "shape", shape: tool, from: { x: first.x, y: first.y }, to: { x: last.x, y: last.y }, color, width }
}

/** The typefaces a text can take, as CSS font families: the app's sans stack, a serif and a monospace. */
export const TEXT_FONTS = [
  { key: "sans", family: "system-ui, sans-serif" },
  { key: "serif", family: '"Noto Serif SC", "Songti SC", "Source Han Serif SC", serif' },
  { key: "mono", family: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' },
] as const
export type TextFontKey = (typeof TEXT_FONTS)[number]["key"]

export function resolveTextFontFamily(key: TextFontKey): string {
  return TEXT_FONTS.find((font) => font.key === key)?.family ?? TEXT_FONTS[0].family
}

/**
 * What keeps a text readable on any picture: a line around the letters, a
 * plate behind the lines, or nothing.
 */
export const TEXT_EFFECTS = ["outline", "plate", "none"] as const
export type TextEffect = (typeof TEXT_EFFECTS)[number]

/**
 * The font sizes a text can take on a picture of this size, in image pixels:
 * from barely readable to a third of the short side, starting at a size that
 * reads comfortably whatever the picture's resolution.
 */
export function resolveTextSizeRange(size: ImageSize): { min: number; max: number; initial: number } {
  const short = Math.min(size.width, size.height)
  const min = Math.max(8, Math.round(short / 60))
  const max = Math.max(min + 1, Math.round(short / 3))
  return { min, max, initial: clampNumber(Math.round(short / 14), min, max) }
}

/** True for a `#rrggbb` colour bright enough to need a dark outline. Anything unreadable counts as dark. */
export function isLightColor(color: string): boolean {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color.trim())
  if (!match) {
    return false
  }
  const [red, green, blue] = [match[1], match[2], match[3]].map((part) => Number.parseInt(part ?? "0", 16))
  return 0.299 * (red ?? 0) + 0.587 * (green ?? 0) + 0.114 * (blue ?? 0) > 150
}

export type TextDraft = {
  text: string
  /** The top of the first line; across, the lines' left edge, middle or right edge according to `align`. */
  at: ImagePoint
  size: number
  color: string
  font: TextFontKey
  bold: boolean
  italic: boolean
  align: ImageTextAlign
  effect: TextEffect
  /** Degrees, clockwise, about the middle of the text. */
  rotation: number
}

export const TEXT_ROTATION_RANGE = { min: -180, max: 180, step: 1 } as const
/** The angles a turned text settles on, and how close (in degrees) it has to come. */
const TEXT_ROTATION_SNAPS = [-180, -90, -45, 0, 45, 90, 180] as const
const TEXT_ROTATION_SNAP_DISTANCE = 3

/**
 * The rotation the turn handle stands for when it is dragged to `pointer`:
 * the handle sits straight above `centre` at 0° and goes round clockwise.
 * Whole degrees from -180 to 180, settling on the straight and diagonal
 * angles when it comes close to one.
 */
export function resolveHandleRotation(pointer: ImagePoint, centre: ImagePoint): number {
  if (pointer.x === centre.x && pointer.y === centre.y) {
    return 0
  }
  const degrees = Math.round((Math.atan2(pointer.x - centre.x, centre.y - pointer.y) * 180) / Math.PI)
  return TEXT_ROTATION_SNAPS.find((snap) => Math.abs(degrees - snap) <= TEXT_ROTATION_SNAP_DISTANCE) ?? degrees
}

/** Where a text starts: one centred line of `fontSize` in the middle of the picture. */
export function initialTextAt(size: ImageSize, fontSize: number): ImagePoint {
  return { x: size.width / 2, y: (size.height - fontSize) / 2 }
}

/** The text's anchor after a drag of (`dx`, `dy`) image pixels, kept on the picture. */
export function moveTextAt(at: ImagePoint, dx: number, dy: number, size: ImageSize): ImagePoint {
  return {
    x: clampNumber(at.x + dx, 0, size.width),
    y: clampNumber(at.y + dy, 0, size.height),
  }
}

/** The anchor after the font size changed: the first line keeps its middle instead of growing downwards. */
export function resizeTextAt(at: ImagePoint, from: number, to: number): ImagePoint {
  return { x: at.x, y: at.y + (from - to) / 2 }
}

/**
 * The anchor for another alignment that leaves the text where it is.
 * `lines` is the rectangle its lines take up now (`measureImageTextBox` of
 * the text without a plate).
 */
export function realignTextAt(at: ImagePoint, lines: ImageRect, align: ImageTextAlign): ImagePoint {
  const x = align === "left" ? lines.x : align === "center" ? lines.x + lines.width / 2 : lines.x + lines.width
  return { x, y: at.y }
}

/**
 * The text operation for a draft. The outline and the plate contrast with
 * the text's colour: dark around light colours, light around dark ones.
 */
export function buildTextOp(draft: TextDraft): Extract<ImageEditOp, { kind: "text" }> {
  const light = isLightColor(draft.color)
  return {
    kind: "text",
    text: draft.text.trim(),
    at: { x: draft.at.x, y: draft.at.y },
    size: draft.size,
    color: draft.color,
    font: resolveTextFontFamily(draft.font),
    weight: draft.bold ? 700 : 400,
    align: draft.align,
    ...(draft.italic ? { italic: true } : {}),
    ...(draft.rotation ? { rotation: draft.rotation } : {}),
    ...(draft.effect === "outline"
      ? { outline: { color: light ? "#000000" : "#ffffff", width: Math.max(1, Math.round(draft.size / 12)) } }
      : {}),
    ...(draft.effect === "plate"
      ? { background: { color: light ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.75)" } }
      : {}),
  }
}

// ---- Export

export const EXPORT_SCALES = [1, 0.75, 0.5, 0.25] as const
export const EXPORT_QUALITY = { min: 10, max: 100, step: 1, initial: 92 } as const

/** The resize an export scale stands for: none at 100%, or when the picture is too small to shrink. */
export function buildExportResizeOps(size: ImageSize, scale: number): ImageEditOp[] {
  if (!(scale > 0) || scale === 1) {
    return []
  }
  const target = scaleImageSize(size, scale)
  return target.width === size.width && target.height === size.height ? [] : [{ kind: "resize", ...target }]
}

/**
 * The saved file's name: marked as edited when the picture was changed (an
 * edit or a resize), the original's name with the new extension when it is a
 * plain format conversion.
 */
export function resolveExportFileName(originalName: string, format: ImageExportFormat, changed: boolean): string {
  return changed ? resolveEditedFileName(originalName, format) : resolveConvertedFileName(originalName, format)
}

/** "812 B", "34.5 KB", "1.2 MB". */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return ""
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} B`
  }
  const units = ["KB", "MB", "GB"]
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value >= 100 ? Math.round(value) : Math.round(value * 10) / 10} ${units[unit]}`
}

// ---- History

/**
 * The operations `next` adds to `previous`, or `null` when `next` is not
 * `previous` with more at the end (an undo, a reset, another picture): only
 * then can the canvas of the committed operations take just the new ones.
 */
export function resolveAppendedOps(previous: readonly ImageEditOp[], next: readonly ImageEditOp[]): ImageEditOp[] | null {
  return next.length > previous.length && previous.every((op, index) => op === next[index])
    ? next.slice(previous.length)
    : null
}

/** Ctrl/Cmd+Z undoes; Ctrl/Cmd+Shift+Z and Ctrl+Y redo. */
export function resolveHistoryShortcut(
  event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey">,
): "undo" | "redo" | null {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) {
    return null
  }
  const key = event.key.toLowerCase()
  if (key === "z") {
    return event.shiftKey ? "redo" : "undo"
  }
  return key === "y" && event.ctrlKey && !event.shiftKey ? "redo" : null
}
