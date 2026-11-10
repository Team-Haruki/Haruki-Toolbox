import { computed, reactive, readonly, type ComputedRef, type DeepReadonly } from "vue"
import {
  toDisplayDuration,
  toDisplayTime,
  toMediaTime,
} from "@/modules/music-library/lib/music-player"
import {
  clampVolume,
  crossfadeGains,
  describeSingers,
  findPlayerVocal,
  isSameTrack,
  resolveSwitchResync,
  type PlayerTrack,
  type PlayerVocal,
} from "@/modules/music-library/player/player-track"
import { useAudioExclusive } from "./useAudioExclusive"

export type GlobalPlayerStatus = "idle" | "loading" | "playing" | "paused" | "error"

type GlobalPlayerState = {
  track: PlayerTrack | null
  vocalId: number | null
  status: GlobalPlayerStatus
  mediaTime: number
  mediaDuration: number | null
  volume: number
  muted: boolean
  /** The version being brought in while the current one keeps playing. */
  switchingTo: number | null
}

export type GlobalMusicPlayer = {
  state: DeepReadonly<GlobalPlayerState>
  vocal: ComputedRef<PlayerVocal | null>
  playing: ComputedRef<boolean>
  displayTime: ComputedRef<number>
  displayDuration: ComputedRef<number | null>
  /** Starts a song, or — for the song already loaded — resumes it or moves to another version. */
  play: (track: PlayerTrack, vocalId: number) => void
  toggle: () => void
  pause: () => void
  seek: (displaySeconds: number) => void
  /** Changes singers in place: the new version joins at the same position and the two crossfade. */
  switchVocal: (vocalId: number) => void
  setVolume: (volume: number) => void
  toggleMuted: () => void
  close: () => void
  isCurrent: (track: PlayerTrack | null | undefined, vocalId?: number | null) => boolean
}

const VOLUME_STORAGE_KEY = "haruki-toolbox:music-player:volume"
const CROSSFADE_MS = 220
/** A version that cannot start within this long is given up on; the old one keeps playing. */
const SWITCH_TIMEOUT_MS = 12_000

function readStoredVolume(): number {
  try {
    const raw = globalThis.localStorage?.getItem(VOLUME_STORAGE_KEY)
    return raw == null ? 1 : clampVolume(Number(raw))
  } catch {
    return 1
  }
}

const state = reactive<GlobalPlayerState>({
  track: null,
  vocalId: null,
  status: "idle",
  mediaTime: 0,
  mediaDuration: null,
  volume: readStoredVolume(),
  muted: false,
  switchingTo: null,
})

// Two elements: the one heard, and a spare that a vocal switch loads the
// next version into. They trade places when the crossfade ends.
let active: HTMLAudioElement | null = null
let standby: HTMLAudioElement | null = null
// Each switch (and each new song or close) takes a new token; a switch that
// finds its token stale abandons itself.
let switchToken = 0
let fadeFrame: number | null = null

const exclusive = useAudioExclusive(() => pause())

function outputVolume(): number {
  return state.muted ? 0 : state.volume
}

function bind(element: HTMLAudioElement) {
  const isActive = () => element === active
  element.addEventListener("timeupdate", () => {
    if (isActive()) state.mediaTime = element.currentTime
  })
  element.addEventListener("durationchange", () => {
    if (isActive()) {
      state.mediaDuration = Number.isFinite(element.duration) && element.duration > 0 ? element.duration : null
    }
  })
  element.addEventListener("playing", () => {
    if (isActive()) state.status = "playing"
  })
  element.addEventListener("waiting", () => {
    if (isActive() && state.status === "playing") state.status = "loading"
  })
  element.addEventListener("pause", () => {
    if (!isActive()) return
    if (state.status !== "idle" && state.status !== "error") state.status = "paused"
    exclusive.release()
    syncMediaSessionState()
  })
  element.addEventListener("ended", () => {
    if (!isActive()) return
    state.status = "paused"
    state.mediaTime = element.duration || state.mediaTime
    exclusive.release()
    syncMediaSessionState()
  })
  element.addEventListener("error", () => {
    if (!isActive() || !element.getAttribute("src")) return
    state.status = "error"
    exclusive.release()
  })
}

function createElement(): HTMLAudioElement {
  const element = new Audio()
  element.preload = "auto"
  bind(element)
  return element
}

function unload(element: HTMLAudioElement | null) {
  if (!element) return
  element.pause()
  element.removeAttribute("src")
  element.load()
}

function cancelSwitch() {
  switchToken += 1
  state.switchingTo = null
  if (fadeFrame != null) {
    cancelAnimationFrame(fadeFrame)
    fadeFrame = null
  }
  unload(standby)
  if (active) active.volume = outputVolume()
}

function startPlayback(element: HTMLAudioElement, vocalId: number) {
  state.status = "loading"
  exclusive.claim()
  void element.play().then(syncMediaSessionState).catch(() => {
    if (element === active && state.vocalId === vocalId) {
      state.status = "error"
      exclusive.release()
    }
  })
}

