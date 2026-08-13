import { expect, test } from "bun:test"
import { readdirSync, readFileSync } from "node:fs"

test("vendored costume kernel exposes view yaw", () => {
  const directory = import.meta.dir
  const kernelFile = readdirSync(directory).find((name) => name.startsWith("CostumeShopKernel-"))

  expect(kernelFile).toBeDefined()
  expect(readFileSync(`${directory}/${kernelFile}`, "utf8")).toContain("setViewYawDegrees")
})
