/**
 * Zooming and panning a picture that is centred in its stage. `scale` 1 is
 * "fits the stage"; `x` / `y` move the picture from the centre, in screen
 * pixels. Pure geometry: the viewer applies it as a CSS transform.
 */

export type ImageView = { scale: number; x: number; y: number }
export type ViewSize = { width: number; height: number }

export const IMAGE_VIEW_FIT: ImageView = { scale: 1, x: 0, y: 0 }
export const MIN_IMAGE_ZOOM = 1
export const MAX_IMAGE_ZOOM = 8
/** One press of the zoom buttons. */
export const IMAGE_ZOOM_STEP = 1.5

export function clampImageZoom(scale: number): number {
  return Number.isFinite(scale) ? Math.min(MAX_IMAGE_ZOOM, Math.max(MIN_IMAGE_ZOOM, scale)) : MIN_IMAGE_ZOOM
}

/**
 * How far the picture may move: only as far as it overflows the stage, so an
 * edge never leaves the stage's edge behind and a picture that fits stays
 * centred. `frame` is the picture's size at scale 1.
 */
export function clampImagePan(view: ImageView, frame: ViewSize, stage: ViewSize): ImageView {
  const maxX = Math.max(0, (frame.width * view.scale - stage.width) / 2)
  const maxY = Math.max(0, (frame.height * view.scale - stage.height) / 2)
  return {
    scale: view.scale,
    // `+ 0` turns a clamped -0 into 0.
    x: Math.min(maxX, Math.max(-maxX, view.x)) + 0,
    y: Math.min(maxY, Math.max(-maxY, view.y)) + 0,
  }
}

/**
 * Zooms to `scale` keeping the point under `anchor` where it is. `anchor` is
 * measured from the stage's centre (the pointer, or the middle of a pinch);
 * { x: 0, y: 0 } zooms about the centre.
 */
export function zoomImageView(
  view: ImageView,
  scale: number,
  anchor: { x: number; y: number },
  frame: ViewSize,
  stage: ViewSize,
): ImageView {
  const next = clampImageZoom(scale)
  const ratio = next / view.scale
  return clampImagePan({
    scale: next,
    x: anchor.x - ratio * (anchor.x - view.x),
    y: anchor.y - ratio * (anchor.y - view.y),
  }, frame, stage)
}

/** "150%" for the zoom readout. */
export function formatImageZoom(scale: number): string {
  return `${Math.round(scale * 100)}%`
}
