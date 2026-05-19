<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue"

const pointerMediaQuery = "(hover: hover) and (pointer: fine)"
const reducedMotionQuery = "(prefers-reduced-motion: reduce)"

const reactiveTargetSelector = [
  '[data-glass-surface="topbar"]',
  '[data-sidebar="menu-button"]',
  '[data-slot="button"]',
  '[data-slot="sidebar-trigger"]',
  '[data-slot="select-trigger"]',
  '[data-slot="tabs-trigger"]',
  '[data-slot="dropdown-menu-item"]',
  '[data-slot="dropdown-menu-checkbox-item"]',
  '[data-slot="dropdown-menu-radio-item"]',
  '[data-slot="dropdown-menu-sub-trigger"]',
  '[data-slot="navigation-menu-trigger"]',
  '[data-slot="navigation-menu-link"]',
].join(",")

const ignoredTargetSelector = [
  "input",
  "textarea",
  "select",
  '[contenteditable="true"]',
  '[data-cursor-effects="off"]',
].join(",")

let pointerMedia: MediaQueryList | null = null
let reducedMotionMedia: MediaQueryList | null = null
let classObserver: MutationObserver | null = null
let activeTarget: HTMLElement | null = null
let pendingPointerEvent: PointerEvent | null = null
let animationFrame = 0
let enabled = false

function clearActiveTarget() {
  if (!activeTarget) return

  activeTarget.removeAttribute("data-cursor-active")
  activeTarget.style.removeProperty("--cursor-local-x")
  activeTarget.style.removeProperty("--cursor-local-y")
  activeTarget = null
}

function setEnabled(nextEnabled: boolean) {
  if (enabled === nextEnabled) return

  enabled = nextEnabled
  document.documentElement.classList.toggle("pointer-effects-enabled", enabled)

  if (!enabled) {
    pendingPointerEvent = null
    clearActiveTarget()
  }
}

function shouldEnablePointerEffects() {
  return Boolean(
    pointerMedia?.matches &&
    !reducedMotionMedia?.matches &&
    !document.documentElement.classList.contains("reduced-visual-effects")
  )
}

function syncEnabledState() {
  setEnabled(shouldEnablePointerEffects())
}

function resolveReactiveTarget(event: PointerEvent) {
  const eventTarget = event.target instanceof Element
    ? event.target
    : document.elementFromPoint(event.clientX, event.clientY)

  if (!eventTarget || eventTarget.closest(ignoredTargetSelector)) {
    return null
  }

  return eventTarget.closest<HTMLElement>(reactiveTargetSelector)
}

function updatePointerTarget(event: PointerEvent) {
  const target = resolveReactiveTarget(event)

  if (activeTarget && activeTarget !== target) {
    clearActiveTarget()
  }

  if (!target) return

  const rect = target.getBoundingClientRect()
  target.style.setProperty("--cursor-local-x", `${event.clientX - rect.left}px`)
  target.style.setProperty("--cursor-local-y", `${event.clientY - rect.top}px`)
  target.setAttribute("data-cursor-active", "true")
  activeTarget = target
}

function flushPointerMove() {
  animationFrame = 0

  if (!enabled || !pendingPointerEvent) {
    return
  }

  const event = pendingPointerEvent
  pendingPointerEvent = null

  if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
    clearActiveTarget()
    return
  }

  updatePointerTarget(event)
}

function handlePointerMove(event: PointerEvent) {
  if (!enabled) return

  pendingPointerEvent = event
  if (animationFrame) return

  animationFrame = window.requestAnimationFrame(flushPointerMove)
}

function handlePointerLeave() {
  pendingPointerEvent = null
  clearActiveTarget()
}

onMounted(() => {
  pointerMedia = window.matchMedia(pointerMediaQuery)
  reducedMotionMedia = window.matchMedia(reducedMotionQuery)
  pointerMedia.addEventListener("change", syncEnabledState)
  reducedMotionMedia.addEventListener("change", syncEnabledState)

  classObserver = new MutationObserver(syncEnabledState)
  classObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  })

  document.addEventListener("pointermove", handlePointerMove, { passive: true })
  document.addEventListener("pointerleave", handlePointerLeave)
  window.addEventListener("blur", handlePointerLeave)
  syncEnabledState()
})

onBeforeUnmount(() => {
  pointerMedia?.removeEventListener("change", syncEnabledState)
  reducedMotionMedia?.removeEventListener("change", syncEnabledState)
  classObserver?.disconnect()
  document.removeEventListener("pointermove", handlePointerMove)
  document.removeEventListener("pointerleave", handlePointerLeave)
  window.removeEventListener("blur", handlePointerLeave)

  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame)
    animationFrame = 0
  }

  setEnabled(false)
})
</script>

<template>
  <span v-if="false" aria-hidden="true" />
</template>
