import { readFile } from "node:fs/promises"
import { deflateSync } from "node:zlib"
import { expect, test, type Download, type Page } from "@playwright/test"

// The full-screen image viewer over one mocked song: its jacket is a small
// generated PNG served with cross-origin access, so the viewer can read it
// into a canvas and edit it.

const NOW = Date.parse("2026-10-22T08:00:00Z")
const DAY = 86_400_000
const JACKET = { width: 400, height: 200 }
/** The jacket's left half; the right half is `PINK`. */
const TEAL = [51, 204, 187] as const
const PINK = [255, 102, 153] as const

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  return value >>> 0
})

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data])
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, checksum])
}

/** An opaque RGB PNG: teal on the left half, pink on the right. */
function jacketPng(): Buffer {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(JACKET.width, 0)
  header.writeUInt32BE(JACKET.height, 4)
  header.set([8, 2, 0, 0, 0], 8)
  const rows = Buffer.alloc(JACKET.height * (1 + JACKET.width * 3))
  for (let y = 0; y < JACKET.height; y += 1) {
    const start = y * (1 + JACKET.width * 3)
    for (let x = 0; x < JACKET.width; x += 1) {
      rows.set(x < JACKET.width / 2 ? TEAL : PINK, start + 1 + x * 3)
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(rows)),
    pngChunk("IEND", Buffer.alloc(0)),
  ])
}

const files: Record<string, unknown> = {
  musics: [
    { id: 1, title: "Tell Your World", pronunciation: "てるゆあわーるど", composer: "kz", arranger: "kz", lyricist: "kz", assetbundleName: "jacket_s_001", publishedAt: NOW - 900 * DAY },
  ],
  musicDifficulties: [
    { id: 11, musicId: 1, musicDifficulty: "expert", playLevel: 25, totalNoteCount: 800 },
    { id: 12, musicId: 1, musicDifficulty: "master", playLevel: 30, totalNoteCount: 1100 },
  ],
}

async function mockSong(page: Page) {
  await page.clock.setFixedTime(new Date(NOW))
  await page.addInitScript(() => {
    if (!localStorage.getItem("settings")) {
      localStorage.setItem("settings", JSON.stringify({ locale: "zh-CN" }))
    }
    // The dev server's Vue devtools button sits at the bottom centre, over the viewer's bar.
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style")
      style.textContent = "#__vue-devtools-container__ { display: none !important; }"
      document.head.append(style)
    })
  })
  const jacket = jacketPng()
  const hashes = Object.fromEntries(
    Object.keys(files).map((name, index) => [index.toString(16).padStart(2, "0").repeat(32), name]),
  )
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url())
    if (url.host === "127.0.0.1:4173") return route.continue()
    if (url.pathname.endsWith("/jacket_s_001.png")) {
      return route.fulfill({ contentType: "image/png", headers: { "access-control-allow-origin": "*" }, body: jacket })
    }
    if (url.host !== "sekai-api-cdn.haruki.seiunx.com") {
      return route.request().resourceType() === "image" ? route.fulfill({ status: 404 }) : route.abort()
    }
    const name = hashes[url.pathname.split("/").at(-1) ?? ""]
    const body = url.pathname.endsWith("/current")
      ? { dataVersion: "7.1.0.12", contentHash: "viewer", files: Object.entries(hashes).map(([sha256, key]) => ({ name: `${key}.json`, sha256 })) }
      : name ? files[name] : []
    return route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) })
  })
}

