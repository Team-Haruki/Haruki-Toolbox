import { describe, expect, test } from "bun:test"
import { ADMIN_DEFAULT_PAGE_SIZE, readAdminPage, readAdminPageSize } from "./pagination"

describe("admin pagination query readers", () => {
  test("readAdminPageSize accepts offered sizes only", () => {
    expect(readAdminPageSize("50")).toBe(50)
    expect(readAdminPageSize("100")).toBe(100)
    expect(readAdminPageSize("10")).toBe(ADMIN_DEFAULT_PAGE_SIZE)
    expect(readAdminPageSize("abc")).toBe(ADMIN_DEFAULT_PAGE_SIZE)
    expect(readAdminPageSize(undefined)).toBe(ADMIN_DEFAULT_PAGE_SIZE)
  })

  test("readAdminPage falls back to the first page", () => {
    expect(readAdminPage("3")).toBe(3)
    expect(readAdminPage("0")).toBe(1)
    expect(readAdminPage("-2")).toBe(1)
    expect(readAdminPage(undefined)).toBe(1)
  })
})
