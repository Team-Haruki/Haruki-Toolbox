import { createLogger } from "@/lib/logger"
import {
  isConstrainedConnection,
  mapWithConcurrency,
  normalizeAssetManifest,
  selectAssetsToWarm,
  WARMUP_CONCURRENCY,
  type ConnectionHint,
} from "@/lib/asset-warmup-plan"

const ASSET_CACHE_NAME = "app-assets-v1"
const ASSET_MANIFEST_URL = `${import.meta.env.BASE_URL}asset-manifest.json`
const CONTROLLER_WAIT_MS = 20000

const logger = createLogger("pwa-warmup")
let warmupInFlight: Promise<void> | null = null
let warmedCommit: string | null = null

function readConnection(): ConnectionHint | undefined {
  return (navigator as Navigator & { connection?: ConnectionHint }).connection
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

  return isConstrainedConnection(readConnection())
}

// Without a controlling worker the warmup fetches bypass the runtime cache
// route and download without caching anything. On the visit that first
// installs the worker the controller arrives a moment later, so wait for it
// rather than skipping the session entirely.
async function waitForController(timeoutMs = CONTROLLER_WAIT_MS) {
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

async function fetchAssetManifest() {
  const response = await fetch(`${ASSET_MANIFEST_URL}?t=${Date.now()}`, { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`asset-manifest.json returned ${response.status}`)
  }

  const manifest = normalizeAssetManifest(await response.json() as unknown)
  if (!manifest) {
    throw new Error("asset-manifest.json is invalid")
  }

  return manifest
}

async function readCachedPaths() {
  const cache = await caches.open(ASSET_CACHE_NAME)
  return new Set((await cache.keys()).map((request) => new URL(request.url).pathname))
}

async function warmOne(url: string) {
  const response = await fetch(url, {
    cache: "default",
    credentials: "same-origin",
    // Chromium honours this and keeps the warmup behind anything the page
    // itself is loading.
    priority: "low",
  } as RequestInit)
  // Draining the body is what actually completes the transfer, and the
  // Service Worker caches its own clone independently.
  await response.arrayBuffer()
}

async function runWarmup() {
  if (!(await waitForController())) {
    return
  }

  const manifest = await fetchAssetManifest()
  if (manifest.gitCommit && manifest.gitCommit === warmedCommit) {
    return
  }

  const pending = selectAssetsToWarm(manifest.files, await readCachedPaths())
  if (pending.length > 0) {
    await mapWithConcurrency(pending, WARMUP_CONCURRENCY, warmOne, (url, error) => {
      logger.warn("Failed to warm asset", url, error)
    })
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
