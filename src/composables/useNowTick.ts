import { onScopeDispose, ref, type Ref } from "vue"

type SharedTicker = {
  now: Ref<number>
  subscribers: number
  timer: ReturnType<typeof setInterval> | null
}

const tickers = new Map<number, SharedTicker>()

/**
 * A `Date.now()` ref that updates every `intervalMs`, shared by every caller
 * with the same interval so a page full of countdowns and status badges
 * drives one timer instead of one per component. The timer stops when the
 * last subscriber's scope is disposed.
 */
export function useNowTick(intervalMs = 30_000): Ref<number> {
  const interval = Math.max(250, Math.trunc(intervalMs))
  let ticker = tickers.get(interval)
  if (!ticker) {
    ticker = { now: ref(Date.now()), subscribers: 0, timer: null }
    tickers.set(interval, ticker)
  }

  const current = ticker
  current.subscribers += 1
  if (current.timer == null && typeof setInterval === "function") {
    current.now.value = Date.now()
    current.timer = setInterval(() => {
      current.now.value = Date.now()
    }, interval)
  }

  onScopeDispose(() => {
    current.subscribers -= 1
    if (current.subscribers <= 0) {
      current.subscribers = 0
      if (current.timer != null) {
        clearInterval(current.timer)
        current.timer = null
      }
      tickers.delete(interval)
    }
  })

  return current.now
}
