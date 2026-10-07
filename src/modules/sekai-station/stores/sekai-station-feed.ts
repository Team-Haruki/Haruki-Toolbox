// The live room feed, ported from Sekai Station's rooms store (MIT ©
// middlered). The stream only runs while the page is open: the page calls
// connect() when it mounts and disconnect() when it unmounts. Rooms stay in
// memory in between, so coming back shows the list at once and the server's
// five-minute replay merges into it.
import { computed, ref, watch } from "vue"
import { defineStore } from "pinia"
import { useLocalStorage } from "@vueuse/core"
import { isStationApiConfigured, stationRealtimeUrl } from "@/modules/sekai-station/api/station"
import { buildDisplayList, type PinnedStationRoom } from "@/modules/sekai-station/lib/room-filter"
import {
  collectBurst,
  isExpired,
  nextRetryDelay,
  nowSeconds,
  selectExpiredKeys,
  splitEndedBlocks,
} from "@/modules/sekai-station/lib/room-stream"
import {
  BLOCK_DURATION_MS,
  BLOCKS_STORAGE_KEY,
  BURST_WINDOW_MS,
  HEARTBEAT_TIMEOUT_MS,
  ORPHAN_EXTRA_TTL_MS,
  PINS_STORAGE_KEY,
  SWEEP_GRACE_SECONDS,
  SWEEP_INTERVAL_MS,
} from "@/modules/sekai-station/lib/sekai-station-constants"
import {
  parseHeartbeat,
  parseJson,
  parseRoom,
  parseRoomExtra,
  parseStatistic,
  sanitizeBlocks,
  sanitizePins,
} from "@/modules/sekai-station/lib/station-parse"
import {
  roomKey,
  type StationRoom,
  type StationRoomExtra,
  type StationStatistic,
} from "@/modules/sekai-station/lib/station-types"
import { useSekaiStationPrefsStore } from "@/modules/sekai-station/stores/sekai-station-prefs"

export type StationConnectionState = "connecting" | "open" | "closed"

export interface StationBlockedEntry {
  id: string
  /** Time (ms) the block ends */
  until: number
}

