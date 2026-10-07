<script lang="ts">
// More items than this mounting in one render pass are a replayed burst or a
// re-render (filter change, coming back to the page), not rooms arriving one by one
const LIVE_PASS_MAX_ITEMS = 3
const ENTER_MS = 400
const LEAVE_MS = 600
// A block should take effect the moment the hold completes, so it uses a short exit
const QUICK_LEAVE_MS = 180
const FLASH_MS = 1600

// Items set up in the current render pass. Every setup of a pass runs before
// any of its mounted hooks, so onMounted sees the size of the whole batch.
let passItems = 0

function joinRenderPass() {
  if (passItems === 0) {
    queueMicrotask(() => {
      passItems = 0
    })
  }
  passItems += 1
}

function canAnimate(el: Element | null | undefined): el is HTMLElement {
  return el instanceof HTMLElement && typeof el.animate === "function"
}

/** Margins that make the item take no room at all, absorbing the list's gap next to it */
function collapsedMargins(el: HTMLElement): { marginTop: string; marginBottom: string } {
  const gap = el.parentElement ? Number.parseFloat(getComputedStyle(el.parentElement).rowGap) || 0 : 0
  if (gap > 0 && el.nextElementSibling) {
    return { marginTop: "0px", marginBottom: `${-gap}px` }
  }
  if (gap > 0 && el.previousElementSibling) {
    return { marginTop: `${-gap}px`, marginBottom: "0px" }
  }
  return { marginTop: "0px", marginBottom: "0px" }
}

/** The item's current box, as the open end of an enter or leave animation */
function openFrame(el: HTMLElement) {
  const style = getComputedStyle(el)
  return {
    opacity: 1,
    height: `${el.getBoundingClientRect().height}px`,
    marginTop: style.marginTop,
    marginBottom: style.marginBottom,
  }
}
</script>

<script setup lang="ts">
// Ported from Sekai Station's RoomItemWrapper (MIT © middlered): expiry,
// enter/leave animations and the temporary block with undo.
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import StationRoomCard from "@/modules/sekai-station/components/StationRoomCard.vue"
import { useStationReducedMotion } from "@/modules/sekai-station/composables/useStationReducedMotion"
import { captureFocusHandOff } from "@/modules/sekai-station/lib/focus-hand-off"
import { LIVE_FLASH_MAX_AGE_SECONDS } from "@/modules/sekai-station/lib/sekai-station-constants"
import type { StationDisplayEntry, StationRoom } from "@/modules/sekai-station/lib/station-types"
import { useSekaiStationFeedStore } from "@/modules/sekai-station/stores/sekai-station-feed"
import { useSekaiStationPrefsStore } from "@/modules/sekai-station/stores/sekai-station-prefs"

type LeaveReason = "expire" | "block"

interface PendingBlock {
  key: string
  room: StationRoom
  wasPinned: boolean
}

const props = defineProps<{
  entry: StationDisplayEntry
}>()

const { t } = useI18n()
const feed = useSekaiStationFeedStore()
const prefs = useSekaiStationPrefsStore()
const reducedMotion = useStationReducedMotion()

const root = ref<HTMLElement | null>(null)
const flashLayer = ref<HTMLElement | null>(null)

const pinned = computed(() => feed.isPinned(props.entry.key))

// Items created together with the list (first render, coming back to the page)
// appear as they are; only items added to a list already on screen are live.
// The parent is the list component, whatever it shows while it is empty.
const listWasMounted = getCurrentInstance()?.parent?.isMounted ?? false
joinRenderPass()

let expiryTimer: ReturnType<typeof setTimeout> | null = null
let enterAnimation: Animation | null = null
let flashAnimation: Animation | null = null
let leaveAnimation: Animation | null = null
let leaveReason: LeaveReason | null = null
let pendingBlock: PendingBlock | null = null

// ── Animations ───────────────────────────────────────────────────────────────
function playEnter(el: HTMLElement) {
  const open = openFrame(el)
  el.style.overflow = "hidden"
  const animation = el.animate([
    { opacity: 0, height: "0px", ...collapsedMargins(el) },
    { ...open, opacity: 0, offset: 0.5 },
    open,
  ], { duration: ENTER_MS, easing: "ease-out" })
  enterAnimation = animation
  const settle = () => {
    if (enterAnimation === animation) {
      enterAnimation = null
    }
    if (!leaveReason) {
      el.style.overflow = ""
    }
  }
  animation.onfinish = settle
  animation.oncancel = settle
}

// The overlay carries the primary tint, so the keyframes only touch opacity
function playFlash() {
  if (canAnimate(flashLayer.value)) {
    flashAnimation = flashLayer.value.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FLASH_MS, easing: "ease-out" })
  }
}

