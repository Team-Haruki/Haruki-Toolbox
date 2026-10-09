import { describe, expect, it } from "bun:test"
import {
  ENDPOINT_OPTIONS,
  IOS_DATA_TYPE_OPTIONS,
  REGION_OPTIONS,
  SOFTWARE_OPTIONS,
  UPLOAD_MODE_OPTIONS,
  isIOSUploadDataType,
  isMySekaiUploadType,
} from "./ios-module-meta"

describe("iOS module options", () => {
  it("lists every client, endpoint, mode and data type", () => {
    expect(SOFTWARE_OPTIONS.map((option) => option.value)).toEqual(["surge", "shadowrocket", "loon", "qx", "stash"])
    expect(ENDPOINT_OPTIONS.map((option) => option.value)).toEqual(["direct", "cdn"])
    expect(UPLOAD_MODE_OPTIONS.map((option) => option.value)).toEqual(["proxy", "script"])
    expect(REGION_OPTIONS.map((option) => option.value)).toContain("jp")
    expect(IOS_DATA_TYPE_OPTIONS.every((option) => isIOSUploadDataType(option.value))).toBe(true)
  })

  it("separates MySekai upload types from the suite", () => {
    expect(isMySekaiUploadType("suite")).toBe(false)
    expect(isMySekaiUploadType("mysekai_force")).toBe(true)
    expect(isIOSUploadDataType("unknown")).toBe(false)
  })
})
