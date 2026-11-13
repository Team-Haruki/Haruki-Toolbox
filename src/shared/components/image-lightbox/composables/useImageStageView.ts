import { computed, ref, type Ref } from "vue"
import {
  IMAGE_VIEW_FIT,
  MIN_IMAGE_ZOOM,
  clampImagePan,
  zoomImageView,
  type ImageView,
} from "image-edit-kit"

/**
 * What a one-pointer drag on the stage does while a mode owns it (drawing a
 * line, moving a text) instead of moving the picture. `cancel` ends a drag
 * that must leave nothing behind: a second finger turned it into a pinch.
 */
export type StageDrag = {
  start: (event: PointerEvent) => void
  move: (event: PointerEvent) => void
  end: () => void
  cancel: () => void
}

type StageViewOptions = {
  stage: Readonly<Ref<HTMLElement | null>>
  /** The element drawn exactly as large as the picture at scale 1. */
  frame: Readonly<Ref<HTMLElement | null>>
  /** Whether there is a picture to zoom. */
  enabled: () => boolean
  /** Whether a double click zooms (not while a mode uses clicks on the picture). */
  doubleClickZoom: () => boolean
  /** The mode's own drag, or `null` when one pointer moves the picture. */
  drag: () => StageDrag | null
}

/**
 * Zoom and pan of the picture in its stage: the wheel, a double click, a
 * pinch, and one pointer dragging the zoomed picture around. `scale` 1 fits
 * the stage; the offset is in screen pixels.
 */
export function useImageStageView(options: StageViewOptions) {
  const view = ref<ImageView>(IMAGE_VIEW_FIT)
  const zoomed = computed(() => view.value.scale > MIN_IMAGE_ZOOM)
  const panning = ref(false)
  const viewTransform = computed(() => `translate(${view.value.x}px, ${view.value.y}px) scale(${view.value.scale})`)

  function viewSizes() {
    const frame = options.frame.value
    const stage = options.stage.value
    if (!frame || !stage) {
      return null
    }
    return {
      frame: { width: frame.offsetWidth, height: frame.offsetHeight },
      stage: { width: stage.clientWidth, height: stage.clientHeight },
      stageRect: stage.getBoundingClientRect(),
    }
  }

  /** Zooms to `scale`, about a screen point when given (the pointer), else about the centre. */
  function zoomTo(scale: number, clientX?: number, clientY?: number) {
    const sizes = viewSizes()
    if (!sizes) {
      return
    }
    const anchor = clientX == null || clientY == null
      ? { x: 0, y: 0 }
      : {
          x: clientX - (sizes.stageRect.left + sizes.stageRect.width / 2),
          y: clientY - (sizes.stageRect.top + sizes.stageRect.height / 2),
        }
    view.value = zoomImageView(view.value, scale, anchor, sizes.frame, sizes.stage)
  }

  function resetView() {
    view.value = IMAGE_VIEW_FIT
  }

  /** Brings the picture back inside the stage after either changed size. */
  function clampView() {
    const sizes = viewSizes()
    if (sizes) {
      view.value = clampImagePan(view.value, sizes.frame, sizes.stage)
    }
  }

  function onWheel(event: WheelEvent) {
    if (options.enabled()) {
      zoomTo(view.value.scale * Math.exp(-event.deltaY * 0.0015), event.clientX, event.clientY)
    }
  }

  function onDoubleClick(event: MouseEvent) {
    if (!options.doubleClickZoom()) {
      return
    }
    if (zoomed.value) {
      resetView()
    } else {
      zoomTo(2, event.clientX, event.clientY)
    }
  }

  // One pointer drags (the picture, or whatever the mode says); two pinch.
  const pointers = new Map<number, { x: number; y: number }>()
  let panStart: { x: number; y: number; view: ImageView } | null = null
  let pinchStart: { distance: number; scale: number } | null = null
  let modeDrag: { pointerId: number; drag: StageDrag } | null = null

  function pinchDistance(): number {
    const [first, second] = [...pointers.values()]
    return first && second ? Math.hypot(first.x - second.x, first.y - second.y) : 0
  }

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    if (pointers.size === 2) {
      modeDrag?.drag.cancel()
      modeDrag = null
      panStart = null
      pinchStart = { distance: pinchDistance(), scale: view.value.scale }
    } else if (pointers.size === 1) {
      const drag = options.drag()
      if (drag) {
        modeDrag = { pointerId: event.pointerId, drag }
        drag.start(event)
        return
      }
      panStart = { x: event.clientX, y: event.clientY, view: view.value }
      panning.value = zoomed.value
    }
  }

  function onPointerMove(event: PointerEvent) {
    if (!pointers.has(event.pointerId)) {
      return
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pinchStart && pointers.size === 2) {
      const [first, second] = [...pointers.values()]
      const distance = pinchDistance()
      if (first && second && pinchStart.distance > 0 && distance > 0) {
        zoomTo(pinchStart.scale * (distance / pinchStart.distance), (first.x + second.x) / 2, (first.y + second.y) / 2)
      }
      return
    }
    if (modeDrag) {
      if (modeDrag.pointerId === event.pointerId) {
        modeDrag.drag.move(event)
      }
      return
    }
    const sizes = viewSizes()
    if (panStart && sizes && zoomed.value) {
      view.value = clampImagePan({
        scale: view.value.scale,
        x: panStart.view.x + (event.clientX - panStart.x),
        y: panStart.view.y + (event.clientY - panStart.y),
      }, sizes.frame, sizes.stage)
    }
  }

  function release(event: PointerEvent, cancelled: boolean) {
    pointers.delete(event.pointerId)
    pinchStart = null
    if (modeDrag?.pointerId === event.pointerId) {
      if (cancelled) {
        modeDrag.drag.cancel()
      } else {
        modeDrag.drag.end()
      }
      modeDrag = null
    }
    // The finger left after a pinch goes on moving the picture.
    const remaining = [...pointers.values()][0]
    panStart = remaining && !modeDrag ? { x: remaining.x, y: remaining.y, view: view.value } : null
    panning.value = false
  }

  /** Drops a mode's drag in progress (the mode is going away). */
  function cancelDrag() {
    modeDrag?.drag.cancel()
    modeDrag = null
  }

  /** Forgets every pointer: the stage went away under them, so their releases never arrive. */
  function releasePointers() {
    cancelDrag()
    pointers.clear()
    panStart = null
    pinchStart = null
    panning.value = false
  }

  return {
    view,
    zoomed,
    panning,
    viewTransform,
    zoomTo,
    resetView,
    clampView,
    cancelDrag,
    releasePointers,
    onWheel,
    onDoubleClick,
    onPointerDown,
    onPointerMove,
    onPointerUp: (event: PointerEvent) => release(event, false),
    onPointerCancel: (event: PointerEvent) => release(event, true),
  }
}
