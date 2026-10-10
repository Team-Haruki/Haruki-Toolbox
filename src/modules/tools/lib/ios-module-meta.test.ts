import { describe, expect, it } from "bun:test"
import {
  ENDPOINT_OPTIONS,
  IOS_DATA_TYPE_OPTIONS,
  IOS_MODULE_EXTENSION_MAP,
  IOS_URI_SCHEMES,
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

describe("Stash install link", () => {
  const moduleUrl = "https://toolbox.example/ios/module/code/jp-haruki-toolbox-suite.stoverride?mode=script&endpoint=direct&chunk=2"

  it("downloads a .stoverride file", () => {
    expect(IOS_MODULE_EXTENSION_MAP.stash).toBe("stoverride")
  })

  it("uses the documented stash://install-override scheme with the encoded URL", () => {
    const link = IOS_URI_SCHEMES.stash(moduleUrl)
    expect(link.startsWith("stash://install-override?url=")).toBe(true)
    const parsed = new URL(link)
    expect(parsed.protocol).toBe("stash:")
    expect(parsed.searchParams.get("url")).toBe(moduleUrl)
    expect(Array.from(parsed.searchParams.keys())).toEqual(["url"])
  })
})
