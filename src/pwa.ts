import { reactive } from "vue"
import { toast } from "vue-sonner"
import { createLogger } from "@/lib/logger"
import { translate } from "@/shared/i18n"

const SERVICE_WORKER_UPDATE_INTERVAL_MS = 60 * 60 * 1000
const BUILD_INFO_CHECK_INTERVAL_MS = 10 * 60 * 1000
const BUILD_INFO_URL = `${import.meta.env.BASE_URL}build-info.json`
const UPDATE_TOAST_ID = "haruki-toolbox-app-update"

type AppBuildInfo = {
  version: string
  gitCommit: string
  buildTime: string
}

const currentBuildInfo: AppBuildInfo = {
  version: __APP_VERSION__,
  gitCommit: __APP_GIT_COMMIT__,
  buildTime: __APP_BUILD_TIME__,
}

export const appUpdateState = reactive({
  current: currentBuildInfo,
  remote: null as AppBuildInfo | null,
  updateAvailable: false,
  checking: false,
  applying: false,
  serviceWorkerReady: false,
  offlineReady: false,
  checkedAt: null as string | null,
  lastError: null as string | null,
})

const logger = createLogger("pwa")
let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null
let serviceWorkerRegistration: ServiceWorkerRegistration | null = null
let updatePromptCommit: string | null = null
let updateCheckTimer: ReturnType<typeof window.setInterval> | null = null
let removeUpdateCheckListeners: (() => void) | null = null

export async function registerAppServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return
  }

  const { registerSW } = await import("virtual:pwa-register")

  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      appUpdateState.updateAvailable = true
      showAppUpdatePrompt(appUpdateState.remote)
    },
    onNeedReload() {
      window.location.reload()
    },
    onOfflineReady() {
      appUpdateState.offlineReady = true
      toast.success(translate("core.pwa.offlineReadyTitle"), {
        description: translate("core.pwa.offlineReadyDescription"),
      })
    },
    onRegisteredSW(_swUrl, registration) {
      serviceWorkerRegistration = registration ?? null
      appUpdateState.serviceWorkerReady = !!registration
      startUpdateChecks(registration)
    },
    onRegisterError(error) {
      const message = error instanceof Error ? error.message : String(error)
      appUpdateState.lastError = message
      logger.warn("Failed to register service worker", error)
    },
  })
}

export async function checkForAppUpdate(options: { silent?: boolean } = {}) {
  if (!import.meta.env.PROD) {
    appUpdateState.checkedAt = new Date().toISOString()
    if (!options.silent) {
      toast.info(translate("core.pwa.devTitle"), {
        description: translate("core.pwa.devDescription"),
      })
    }
    return appUpdateState.remote
  }

  if (appUpdateState.checking) {
    return appUpdateState.remote
  }

  appUpdateState.checking = true
  appUpdateState.lastError = null

  try {
    const remote = await fetchRemoteBuildInfo()
    appUpdateState.remote = remote
    appUpdateState.checkedAt = new Date().toISOString()

    if (isNewBuild(remote)) {
      appUpdateState.updateAvailable = true
      showAppUpdatePrompt(remote)
    } else {
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
    logger.warn("Failed to check app update", error)
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

  try {
    const registration = serviceWorkerRegistration
    if (registration) {
      await registration.update()
      await waitForWaitingServiceWorker(registration)
    }

    if (updateServiceWorker) {
      await updateServiceWorker(true)
    }
  } catch (error) {
    logger.warn("Failed to activate service worker update, reloading page", error)
  } finally {
    window.setTimeout(() => {
      window.location.reload()
    }, 500)
  }
}

function startUpdateChecks(registration: ServiceWorkerRegistration | undefined) {
  const checkWhenOnline = () => {
    if (!navigator.onLine) {
      return
    }

    void registration?.update()
    void checkForAppUpdate({ silent: true })
  }

  checkWhenOnline()

  if (updateCheckTimer !== null) {
    window.clearInterval(updateCheckTimer)
  }
  removeUpdateCheckListeners?.()

  updateCheckTimer = window.setInterval(checkWhenOnline, Math.min(
    SERVICE_WORKER_UPDATE_INTERVAL_MS,
    BUILD_INFO_CHECK_INTERVAL_MS,
  ))

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      checkWhenOnline()
    }
  }

  document.addEventListener("visibilitychange", handleVisibilityChange)
  window.addEventListener("online", checkWhenOnline)
  removeUpdateCheckListeners = () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange)
    window.removeEventListener("online", checkWhenOnline)
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

function normalizeBuildInfo(value: unknown): AppBuildInfo | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = value as Partial<Record<keyof AppBuildInfo | "gitHash", unknown>>
  if (
    typeof candidate.version !== "string"
    || typeof candidate.buildTime !== "string"
  ) {
    return null
  }

  let gitCommit: string | null = null
  if (typeof candidate.gitCommit === "string") {
    gitCommit = candidate.gitCommit
  } else if (typeof candidate.gitHash === "string") {
    gitCommit = candidate.gitHash
  }

  if (!gitCommit) {
    return null
  }

  return {
    version: candidate.version,
    gitCommit,
    buildTime: candidate.buildTime,
  }
}

function isNewBuild(remote: AppBuildInfo) {
  return Boolean(
    remote.gitCommit
    && currentBuildInfo.gitCommit
    && remote.gitCommit !== "unknown"
    && currentBuildInfo.gitCommit !== "unknown"
    && remote.gitCommit !== currentBuildInfo.gitCommit,
  )
}

function showAppUpdatePrompt(remote: AppBuildInfo | null) {
  if (remote?.gitCommit && updatePromptCommit === remote.gitCommit) {
    return
  }

  updatePromptCommit = remote?.gitCommit ?? null
  toast.info(translate("core.pwa.updateAvailableTitle"), {
    id: UPDATE_TOAST_ID,
    description: remote?.gitCommit
      ? translate("core.pwa.updateAvailableDescriptionWithCommit", { commit: remote.gitCommit })
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

function waitForWaitingServiceWorker(
  registration: ServiceWorkerRegistration,
  timeoutMs = 4000,
) {
  if (registration.waiting) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, timeoutMs)

    registration.addEventListener("updatefound", () => {
      const worker = registration.installing
      if (!worker) {
        return
      }

      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && registration.waiting) {
          window.clearTimeout(timeout)
          resolve()
        }
      })
    }, { once: true })
  })
}