async function openViewer(page: Page) {
  await mockSong(page)
  await page.goto("/music/1")
  await page.getByTestId("music-detail-jacket").getByRole("button", { name: "查看大图" }).click({ timeout: 30_000 })
  const viewer = page.getByTestId("image-viewer")
  await expect(viewer).toHaveAttribute("data-state", "ready")
  await expect(page.getByTestId("image-viewer-size")).toHaveText("400 × 200")
  return {
    viewer,
    size: page.getByTestId("image-viewer-size"),
    frame: page.getByTestId("image-viewer-frame"),
    undo: page.getByTestId("image-viewer-undo"),
    redo: page.getByTestId("image-viewer-redo"),
    confirm: page.getByTestId("image-viewer-mode-confirm"),
    /** The colour of one pixel of the picture as it is drawn, `at` in shares of its width and height. */
    pixel: (at: { x: number; y: number }) => page.getByTestId("image-viewer-frame").locator("canvas").evaluate((canvas, share) => {
      const element = canvas as HTMLCanvasElement
      const data = element.getContext("2d")!.getImageData(
        Math.floor(element.width * share.x),
        Math.floor(element.height * share.y),
        1,
        1,
      ).data
      return [data[0], data[1], data[2]]
    }, at),
    /**
     * Where the picture differs from the untouched jacket: the middle of
     * everything drawn on it, in shares of its width and height, and how far
     * it reaches, or `null` when nothing is drawn.
     */
    ink: () => page.getByTestId("image-viewer-frame").locator("canvas").evaluate((canvas, colors) => {
      const element = canvas as HTMLCanvasElement
      const { width, height } = element
      const data = element.getContext("2d")!.getImageData(0, 0, width, height).data
      let left = width
      let right = -1
      let top = height
      let bottom = -1
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const expected = x < width / 2 ? colors.left : colors.right
          const offset = (y * width + x) * 4
          if (expected.some((channel, index) => Math.abs(data[offset + index]! - channel) > 2)) {
            left = Math.min(left, x)
            right = Math.max(right, x)
            top = Math.min(top, y)
            bottom = Math.max(bottom, y)
          }
        }
      }
      return right < 0
        ? null
        : {
            x: (left + right + 1) / 2 / width,
            y: (top + bottom + 1) / 2 / height,
            /** The extent of what is drawn, in pixels of the picture. */
            width: right - left + 1,
            height: bottom - top + 1,
          }
    }, { left: [...TEAL], right: [...PINK] }),
  }
}

/** Drags across the picture between two points given in shares of its width and height. */
async function dragOnFrame(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const box = await page.getByTestId("image-viewer-frame").boundingBox()
  if (!box) throw new Error("the picture is not on screen")
  await page.mouse.move(box.x + box.width * from.x, box.y + box.height * from.y)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * (from.x + to.x) / 2, box.y + box.height * (from.y + to.y) / 2, { steps: 4 })
  await page.mouse.move(box.x + box.width * to.x, box.y + box.height * to.y, { steps: 4 })
  await page.mouse.up()
}

async function exportAs(page: Page, format: "png" | "jpeg" | "webp"): Promise<Download> {
  await page.getByTestId("image-viewer-export").click()
  await page.locator(`[data-format="${format}"]`).click()
  await expect(page.getByTestId("image-viewer-export-file-size")).toHaveText(/\d (B|KB|MB)$/)
  const download = page.waitForEvent("download")
  await page.getByTestId("image-viewer-export-save").click()
  return download
}

async function fileStart(download: Download, length: number): Promise<number[]> {
  return [...(await readFile(await download.path())).subarray(0, length)]
}

test("rotating and cropping change the picture's size", async ({ page }) => {
  const viewer = await openViewer(page)
  await expect(viewer.undo).toBeDisabled()

  await page.getByTestId("image-viewer-rotate-right").click()
  await expect(viewer.size).toHaveText("200 × 400")
  await expect(viewer.undo).toBeEnabled()
  // A quarter turn clockwise puts the left half on top.
  await expect.poll(() => viewer.pixel({ x: 0.5, y: 0.25 })).toEqual([...TEAL])
  await expect.poll(() => viewer.pixel({ x: 0.5, y: 0.75 })).toEqual([...PINK])

  await page.getByTestId("image-viewer-crop-start").click()
  await expect(viewer.viewer).toHaveAttribute("data-mode", "crop")
  await expect(page.getByTestId("image-viewer-crop")).toBeVisible()
  await expect(page.getByTestId("image-viewer-crop-size")).toHaveText("160 × 320")
  await page.locator('[data-aspect="1:1"]').click()
  await expect(page.getByTestId("image-viewer-crop-size")).toHaveText("160 × 160")
  await page.getByTestId("image-viewer-crop-apply").click()

  await expect(viewer.viewer).toHaveAttribute("data-mode", "none")
  await expect(viewer.viewer).toHaveAttribute("data-ops", "2")
  await expect(viewer.size).toHaveText("160 × 160")

  // Escape leaves a mode before it closes the viewer.
  await page.getByTestId("image-viewer-crop-start").click()
  await page.keyboard.press("Escape")
  await expect(viewer.viewer).toHaveAttribute("data-mode", "none")
  await expect(viewer.viewer).toHaveAttribute("data-ops", "2")
  await page.keyboard.press("Escape")
  await expect(viewer.viewer).toBeHidden()
})

