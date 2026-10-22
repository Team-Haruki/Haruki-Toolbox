import { describe, expect, it } from "bun:test"
import {
  firstInvalidField,
  validateGroupForm,
  validateItemForm,
  validateLinkForm,
} from "./form-validation"

describe("validateLinkForm", () => {
  it("reports both required fields when empty", () => {
    expect(validateLinkForm({ name: " ", url: "" })).toEqual({ errors: { name: "nameRequired", url: "urlRequired" } })
  })

  it("prefers the required error over the URL format check", () => {
    expect(validateLinkForm({ name: "", url: "not a url" })).toEqual({ errors: { name: "nameRequired", url: "invalidUrl" } })
  })

  it("rejects non-http(s) URLs", () => {
    expect(validateLinkForm({ name: "Site", url: "javascript:alert(1)" })).toEqual({ errors: { url: "invalidUrl" } })
  })

  it("normalizes a valid URL", () => {
    expect(validateLinkForm({ name: "Site", url: " https://example.com " })).toEqual({ normalizedUrl: "https://example.com/" })
  })
})

describe("validateItemForm", () => {
  it("allows an empty URL", () => {
    expect(validateItemForm({ name: "Item", url: "" })).toEqual({ normalizedUrl: undefined })
  })

  it("rejects an invalid URL when one is given", () => {
    expect(validateItemForm({ name: "Item", url: "ftp://x" })).toEqual({ errors: { url: "invalidUrl" } })
  })

  it("requires a name", () => {
    expect(validateItemForm({ name: "", url: "https://example.com" })).toEqual({ errors: { name: "nameRequired" } })
  })
})

describe("validateGroupForm", () => {
  it("requires a name", () => {
    expect(validateGroupForm({ name: "  " })).toEqual({ name: "groupNameRequired" })
    expect(validateGroupForm({ name: "Group" })).toEqual({})
  })
})

describe("firstInvalidField", () => {
  it("returns the first field in form order", () => {
    expect(firstInvalidField({ url: "invalidUrl", name: "nameRequired" }, ["name", "url"])).toBe("name")
    expect(firstInvalidField({ url: "invalidUrl" }, ["name", "url"])).toBe("url")
    expect(firstInvalidField({}, ["name", "url"])).toBeNull()
  })
})
