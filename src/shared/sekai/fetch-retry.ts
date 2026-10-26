/**
 * Retry planning for the master-data worker's fetches.
 *
 * Two bounds keep a dead CDN from stalling a page for minutes: every attempt
 * waits at most `attemptTimeoutMs` for response headers, and once the first
 * attempt has failed, the remaining retries (delays included) must fit in
 * `retryBudgetMs`. A consumer therefore sees an error within roughly
 * `retryBudgetMs` of the first failure, however long the first attempt took.
 */
export type FetchRetryPolicy = {
  /** Back-off before retry `n` (index `n - 1`); the length is the retry count. */
  delaysMs: readonly number[]
  /** Time allowed for response headers on any single attempt. */
  attemptTimeoutMs: number
  /** Wall-clock budget for every retry after the first failure. */
  retryBudgetMs: number
}

export type FetchRetryAttempt = {
  /** Back-off to sleep before the attempt (0 for the first attempt). */
  delayMs: number
  /** Time-to-headers limit for the attempt. */
  timeoutMs: number
}

export const DEFAULT_FETCH_RETRY_POLICY: FetchRetryPolicy = {
  // Transient network failures ("Failed to fetch") and gateway hiccups are
  // common on flaky CDN paths; the master CDN also sits behind a WAF that
  // answers bursts with a transient 403 or an HTML challenge page. Both clear
  // on a paced retry.
  delaysMs: [800, 1800, 3500],
  attemptTimeoutMs: 10_000,
  retryBudgetMs: 9_000,
}

/**
 * Plans attempt number `attempt` (0-based). Returns null when the policy is
 * out of retries or the retry would not finish inside the budget.
 *
 * `elapsedSinceFirstFailureMs` is the time since the first attempt failed
 * (0 for the first retry when it is planned right away); `jitter` may
 * spread the nominal back-off and receives the nominal delay.
 */
export function planFetchRetry(
  attempt: number,
  elapsedSinceFirstFailureMs: number,
  policy: FetchRetryPolicy = DEFAULT_FETCH_RETRY_POLICY,
  jitter: (delayMs: number) => number = (delayMs) => delayMs,
): FetchRetryAttempt | null {
  if (attempt <= 0) {
    return { delayMs: 0, timeoutMs: policy.attemptTimeoutMs }
  }
  const nominalDelay = policy.delaysMs[attempt - 1]
  if (nominalDelay == null) {
    return null
  }
  const delayMs = Math.max(0, Math.round(jitter(nominalDelay)))
  const remaining = policy.retryBudgetMs - Math.max(0, elapsedSinceFirstFailureMs) - delayMs
  // A retry that cannot even wait for headers for a moment is not worth
  // starting; the budget is there so consumers hear about the failure.
  if (remaining < 250) {
    return null
  }
  return { delayMs, timeoutMs: Math.min(policy.attemptTimeoutMs, remaining) }
}