test("the selection and a drawn line follow the pointer while zoomed in", async ({ page }) => {
  const viewer = await openViewer(page)
  await page.getByTestId("image-viewer-zoom-in").click()
  await expect(page.getByTestId("image-viewer-zoom-reset")).toHaveText("150%")

  await page.getByTestId("image-viewer-crop-start").click()
  await expect(page.getByTestId("image-viewer-crop-size")).toHaveText("320 × 160")
  const handle = await page.getByTestId("image-viewer-crop").locator('[data-handle="se"]').boundingBox()
  if (!handle) throw new Error("the crop handle is not on screen")
  // 60 × 30 screen pixels at 150% are 40 × 20 pixels of the picture.
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
  await page.mouse.down()
  await page.mouse.move(handle.x + handle.width / 2 - 60, handle.y + handle.height / 2 - 30, { steps: 4 })
  await page.mouse.up()
  await expect(page.getByTestId("image-viewer-crop-size")).toHaveText("280 × 140")
  await page.getByTestId("image-viewer-mode-cancel").click()
  await expect(viewer.viewer).toHaveAttribute("data-ops", "0")

  await page.getByTestId("image-viewer-draw-start").click()
  await expect(page.getByTestId("image-viewer-zoom-reset")).toHaveText("150%")
  await dragOnFrame(page, { x: 0.4, y: 0.25 }, { x: 0.6, y: 0.25 })
  await expect(viewer.viewer).toHaveAttribute("data-ops", "1")
  await expect.poll(() => viewer.pixel({ x: 0.45, y: 0.25 })).toEqual([239, 68, 68])
  await expect.poll(() => viewer.pixel({ x: 0.45, y: 0.5 })).toEqual([...TEAL])
})

test("an adjustment is previewed, confirmed, undone and redone", async ({ page }) => {
  const viewer = await openViewer(page)

  await page.getByTestId("image-viewer-adjust-start").click()
  await expect(viewer.confirm).toBeDisabled()
  await page.locator('[data-adjust="brightness"] input').fill("100")
  // Previewed at once: twice as bright.
  await expect.poll(() => viewer.pixel({ x: 0.1, y: 0.5 })).toEqual([102, 255, 255])
  await expect(viewer.viewer).toHaveAttribute("data-ops", "0")

  // The value is a button that puts its slider back to 0.
  await page.locator('[data-adjust="brightness"] [data-slider-reset]').click()
  await expect(viewer.confirm).toBeDisabled()
  await expect.poll(() => viewer.pixel({ x: 0.1, y: 0.5 })).toEqual([...TEAL])

  await page.locator('[data-adjust="brightness"] input').fill("100")
  await page.locator('[data-look="grayscale"]').click()
  await viewer.confirm.click()
  // The tone and the look are one step each.
  await expect(viewer.viewer).toHaveAttribute("data-ops", "2")
  await expect(viewer.undo).toBeEnabled()
  await expect(viewer.redo).toBeDisabled()
  const [red, green, blue] = await viewer.pixel({ x: 0.1, y: 0.5 })
  expect(red).toBe(green)
  expect(green).toBe(blue)

  await viewer.undo.click()
  await expect(viewer.viewer).toHaveAttribute("data-ops", "1")
  await expect(viewer.redo).toBeEnabled()
  await expect.poll(() => viewer.pixel({ x: 0.1, y: 0.5 })).toEqual([102, 255, 255])
  await viewer.redo.click()
  await expect(viewer.viewer).toHaveAttribute("data-ops", "2")
  await expect(viewer.redo).toBeDisabled()

  await page.keyboard.press("Control+z")
  await page.keyboard.press("Control+z")
  await expect(viewer.viewer).toHaveAttribute("data-ops", "0")
  await expect(viewer.undo).toBeDisabled()
  await expect.poll(() => viewer.pixel({ x: 0.1, y: 0.5 })).toEqual([...TEAL])
  await page.keyboard.press("Control+Shift+z")
  await page.keyboard.press("Control+y")
  await expect(viewer.viewer).toHaveAttribute("data-ops", "2")

  await page.getByTestId("image-viewer-reset").click()
  await expect(viewer.viewer).toHaveAttribute("data-ops", "0")
  await expect(viewer.redo).toBeEnabled()
})

test("straightening trims the picture and is off at zero", async ({ page }) => {
  const viewer = await openViewer(page)

  await page.getByTestId("image-viewer-straighten-start").click()
  await expect(viewer.confirm).toBeDisabled()
  await page.getByTestId("image-viewer-straighten-slider").locator("input").fill("10")
  await expect(page.getByTestId("image-viewer-straighten-slider").locator("[data-slider-reset]")).toHaveText("+10°")
  await expect(viewer.size).not.toHaveText("400 × 200")
  await viewer.confirm.click()
  await expect(viewer.viewer).toHaveAttribute("data-ops", "1")
  await expect(viewer.size).not.toHaveText("400 × 200")
})

