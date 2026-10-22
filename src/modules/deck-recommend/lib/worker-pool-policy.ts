export type DeckRecommendExecutionMode = "sequential" | "parallel"

/**
 * How many recommendation engines a device can hold at once.
 *
 * Every engine worker parses the whole master set (about 50 MB of JSON for
 * jp) and keeps roughly 200 MB resident afterwards. WebKit on iOS kills a
 * tab somewhere around 1 GB, so phones get a single engine, touch devices
 * with unknown memory get two, and desktops scale with their cores.
 */
export type DeckRecommendDeviceProfile = {
  /** iOS/iPadOS, or any browser reporting 4 GB of device memory or less. */
  memoryConstrained: boolean
  touchDevice: boolean
  hardwareConcurrency: number | null
}

export const DECK_RECOMMEND_MAX_WORKERS = 4
/** Engines stay warm this long after the last page using them unmounts. */
export const DECK_RECOMMEND_WORKER_IDLE_DISPOSE_MS = 3 * 60 * 1000

type NavigatorLike = {
  userAgent?: string
  platform?: string
  maxTouchPoints?: number
  hardwareConcurrency?: number
  deviceMemory?: number
}

export function detectDeckRecommendDeviceProfile(
  nav: NavigatorLike | null | undefined = typeof navigator === "undefined" ? null : navigator,
): DeckRecommendDeviceProfile {
  if (!nav) {
    return { memoryConstrained: false, touchDevice: false, hardwareConcurrency: null }
  }

  const userAgent = nav.userAgent ?? ""
  const maxTouchPoints = nav.maxTouchPoints ?? 0
  // iPadOS 13+ presents itself as a Mac; the touch points give it away.
  const isApplePhoneOrTablet = /iPhone|iPad|iPod/i.test(userAgent)
    || (/Macintosh|MacIntel/i.test(`${userAgent} ${nav.platform ?? ""}`) && maxTouchPoints > 1)
  const deviceMemory = typeof nav.deviceMemory === "number" && Number.isFinite(nav.deviceMemory) ? nav.deviceMemory : null
  const hardwareConcurrency = typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency > 0
    ? Math.floor(nav.hardwareConcurrency)
    : null

  return {
    memoryConstrained: isApplePhoneOrTablet || (deviceMemory != null && deviceMemory <= 4),
    touchDevice: maxTouchPoints > 1,
    hardwareConcurrency,
  }
}

let cachedProfile: DeckRecommendDeviceProfile | null = null

export function getDeckRecommendDeviceProfile(): DeckRecommendDeviceProfile {
  cachedProfile ??= detectDeckRecommendDeviceProfile()
  return cachedProfile
}

/** Upper bound of engines for the device regardless of the requested mode. */
export function resolveDeckRecommendWorkerCap(profile: DeckRecommendDeviceProfile): number {
  if (profile.memoryConstrained) {
    return 1
  }
  if (profile.touchDevice) {
    return 2
  }
  const cores = profile.hardwareConcurrency
  if (cores == null) {
    return 2
  }
  return Math.max(1, Math.min(DECK_RECOMMEND_MAX_WORKERS, cores - 1))
}

export function resolveDeckRecommendWorkerCount(
  executionMode: DeckRecommendExecutionMode,
  algorithmCount: number,
  profile: DeckRecommendDeviceProfile,
): number {
  const algorithms = Math.max(1, Math.floor(algorithmCount))
  if (executionMode !== "parallel") {
    return 1
  }
  return Math.max(1, Math.min(algorithms, resolveDeckRecommendWorkerCap(profile)))
}

/** The device cannot honour the parallel mode the user picked. */
export function isDeckRecommendParallelLimited(
  executionMode: DeckRecommendExecutionMode,
  algorithmCount: number,
  profile: DeckRecommendDeviceProfile,
): boolean {
  return executionMode === "parallel"
    && algorithmCount > 1
    && resolveDeckRecommendWorkerCount(executionMode, algorithmCount, profile) < algorithmCount
}

/**
 * Spreads algorithms over the workers round-robin so every worker gets a
 * similar amount of work; a worker with several algorithms runs them as one
 * batch request.
 */
export function partitionDeckRecommendAlgorithms<T>(items: readonly T[], workerCount: number): T[][] {
  const count = Math.max(1, Math.min(Math.floor(workerCount), items.length))
  const groups: T[][] = Array.from({ length: count }, () => [])
  items.forEach((item, index) => {
    groups[index % count].push(item)
  })
  return groups.filter((group) => group.length > 0)
}

export function resolveDeckRecommendWorkerIdleDisposeMs(profile: DeckRecommendDeviceProfile): number {
  return profile.memoryConstrained ? 0 : DECK_RECOMMEND_WORKER_IDLE_DISPOSE_MS
}
