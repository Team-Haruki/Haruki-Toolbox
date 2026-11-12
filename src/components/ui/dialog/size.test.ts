import { describe, expect, test } from "bun:test"
import { DIALOG_SIZE_CLASS } from "./size"

describe("dialog sizes", () => {
  test("is one ascending scale applied from the sm breakpoint", () => {
    const widths = Object.values(DIALOG_SIZE_CLASS).map((value) => {
      const match = /^sm:max-w-\[(\d+)rem\]$/.exec(value)
      expect(match).not.toBeNull()
      return Number(match![1])
    })

    expect(Object.keys(DIALOG_SIZE_CLASS)).toEqual(["sm", "md", "lg", "xl", "2xl"])
    expect(widths).toEqual([...widths].sort((a, b) => a - b))
    expect(new Set(widths).size).toBe(widths.length)
  })
})