test("a mask and each drawn line add an operation", async ({ page }) => {
  const viewer = await openViewer(page)

  await page.getByTestId("image-viewer-mask-start").click()
  await expect(page.getByTestId("image-viewer-mask")).toBeVisible()
  // The mosaic over the middle mixes the two halves along the seam.
  await expect.poll(() => viewer.pixel({ x: 0.495, y: 0.5 })).not.toEqual([...TEAL])
  await expect.poll(() => viewer.pixel({ x: 0.1, y: 0.5 })).toEqual([...TEAL])
  await page.locator('[data-mask="blur"]').click()
  await page.getByTestId("image-viewer-mask-strength").locator("input").fill("100")
  await viewer.confirm.click()
  await expect(viewer.viewer).toHaveAttribute("data-ops", "1")
  await expect(viewer.viewer).toHaveAttribute("data-mode", "none")

  await page.getByTestId("image-viewer-draw-start").click()
  await expect(viewer.viewer).toHaveAttribute("data-mode", "draw")
  await dragOnFrame(page, { x: 0.1, y: 0.2 }, { x: 0.9, y: 0.2 })
  await expect(viewer.viewer).toHaveAttribute("data-ops", "2")
  // The pen is red until another colour is picked.
  await expect.poll(() => viewer.pixel({ x: 0.3, y: 0.2 })).toEqual([239, 68, 68])

  await page.locator('[data-tool="rect"]').click()
  await page.locator('[data-color="blue"]').click()
  await dragOnFrame(page, { x: 0.1, y: 0.6 }, { x: 0.4, y: 0.9 })
  await expect(viewer.viewer).toHaveAttribute("data-ops", "3")
  await expect.poll(() => viewer.pixel({ x: 0.1, y: 0.75 })).toEqual([59, 130, 246])

  // A click with a shape tool draws nothing.
  await dragOnFrame(page, { x: 0.7, y: 0.7 }, { x: 0.7, y: 0.7 })
  await expect(viewer.viewer).toHaveAttribute("data-ops", "3")

  await page.getByTestId("image-viewer-draw-undo").click()
  await expect(viewer.viewer).toHaveAttribute("data-ops", "2")
  await viewer.confirm.click()
  await expect(viewer.viewer).toHaveAttribute("data-mode", "none")
  await expect(viewer.viewer).toHaveAttribute("data-ops", "2")
})

test("a press beside the picture draws nothing", async ({ page }) => {
  const viewer = await openViewer(page)

  await page.getByTestId("image-viewer-draw-start").click()
  const frame = await viewer.frame.boundingBox()
  const stage = await page.getByTestId("image-viewer-stage").boundingBox()
  if (!frame || !stage) throw new Error("the picture is not on screen")
  // The picture is wider than it is tall: the stage has room above it.
  expect(frame.y - stage.y).toBeGreaterThan(20)
  await page.mouse.click(frame.x + frame.width / 2, stage.y + (frame.y - stage.y) / 2)
  await expect(viewer.viewer).toHaveAttribute("data-ops", "0")
  // A drag that starts there and crosses the picture draws nothing either.
  await page.mouse.move(frame.x + frame.width / 2, stage.y + 4)
  await page.mouse.down()
  await page.mouse.move(frame.x + frame.width / 2, frame.y + frame.height / 2, { steps: 4 })
  await page.mouse.up()
  await expect(viewer.viewer).toHaveAttribute("data-ops", "0")
  // On the picture a click still leaves a dot.
  await page.mouse.click(frame.x + frame.width / 2, frame.y + frame.height / 2)
  await expect(viewer.viewer).toHaveAttribute("data-ops", "1")
})