/** Loads a version into the active element at `mediaSeconds`, optionally starting it. */
function loadInto(vocal: PlayerVocal, mediaSeconds: number, autoplay: boolean) {
  active ??= createElement()
  const element = active
  element.src = vocal.url
  element.volume = outputVolume()
  // Setting currentTime before metadata records the default start position.
  if (mediaSeconds > 0) element.currentTime = mediaSeconds
  state.vocalId = vocal.id
  state.mediaTime = mediaSeconds
  state.mediaDuration = null
  syncMediaSessionMetadata()
  if (autoplay) {
    startPlayback(element, vocal.id)
  } else {
    state.status = "paused"
  }
}

function play(track: PlayerTrack, vocalId: number) {
  const target = findPlayerVocal(track, vocalId)
  if (!target) return

  if (isSameTrack(state.track, track)) {
    // Labels may have been resolved since (another locale, late master data).
    state.track = track
    if (state.vocalId === vocalId && active) {
      if (active.ended || (state.mediaDuration != null && active.currentTime >= state.mediaDuration)) {
        active.currentTime = track.fillerSec
      }
      startPlayback(active, vocalId)
      return
    }
    switchVocal(vocalId, true)
    return
  }

  cancelSwitch()
  state.track = track
  loadInto(target, track.fillerSec, true)
}

function pause() {
  cancelSwitch()
  active?.pause()
  if (state.status === "playing" || state.status === "loading") state.status = "paused"
  exclusive.release()
}

function toggle() {
  if (!state.track || state.vocalId == null) return
  if (state.status === "playing" || state.status === "loading") {
    pause()
  } else {
    play(state.track, state.vocalId)
  }
}

function seek(displaySeconds: number) {
  if (!active || !state.track) return
  cancelSwitch()
  const target = toMediaTime(displaySeconds, state.track.fillerSec, state.mediaDuration)
  active.currentTime = target
  state.mediaTime = target
}

function once(element: HTMLAudioElement, event: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer)
      element.removeEventListener(event, onEvent)
      element.removeEventListener("error", onError)
    }
    const onEvent = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error(`audio failed before ${event}`))
    }
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error(`audio timed out waiting for ${event}`))
    }, timeoutMs)
    element.addEventListener(event, onEvent, { once: true })
    element.addEventListener("error", onError, { once: true })
  })
}

/** iOS ignores `volume`: there the two versions cannot overlap, so the swap is a cut. */
function supportsVolume(element: HTMLAudioElement): boolean {
  const before = element.volume
  element.volume = before === 0.5 ? 0.4 : 0.5
  const settable = element.volume !== before
  element.volume = before
  return settable
}

function fade(outgoing: HTMLAudioElement, incoming: HTMLAudioElement, token: number): Promise<void> {
  return new Promise((resolve) => {
    const startedAt = performance.now()
    const step = () => {
      if (token !== switchToken) {
        fadeFrame = null
        resolve()
        return
      }
      const progress = (performance.now() - startedAt) / CROSSFADE_MS
      const gains = crossfadeGains(progress)
      const level = outputVolume()
      outgoing.volume = level * gains.out
      incoming.volume = level * gains.in
      if (progress >= 1) {
        fadeFrame = null
        resolve()
        return
      }
      fadeFrame = requestAnimationFrame(step)
    }
    fadeFrame = requestAnimationFrame(step)
  })
}

/**
 * Brings another version of the same song in without stopping the music.
 * Every version shares one backing track and one timeline, so the incoming
 * element is seeked to where the current one is, started silently, nudged
 * into step, and crossfaded. Until that moment the current version plays on;
 * if the new one cannot load, nothing is interrupted.
 */
async function switchSeamlessly(target: PlayerVocal, outgoing: HTMLAudioElement) {
  const token = ++switchToken
  state.switchingTo = target.id
  standby ??= createElement()
  const incoming = standby
  const stale = () => token !== switchToken || outgoing !== active

  try {
    incoming.volume = 0
    incoming.src = target.url
    const metadata = once(incoming, "loadedmetadata", SWITCH_TIMEOUT_MS)
    incoming.load()
    await metadata
    if (stale()) return

    const ready = once(incoming, "canplay", SWITCH_TIMEOUT_MS)
    incoming.currentTime = outgoing.currentTime
    await ready
    if (stale()) return

    // Buffering took a moment and the music moved on: catch up before starting.
    if (resolveSwitchResync(outgoing.currentTime, incoming.currentTime) != null) {
      const seeked = once(incoming, "seeked", SWITCH_TIMEOUT_MS)
      incoming.currentTime = outgoing.currentTime
      await seeked
      if (stale()) return
    }

    await incoming.play()
    if (stale()) {
      incoming.pause()
      return
    }
    const resync = resolveSwitchResync(outgoing.currentTime, incoming.currentTime)
    if (resync != null) incoming.currentTime = resync

    if (supportsVolume(incoming)) {
      await fade(outgoing, incoming, token)
      if (stale()) return
    }

    // Trade places: the incoming element is now the one heard.
    active = incoming
    standby = outgoing
    incoming.volume = outputVolume()
    state.vocalId = target.id
    state.switchingTo = null
    state.status = "playing"
    state.mediaTime = incoming.currentTime
    state.mediaDuration = Number.isFinite(incoming.duration) && incoming.duration > 0 ? incoming.duration : null
    unload(outgoing)
    syncMediaSessionMetadata()
  } catch {
    if (token !== switchToken) return
    // The spare could not start (network, or a browser that refuses a second
    // element): swap the source on the element that is already allowed to play.
    state.switchingTo = null
    unload(incoming)
    if (outgoing === active && state.track) {
      const position = outgoing.currentTime
      outgoing.volume = outputVolume()
      loadInto(target, position, true)
    }
  }
}

