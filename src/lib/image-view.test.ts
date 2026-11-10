import { describe, expect, it } from "bun:test"
import { IMAGE_VIEW_FIT, clampImagePan, clampImageZoom, formatImageZoom, zoomImageView } from "./image-view"

const frame = { width: 800, height: 400 }
const stage = { width: 1000, height: 600 }

describe("image view", () => {
  it("keeps the zoom between fit and the maximum", () => {
    expect(clampImageZoom(0.2)).toBe(1)
    expect(clampImageZoom(3)).toBe(3)
    expect(clampImageZoom(99)).toBe(8)
    expect(clampImageZoom(Number.NaN)).toBe(1)
  })

  it("does not let a picture that fits leave the centre", () => {
    expect(clampImagePan({ scale: 1, x: 300, y: -200 }, frame, stage)).toEqual({ scale: 1, x: 0, y: 0 })
  })

  it("lets a zoomed picture move only as far as it overflows", () => {
    // 2×: 1600 × 800 in a 1000 × 600 stage → ±300 and ±100.
    expect(clampImagePan({ scale: 2, x: 999, y: -999 }, frame, stage)).toEqual({ scale: 2, x: 300, y: -100 })
    expect(clampImagePan({ scale: 2, x: -120, y: 40 }, frame, stage)).toEqual({ scale: 2, x: -120, y: 40 })
  })

  it("zooms about the centre without moving", () => {
    expect(zoomImageView(IMAGE_VIEW_FIT, 2, { x: 0, y: 0 }, frame, stage)).toEqual({ scale: 2, x: 0, y: 0 })
  })

  it("keeps the point under the pointer in place", () => {
    // The point 100 px right of centre stays there: the picture moves left by 100.
    expect(zoomImageView(IMAGE_VIEW_FIT, 2, { x: 100, y: 0 }, frame, stage)).toEqual({ scale: 2, x: -100, y: 0 })
    // Zooming back out returns to the fit view.
    expect(zoomImageView({ scale: 2, x: -100, y: 0 }, 1, { x: 100, y: 0 }, frame, stage)).toEqual({ scale: 1, x: 0, y: 0 })
  })

  it("clamps both the zoom and the resulting pan", () => {
    expect(zoomImageView(IMAGE_VIEW_FIT, 100, { x: 0, y: 0 }, frame, stage).scale).toBe(8)
    expect(zoomImageView(IMAGE_VIEW_FIT, 2, { x: 5000, y: 0 }, frame, stage)).toEqual({ scale: 2, x: -300, y: 0 })
  })

  it("formats the readout", () => {
    expect(formatImageZoom(1)).toBe("100%")
    expect(formatImageZoom(1.5)).toBe("150%")
  })
})
