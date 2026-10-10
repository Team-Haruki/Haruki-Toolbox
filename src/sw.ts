// Built by vite-plugin-pwa (strategies: 'injectManifest') into dist/sw.js.
// The file name is part of the contract: every registration ever made by this
// app, including the pre-9.9 ones still open in old tabs, points at /sw.js.
import { CacheableResponsePlugin } from "workbox-cacheable-response"
import { ExpirationPlugin } from "workbox-expiration"
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from "workbox-precaching"
import { NavigationRoute, registerRoute } from "workbox-routing"
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies"
import type { PrecacheEntry } from "workbox-precaching"
import {
  APP_UPDATE_MESSAGE_ACK,
  APP_UPDATE_MESSAGE_HELLO,
  APP_UPDATE_MESSAGE_PROBE,
  APP_UPDATE_MESSAGE_SKIP_WAITING,
  readAppUpdateMessage,
  type AppUpdateClientBuild,
} from "@/lib/app-update-protocol"

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry | string>
}

/** Longest a navigation waits for the network before the precached shell. */
const NAVIGATION_NETWORK_TIMEOUT_MS = 3000
/** How long a window gets to answer the post-activation probe. */
const LEGACY_PROBE_TIMEOUT_MS = 10_000
/** Client ids of windows that run the update protocol (see app-update-protocol.ts). */
const CLIENT_REGISTRY_CACHE = "app-update-clients-v1"
const CLIENT_REGISTRY_PREFIX = "/__app-update/clients/"

// --- Lifecycle -------------------------------------------------------------
//
// A new worker activates as soon as it is installed and takes over every open
// tab. Up to 9.8.x the worker waited for the reader to accept an in-app
// prompt, and since it also served index.html cache-first from its precache,
// neither a reload nor days of use moved a tab off the old build. What the
// open pages do about the takeover is decided page-side (src/pwa.ts), so
// unsaved input is never thrown away just because a deployment happened.

self.addEventListener("install", () => {
  void self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  const claimed = self.clients.claim()
  event.waitUntil(claimed)
  // Deliberately outside waitUntil: fetches are held while the worker is
  // still activating, and the probe waits several seconds for answers.
  void claimed.then(rescueLegacyClients).catch(() => undefined)
})

// --- Navigations: network first --------------------------------------------
//
// The shell is fetched with `cache: 'no-cache'` (a cheap conditional request)
// so every load of an online tab gets the deployed index.html and therefore
// the deployed chunks. The precached copy only answers when the network is
// down or slower than NAVIGATION_NETWORK_TIMEOUT_MS. Registered before the
// precache route, which would otherwise answer "/" from the precache.

function timeout(ms: number) {
  return new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), ms)
  })
}

async function fetchShell(): Promise<Response | null> {
  try {
    const response = await fetch(new Request(new URL("/", self.location.origin).href, {
      cache: "no-cache",
      credentials: "same-origin",
    }))
    const contentType = response.headers.get("content-type") ?? ""
    if (!response.ok || !contentType.includes("text/html")) {
      return null
    }
    if (!response.redirected) {
      return response
    }
    // A redirected response cannot answer a navigation request.
    return new Response(await response.blob(), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  } catch {
    return null
  }
}

registerRoute(new NavigationRoute(async ({ request }) => {
  const network = await Promise.race([fetchShell(), timeout(NAVIGATION_NETWORK_TIMEOUT_MS)])
  if (network) {
    return network
  }

  const cached = await matchPrecache("index.html")
  return cached ?? fetch(request)
}, {
  denylist: [/^\/api\//],
}))

// --- Precache: the offline shell and root icons -----------------------------

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// --- Runtime caches ---------------------------------------------------------

// The whole build output under /assets/ is content-hashed, so a URL never
// changes meaning: cache-first, never revalidated. Workbox installs precache
// entries one at a time, so these are cached on first use instead (in
// parallel, by the page's normal loading) rather than precached.
registerRoute(
  ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/assets/"),
  new CacheFirst({
    cacheName: "app-assets-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 60, purgeOnQuotaError: true }),
    ],
  }),
)

// public/ assets keep stable URLs across builds, so they have to revalidate
// instead of pinning forever.
registerRoute(
  ({ url, sameOrigin }) => sameOrigin
    && (url.pathname.startsWith("/rank-border/") || url.pathname.startsWith("/basis/")),
  new StaleWhileRevalidate({
    cacheName: "app-static-v1",
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30, purgeOnQuotaError: true }),
    ],
  }),
)

