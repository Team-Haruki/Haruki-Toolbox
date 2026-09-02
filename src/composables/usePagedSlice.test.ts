import { describe, expect, test } from "bun:test"
import { nextTick, ref } from "vue"
import { usePagedSlice } from "./usePagedSlice"

function range(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index + 1)
}

describe("usePagedSlice", () => {
  test("slices the requested page and reports the page count", () => {
    const items = ref(range(25))
    const page = ref(2)
    const size = ref(10)
    const paged = usePagedSlice(items, page, size)

    expect(paged.totalPages.value).toBe(3)
    expect(paged.currentPage.value).toBe(2)
    expect(paged.pageItems.value).toEqual(range(20).slice(10))
  })

  test("renders the last page when the requested page is out of range", () => {
    const items = ref(range(25))
    const page = ref(9)
    const size = ref(10)
    const paged = usePagedSlice(items, page, size)

    expect(paged.currentPage.value).toBe(3)
    expect(paged.pageItems.value).toEqual([21, 22, 23, 24, 25])
  })

  test("treats non-positive and non-finite pages as the first page", () => {
    const items = ref(range(5))
    const size = ref(2)
    expect(usePagedSlice(items, ref(0), size).currentPage.value).toBe(1)
    expect(usePagedSlice(items, ref(-3), size).currentPage.value).toBe(1)
    expect(usePagedSlice(items, ref(Number.NaN), size).currentPage.value).toBe(1)
    expect(usePagedSlice(items, ref(0), size).pageItems.value).toEqual([1, 2])
  })

  test("handles an empty list as a single empty page", () => {
    const paged = usePagedSlice(ref<number[]>([]), ref(4), ref(10))
    expect(paged.totalPages.value).toBe(1)
    expect(paged.currentPage.value).toBe(1)
    expect(paged.pageItems.value).toEqual([])
  })

  test("clamps the page ref back into range when the items shrink", async () => {
    const items = ref(range(25))
    const page = ref(3)
    const size = ref(10)
    const paged = usePagedSlice(items, page, size)
    expect(paged.pageItems.value).toEqual([21, 22, 23, 24, 25])

    items.value = range(5)
    await nextTick()

    expect(paged.totalPages.value).toBe(1)
    expect(page.value).toBe(1)
    expect(paged.currentPage.value).toBe(1)
    expect(paged.pageItems.value).toEqual([1, 2, 3, 4, 5])
  })

  test("clamps the page ref when the page size grows past the item count", async () => {
    const items = ref(range(25))
    const page = ref(3)
    const size = ref(10)
    usePagedSlice(items, page, size)

    size.value = 30
    await nextTick()

    expect(page.value).toBe(1)
  })

  test("clamps a page written out of range after setup", async () => {
    const items = ref(range(25))
    const page = ref(1)
    const size = ref(10)
    const paged = usePagedSlice(items, page, size)

    page.value = 42
    await nextTick()

    expect(page.value).toBe(3)
    expect(paged.pageItems.value).toEqual([21, 22, 23, 24, 25])
  })

  test("leaves an in-range page untouched", async () => {
    const items = ref(range(25))
    const page = ref(2)
    const size = ref(10)
    usePagedSlice(items, page, size)

    items.value = range(21)
    await nextTick()

    expect(page.value).toBe(2)
  })
})