export const useSekaiStationFeedStore = defineStore("sekai-station-feed", () => {
  const prefs = useSekaiStationPrefsStore()

  // ── State ──────────────────────────────────────────────────────────────────
  /** False when this build has no Sekai Station API address (VITE_SEKAI_STATION_API_URL) */
  const configured = isStationApiConfigured()
  const roomMap = ref(new Map<string, StationRoom>())
  const roomExtras = ref(new Map<string, StationRoomExtra>())
  const statistic = ref<StationStatistic | null>(null)
  const connectionState = ref<StationConnectionState>("closed")
  /** The last attempt failed or the stream dropped; cleared once a stream opens */
  const connectFailed = ref(false)
  /** When the next reconnect attempt starts (ms), or null when none is waiting */
  const retryAt = ref<number | null>(null)
  /** Stable display order: live rooms are prepended, a burst is merged on top, nothing is re-sorted */
  const displayOrder = ref<string[]>([])
  /** False until the first replayed burst has been merged */
  const ready = ref(false)

  // Pins keep the whole room (text included) so they survive a reload and stay
  // listed when the server no longer replays them. Shared across tabs.
  const pins = useLocalStorage<Record<string, PinnedStationRoom>>(PINS_STORAGE_KEY, {})
  const cleanPins = sanitizePins(pins.value)
  if (JSON.stringify(cleanPins) !== JSON.stringify(pins.value)) {
    pins.value = cleanPins
  }
  /** Room number → time (ms) the temporary block ends; shared across tabs */
  const blocks = useLocalStorage<Record<string, number>>(BLOCKS_STORAGE_KEY, {})
  const cleanBlocks = sanitizeBlocks(blocks.value, Date.now())
  if (JSON.stringify(cleanBlocks) !== JSON.stringify(blocks.value)) {
    blocks.value = cleanBlocks
  }

  let eventSource: EventSource | null = null
  let wanted = false
  let listening = false
  let retryAttempt = 0
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let burstTimer: ReturnType<typeof setTimeout> | null = null
  let watchdogTimer: ReturnType<typeof setTimeout> | null = null
  let sweepTimer: ReturnType<typeof setInterval> | null = null
  let unblockTimer: ReturnType<typeof setTimeout> | null = null
  let bursting = false
  let burstBuffer: StationRoom[] = []
  const extraReceivedAt = new Map<string, number>()

  // ── Derived ────────────────────────────────────────────────────────────────
  const displayItems = computed(() =>
    buildDisplayList({
      order: displayOrder.value,
      rooms: roomMap.value,
      pins: pins.value,
      blocks: blocks.value,
      terms: prefs.filterTerms,
      mode: prefs.filterMode,
      ready: ready.value,
    }),
  )

  const blockedList = computed<StationBlockedEntry[]>(() =>
    Object.entries(blocks.value)
      .map(([id, until]) => ({ id, until }))
      .sort((a, b) => a.until - b.until),
  )

  // ── Stream rooms ───────────────────────────────────────────────────────────
  function addRoom(room: StationRoom) {
    const key = roomKey(room)
    // The server replays recent rooms on every (re)connect
    if (roomMap.value.has(key)) {
      return
    }
    if (bursting) {
      burstBuffer.push(room)
      return
    }
    roomMap.value.set(key, room)
    displayOrder.value = [key, ...displayOrder.value]
  }

  function addRoomExtra(extra: StationRoomExtra) {
    roomExtras.value.set(extra.id, extra)
    extraReceivedAt.set(extra.id, Date.now())
  }

  function dropPins(keep: (key: string, entry: PinnedStationRoom) => boolean) {
    const entries = Object.entries(pins.value)
    const kept = entries.filter(([key, entry]) => keep(key, entry))
    if (kept.length !== entries.length) {
      pins.value = Object.fromEntries(kept)
    }
  }

  /** Removes an expired room from the list, and from the pins */
  function removeRoom(key: string) {
    roomMap.value.delete(key)
    displayOrder.value = displayOrder.value.filter((listed) => listed !== key)
    dropPins((pinnedKey) => pinnedKey !== key)
  }

  /** Sorts the replayed burst once and puts it on top of what is already listed */
  function finalizeBurst() {
    burstTimer = null
    bursting = false
    const fresh = collectBurst(
      burstBuffer,
      (key) => roomMap.value.has(key),
      prefs.expireSeconds,
      nowSeconds(),
    )
    burstBuffer = []
    for (const [key, room] of fresh) {
      roomMap.value.set(key, room)
    }
    displayOrder.value = [...fresh.map(([key]) => key), ...displayOrder.value]
    ready.value = true
  }

  /** Drops expired rooms nobody sees any more, and extras whose room is gone */
  function sweep() {
    const expired = selectExpiredKeys(
      roomMap.value.entries(),
      (key) => key in pins.value,
      prefs.expireSeconds,
      nowSeconds(),
      SWEEP_GRACE_SECONDS,
    )
    if (expired.length > 0) {
      for (const key of expired) {
        roomMap.value.delete(key)
      }
      displayOrder.value = displayOrder.value.filter((key) => roomMap.value.has(key))
    }

    const liveIds = new Set<string>()
    for (const room of roomMap.value.values()) {
      liveIds.add(room.id)
    }
    for (const id of [...roomExtras.value.keys()]) {
      if (!liveIds.has(id) && Date.now() - (extraReceivedAt.get(id) ?? 0) > ORPHAN_EXTRA_TTL_MS) {
        roomExtras.value.delete(id)
        extraReceivedAt.delete(id)
      }
    }
  }

  // ── Connection ─────────────────────────────────────────────────────────────
  function clearWatchdog() {
    if (watchdogTimer) {
      clearTimeout(watchdogTimer)
      watchdogTimer = null
    }
  }

  /** No heartbeat (or no open) in time means the stream is dead */
  function resetWatchdog() {
    clearWatchdog()
    watchdogTimer = setTimeout(() => {
      watchdogTimer = null
      dropStream()
    }, HEARTBEAT_TIMEOUT_MS)
  }

  function closeStream() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    if (burstTimer) {
      clearTimeout(burstTimer)
      burstTimer = null
    }
    clearWatchdog()
    bursting = false
    burstBuffer = []
    connectionState.value = "closed"
  }

  /** The stream broke: show the lost-connection state and reconnect with backoff */
  function dropStream() {
    connectFailed.value = true
    closeStream()
    scheduleRetry()
  }

  function cancelRetry() {
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
    retryAt.value = null
  }

  function scheduleRetry() {
    cancelRetry()
    if (!wanted) {
      return
    }
    const delay = nextRetryDelay(retryAttempt)
    retryAttempt += 1
    retryAt.value = Date.now() + delay
    retryTimer = setTimeout(() => {
      retryTimer = null
      retryAt.value = null
      openStream()
    }, delay)
  }

  function openStream() {
    if (eventSource || !wanted) {
      return
    }
    cancelRetry()
    connectionState.value = "connecting"

    const source = new EventSource(stationRealtimeUrl())
    eventSource = source
    // Also covers a stream that never opens
    resetWatchdog()

    source.onopen = () => {
      if (source !== eventSource) {
        return
      }
      connectionState.value = "open"
      connectFailed.value = false
      retryAttempt = 0
      resetWatchdog()
      bursting = true
      if (burstTimer) {
        clearTimeout(burstTimer)
      }
      burstTimer = setTimeout(finalizeBurst, BURST_WINDOW_MS)
    }

    // The browser's own retry runs at a fixed interval; take over with backoff
    source.onerror = () => {
      if (source === eventSource) {
        dropStream()
      }
    }

    source.addEventListener("room", (event) => {
      const room = parseRoom(parseJson((event as MessageEvent<string>).data))
      if (room && source === eventSource) {
        addRoom(room)
      }
    })
    source.addEventListener("heartbeat", (event) => {
      if (source === eventSource && parseHeartbeat(parseJson((event as MessageEvent<string>).data)) !== null) {
        resetWatchdog()
      }
    })
    source.addEventListener("statistic", (event) => {
      const value = parseStatistic(parseJson((event as MessageEvent<string>).data))
      if (value && source === eventSource) {
        statistic.value = value
      }
    })
    source.addEventListener("roomExtra", (event) => {
      const extra = parseRoomExtra(parseJson((event as MessageEvent<string>).data))
      if (extra && source === eventSource) {
        addRoomExtra(extra)
      }
    })
  }

  // Back online or back to the tab: try at once instead of waiting out the backoff
  function retryNow() {
    if (wanted && retryAt.value !== null && (typeof document === "undefined" || document.visibilityState === "visible")) {
      openStream()
    }
  }

  function listen(on: boolean) {
    if (on === listening || typeof window === "undefined" || typeof document === "undefined") {
      return
    }
    listening = on
    if (on) {
      document.addEventListener("visibilitychange", retryNow)
      window.addEventListener("online", retryNow)
    } else {
      document.removeEventListener("visibilitychange", retryNow)
      window.removeEventListener("online", retryNow)
    }
  }

  /** Starts the stream (the page calls this when it mounts) */
  function connect() {
    if (!configured) {
      return
    }
    wanted = true
    connectFailed.value = false
    retryAttempt = 0
    sweep()
    // Everything listed last time has expired: wait for the replay again
    // (pins still show meanwhile; the burst sets ready back)
    if ([...roomMap.value.keys()].every((key) => key in pins.value)) {
      ready.value = false
    }
    if (!sweepTimer) {
      sweepTimer = setInterval(sweep, SWEEP_INTERVAL_MS)
    }
    listen(true)
    openStream()
  }

  /** Stops the stream and its timers (the page calls this when it unmounts) */
  function disconnect() {
    wanted = false
    cancelRetry()
    if (sweepTimer) {
      clearInterval(sweepTimer)
      sweepTimer = null
    }
    listen(false)
    closeStream()
  }

  // ── Pins ───────────────────────────────────────────────────────────────────
  function isPinned(key: string): boolean {
    return key in pins.value
  }

  function pinRoom(key: string, room: StationRoom) {
    // A plain copy: the stored value is JSON, never a reactive proxy
    const { time, id, msg, name, source, info } = room
    pins.value = { ...pins.value, [key]: { room: { time, id, msg, name, source, info: { ...info } }, pinnedAt: Date.now() } }
  }

  function unpinRoom(key: string) {
    const saved = pins.value[key]?.room
    dropPins((pinnedKey) => pinnedKey !== key)
    const room = roomMap.value.get(key) ?? saved
    if (!room) {
      return
    }
    if (isExpired(room, prefs.expireSeconds, nowSeconds())) {
      removeRoom(key)
    } else if (!roomMap.value.has(key)) {
      // Pinned before a reload and still fresh: carry on as a normal room
      roomMap.value.set(key, room)
      displayOrder.value = [key, ...displayOrder.value]
    }
  }

  // ── Temporary blocks ───────────────────────────────────────────────────────
  /** Hides every room with this number for 10 minutes; a blocked room is unpinned too */
  function blockRoom(id: string) {
    blocks.value = { ...blocks.value, [id]: Date.now() + BLOCK_DURATION_MS }
    dropPins((_, entry) => entry.room.id !== id)
  }

  function unblockRoom(id: string) {
    if (!(id in blocks.value)) {
      return
    }
    const next = { ...blocks.value }
    delete next[id]
    blocks.value = next
  }

  function clearBlocks() {
    blocks.value = {}
  }

  // Drops ended blocks and sleeps until the next one ends; also runs for changes made in another tab
  watch(blocks, (current) => {
    if (unblockTimer) {
      clearTimeout(unblockTimer)
      unblockTimer = null
    }
    const { ended, nextEndMs } = splitEndedBlocks(current, Date.now())
    if (ended.length > 0) {
      const next = { ...current }
      for (const id of ended) {
        delete next[id]
      }
      blocks.value = next
      return
    }
    if (nextEndMs !== null) {
      // Capped: a delay past setTimeout's 32-bit limit would fire at once
      unblockTimer = setTimeout(() => {
        blocks.value = { ...blocks.value }
      }, Math.min(nextEndMs - Date.now() + 50, BLOCK_DURATION_MS))
    }
  }, { immediate: true, deep: true })

  function getExtra(roomId: string): StationRoomExtra | undefined {
    return roomExtras.value.get(roomId)
  }

  return {
    configured,
    statistic,
    connectionState,
    connectFailed,
    retryAt,
    ready,
    displayItems,
    blockedList,
    connect,
    disconnect,
    removeRoom,
    isPinned,
    pinRoom,
    unpinRoom,
    blockRoom,
    unblockRoom,
    clearBlocks,
    getExtra,
  }
})