test("the selection and its handles move with the arrow keys", async ({ page }) => {
  await openViewer(page)

  await page.getByTestId("image-viewer-crop-start").click()
  const size = page.getByTestId("image-viewer-crop-size")
  const selection = page.locator("[data-region-selection]")
  await expect(size).toHaveText("320 × 160")
  const before = await selection.boundingBox()
  if (!before) throw new Error("the selection is not on screen")

  // The whole selection: it moves, its size stays.
  await page.locator("[data-region-move]").focus()
  await page.keyboard.press("ArrowRight")
  await expect.poll(async () => ((await selection.boundingBox())?.x ?? 0) - before.x).toBeGreaterThan(1)
  await expect(size).toHaveText("320 × 160")

  // A corner: the selection shrinks from that corner, a hundredth of the long side a press, one pixel with Shift.
  await page.locator('[data-handle="se"]').focus()
  await page.keyboard.press("ArrowLeft")
  await expect(size).toHaveText("316 × 160")
  await page.keyboard.press("Shift+ArrowUp")
  await expect(size).toHaveText("316 × 159")

  // A locked shape holds from the keyboard too.
  await page.locator('[data-aspect="1:1"]').click()
  await page.locator('[data-handle="se"]').focus()
  await page.keyboard.press("ArrowLeft")
  const [width, height] = ((await size.textContent()) ?? "").split("×").map((part) => Number(part.trim()))
  expect(width).toBe(height)
  expect(width).toBeLessThan(159)
})

test("a text moves with the arrow keys once its frame has focus", async ({ page }) => {
  await openViewer(page)

  await page.getByTestId("image-viewer-text-start").click()
  await page.getByTestId("image-viewer-text-input").fill("Miku")
  const box = page.getByTestId("image-viewer-text-box")
  const before = await box.boundingBox()
  if (!before) throw new Error("the text is not on screen")
  await box.focus()
  await page.keyboard.press("ArrowDown")
  await page.keyboard.press("ArrowDown")
  await expect.poll(async () => ((await box.boundingBox())?.y ?? 0) - before.y).toBeGreaterThan(2)
  expect(Math.abs(((await box.boundingBox())?.x ?? 0) - before.x)).toBeLessThan(1)
  // The typing field still takes the arrow keys for itself.
  await page.getByTestId("image-viewer-text-input").focus()
  const moved = await box.boundingBox()
  await page.keyboard.press("ArrowDown")
  expect((await box.boundingBox())?.y).toBe(moved?.y)
})

test("a text needs something typed before it can be added", async ({ page }) => {
  const viewer = await openViewer(page)

  await page.getByTestId("image-viewer-text-start").click()
  const input = page.getByTestId("image-viewer-text-input")
  await expect(input).toHaveAttribute("placeholder", "输入文字")
  await expect(viewer.confirm).toBeDisabled()
  await input.fill("   ")
  await expect(viewer.confirm).toBeDisabled()
  await expect(page.getByTestId("image-viewer-text-box")).toHaveCount(0)

  expect(await viewer.ink()).toBeNull()
  await input.fill("Miku")
  await expect(viewer.confirm).toBeEnabled()
  // Previewed in the middle of the picture.
  await expect.poll(async () => (await viewer.ink())?.x).toBeCloseTo(0.5, 1)
  await expect.poll(async () => (await viewer.ink())?.y).toBeCloseTo(0.5, 1)

  // The text follows a drag of the frame around it.
  const box = await page.getByTestId("image-viewer-text-box").boundingBox()
  const frame = await viewer.frame.boundingBox()
  if (!box || !frame) throw new Error("the text is not on screen")
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(frame.x + frame.width * 0.25, frame.y + frame.height * 0.75, { steps: 4 })
  await page.mouse.up()
  await expect.poll(async () => (await viewer.ink())?.x).toBeCloseTo(0.25, 1)
  await expect.poll(async () => (await viewer.ink())?.y).toBeCloseTo(0.75, 1)

  await viewer.confirm.click()
  await expect(viewer.viewer).toHaveAttribute("data-ops", "1")
  await expect(viewer.viewer).toHaveAttribute("data-mode", "none")
})

