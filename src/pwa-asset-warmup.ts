import { createLogger } from "@/lib/logger"

const ASSET_CACHE_NAME = "app-assets-v1"
const ASSET_MANIFEST_URL = `${import.meta.env.BASE_URL}asset-manifest.json`

// Workbox's precache installed entries one at a time, which is what made
// updates take a minute. This warms the same files from the page instead:
// after load, off the critical path, several at a time, and skipping whatever
// the runtime cache already holds.
const WARMUP_CONCURRENCY = 6
const WARMUP_MAX_FILE_BYTES = 600 * 1024
const WARMUP_MAX_TOTAL_BYTES = 6 * 1024 * 1024

type AssetManifestEntry = {
  url: string
  bytes: number
}

type AssetManifest = {
  gitCommit?: string
  files: AssetManifestEntry[]
}

type NetworkInformation = {
  saveData?: boolean
  effectiveType?: string
}

const logger = createLogger("pwa-warmup")
let warmupInFlight: Promise<void> | null = null
let warmedCommit: string | null = null

function readConnection(): NetworkInformation | undefined {
  return (navigator as Navigator & { connection?: NetworkInformation }).connection
}

function shouldSkipWarmup() {
  if (!import.meta.env.PROD || typeof caches === "undefined") {
    return true
  }

  if (!("serviceWorker" in navigator)) {
    return true
  }

  if (!navigator.onLine) {
    return true
  }

  const connection = readConnection()
  return Boolean(
    connection?.saveData
    || connection?.effectiveType === "slow-2g"
    || connection?.effectiveType === "2g",
  )
}

function normalizeManifest(value: unknown): AssetManifest | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = value as { gitCommit?: unknown, files?: unknown }
  if (!Array.isArray(candidate.files)) {
    return null
  }

  const files: AssetManifestEntry[] = []
  for (const entry of candidate.files) {
    if (!entry || typeof entry !== "object") {
      continue
    }
    const { url, bytes } = entry as { url?: unknown, bytes?: unknown }
    if (typeof url === "string" && url.startsWith("/") && typeof bytes === "number") {
      files.push({ url, bytes })
    }
  }

  return {
    gitCommit: typeof candidate.gitCommit === "string" ? candidate.gitCommit : undefined,
    files,
  }
}

async function runWithConcurrency(urls: string[], limit: number) {
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, urls.length) }, async () => {
    while (cursor < urls.length) {
      const url = urls[cursor]
      cursor += 1
      try {
        const response = await fetch(url, {
          cache: "default",
          credentials: "same-origin",
          // Chromium honours this and keeps the warmup behind anything the
          // page itself is loading.
          priority: "low",
        } as RequestInit)
        // Draining the body is what actually completes the transfer, and the
        // Service Worker caches its own clone independently.
        await response.arrayBuffer()
      } catch (error) {
        logger.warn("Failed to warm asset", url, error)
      }
    }
  })

  await Promise.all(workers)
}

// Without a controlling worker the warmup fetches bypass the runtime cache
// route and download without caching anything. On the visit that first
// installs the worker the controller arrives a moment later, so wait for it
// rather than skipping the session entirely.
async function waitForController(timeoutMs = 20000) {
  if (navigator.serviceWorker.controller) {
    return true
  }

  await navigator.serviceWorker.ready.catch(() => undefined)
  if (navigator.serviceWorker.controller) {
    return true
  }

  return new Promise<boolean>((resolve) => {
    const timer = window.setTimeout(() => resolve(false), timeoutMs)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.clearTimeout(timer)
      resolve(true)
    }, { once: true })
  })
}

async function runWarmup() {
  if (!(await waitForController())) {
    return
  }

  const response = await fetch(`${ASSET_MANIFEST_URL}?t=${Date.now()}`, { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`asset-manifest.json returned ${response.status}`)
  }

  const manifest = normalizeManifest(await response.json() as unknown)
  if (!manifest) {
    throw new Error("asset-manifest.json is invalid")
  }

  if (manifest.gitCommit && manifest.gitCommit === warmedCommit) {
    return
  }

  const cache = await caches.open(ASSET_CACHE_NAME)
  const cached = new Set((await cache.keys()).map((request) => new URL(request.url).pathname))

  let budget = WARMUP_MAX_TOTAL_BYTES
  const pending: string[] = []
  for (const file of manifest.files) {
    if (cached.has(file.url) || file.bytes > WARMUP_MAX_FILE_BYTES) {
      continue
    }
    if (file.bytes > budget) {
      break
    }
    budget -= file.bytes
    pending.push(file.url)
  }

  if (pending.length > 0) {
    await runWithConcurrency(pending, WARMUP_CONCURRENCY)
  }

  warmedCommit = manifest.gitCommit ?? null
}

/**
 * Pulls the deployed build's chunks into the runtime asset cache in the
 * background. It reads the manifest with `no-store`, so once a new build is
 * live this warms *that* build: by the time the reader accepts the update
 * prompt, the reload it triggers is served from cache.
 */
export function warmAssetCache() {
  if (warmupInFlight) {
    return warmupInFlight
  }

  if (shouldSkipWarmup()) {
    return Promise.resolve()
  }

  warmupInFlight = runWarmup()
    .catch((error: unknown) => {
      logger.warn("Asset cache warmup failed", error)
    })
    .finally(() => {
      warmupInFlight = null
    })

  return warmupInFlight
}

export function scheduleAssetWarmup() {
  const start = () => {
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number })
      .requestIdleCallback
    if (idle) {
      idle(() => void warmAssetCache(), { timeout: 10000 })
      return
    }
    window.setTimeout(() => void warmAssetCache(), 2000)
  }

  if (document.readyState === "complete") {
    start()
    return
  }
  window.addEventListener("load", start, { once: true })
}
