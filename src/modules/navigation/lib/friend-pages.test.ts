import { describe, expect, it } from "bun:test"
import { extractGroupNumber, resolveLinkHost } from "./friend-pages"

describe("resolveLinkHost", () => {
  it("shows the host without the scheme, path or a leading www", () => {
    expect(resolveLinkHost("https://sekai.best")).toBe("sekai.best")
    expect(resolveLinkHost("https://www.example.com/some/path?x=1")).toBe("example.com")
    expect(resolveLinkHost("http://viewer.unipjsk.com:8443/")).toBe("viewer.unipjsk.com:8443")
  })

  it("is empty for an address that does not parse", () => {
    expect(resolveLinkHost("not a url")).toBe("")
    expect(resolveLinkHost("")).toBe("")
  })
})

describe("extractGroupNumber", () => {
  it("reads the number out of the info text", () => {
    expect(extractGroupNumber("QQ 730020933")).toBe("730020933")
    expect(extractGroupNumber("QQ群：1026390204（已满）")).toBe("1026390204")
    expect(extractGroupNumber("12345")).toBe("12345")
  })

  it("skips digit runs that are not a group number", () => {
    expect(extractGroupNumber("2 群 QQ 954385726")).toBe("954385726")
    expect(extractGroupNumber("Discord")).toBeNull()
    expect(extractGroupNumber("1234")).toBeNull()
    expect(extractGroupNumber("1234567890123")).toBeNull()
    expect(extractGroupNumber("")).toBeNull()
  })
})
