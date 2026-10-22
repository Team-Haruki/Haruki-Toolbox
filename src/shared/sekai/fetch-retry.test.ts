import { describe, expect, test } from "bun:test"
import { DEFAULT_FETCH_RETRY_POLICY, planFetchRetry, type FetchRetryPolicy } from "./fetch-retry"

const policy: FetchRetryPolicy = {
  delaysMs: [800, 1800, 3500],
  attemptTimeoutMs: 10_000,
  retryBudgetMs: 9_000,
}

describe("planFetchRetry", () => {
  test("the first attempt waits for nothing and gets the full header timeout", () => {
    expect(planFetchRetry(0, 0, policy)).toEqual({ delayMs: 0, timeoutMs: 10_000 })
  })

  test("retries back off per the policy and shrink their timeout to the remaining budget", () => {
    expect(planFetchRetry(1, 0, policy)).toEqual({ delayMs: 800, timeoutMs: 8_200 })
    // Second retry planned 1 s after the first failure: 9000 - 1000 - 1800.
    expect(planFetchRetry(2, 1_000, policy)).toEqual({ delayMs: 1_800, timeoutMs: 6_200 })
  })

  test("stops when the retries are exhausted", () => {
    expect(planFetchRetry(4, 0, policy)).toBeNull()
  })

  test("stops when the back-off would not leave room inside the budget", () => {
    // 9000 - 6000 - 3500 < 0: no point sleeping past the budget.
    expect(planFetchRetry(3, 6_000, policy)).toBeNull()
    // Barely inside the budget but not enough to wait for headers.
    expect(planFetchRetry(3, 5_300, policy)).toBeNull()
    expect(planFetchRetry(3, 5_000, policy)).toEqual({ delayMs: 3_500, timeoutMs: 500 })
  })

  test("applies jitter to the nominal delay and never goes negative", () => {
    expect(planFetchRetry(1, 0, policy, (delay) => delay * 1.3)).toEqual({ delayMs: 1_040, timeoutMs: 7_960 })
    expect(planFetchRetry(1, 0, policy, () => -50)).toEqual({ delayMs: 0, timeoutMs: 9_000 })
  })

  test("every default retry fits in the default budget when failures are instant", () => {
    const totalDelay = DEFAULT_FETCH_RETRY_POLICY.delaysMs.reduce((sum, delay) => sum + delay, 0)
    expect(totalDelay).toBeLessThan(DEFAULT_FETCH_RETRY_POLICY.retryBudgetMs)
    let elapsed = 0
    for (let attempt = 1; attempt <= DEFAULT_FETCH_RETRY_POLICY.delaysMs.length; attempt += 1) {
      const plan = planFetchRetry(attempt, elapsed)
      expect(plan).not.toBeNull()
      elapsed += plan!.delayMs
    }
  })
})
