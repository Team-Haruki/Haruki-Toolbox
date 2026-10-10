import { reactive } from "vue"
import type { Router } from "vue-router"
import { toast } from "vue-sonner"
import {
  APP_UPDATE_MESSAGE_ACK,
  APP_UPDATE_MESSAGE_HELLO,
  APP_UPDATE_MESSAGE_PROBE,
  APP_UPDATE_MESSAGE_SKIP_WAITING,
  readAppUpdateMessage,
  type AppUpdateClientBuild,
} from "@/lib/app-update-protocol"
import {
  decideAppUpdate,
  evaluateReloadGuard,
  isChunkLoadError,
  isProtectedInputType,
  normalizeBuildInfo,
  parseReloadGuardState,
  type AppBuildInfo,
} from "@/lib/app-update-policy"
import { createLogger } from "@/lib/logger"
import { scheduleAssetWarmup, warmAssetCache } from "@/pwa-asset-warmup"
import { translate } from "@/shared/i18n"

// Update policy (see also src/sw.ts and src/lib/app-update-policy.ts):
// - A new Service Worker activates at once and navigations are network-first,
//   so any reload or new tab lands on the deployed build.
// - Open tabs compare their build with /build-info.json every few minutes, when
//   they become visible again and when a new worker takes control.
// - A newer build is offered through a prompt; a tab that has been hidden for
//   a while with no unsaved input reloads silently instead.
// - A build below the deployment's `minSupportedVersion` reloads regardless,
//   after a one-minute grace period when the reader has unsaved input.
// - A lazily-loaded chunk that no longer exists triggers one guarded reload.

const BUILD_INFO_CHECK_INTERVAL_MS = 10 * 60 * 1000
const BUILD_INFO_URL = `${import.meta.env.BASE_URL}build-info.json`
const SERVICE_WORKER_URL = `${import.meta.env.BASE_URL}sw.js`
const UPDATE_TOAST_ID = "haruki-toolbox-app-update"
const CHUNK_ERROR_TOAST_ID = "haruki-toolbox-chunk-error"
/** How long a forced update waits when the reader has typed something. */
const FORCED_UPDATE_GRACE_MS = 60 * 1000
/** How long a forced update shows its notice before reloading. */
const FORCED_UPDATE_NOTICE_MS = 1500
const SERVICE_WORKER_UPDATE_TIMEOUT_MS = 5000
const RELOAD_GUARD_STORAGE_KEY = "haruki-toolbox:app-reload-guard"

/** Build-info polling runs in production, and in the e2e suite on request. */
const updateChecksEnabled = import.meta.env.PROD || import.meta.env.VITE_APP_UPDATE_CHECKS === "true"

const currentBuildInfo: AppBuildInfo = {
  version: __APP_VERSION__,
  gitCommit: __APP_GIT_COMMIT__,
  buildTime: __APP_BUILD_TIME__,
}

export const appUpdateState = reactive({
  current: currentBuildInfo,
  remote: null as AppBuildInfo | null,
  updateAvailable: false,
  /** The running build is below the deployment's minimum supported version. */
  forced: false,
  checking: false,
  applying: false,
  serviceWorkerReady: false,
  offlineReady: false,
  checkedAt: null as string | null,
  lastError: null as string | null,
})

const logger = createLogger("pwa")
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null
let updatePromptCommit: string | null = null
let updateChecksStarted = false
let forcedUpdateTimer: ReturnType<typeof window.setTimeout> | null = null
let reloading = false
let hadController = false
let hiddenSince: number | null = null
const editedFields = new Set<HTMLElement>()

function currentClientBuild(): AppUpdateClientBuild {
  return { version: currentBuildInfo.version, gitCommit: currentBuildInfo.gitCommit }
}

// --- Unsaved input -----------------------------------------------------------

function isProtectedField(target: EventTarget | null): target is HTMLElement {
  if (target instanceof HTMLTextAreaElement) {
    return true
  }
  if (target instanceof HTMLInputElement) {
    return isProtectedInputType(target.type)
  }
  return target instanceof HTMLElement && target.isContentEditable
}

/**
 * Whether a field the reader typed into is still on screen and non-empty.
 * Leaving the page (or clearing the field) drops it, so a search box typed
 * into an hour ago on another route does not block silent updates.
 */
export function hasUnsavedInput() {
  for (const field of editedFields) {
    if (!field.isConnected) {
      editedFields.delete(field)
      continue
    }
    if (field.closest("[data-app-update-safe]")) {
      continue
    }
    const value = field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement
      ? field.value
      : field.textContent
    if (value && value.trim() !== "") {
      return true
    }
  }
  return false
}

