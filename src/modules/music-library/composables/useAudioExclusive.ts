import { getCurrentScope, onScopeDispose } from "vue"

type AudioClaim = {
  token: symbol
  preempt: () => void
}

let active: AudioClaim | null = null

export type AudioExclusive = {
  /** Announce that this source starts playing; any other active source is paused first. */
  claim: () => void
  /** Give the slot back when this source pauses or ends on its own. */
  release: () => void
  /** True while this source holds the slot. */
  isActive: () => boolean
}

/**
 * Page-wide "one thing plays at a time" bus shared by the vocal player and
 * the chart preview. Each source registers the callback that pauses it;
 * claiming the slot runs the previous holder's callback.
 */
export function useAudioExclusive(onPreempted: () => void): AudioExclusive {
  const token = Symbol("audio-source")

  function claim() {
    if (active && active.token !== token) {
      active.preempt()
    }
    active = { token, preempt: onPreempted }
  }

  function release() {
    if (active?.token === token) {
      active = null
    }
  }

  if (getCurrentScope()) {
    onScopeDispose(release)
  }

  return { claim, release, isActive: () => active?.token === token }
}
