import { expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"

const directory = import.meta.dir
const read = (name: string) => readFileSync(`${directory}/${name}`, "utf8")

test("the vendored CostumeShop entry exports the kernel, the mirror content and the role parts", () => {
  const entry = read("haruki-3d-engine-costume-shop.js")
  for (const name of ["createHaruki3DKernel", "createMirrorContent", "listRoleParts"]) {
    expect(entry).toMatch(new RegExp(`as ${name}\\b`))
  }
})

test("the vendored kernel keeps the view yaw, zoom and height controls", () => {
  const sources = readdirSync(directory).filter((name) => name.endsWith(".js")).map(read).join("\n")
  for (const name of ["setViewYawDegrees", "setViewZoom", "setViewHeightOffset"]) {
    expect(sources).toContain(name)
  }
})

test("every relative import of the vendored files resolves inside the directory", () => {
  const files = new Set([
    ...readdirSync(directory),
    ...readdirSync(`${directory}/assets`).map((name) => `assets/${name}`),
  ])
  for (const name of [...files].filter((file) => file.endsWith(".js"))) {
    for (const [, path] of read(name).matchAll(/(?:from\s*|import\()\s*"\.\/([^"]+)"/g)) {
      expect(files.has(path!)).toBe(true)
    }
    for (const [, path] of read(name).matchAll(/new URL\("(assets\/[^"]+)"/g)) {
      expect(files.has(path!)).toBe(true)
    }
  }
})
