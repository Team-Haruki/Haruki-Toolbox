import { describe, expect, it } from "bun:test"
import { buildTicketListQuery, readPageQuery, readStatusQuery, ticketListQueryMatches } from "./list-query"

describe("ticket list query", () => {
  it("reads the filter and page with safe defaults", () => {
    expect(readStatusQuery("open")).toBe("open")
    expect(readStatusQuery("nope")).toBe("all")
    expect(readStatusQuery(["open"])).toBe("all")
    expect(readStatusQuery(undefined)).toBe("all")
    expect(readPageQuery("3")).toBe(3)
    expect(readPageQuery("1")).toBe(1)
    expect(readPageQuery("0")).toBe(1)
    expect(readPageQuery("x")).toBe(1)
    expect(readPageQuery(undefined)).toBe(1)
  })

  it("tells when the query already matches the local state", () => {
    expect(ticketListQueryMatches({}, "all", 1)).toBe(true)
    expect(ticketListQueryMatches({ status: "open", page: "3" }, "open", 3)).toBe(true)
    expect(ticketListQueryMatches({ status: "open" }, "open", 1)).toBe(true)
    expect(ticketListQueryMatches({ status: "open", page: "3" }, "open", 1)).toBe(false)
    expect(ticketListQueryMatches({ page: "2" }, "all", 1)).toBe(false)
  })

  it("writes only non-default values and keeps other parameters", () => {
    expect(buildTicketListQuery({ tab: "x", status: "open", page: "4" }, "all", 1)).toEqual({ tab: "x" })
    expect(buildTicketListQuery({}, "closed", 2)).toEqual({ status: "closed", page: "2" })
    expect(buildTicketListQuery({ page: "9" }, "open", 1)).toEqual({ status: "open" })
  })
})