test("a styled text of several lines is one operation", async ({ page }) => {
  const viewer = await openViewer(page)

  await page.getByTestId("image-viewer-text-start").click()
  const input = page.getByTestId("image-viewer-text-input")
  // Enter starts a new line instead of confirming.
  await input.fill("Hello")
  await input.press("Enter")
  await input.pressSequentially("Miku 39")
  await expect(input).toHaveValue("Hello\nMiku 39")
  await expect(input).toHaveAttribute("rows", "2")
  await expect(viewer.viewer).toHaveAttribute("data-mode", "text")

  // Another alignment moves the lines against each other, not the block.
  const centred = await page.getByTestId("image-viewer-text-box").boundingBox()
  if (!centred) throw new Error("the text is not on screen")
  for (const align of ["left", "right", "center"]) {
    await page.locator(`[data-text-align="${align}"]`).click()
    await expect(page.locator(`[data-text-align="${align}"]`)).toHaveAttribute("aria-pressed", "true")
    const moved = await page.getByTestId("image-viewer-text-box").boundingBox()
    expect(Math.abs((moved?.x ?? 0) - centred.x)).toBeLessThan(1)
    expect(Math.abs((moved?.width ?? 0) - centred.width)).toBeLessThan(1)
  }

  await expect(page.locator('[data-text-style="bold"]')).toHaveAttribute("aria-pressed", "true")
  await page.locator('[data-text-style="bold"]').click()
  await page.locator('[data-text-style="italic"]').click()
  await expect(page.locator('[data-text-style="italic"]')).toHaveAttribute("aria-pressed", "true")
  await page.locator('[data-text-font="serif"]').click()
  await page.locator('[data-color="white"]').click()

  // A plate is wider than the letters it sits behind.
  await expect(page.locator('[data-text-effect="outline"]')).toHaveAttribute("aria-pressed", "true")
  const outlined = await page.getByTestId("image-viewer-text-box").boundingBox()
  await page.locator('[data-text-effect="plate"]').click()
  await expect.poll(async () => (await page.getByTestId("image-viewer-text-box").boundingBox())?.width ?? 0)
    .toBeGreaterThan(outlined?.width ?? Number.POSITIVE_INFINITY)
  // The plate stays where the text was.
  await expect.poll(async () => {
    const ink = await viewer.ink()
    return ink ? Math.abs(ink.x - 0.5) + Math.abs(ink.y - 0.5) : 1
  }).toBeLessThan(0.1)

  await viewer.confirm.click()
  await expect(viewer.viewer).toHaveAttribute("data-ops", "1")
  await expect(viewer.viewer).toHaveAttribute("data-mode", "none")
  await expect(page.getByTestId("image-viewer-text-box")).toHaveCount(0)
})

test("a text takes any size in its range and keeps its place while it grows", async ({ page }) => {
  const viewer = await openViewer(page)

  await page.getByTestId("image-viewer-text-start").click()
  await page.getByTestId("image-viewer-text-input").fill("Miku")
  const box = page.getByTestId("image-viewer-text-box")
  const size = page.getByTestId("image-viewer-text-size")
  const slider = size.locator("input")
  const initial = await size.locator("[data-slider-reset]").textContent()
  const min = Number(await slider.getAttribute("min"))
  const max = Number(await slider.getAttribute("max"))
  expect(Number(initial)).toBeGreaterThan(min)
  expect(Number(initial)).toBeLessThan(max)
  const before = await box.boundingBox()
  if (!before) throw new Error("the text is not on screen")

  // Any value between the ends, not one of a few steps.
  const between = Math.round(Number(initial) * 1.37)
  await slider.fill(String(between))
  await expect(size.locator("[data-slider-reset]")).toHaveText(String(between))
  // The frame has a fixed margin around the text, so it grows a little less than the text itself.
  await expect.poll(async () => ((await box.boundingBox())?.height ?? 0) / before.height).toBeGreaterThan(1.1)
  expect(((await box.boundingBox())?.height ?? 0) / before.height).toBeLessThan(1.4)
  await slider.fill(String(max))
  const grown = await box.boundingBox()
  if (!grown) throw new Error("the text is not on screen")
  expect(grown.height).toBeGreaterThan(before.height * 2)
  // The line grows about its own middle.
  expect(Math.abs(grown.y + grown.height / 2 - (before.y + before.height / 2))).toBeLessThan(6)
  expect(Math.abs(grown.x + grown.width / 2 - (before.x + before.width / 2))).toBeLessThan(6)

  // The value is a button that goes back to the starting size.
  await size.locator("[data-slider-reset]").click()
  await expect(size.locator("[data-slider-reset]")).toHaveText(initial ?? "")
  await expect.poll(async () => Math.abs(((await box.boundingBox())?.height ?? 0) - before.height)).toBeLessThan(2)

  await viewer.confirm.click()
  await expect(viewer.viewer).toHaveAttribute("data-ops", "1")
})

