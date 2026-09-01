import { computed, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { resolveMusicLongAudioUrl } from "@/modules/music-library/lib/music-assets"
import type { MusicVocalEntry } from "@/modules/music-library/lib/music-data"
import {
  resolveFillerSeconds,
  toDisplayDuration,
  toDisplayTime,
  toMediaTime,
} from "@/modules/music-library/lib/music-player"
import { useAudioExclusive } from "./useAudioExclusive"

export type MusicVocalPlayerStatus = "idle" | "loading" | "playing" | "paused" | "error"

export type MusicVocalPlayer = {
  currentVocalId: Ref<number | null>
  status: Ref<MusicVocalPlayerStatus>
  playing: ComputedRef<boolean>
  /** Position / length with the leading filler hidden. */
  displayTime: ComputedRef<number>
  displayDuration: ComputedRef<number | null>
  resolveUrl: (vocal: MusicVocalEntry) => string | null
  toggle: (vocal: MusicVocalEntry) => void
  pause: () => void
  stop: () => void
  seek: (displaySeconds: number) => void
}

export type MusicVocalPlayerOptions = {
  region: Ref<SekaiRegion>
  preference: Ref<SekaiAssetEndpointPreference>
  fillerSec: Ref<number | null | undefined>
  /** Playback stops when the song changes. */
  musicId: Ref<number | null>
}

/**
 * One shared `<audio>` for every vocal version of a song. Starting a
 * version claims the page's exclusive audio slot (pausing the chart
 * preview); the filler silence baked into the long assets is skipped and
 * hidden from the clock.
 */
export function useMusicVocalPlayer(options: MusicVocalPlayerOptions): MusicVocalPlayer {
  const currentVocalId = ref<number | null>(null)
  const status = ref<MusicVocalPlayerStatus>("idle")
  const mediaTime = ref(0)
  const mediaDuration = ref<number | null>(null)
  let audio: HTMLAudioElement | null = null

  const exclusive = useAudioExclusive(() => pause())

  const playing = computed(() => status.value === "playing" || status.value === "loading")
  const filler = computed(() => resolveFillerSeconds(options.fillerSec.value))

  function ensureAudio(): HTMLAudioElement {
    if (audio) {
      return audio
    }
    const element = new Audio()
    element.preload = "auto"
    element.addEventListener("timeupdate", () => {
      mediaTime.value = element.currentTime
    })
    element.addEventListener("durationchange", () => {
      mediaDuration.value = Number.isFinite(element.duration) && element.duration > 0 ? element.duration : null
    })
    element.addEventListener("playing", () => {
      status.value = "playing"
    })
    element.addEventListener("waiting", () => {
      if (status.value === "playing") {
        status.value = "loading"
      }
    })
    element.addEventListener("pause", () => {
      if (status.value !== "idle" && status.value !== "error") {
        status.value = "paused"
      }
      exclusive.release()
    })
    element.addEventListener("ended", () => {
      status.value = "paused"
      mediaTime.value = element.duration || mediaTime.value
      exclusive.release()
    })
    element.addEventListener("error", () => {
      status.value = "error"
      exclusive.release()
    })
    audio = element
    return element
  }

  function resolveUrl(vocal: MusicVocalEntry): string | null {
    return resolveMusicLongAudioUrl(options.region.value, vocal.assetbundleName, options.preference.value)
  }

  function play(vocal: MusicVocalEntry) {
    const url = resolveUrl(vocal)
    if (url == null) {
      return
    }
    const element = ensureAudio()
    if (currentVocalId.value !== vocal.id || element.src !== url) {
      element.src = url
      mediaTime.value = 0
      mediaDuration.value = null
      currentVocalId.value = vocal.id
      // The long assets lead with the chart's filler silence; skip it.
      // (Setting currentTime pre-metadata records the default start position.)
      if (filler.value > 0) {
        element.currentTime = filler.value
      }
    } else if (element.ended || (mediaDuration.value != null && element.currentTime >= mediaDuration.value)) {
      element.currentTime = filler.value
    }

    status.value = "loading"
    exclusive.claim()
    void element.play().catch(() => {
      if (currentVocalId.value === vocal.id) {
        status.value = "error"
        exclusive.release()
      }
    })
  }

  function pause() {
    audio?.pause()
    if (status.value === "playing" || status.value === "loading") {
      status.value = "paused"
    }
    exclusive.release()
  }

  function stop() {
    pause()
    if (audio) {
      audio.removeAttribute("src")
      audio.load()
    }
    currentVocalId.value = null
    status.value = "idle"
    mediaTime.value = 0
    mediaDuration.value = null
  }

  function toggle(vocal: MusicVocalEntry) {
    if (currentVocalId.value === vocal.id && playing.value) {
      pause()
      return
    }
    play(vocal)
  }

  function seek(displaySeconds: number) {
    if (!audio || currentVocalId.value == null) {
      return
    }
    const target = toMediaTime(displaySeconds, filler.value, mediaDuration.value)
    audio.currentTime = target
    mediaTime.value = target
  }

  watch(() => [options.musicId.value, options.region.value] as const, () => {
    stop()
  })

  onBeforeUnmount(() => {
    stop()
    audio = null
  })

  return {
    currentVocalId,
    status,
    playing,
    displayTime: computed(() => toDisplayTime(mediaTime.value, filler.value)),
    displayDuration: computed(() => toDisplayDuration(mediaDuration.value, filler.value)),
    resolveUrl,
    toggle,
    pause,
    stop,
    seek,
  }
}