/** Fades the item out, collapses it, then calls done; immediate with reduced motion */
function leave(reason: LeaveReason, done: () => void) {
  if (leaveReason) {
    return
  }
  leaveReason = reason
  enterAnimation?.cancel()
  flashAnimation?.cancel()
  const el = root.value
  if (reducedMotion.value || !canAnimate(el)) {
    done()
    return
  }
  // Expiry fades out slowly, as in Station; only a block is quick
  const quick = reason === "block"
  const open = openFrame(el)
  el.style.overflow = "hidden"
  const animation = el.animate([
    open,
    { ...open, opacity: 0, offset: 0.5 },
    { opacity: 0, height: "0px", ...collapsedMargins(el) },
  ], {
    duration: quick ? QUICK_LEAVE_MS : LEAVE_MS,
    easing: quick ? "ease-out" : "ease-in",
    fill: "forwards",
  })
  leaveAnimation = animation
  animation.onfinish = () => {
    if (leaveAnimation === animation) {
      done()
    }
  }
}

/** Brings back an item that was fading out because it expired */
function cancelLeave() {
  leaveAnimation?.cancel()
  leaveAnimation = null
  leaveReason = null
  if (root.value) {
    root.value.style.overflow = ""
  }
}

// ── Expiry ───────────────────────────────────────────────────────────────────
function clearExpiryTimer() {
  if (expiryTimer) {
    clearTimeout(expiryTimer)
    expiryTimer = null
  }
}

function expire() {
  expiryTimer = null
  const key = props.entry.key
  leave("expire", () => feed.removeRoom(key))
}

/**
 * Leaves when the item expires; pinned items stay. Pinning an item while it
 * fades out, or keeping rooms longer, brings it back.
 */
function scheduleExpiry() {
  clearExpiryTimer()
  if (leaveReason && leaveReason !== "expire") {
    return
  }
  const remainingMs = (props.entry.room.time + prefs.expireSeconds) * 1000 - Date.now()
  if (!pinned.value && remainingMs <= 0) {
    expire()
    return
  }
  if (leaveReason === "expire") {
    cancelLeave()
  }
  if (!pinned.value) {
    expiryTimer = setTimeout(expire, remainingMs)
  }
}

watch(() => prefs.expireSeconds, scheduleExpiry)
watch(pinned, scheduleExpiry)

// ── Block ────────────────────────────────────────────────────────────────────
/** Where keyboard focus goes once the user removed this item: the nearest item left, or the list */
function captureItemFocus(): (() => void) | null {
  const el = root.value
  const active = document.activeElement
  // The ⋯ menu is portalled out of the item, so its items count as inside
  const hasFocus = !!el && !!active && (el.contains(active) || !!active.closest("[role=menu]"))
  const list = el?.closest<HTMLElement>("section")
  return captureFocusHandOff(el, () => list, hasFocus)
}

function onBlock() {
  if (pendingBlock) {
    return
  }
  const current = props.entry.room
  // Captured now: the card unmounts as soon as the room is blocked
  pendingBlock = {
    key: props.entry.key,
    room: { ...current, info: { ...current.info } },
    wasPinned: feed.isPinned(props.entry.key),
  }
  const handOffFocus = captureItemFocus()
  const done = () => {
    finishBlock()
    handOffFocus?.()
  }
  clearExpiryTimer()
  if (leaveReason) {
    // Already fading out because it expired: no animation to wait for
    done()
  } else {
    leave("block", done)
  }
}

function finishBlock() {
  const pending = pendingBlock
  if (!pending) {
    return
  }
  pendingBlock = null
  const { key, room: blockedRoom, wasPinned } = pending
  feed.blockRoom(blockedRoom.id)
  toast(t("sekaiStation.rooms.blocked", { id: blockedRoom.id }), {
    action: {
      label: t("sekaiStation.rooms.undo"),
      onClick: () => {
        feed.unblockRoom(blockedRoom.id)
        if (wasPinned) {
          feed.pinRoom(key, blockedRoom)
        }
      },
    },
  })
}

// ── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  const live = listWasMounted && passItems <= LIVE_PASS_MAX_ITEMS
  // An item already past its time leaves right away; the store's sweep is only a fallback
  scheduleExpiry()
  const el = root.value
  if (!live || leaveReason || reducedMotion.value || !canAnimate(el)) {
    return
  }
  playEnter(el)
  if (Date.now() / 1000 - props.entry.room.time <= LIVE_FLASH_MAX_AGE_SECONDS) {
    playFlash()
  }
})

onBeforeUnmount(() => {
  // Unmounted while the block was still playing out (leaving the page): apply it anyway
  finishBlock()
  clearExpiryTimer()
  enterAnimation?.cancel()
  flashAnimation?.cancel()
  leaveAnimation?.cancel()
})
</script>

<template>
  <div ref="root" class="relative">
    <StationRoomCard
      :room="entry.room"
      :room-key="entry.key"
      :extra="feed.getExtra(entry.room.id)"
      @block="onBlock"
    />
    <span
      ref="flashLayer"
      class="pointer-events-none absolute inset-0 rounded-lg bg-primary/15 opacity-0"
      aria-hidden="true"
    />
  </div>
</template>
