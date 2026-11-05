// Layout maths of the player shell, kept pure so it can be tested without a
// DOM. Panels keep their natural (CSS px) size; only the 1280x720 stage
// scales, so what fits beside it depends on the host width and on the room
// left under the row.

export const STAGE_W = 1280;
export const STAGE_H = 720;

/** Width of the story browser / talk log columns beside the stage (CSS px). */
export const BROWSER_W = 280;
export const LOG_W = 300;
/** The story browser collapsed to its rail. */
export const RAIL_W = 44;
export const GAP = 12;

/**
 * "wide": browser | stage | log. "mid": stage | one tabbed side panel.
 * "stack": stage on top, tabs and the panel under it (phones).
 */
export type LayoutMode = "wide" | "mid" | "stack";

export function layoutMode(hostWidth: number): LayoutMode {
  if (hostWidth >= 1180) return "wide";
  if (hostWidth >= 720) return "mid";
  return "stack";
}

/** Smallest stage worth showing beside a panel (CSS px). */
const MIN_STAGE_W = 320;

export interface RowColumns {
  /** the story browser is collapsed to its rail (wide layout) */
  browserCollapsed?: boolean;
  /** no talk log column beside the stage (wide layout: hidden, or nothing playing) */
  logHidden?: boolean;
}

/**
 * Stage width for a row: what the columns leave, capped so the stage (16:9)
 * also fits in `maxHeight` — the room between the row's top and the bottom of
 * the viewport — unless that would make it unusably small.
 */
export function stageWidthFor(hostWidth: number, mode: LayoutMode, cols: RowColumns, maxHeight: number): number {
  let avail = hostWidth;
  if (mode === "wide") avail -= (cols.browserCollapsed ? RAIL_W : BROWSER_W) + GAP + (cols.logHidden ? 0 : LOG_W + GAP);
  else if (mode === "mid") avail -= LOG_W + GAP;
  if (mode === "stack") return Math.max(0, Math.floor(avail));
  const byHeight = (Math.max(0, maxHeight) * STAGE_W) / STAGE_H;
  return Math.floor(Math.max(Math.min(avail, byHeight), Math.min(avail, MIN_STAGE_W), 0));
}

/** Target size of the in-stage ⋯ menu button and its rows (CSS px). */
const MENU_TARGET = 40;
/** Design sizes (stage px) from the library's stylesheet. */
const MENU_BTN = 64;
const MENU_CLOSE = 29.33;
/** The panel (525 stage px tall, scaled) has to fit on the stage below this scale. */
const MENU_PANEL_H = 525.33;

/** Scale factor that keeps the ⋯ button at least 40 CSS px on a stage drawn at `k`. */
export function menuScale(k: number): number {
  if (!(k > 0)) return 1;
  return Math.max(1, MENU_TARGET / (MENU_BTN * k));
}

/** Extra scale of the panel's close cross, on top of `menuScale`. */
export function menuCloseScale(k: number): number {
  if (!(k > 0)) return 1;
  return Math.max(1, MENU_TARGET / (MENU_CLOSE * k * menuScale(k)));
}

/**
 * Can the in-stage menu, scaled up to 40px targets, still fit on a stage of
 * this height? Otherwise the shell shows a control row under the stage.
 */
export function stageMenuFits(k: number, stageHeightPx: number): boolean {
  if (!(k > 0)) return false;
  return MENU_PANEL_H * k * menuScale(k) <= stageHeightPx + 1;
}

/**
 * Native fullscreen on a phone that refused the landscape lock: the stage
 * is drawn sideways. Returns the scale and the CSS transform that puts the
 * 1280x720 stage rotated 90° into a `w` x `h` (portrait) box, centred.
 */
export function rotatedStage(w: number, h: number): { k: number; transform: string } {
  const k = Math.min(h / STAGE_W, w / STAGE_H) || 1;
  const tx = (w + STAGE_H * k) / 2;
  const ty = (h - STAGE_W * k) / 2;
  return { k, transform: `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) rotate(90deg) scale(${k.toFixed(4)})` };
}

/** Font size (px) of the credit line for a stage this wide: 12–18px, in one line where it fits. */
export function creditFontSize(stageWidth: number): number {
  return Math.min(18, Math.max(12, stageWidth * 0.016));
}
