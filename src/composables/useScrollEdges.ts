import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue"

/**
 * Tracks whether a horizontally scrolling element has content hidden past
 * its left/right edge, so a row that scrolls (a tab strip, a roster, a wide
 * table) can show an edge fade as the affordance. Pair with
 * `scrollEdgeFadeClass` on a `relative` wrapper around the scroller.
 */
export function useScrollEdges(element: Ref<HTMLElement | null>) {
  const canScrollLeft = ref(false)
  const canScrollRight = ref(false)
  let observer: ResizeObserver | null = null

  function update() {
    const el = element.value
    if (!el) {
      canScrollLeft.value = false
      canScrollRight.value = false
      return
    }
    const maxScroll = el.scrollWidth - el.clientWidth
    canScrollLeft.value = el.scrollLeft > 1
    canScrollRight.value = maxScroll - el.scrollLeft > 1
  }

  function attach(el: HTMLElement | null) {
    observer?.disconnect()
    observer = null
    if (!el) {
      update()
      return
    }
    el.addEventListener("scroll", update, { passive: true })
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(update)
      observer.observe(el)
      for (const child of Array.from(el.children)) {
        observer.observe(child)
      }
    }
    update()
  }

  onMounted(() => attach(element.value))
  watch(element, (next, previous) => {
    previous?.removeEventListener("scroll", update)
    attach(next)
  })
  onBeforeUnmount(() => {
    element.value?.removeEventListener("scroll", update)
    observer?.disconnect()
    observer = null
  })

  const edgeClass = computed(() => [
    canScrollLeft.value ? "scroll-fade-left" : "",
    canScrollRight.value ? "scroll-fade-right" : "",
  ].filter(Boolean).join(" "))

  return { canScrollLeft, canScrollRight, edgeClass, update }
}

/**
 * Scrolls `target` into view horizontally inside `container` without moving
 * the page vertically (the browser's `scrollIntoView` would also scroll the
 * document). Centers it when it is off-screen.
 */
export function scrollChildIntoView(container: HTMLElement | null, target: HTMLElement | null) {
  if (!container || !target) {
    return
  }
  const left = target.offsetLeft - container.offsetLeft
  const right = left + target.offsetWidth
  const viewStart = container.scrollLeft
  const viewEnd = viewStart + container.clientWidth
  if (left >= viewStart && right <= viewEnd) {
    return
  }
  container.scrollTo({
    left: Math.max(0, left - (container.clientWidth - target.offsetWidth) / 2),
    behavior: "smooth",
  })
}
