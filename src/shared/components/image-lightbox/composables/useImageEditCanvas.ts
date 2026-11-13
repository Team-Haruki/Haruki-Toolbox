import { computed, onScopeDispose, shallowRef, watch, type Ref } from "vue"
import {
  applyImageEditOp,
  paintImageSource,
  renderImageEdit,
  resolveEditedImageSize,
  type EditCanvas,
  type ImageEditOp,
  type ImageSize,
  type ImageSource,
} from "image-edit-kit"
import { resolveAppendedOps } from "@/lib/image-lightbox"

type EditCanvasOptions = {
  /** The canvas on the page. */
  canvas: Readonly<Ref<HTMLCanvasElement | null>>
  /** The original picture. */
  source: Readonly<Ref<ImageBitmap | null>>
  /** The committed operations. */
  ops: () => readonly ImageEditOp[]
}

/**
 * Draws the edit. One canvas (`base`) holds the original with the committed
 * operations and is redrawn only when they change; the operations of the
 * mode in progress (`draft`) are applied on top of a copy for every paint, so
 * a slider or a drag never replays the whole edit. Paints are coalesced to
 * one per animation frame. `base` is never drawn on.
 */
export function useImageEditCanvas(options: EditCanvasOptions) {
  const base = shallowRef<EditCanvas | null>(null)
  const draft = shallowRef<readonly ImageEditOp[]>([])
  let baseOps: readonly ImageEditOp[] = []

  watch([options.source, options.ops], ([bitmap, ops], [previousBitmap]) => {
    if (!bitmap) {
      base.value = null
      baseOps = []
      return
    }
    const appended = bitmap === previousBitmap && base.value ? resolveAppendedOps(baseOps, ops) : null
    base.value = appended && base.value
      ? appended.reduce<EditCanvas>((canvas, op) => applyImageEditOp(canvas, op), base.value)
      : renderImageEdit(bitmap, ops)
    baseOps = ops
  })

  const baseSize = computed<ImageSize | null>(() => (base.value ? { width: base.value.width, height: base.value.height } : null))
  /** The size of what is on screen: a draft may change it (a tilt trims the corners). */
  const displaySize = computed<ImageSize | null>(() => (baseSize.value ? resolveEditedImageSize(baseSize.value, draft.value) : null))

  let frame = 0

  function paint() {
    frame = 0
    const target = options.canvas.value
    const committed = base.value
    if (!target || !committed) {
      return
    }
    const picture = draft.value.reduce<ImageSource>((current, op) => applyImageEditOp(current, op), committed)
    paintImageSource(target, picture)
  }

  function schedulePaint() {
    if (frame === 0) {
      frame = requestAnimationFrame(paint)
    }
  }

  watch([base, draft, options.canvas], schedulePaint)

  onScopeDispose(() => {
    if (frame !== 0) {
      cancelAnimationFrame(frame)
    }
  })

  return { base, baseSize, displaySize, draft }
}