// Sekai game-asset and toolbox static images (music jackets, card art, icons)
// are content-addressed and immutable. Scoped to image extensions to avoid
// caching large 3D bundles, and latency probes stay on the network (caching
// them would make endpoint re-tests measure cache reads).
//
// These <img> loads are cross-origin no-cors, so every response is opaque
// (status 0), including CDN/WAF errors that statuses:[0,200] cannot filter
// out. CacheFirst stays (revalidate-per-use would re-trigger the WAF's burst
// limit and can overwrite good entries with errors); instead the image error
// handlers purge the poisoned entry and retry (shared/sekai/image-recovery.ts).
// The v2 name abandons caches poisoned before that recovery existed; pwa.ts
// deletes the old cache.
registerRoute(
  /^https:\/\/(sekai-assets\.haruki\.seiunx\.com|sekai-assets-bdf29c81\.seiunx\.net|sekai-assets-cn03-she01-cdn\.haruki\.seiunx\.com|images\.haruki\.seiunx\.com)\/(?!asset-probe\.png(?:\?|$)).*\.(?:png|jpe?g|webp|avif)(?:\?.*)?$/i,
  new CacheFirst({
    cacheName: "sekai-image-assets-v2",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 4000, maxAgeSeconds: 60 * 60 * 24 * 30, purgeOnQuotaError: true }),
    ],
  }),
)

// --- Update protocol ----------------------------------------------------------

function registryKey(clientId: string) {
  return new URL(`${CLIENT_REGISTRY_PREFIX}${encodeURIComponent(clientId)}`, self.location.origin).href
}

async function rememberClient(clientId: string, build: AppUpdateClientBuild) {
  const cache = await caches.open(CLIENT_REGISTRY_CACHE)
  await cache.put(registryKey(clientId), new Response(JSON.stringify({ ...build, at: Date.now() }), {
    headers: { "content-type": "application/json" },
  }))
}

/** Ids of open windows known to run the update protocol; forgets closed ones. */
async function readKnownClients(openIds: ReadonlySet<string>) {
  const cache = await caches.open(CLIENT_REGISTRY_CACHE)
  const known = new Set<string>()
  for (const request of await cache.keys()) {
    const path = new URL(request.url).pathname
    const id = decodeURIComponent(path.slice(CLIENT_REGISTRY_PREFIX.length))
    if (openIds.has(id)) {
      known.add(id)
    } else {
      await cache.delete(request)
    }
  }
  return known
}

let pendingProbe: Set<string> | null = null

function clientIdOf(source: ExtendableMessageEvent["source"]) {
  return source && "id" in source && typeof source.id === "string" ? source.id : null
}

self.addEventListener("message", (event) => {
  const message = readAppUpdateMessage(event.data)
  if (!message) {
    return
  }

  if (message.type === APP_UPDATE_MESSAGE_SKIP_WAITING) {
    event.waitUntil(self.skipWaiting())
    return
  }

  const clientId = clientIdOf(event.source)
  if (!clientId) {
    return
  }

  if (message.type === APP_UPDATE_MESSAGE_HELLO || message.type === APP_UPDATE_MESSAGE_ACK) {
    pendingProbe?.delete(clientId)
    event.waitUntil(rememberClient(clientId, message.build).catch(() => undefined))
  }
})

/**
 * Reloads the windows that run a build from before the update protocol
 * (anything up to 9.8.x). Their page code only moves to a new worker after an
 * in-app prompt is accepted, and some tabs stayed on months-old builds that
 * request retired hosts. Windows known to speak the protocol (they announced
 * themselves, even if they are frozen in the background now) or that answer
 * the probe in time are left to their own, input-preserving update logic.
 */
async function rescueLegacyClients() {
  const windows = await self.clients.matchAll({ type: "window" })
  if (windows.length === 0) {
    return
  }

  const known = await readKnownClients(new Set(windows.map((client) => client.id)))
  const candidates = windows.filter((client) => !known.has(client.id))
  if (candidates.length === 0) {
    return
  }

  pendingProbe = new Set(candidates.map((client) => client.id))
  for (const client of candidates) {
    client.postMessage({ type: APP_UPDATE_MESSAGE_PROBE })
  }

  await timeout(LEGACY_PROBE_TIMEOUT_MS)
  const unanswered = pendingProbe
  pendingProbe = null

  // Re-list: a legacy page usually reloads itself when the new worker takes
  // control, and the window it became has a new id.
  for (const client of await self.clients.matchAll({ type: "window" })) {
    if (!unanswered.has(client.id)) {
      continue
    }
    try {
      await client.navigate(client.url)
    } catch {
      // Not navigable (another origin's frame, already gone, or a browser
      // without WindowClient.navigate); it updates on its next load.
    }
  }
}
