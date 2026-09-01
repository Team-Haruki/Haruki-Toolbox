import { getCurrentScope, onScopeDispose, shallowRef, type Ref } from "vue"

type TickerEntry = {
  now: Ref<number>
  subscribers: number
  timer: ReturnType<typeof setInterval> | null
}

const tickers = new Map<number, TickerEntry>()

/**
 * Shared low-frequency clock. Every consumer of the same interval shares one
 * `setInterval` and one ref, and the timer stops when the last consumer's
 * scope is disposed. Row-level relative times subscribe from a leaf component
 * so a tick re-renders only those leaves, never the leaderboard itself.
 */
export function useNowSecond(intervalMs = 15_000): Ref<number> {
  let entry = tickers.get(intervalMs)
  if (!entry) {
    entry = {
      now: shallowRef(Math.floor(Date.now() / 1000)),
      subscribers: 0,
      timer: null,
    }
    tickers.set(intervalMs, entry)
  }

  const active = entry
  active.subscribers += 1
  if (active.timer == null) {
    active.now.value = Math.floor(Date.now() / 1000)
    active.timer = setInterval(() => {
      active.now.value = Math.floor(Date.now() / 1000)
    }, intervalMs)
  }

  if (getCurrentScope()) {
    onScopeDispose(() => {
      active.subscribers -= 1
      if (active.subscribers <= 0 && active.timer != null) {
        clearInterval(active.timer)
        active.timer = null
      }
    })
  }

  return active.now
}