function trackUnsavedInput() {
  document.addEventListener("input", (event) => {
    if (event.isTrusted && isProtectedField(event.target)) {
      editedFields.add(event.target)
    }
  }, true)
}

function currentHiddenForMs() {
  return hiddenSince === null ? 0 : Date.now() - hiddenSince
}

function trackVisibility() {
  hiddenSince = document.visibilityState === "hidden" ? Date.now() : null
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      hiddenSince = Date.now()
      return
    }

    const hiddenForMs = currentHiddenForMs()
    hiddenSince = null
    if (updateChecksStarted) {
      runBackgroundCheck(hiddenForMs)
    }
  })
}

// --- Service Worker messaging ---------------------------------------------------

function announceTo(worker: ServiceWorker | null | undefined) {
  worker?.postMessage({ type: APP_UPDATE_MESSAGE_HELLO, build: currentClientBuild() })
}

function handleControllerChange() {
  const container = navigator.serviceWorker
  announceTo(container.controller)

  if (!hadController) {
    hadController = true
    appUpdateState.offlineReady = true
    toast.success(translate("core.pwa.offlineReadyTitle"), {
      description: translate("core.pwa.offlineReadyDescription"),
    })
    return
  }

  // A newer worker took over (it activates without waiting). The page keeps
  // running; the build check decides whether to prompt, apply or force.
  if (updateChecksStarted && !reloading) {
    void checkForAppUpdate({ silent: true })
  }
}

/**
 * Must run before anything else at boot: it answers the Service Worker's
 * post-activation probe (an unanswered window is treated as a legacy build
 * and reloaded) and starts tracking unsaved input and visibility.
 */
export function installAppUpdateMessaging() {
  trackUnsavedInput()
  trackVisibility()

  if (!("serviceWorker" in navigator)) {
    return
  }

  const container = navigator.serviceWorker
  container.addEventListener("message", (event) => {
    const message = readAppUpdateMessage(event.data)
    if (message?.type !== APP_UPDATE_MESSAGE_PROBE) {
      return
    }
    const worker = event.source instanceof ServiceWorker ? event.source : container.controller
    worker?.postMessage({ type: APP_UPDATE_MESSAGE_ACK, build: currentClientBuild() })
  })
  container.startMessages()
  hadController = !!container.controller
  announceTo(container.controller)
  container.addEventListener("controllerchange", handleControllerChange)
}

// --- Registration and checks -------------------------------------------------------

export async function registerAppServiceWorker() {
  if (updateChecksEnabled) {
    startUpdateChecks()
  }

  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return
  }

  // The runtime image cache was renamed to sekai-image-assets-v2 after
  // opaque error responses poisoned it; workbox only cleans up outdated
  // precaches, so drop the abandoned cache ourselves.
  if (typeof caches !== "undefined") {
    caches.delete("sekai-image-assets").catch(() => {})
  }

  try {
    // updateViaCache 'none': the browser revalidates sw.js and everything it
    // imports with the server on every update check, whatever the HTTP
    // cache headers say.
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, {
      scope: import.meta.env.BASE_URL,
      updateViaCache: "none",
    })
    serviceWorkerRegistration = registration
    appUpdateState.serviceWorkerReady = true
    // A worker left waiting by a pre-9.9 build is told to take over now.
    registration.waiting?.postMessage({ type: APP_UPDATE_MESSAGE_SKIP_WAITING })
    scheduleAssetWarmup()
  } catch (error) {
    appUpdateState.lastError = error instanceof Error ? error.message : String(error)
    logger.warn("Failed to register service worker", error)
  }
}

function runBackgroundCheck(hiddenForMs?: number) {
  if (!navigator.onLine || reloading) {
    return
  }

  serviceWorkerRegistration?.update().catch(() => undefined)
  void checkForAppUpdate({ silent: true, hiddenForMs })
}

function startUpdateChecks() {
  if (updateChecksStarted) {
    return
  }
  updateChecksStarted = true

  runBackgroundCheck()
  window.setInterval(() => runBackgroundCheck(), BUILD_INFO_CHECK_INTERVAL_MS)
  window.addEventListener("online", () => runBackgroundCheck())
}

