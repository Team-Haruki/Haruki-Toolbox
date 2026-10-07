import { describe, expect, it } from "bun:test"
import { encodePathSegment, resolveRequestBaseURL } from "@/core/http/url"

describe("resolveRequestBaseURL", () => {
  it("uses the selected endpoint when the request names none", () => {
    expect(resolveRequestBaseURL(undefined, "https://cdn.example")).toBe("https://cdn.example")
    expect(resolveRequestBaseURL("", "https://cdn.example")).toBe("https://cdn.example")
    expect(resolveRequestBaseURL("   ", "https://cdn.example")).toBe("https://cdn.example")
  })

  it("lets a request override the selected endpoint", () => {
    expect(resolveRequestBaseURL("https://direct.example", "https://cdn.example")).toBe("https://direct.example")
  })
})

describe("encodePathSegment", () => {
  it("escapes path separators", () => {
    expect(encodePathSegment("a/b c")).toBe("a%2Fb%20c")
  })
})
