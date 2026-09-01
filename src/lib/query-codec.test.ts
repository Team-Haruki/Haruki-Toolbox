import { describe, expect, test } from "bun:test"
import {
  mergeQuery,
  readQueryBoolean,
  readQueryEnum,
  readQueryEnumList,
  readQueryInt,
  readQueryIntList,
  readQueryList,
  readQueryString,
  serializeQueryRecord,
  writeQueryList,
  writeQueryValue,
} from "./query-codec"

describe("query readers", () => {
  test("readQueryString takes the first array entry and trims", () => {
    expect(readQueryString(" a ")).toBe("a")
    expect(readQueryString(["b", "c"])).toBe("b")
    expect(readQueryString("")).toBeNull()
    expect(readQueryString(undefined)).toBeNull()
    expect(readQueryString(null)).toBeNull()
  })

  test("readQueryInt validates integers and bounds", () => {
    expect(readQueryInt("12")).toBe(12)
    expect(readQueryInt("12.5")).toBeNull()
    expect(readQueryInt("abc")).toBeNull()
    expect(readQueryInt("0", { min: 1 })).toBeNull()
    expect(readQueryInt("500", { max: 120 })).toBeNull()
    expect(readQueryInt(["7"], { min: 1 })).toBe(7)
  })

  test("readQueryEnum only accepts allowed values", () => {
    expect(readQueryEnum("asc", ["asc", "desc"])).toBe("asc")
    expect(readQueryEnum("up", ["asc", "desc"])).toBeNull()
  })

  test("readQueryBoolean accepts 1 and true", () => {
    expect(readQueryBoolean("1")).toBe(true)
    expect(readQueryBoolean("true")).toBe(true)
    expect(readQueryBoolean("0")).toBe(false)
    expect(readQueryBoolean(undefined)).toBe(false)
  })

  test("readQueryList splits, trims, dedupes", () => {
    expect(readQueryList("a, b,,a,c")).toEqual(["a", "b", "c"])
    expect(readQueryList(undefined)).toEqual([])
  })

  test("readQueryEnumList drops unknown members", () => {
    expect(readQueryEnumList("cute,loud,cool", ["cute", "cool"])).toEqual(["cute", "cool"])
  })

  test("readQueryIntList keeps valid positive integers", () => {
    expect(readQueryIntList("1,2,x,2,-3,0")).toEqual([1, 2])
    expect(readQueryIntList("0,5", { min: 0 })).toEqual([0, 5])
  })
})

describe("query writers", () => {
  test("writeQueryList joins and omits empty lists", () => {
    expect(writeQueryList([1, 2])).toBe("1,2")
    expect(writeQueryList([])).toBeUndefined()
  })

  test("writeQueryValue omits defaults, empties and false", () => {
    expect(writeQueryValue("desc", "desc")).toBeUndefined()
    expect(writeQueryValue("asc", "desc")).toBe("asc")
    expect(writeQueryValue(1, 1)).toBeUndefined()
    expect(writeQueryValue(2, 1)).toBe("2")
    expect(writeQueryValue(true)).toBe("1")
    expect(writeQueryValue(false)).toBeUndefined()
    expect(writeQueryValue("")).toBeUndefined()
    expect(writeQueryValue(null)).toBeUndefined()
  })

  test("mergeQuery preserves foreign keys and drops removed owned keys", () => {
    const merged = mergeQuery(
      { q: "old", page: "3", utm: "x", foreign: ["a", "b"] },
      ["q", "page", "sort"],
      { q: "new", page: undefined, sort: "id" },
    )
    expect(merged).toEqual({ utm: "x", foreign: ["a", "b"], q: "new", sort: "id" })
  })

  test("serializeQueryRecord is order-independent and skips blanks", () => {
    expect(serializeQueryRecord({ b: "2", a: "1", c: undefined, d: "" })).toBe("a=1&b=2")
    expect(serializeQueryRecord({})).toBe("")
  })
})
