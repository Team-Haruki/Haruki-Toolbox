import { describe, expect, test } from "bun:test"
import {
  UPLOAD_METHOD_FILTER_VALUES,
  UPLOAD_SERVER_FILTER_VALUES,
  describeMultiFilterSelection,
  resolveMultiFilterLabel,
} from "./upload-log-meta"

const options = [
  { value: "jp", label: "日服" },
  { value: "en", label: "国际服" },
  { value: "tw", label: "台服" },
]
const more = (first: string, count: number) => `${first} +${count}`

describe("resolveMultiFilterLabel", () => {
  test("falls back when nothing (known) is selected", () => {
    expect(resolveMultiFilterLabel([], options, "全部区服", more)).toBe("全部区服")
    expect(resolveMultiFilterLabel(["zz"], options, "全部区服", more)).toBe("全部区服")
  })

  test("shows the single pick, and first +N for several picks", () => {
    expect(resolveMultiFilterLabel(["en"], options, "全部区服", more)).toBe("国际服")
    expect(resolveMultiFilterLabel(["tw", "jp"], options, "全部区服", more)).toBe("日服 +1")
    expect(resolveMultiFilterLabel(["jp", "en", "tw"], options, "全部区服", more)).toBe("日服 +2")
  })

  test("describeMultiFilterSelection lists every pick in option order", () => {
    expect(describeMultiFilterSelection(["tw", "jp"], options)).toBe("日服, 台服")
    expect(describeMultiFilterSelection([], options)).toBe("")
  })
})

describe("filter value lists", () => {
  test("never contain the select's all entry", () => {
    expect(UPLOAD_METHOD_FILTER_VALUES).not.toContain("all")
    expect(UPLOAD_SERVER_FILTER_VALUES).not.toContain("all")
    expect(UPLOAD_SERVER_FILTER_VALUES).toContain("jp")
  })
})
