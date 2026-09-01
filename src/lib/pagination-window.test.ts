import { describe, expect, test } from "bun:test"
import {
  buildPaginationWindow,
  clampPage,
  countPages,
  sliceItemsForPage,
} from "./pagination-window"

describe("buildPaginationWindow", () => {
  test("lists every page when the total fits the window", () => {
    expect(buildPaginationWindow(1, 1)).toEqual([1])
    expect(buildPaginationWindow(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  test("collapses the far side with an ellipsis", () => {
    expect(buildPaginationWindow(1, 20)).toEqual([1, 2, 3, 4, "ellipsis", 20])
    expect(buildPaginationWindow(2, 20)).toEqual([1, 2, 3, 4, "ellipsis", 20])
    expect(buildPaginationWindow(20, 20)).toEqual([1, "ellipsis", 17, 18, 19, 20])
  })

  test("keeps siblings around the middle page with ellipses on both sides", () => {
    expect(buildPaginationWindow(10, 20)).toEqual([1, "ellipsis", 9, 10, 11, "ellipsis", 20])
    expect(buildPaginationWindow(10, 20, 2)).toEqual([1, "ellipsis", 8, 9, 10, 11, 12, "ellipsis", 20])
  })

  test("never emits an ellipsis for a single skipped page", () => {
    expect(buildPaginationWindow(4, 20)).toEqual([1, 2, 3, 4, 5, "ellipsis", 20])
    expect(buildPaginationWindow(17, 20)).toEqual([1, "ellipsis", 16, 17, 18, 19, 20])
  })

  test("clamps out-of-range pages", () => {
    expect(buildPaginationWindow(0, 5)).toEqual([1, 2, 3, 4, 5])
    expect(buildPaginationWindow(99, 20)).toEqual([1, "ellipsis", 17, 18, 19, 20])
    expect(buildPaginationWindow(3, 0)).toEqual([1])
  })
})

describe("page helpers", () => {
  test("countPages rounds up and never returns zero", () => {
    expect(countPages(0, 60)).toBe(1)
    expect(countPages(60, 60)).toBe(1)
    expect(countPages(61, 60)).toBe(2)
    expect(countPages(10, 0)).toBe(10)
  })

  test("clampPage keeps the page inside [1, totalPages]", () => {
    expect(clampPage(0, 3)).toBe(1)
    expect(clampPage(5, 3)).toBe(3)
    expect(clampPage(Number.NaN, 3)).toBe(1)
    expect(clampPage(2.9, 3)).toBe(2)
  })

  test("sliceItemsForPage returns the right slice and clamps the page", () => {
    const items = Array.from({ length: 7 }, (_, index) => index + 1)
    expect(sliceItemsForPage(items, 1, 3)).toEqual([1, 2, 3])
    expect(sliceItemsForPage(items, 3, 3)).toEqual([7])
    expect(sliceItemsForPage(items, 9, 3)).toEqual([7])
    expect(sliceItemsForPage([], 1, 3)).toEqual([])
  })
})