test("a text is turned by the slider or by the handle above its frame", async ({ page }) => {
  const viewer = await openViewer(page)

  await page.getByTestId("image-viewer-text-start").click()
  await page.getByTestId("image-viewer-text-input").fill("Miku 39 Miku")
  const box = page.getByTestId("image-viewer-text-box")
  const rotation = page.getByTestId("image-viewer-text-rotation")
  await expect(rotation.locator("[data-slider-reset]")).toHaveText("0°")
  // Upright, a line of text is wider than it is tall.
  await expect.poll(async () => {
    const ink = await viewer.ink()
    return ink ? ink.width / ink.height : 0
  }).toBeGreaterThan(2)

  await rotation.locator("input").fill("90")
  await expect(rotation.locator("[data-slider-reset]")).toHaveText("+90°")
  await expect(box).toHaveCSS("rotate", "90deg")
  // On its side it is taller than wide, and still in the middle.
  await expect.poll(async () => {
    const ink = await viewer.ink()
    return ink ? ink.width / ink.height : 0
  }).toBeLessThan(0.5)
  await expect.poll(async () => (await viewer.ink())?.x).toBeCloseTo(0.5, 1)
  await expect.poll(async () => (await viewer.ink())?.y).toBeCloseTo(0.5, 1)

  // The value is a button that puts the text upright again.
  await rotation.locator("[data-slider-reset]").click()
  await expect(box).toHaveCSS("rotate", "0deg")

  // The handle follows the pointer around the text's middle and settles on -45° when close.
  const frame = await box.boundingBox()
  const handle = await page.getByTestId("image-viewer-text-rotate").boundingBox()
  if (!frame || !handle) throw new Error("the text is not on screen")
  const centre = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 }
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
  await page.mouse.down()
  await page.mouse.move(centre.x - 62, centre.y - 60, { steps: 6 })
  await page.mouse.up()
  await expect(rotation.locator("[data-slider-reset]")).toHaveText("−45°")
  await expect(box).toHaveCSS("rotate", "-45deg")

  await viewer.confirm.click()
  await expect(viewer.viewer).toHaveAttribute("data-ops", "1")
  await expect(viewer.viewer).toHaveAttribute("data-mode", "none")
})

/** The crop readout and the selection drawn on the picture both have this shape (width : height). */
async function expectCropShape(page: Page, ratio: number) {
  await expect.poll(async () => {
    const [width, height] = (await page.getByTestId("image-viewer-crop-size").innerText()).split("×").map(Number)
    return (width ?? 0) / (height ?? 1)
  }, { timeout: 1000 }).toBeCloseTo(ratio, 1)
  const box = await page.locator("[data-region-selection]").boundingBox()
  if (!box) throw new Error("the selection is not on screen")
  expect(box.width / box.height).toBeCloseTo(ratio, 1)
}

const CROP_RATIOS = [["1:1", 1], ["4:3", 4 / 3], ["16:9", 16 / 9], ["9:16", 9 / 16], ["3:4", 3 / 4], ["1:1", 1]] as const

test("every crop ratio takes effect on the click that picks it", async ({ page }) => {
  await openViewer(page)
  await page.getByTestId("image-viewer-crop-start").click()
  await expectCropShape(page, 2)

  for (const [key, ratio] of CROP_RATIOS) {
    await page.locator(`[data-aspect="${key}"]`).click()
    await expect(page.locator(`[data-aspect="${key}"]`)).toHaveAttribute("aria-pressed", "true")
    await expectCropShape(page, ratio)
  }

  // Free keeps the selection as it is and lets a handle change its shape again.
  await page.locator('[data-aspect="free"]').click()
  await expectCropShape(page, 1)
  const handle = await page.locator('[data-handle="e"]').boundingBox()
  if (!handle) throw new Error("the crop handle is not on screen")
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
  await page.mouse.down()
  await page.mouse.move(handle.x + handle.width / 2 + 40, handle.y + handle.height / 2, { steps: 4 })
  await page.mouse.up()
  await expect(page.getByTestId("image-viewer-crop-size")).not.toHaveText(/^(\d+) × \1$/)
})