export async function checkForAppUpdate(options: { silent?: boolean, hiddenForMs?: number } = {}) {
  if (!updateChecksEnabled) {
    appUpdateState.checkedAt = new Date().toISOString()
    if (!options.silent) {
      toast.info(translate("core.pwa.devTitle"), {
        description: translate("core.pwa.devDescription"),
      })
    }
    return appUpdateState.remote
  }

  if (appUpdateState.checking || reloading) {
    return appUpdateState.remote
  }

  appUpdateState.checking = true
  appUpdateState.lastError = null

  try {
    const remote = await fetchRemoteBuildInfo()
    appUpdateState.remote = remote
    appUpdateState.checkedAt = new Date().toISOString()

    const decision = decideAppUpdate({
      current: currentBuildInfo,
      remote,
      hasUnsavedInput: hasUnsavedInput(),
      hiddenForMs: options.hiddenForMs ?? currentHiddenForMs(),
    })

    switch (decision) {
      case "force":
        startForcedUpdate(remote)
        break
      case "apply":
        appUpdateState.updateAvailable = true
        if (consumeReloadGuard(`update:${remote.gitCommit}`)) {
          void reloadIntoDeployedBuild(undefined, { keepUnsavedInput: true })
        } else {
          showAppUpdatePrompt(remote)
        }
        break
      case "prompt":
        appUpdateState.updateAvailable = true
        showAppUpdatePrompt(remote)
        // Pull the new build's chunks down in the background while the prompt
        // is up, so accepting it reloads into an already-cached build.
        void warmAssetCache()
        break
      default:
        appUpdateState.updateAvailable = false
        updatePromptCommit = null
        if (!options.silent) {
          toast.success(translate("core.pwa.currentTitle"), {
            description: translate("core.pwa.currentDescription"),
          })
        }
    }

    return remote
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    appUpdateState.lastError = message
    // The dev server has no build-info.json; only e2e specs that mock it care.
    if (import.meta.env.PROD || !options.silent) {
      logger.warn("Failed to check app update", error)
    }
    if (!options.silent) {
      toast.error(translate("core.pwa.checkFailedTitle"), {
        description: translate("core.pwa.checkFailedDescription"),
      })
    }
    return appUpdateState.remote
  } finally {
    appUpdateState.checking = false
  }
}

/** The reader accepted the update (prompt action or settings dialog). */
export async function applyAppUpdate() {
  if (appUpdateState.applying) {
    return
  }

  appUpdateState.applying = true
  toast.loading(translate("core.pwa.applyingTitle"), {
    id: UPDATE_TOAST_ID,
    description: translate("core.pwa.applyingDescription"),
    duration: Number.POSITIVE_INFINITY,
  })

  await reloadIntoDeployedBuild()
}

function startForcedUpdate(remote: AppBuildInfo) {
  appUpdateState.updateAvailable = true
  appUpdateState.forced = true
  if (forcedUpdateTimer !== null || reloading) {
    return
  }

  if (!consumeReloadGuard(`update:${remote.gitCommit}`)) {
    // Reloading already failed to bring the deployed build (a stale cache in
    // front of the site, most likely). Never loop; leave it to the reader.
    logger.warn("Forced update suppressed by the reload guard", remote.gitCommit)
    showAppUpdatePrompt(remote)
    return
  }

  const unsaved = hasUnsavedInput()
  toast.warning(translate("core.pwa.forcedUpdateTitle"), {
    id: UPDATE_TOAST_ID,
    description: unsaved
      ? translate("core.pwa.forcedUpdateWithInputDescription", { version: remote.version })
      : translate("core.pwa.forcedUpdateDescription", { version: remote.version }),
    duration: Number.POSITIVE_INFINITY,
    action: {
      label: translate("core.pwa.updateAction"),
      onClick(event) {
        event.preventDefault()
        void applyAppUpdate()
      },
    },
  })
  forcedUpdateTimer = window.setTimeout(() => {
    void reloadIntoDeployedBuild()
  }, unsaved ? FORCED_UPDATE_GRACE_MS : FORCED_UPDATE_NOTICE_MS)
}

/**
 * Gets the newest worker in (best effort, bounded) and reloads. The reload
 * itself is what matters: navigations are network-first, so it fetches the
 * deployed index.html even if the worker update has not finished.
 */
async function reloadIntoDeployedBuild(target?: string, options: { keepUnsavedInput?: boolean } = {}) {
  if (reloading) {
    return
  }
  reloading = true

  const registration = serviceWorkerRegistration
  if (registration) {
    await Promise.race([
      registration.update().catch(() => undefined),
      new Promise((resolve) => window.setTimeout(resolve, SERVICE_WORKER_UPDATE_TIMEOUT_MS)),
    ])
    registration.waiting?.postMessage({ type: APP_UPDATE_MESSAGE_SKIP_WAITING })
  }

  // A silent update must not discard what the reader typed meanwhile.
  if (options.keepUnsavedInput && hasUnsavedInput()) {
    reloading = false
    showAppUpdatePrompt(appUpdateState.remote)
    return
  }

  if (target && target !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.location.assign(target)
  } else {
    window.location.reload()
  }
}