function switchVocal(vocalId: number, autoplay = false) {
  const track = state.track
  const target = findPlayerVocal(track, vocalId)
  if (!track || !target) return
  if (state.vocalId === vocalId) {
    // Back to the version still playing: drop the switch in progress.
    if (state.switchingTo != null) cancelSwitch()
    else if (autoplay) play(track, vocalId)
    return
  }
  if (state.switchingTo === vocalId) return

  const element = active
  const audible = element != null && !element.paused && !element.ended && state.status !== "error"
  if (element && audible) {
    void switchSeamlessly(target, element)
    return
  }

  // Nothing is sounding: keep the position, change the source.
  cancelSwitch()
  const position = element && state.vocalId != null ? Math.max(element.currentTime, track.fillerSec) : track.fillerSec
  const ended = element != null && (element.ended || (state.mediaDuration != null && position >= state.mediaDuration))
  loadInto(target, ended ? track.fillerSec : position, autoplay)
}

function setVolume(volume: number) {
  state.volume = clampVolume(volume, state.volume)
  if (state.volume > 0) state.muted = false
  if (active && state.switchingTo == null) active.volume = outputVolume()
  try {
    globalThis.localStorage?.setItem(VOLUME_STORAGE_KEY, String(state.volume))
  } catch {
    // Storage blocked: the volume simply does not persist.
  }
}

function toggleMuted() {
  state.muted = !state.muted
  if (active && state.switchingTo == null) active.volume = outputVolume()
}

function close() {
  cancelSwitch()
  unload(active)
  exclusive.release()
  state.track = null
  state.vocalId = null
  state.status = "idle"
  state.mediaTime = 0
  state.mediaDuration = null
  if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
    navigator.mediaSession.metadata = null
    navigator.mediaSession.playbackState = "none"
  }
}

function isCurrent(track: PlayerTrack | null | undefined, vocalId?: number | null): boolean {
  if (!isSameTrack(state.track, track ?? null)) return false
  return vocalId == null || state.vocalId === vocalId
}

// Lock screen / media keys: the song, who sings this version, and transport.
function syncMediaSessionMetadata() {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return
  const track = state.track
  if (!track) return
  const vocal = findPlayerVocal(track, state.vocalId)
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: describeSingers(vocal) || vocal?.caption || "",
    album: vocal?.caption ?? "",
    artwork: track.jacketUrl ? [{ src: track.jacketUrl, sizes: "512x512", type: "image/png" }] : [],
  })
}

function syncMediaSessionState() {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return
  navigator.mediaSession.playbackState = state.status === "playing" || state.status === "loading" ? "playing" : state.track ? "paused" : "none"
}

let mediaSessionBound = false
function bindMediaSession() {
  if (mediaSessionBound || typeof navigator === "undefined" || !("mediaSession" in navigator)) return
  mediaSessionBound = true
  const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
    ["play", () => toggleTo(true)],
    ["pause", () => toggleTo(false)],
    ["seekto", (details) => {
      if (details.seekTime != null && state.track) seek(toDisplayTime(details.seekTime, state.track.fillerSec))
    }],
  ]
  for (const [action, handler] of handlers) {
    try {
      navigator.mediaSession.setActionHandler(action, handler)
    } catch {
      // The browser does not offer this action.
    }
  }
}

function toggleTo(playing: boolean) {
  const isPlaying = state.status === "playing" || state.status === "loading"
  if (playing !== isPlaying) toggle()
}

const vocal = computed(() => findPlayerVocal(state.track, state.vocalId))
const playing = computed(() => state.status === "playing" || state.status === "loading")
const displayTime = computed(() => toDisplayTime(state.mediaTime, state.track?.fillerSec))
const displayDuration = computed(() => toDisplayDuration(state.mediaDuration, state.track?.fillerSec))

/**
 * The site-wide music player: one song at a time, started from the music
 * pages and kept playing across navigation. State is a module singleton, so
 * every caller (the bar in the layout, the detail page, the list tiles) sees
 * the same player.
 */
export function useGlobalMusicPlayer(): GlobalMusicPlayer {
  bindMediaSession()
  return {
    state: readonly(state),
    vocal,
    playing,
    displayTime,
    displayDuration,
    play,
    toggle,
    pause,
    seek,
    switchVocal: (vocalId: number) => switchVocal(vocalId),
    setVolume,
    toggleMuted,
    close,
    isCurrent,
  }
}