test("a crop ratio picked after dragging the selection applies at once and holds while dragging", async ({ page }) => {
  await openViewer(page)
  await page.getByTestId("image-viewer-crop-start").click()

  // Move the selection, then pull a corner in: a free shape that is none of the ratios.
  const selection = await page.locator("[data-region-selection]").boundingBox()
  if (!selection) throw new Error("the selection is not on screen")
  await page.mouse.move(selection.x + selection.width / 2, selection.y + selection.height / 2)
  await page.mouse.down()
  await page.mouse.move(selection.x + selection.width / 2 - 20, selection.y + selection.height / 2 + 10, { steps: 4 })
  await page.mouse.up()
  const corner = await page.locator('[data-handle="se"]').boundingBox()
  if (!corner) throw new Error("the crop handle is not on screen")
  await page.mouse.move(corner.x + corner.width / 2, corner.y + corner.height / 2)
  await page.mouse.down()
  await page.mouse.move(corner.x + corner.width / 2 - 90, corner.y + corner.height / 2 - 20, { steps: 4 })
  await page.mouse.up()

  for (const [key, ratio] of CROP_RATIOS) {
    await page.locator(`[data-aspect="${key}"]`).click()
    await expectCropShape(page, ratio)
  }

  // A locked shape survives a drag of its corner.
  await page.locator('[data-aspect="4:3"]').click()
  await expectCropShape(page, 4 / 3)
  const locked = await page.locator('[data-handle="nw"]').boundingBox()
  if (!locked) throw new Error("the crop handle is not on screen")
  await page.mouse.move(locked.x + locked.width / 2, locked.y + locked.height / 2)
  await page.mouse.down()
  await page.mouse.move(locked.x + locked.width / 2 + 15, locked.y + locked.height / 2 + 5, { steps: 4 })
  await page.mouse.up()
  await expectCropShape(page, 4 / 3)
})

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test("every crop ratio takes effect on the tap that picks it", async ({ page }) => {
    const viewer = await openViewer(page)
    await page.getByTestId("image-viewer-crop-start").tap()
    await expect(viewer.viewer).toHaveAttribute("data-mode", "crop")
    await expectCropShape(page, 2)

    for (const [key, ratio] of CROP_RATIOS) {
      await page.locator(`[data-aspect="${key}"]`).tap()
      await expect(page.locator(`[data-aspect="${key}"]`)).toHaveAttribute("aria-pressed", "true")
      await expectCropShape(page, ratio)
    }
  })

  test("the picture stays on screen above every mode's panel", async ({ page }) => {
    const viewer = await openViewer(page)

    for (const mode of ["straighten", "adjust", "mask", "draw", "text"]) {
      await page.getByTestId(`image-viewer-${mode}-start`).tap()
      await expect(viewer.viewer).toHaveAttribute("data-mode", mode)
      const panel = await page.getByTestId("image-viewer-panel").boundingBox()
      const frame = await viewer.frame.boundingBox()
      if (!panel || !frame) throw new Error("the picture or the panel is not on screen")
      expect(frame.y).toBeGreaterThan(40)
      expect(frame.y + frame.height).toBeLessThanOrEqual(panel.y)
      expect(panel.y + panel.height).toBeLessThanOrEqual(844)
      expect(panel.x).toBeGreaterThanOrEqual(0)
      expect(panel.x + panel.width).toBeLessThanOrEqual(390)
      await page.keyboard.press("Escape")
      await expect(viewer.viewer).toHaveAttribute("data-mode", "none")
    }
  })
})

test("exporting an untouched picture converts its format and keeps its name", async ({ page }) => {
  await openViewer(page)

  const download = await exportAs(page, "jpeg")
  expect(download.suggestedFilename()).toBe("jacket_s_001.jpg")
  expect(await fileStart(download, 3)).toEqual([0xff, 0xd8, 0xff])
  await expect(page.getByTestId("image-viewer")).toHaveAttribute("data-mode", "none")
})

test("exporting an edited picture marks the file as edited in the chosen format", async ({ page }) => {
  const viewer = await openViewer(page)
  await page.getByTestId("image-viewer-flip-horizontal").click()
  await expect(viewer.viewer).toHaveAttribute("data-ops", "1")

  const png = await exportAs(page, "png")
  expect(png.suggestedFilename()).toBe("jacket_s_001-edited.png")
  expect(await fileStart(png, 4)).toEqual([0x89, 0x50, 0x4e, 0x47])

  const webp = await exportAs(page, "webp")
  expect(webp.suggestedFilename()).toBe("jacket_s_001-edited.webp")
  expect(String.fromCharCode(...await fileStart(webp, 4))).toBe("RIFF")
})

test("export offers a quality for lossy formats and a smaller size", async ({ page }) => {
  await openViewer(page)

  await page.getByTestId("image-viewer-export").click()
  const info = page.getByTestId("image-viewer-export-info")
  await expect(info).toContainText("400 × 200")
  await expect(page.locator('[data-format="png"]')).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByTestId("image-viewer-export-quality")).toHaveCount(0)

  await page.locator('[data-format="jpeg"]').click()
  await expect(page.getByTestId("image-viewer-export-quality")).toContainText("92%")
  await page.locator('[data-scale="0.5"]').click()
  await expect(info).toContainText("200 × 100")
  await expect(page.getByTestId("image-viewer-export-file-size")).toHaveText(/\d (B|KB|MB)$/)

  // A resize is a change: the file is named as edited.
  const download = page.waitForEvent("download")
  await page.getByTestId("image-viewer-export-save").click()
  expect((await download).suggestedFilename()).toBe("jacket_s_001-edited.jpg")
})