function readGuardStorage(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/**
 * Records an automatic reload for `key` and says whether it may happen. With
 * no session storage there is no way to remember the attempt across the
 * reload, so automatic reloads are refused rather than risk a loop.
 */
function consumeReloadGuard(key: string) {
  const storage = readGuardStorage()
  if (!storage) {
    return false
  }

  try {
    const { allowed, state } = evaluateReloadGuard(
      parseReloadGuardState(storage.getItem(RELOAD_GUARD_STORAGE_KEY)),
      key,
      Date.now(),
    )
    if (allowed) {
      storage.setItem(RELOAD_GUARD_STORAGE_KEY, JSON.stringify(state))
    }
    return allowed
  } catch {
    return false
  }
}

async function fetchRemoteBuildInfo(): Promise<AppBuildInfo> {
  const response = await fetch(`${BUILD_INFO_URL}?t=${Date.now()}`, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
    },
  })

  if (!response.ok) {
    throw new Error(`build-info.json returned ${response.status}`)
  }

  const value = await response.json() as unknown
  const buildInfo = normalizeBuildInfo(value)
  if (!buildInfo) {
    throw new Error("build-info.json is invalid")
  }

  return buildInfo
}

function showAppUpdatePrompt(remote: AppBuildInfo | null) {
  if (remote?.gitCommit && updatePromptCommit === remote.gitCommit) {
    return
  }

  updatePromptCommit = remote?.gitCommit ?? null
  toast.info(translate("core.pwa.updateAvailableTitle"), {
    id: UPDATE_TOAST_ID,
    description: remote?.version
      ? translate("core.pwa.updateAvailableDescriptionWithVersion", { version: remote.version })
      : translate("core.pwa.updateAvailableDescription"),
    duration: Number.POSITIVE_INFINITY,
    action: {
      label: translate("core.pwa.updateAction"),
      onClick(event) {
        event.preventDefault()
        void applyAppUpdate()
      },
    },
  })
}

// --- Chunk-load failures --------------------------------------------------------

function showChunkErrorPrompt() {
  toast.error(translate("core.pwa.chunkErrorTitle"), {
    id: CHUNK_ERROR_TOAST_ID,
    description: translate("core.pwa.chunkErrorDescription"),
    duration: Number.POSITIVE_INFINITY,
    action: {
      label: translate("core.pwa.reloadAction"),
      onClick(event) {
        event.preventDefault()
        void reloadIntoDeployedBuild()
      },
    },
  })
}

/**
 * A lazily-loaded chunk of the running build is gone (a deployment replaced
 * it). Reload into the deployed build once per build and guard window; a
 * route navigation reloads straight into its target. Outside a navigation a
 * reader with unsaved input is asked first.
 */
function recoverFromChunkLoadError(error: unknown, target?: string) {
  if (reloading) {
    return true
  }

  if (!navigator.onLine) {
    return false
  }

  if (target === undefined && hasUnsavedInput()) {
    showChunkErrorPrompt()
    return false
  }

  if (!consumeReloadGuard(`chunk:${currentBuildInfo.gitCommit}`)) {
    showChunkErrorPrompt()
    return false
  }

  logger.warn("Reloading after a chunk failed to load", error)
  void reloadIntoDeployedBuild(target)
  return true
}

export function installChunkLoadRecovery(router: Router) {
  // In development Vite reloads the page itself when dependencies change.
  if (!import.meta.env.PROD) {
    return
  }

  // The route being navigated to, while its lazy view is loading: Vite's
  // preload error fires before the router's, and both should land the reader
  // on the page they asked for.
  let pendingNavigation: string | null = null
  router.beforeEach((to) => {
    pendingNavigation = to.fullPath
  })
  router.afterEach(() => {
    pendingNavigation = null
  })

  window.addEventListener("vite:preloadError", (event) => {
    if (recoverFromChunkLoadError(event.payload, pendingNavigation ?? undefined)) {
      event.preventDefault()
    }
  })
  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadError(event.reason) && recoverFromChunkLoadError(event.reason)) {
      event.preventDefault()
    }
  })
  router.onError((error, to) => {
    pendingNavigation = null
    if (isChunkLoadError(error)) {
      recoverFromChunkLoadError(error, to.fullPath)
    }
  })
}
