<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideArrowDownToLine, LucideArrowUpToLine } from "lucide-vue-next"
import { resolveScrollJumpState, type ScrollJumpState } from "../lib/scroll-jump"

/**
 * "Back to top" and "jump to bottom" for long pages. The layout places this
 * above the bottom dock (the music player, when one is playing), so the
 * buttons ride along the bottom right of the viewport and stop above the
 * footer at the end of the page. Each button shows only while its edge is
 * some way off, and neither shows on a page that barely scrolls.
 */
const { t } = useI18n()

const state = ref<ScrollJumpState>({ showTop: false, showBottom: false })
let frame = 0
let observer: ResizeObserver | null = null

function measure() {
  frame = 0
  const root = document.documentElement
  state.value = resolveScrollJumpState(window.scrollY, window.innerHeight, root.scrollHeight)
}

// One measurement per frame however many scroll events arrive.
function schedule() {
  if (frame === 0) {
    frame = requestAnimationFrame(measure)
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
}

function jump(to: "top" | "bottom") {
  window.scrollTo({
    top: to === "top" ? 0 : document.documentElement.scrollHeight,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  })
}

onMounted(() => {
  window.addEventListener("scroll", schedule, { passive: true })
  window.addEventListener("resize", schedule, { passive: true })
  // The page grows as data loads and as routes change; the body's size says when.
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(schedule)
    observer.observe(document.body)
  }
  measure()
})

onBeforeUnmount(() => {
  window.removeEventListener("scroll", schedule)
  window.removeEventListener("resize", schedule)
  observer?.disconnect()
  cancelAnimationFrame(frame)
})

const buttonClass = "pointer-events-auto inline-flex size-9 items-center justify-center rounded-full border bg-background/90 text-muted-foreground shadow-sm outline-none backdrop-blur transition-[color,background-color,opacity,transform] duration-150 hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:size-10"
</script>

<template>
  <div class="pointer-events-none flex flex-col items-center gap-1.5" data-testid="scroll-jump">
    <Transition name="scroll-jump">
      <button
        v-if="state.showTop"
        type="button"
        :class="buttonClass"
        :aria-label="t('webLayout.scrollJump.top')"
        :title="t('webLayout.scrollJump.top')"
        data-testid="scroll-jump-top"
        @click="jump('top')"
      >
        <LucideArrowUpToLine class="size-4" />
      </button>
    </Transition>
    <Transition name="scroll-jump">
      <button
        v-if="state.showBottom"
        type="button"
        :class="buttonClass"
        :aria-label="t('webLayout.scrollJump.bottom')"
        :title="t('webLayout.scrollJump.bottom')"
        data-testid="scroll-jump-bottom"
        @click="jump('bottom')"
      >
        <LucideArrowDownToLine class="size-4" />
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.scroll-jump-enter-from,
.scroll-jump-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

@media (prefers-reduced-motion: reduce) {
  .scroll-jump-enter-active,
  .scroll-jump-leave-active {
    transition: none;
  }
}
</style>
