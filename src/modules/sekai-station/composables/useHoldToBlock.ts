import { onScopeDispose, ref } from "vue"
import { CLICK_MAX_MS, HOLD_TO_BLOCK_MS } from "@/modules/sekai-station/lib/sekai-station-constants"

/**
 * Click-or-hold on the room number, ported from Sekai Station's RoomCard
 * (MIT © middlered). A short press is a click (copy); holding for
 * HOLD_TO_BLOCK_MS hides the number. Releasing late, sliding away or the page
 * losing focus cancels without copying.
 */
export function useHoldToBlock(options: { onClick: () => void; onHold: () => void }) {
  const holding = ref(false)
  let holdTimer: ReturnType<typeof setTimeout> | null = null
  let holdStart = 0
  let suppressClick = false

  function stopHold() {
    if (holdTimer) {
      clearTimeout(holdTimer)
    }
    holdTimer = null
    holding.value = false
    window.removeEventListener("blur", cancelHold)
    document.removeEventListener("visibilitychange", cancelHold)
  }

  function cancelHold() {
    if (!holding.value) {
      return
    }
    suppressClick = true
    stopHold()
  }

  function completeHold() {
    stopHold()
    suppressClick = true
    navigator.vibrate?.(30)
    options.onHold()
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0) {
      return
    }
    // Touch pointers are captured by default; release so sliding off counts as leaving
    ;(event.currentTarget as Element | null)?.releasePointerCapture?.(event.pointerId)
    suppressClick = false
    holdStart = Date.now()
    holding.value = true
    holdTimer = setTimeout(completeHold, HOLD_TO_BLOCK_MS)
    window.addEventListener("blur", cancelHold)
    document.addEventListener("visibilitychange", cancelHold)
  }

  function onPointerUp() {
    if (!holding.value) {
      return
    }
    if (Date.now() - holdStart >= CLICK_MAX_MS) {
      suppressClick = true
    }
    stopHold()
  }

  /** Also bound to keyboard activation, which never starts a hold */
  function onClick() {
    if (suppressClick) {
      suppressClick = false
      return
    }
    options.onClick()
  }

  onScopeDispose(stopHold)

  return {
    holding,
    onPointerDown,
    onPointerUp,
    onPointerLeave: cancelHold,
    onPointerCancel: cancelHold,
    onClick,
  }
}
