import { onMounted, onUnmounted, ref } from "vue"

interface UseTurnstileWidgetOptions {
  enabled?: boolean
  getSitekey?: () => string | undefined
  getCallback?: () => ((token: string) => void) | undefined
  getTheme?: () => string | undefined
  getSize?: () => string | undefined
  getAction?: () => string | undefined
  onVerify: (token: string) => void
  onInvalid: () => void
}

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js"

let turnstileScriptPromise: Promise<void> | null = null

function ensureTurnstileScript(): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Turnstile requires a browser environment"))
  }

  if (window.turnstile) {
    return Promise.resolve()
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise
  }

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_SRC}"]`)
    const script = existingScript ?? document.createElement("script")

    const cleanup = () => {
      script.removeEventListener("load", handleLoad)
      script.removeEventListener("error", handleError)
    }

    const handleLoad = () => {
      cleanup()
      if (window.turnstile) {
        resolve()
        return
      }

      turnstileScriptPromise = null
      reject(new Error("Turnstile script loaded without exposing window.turnstile"))
    }

    const handleError = () => {
      cleanup()
      turnstileScriptPromise = null
      reject(new Error("Failed to load Cloudflare Turnstile"))
    }

    script.addEventListener("load", handleLoad)
    script.addEventListener("error", handleError)

    if (!existingScript) {
      script.src = TURNSTILE_SCRIPT_SRC
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  })

  return turnstileScriptPromise
}

export function useTurnstileWidget(options: UseTurnstileWidgetOptions) {
  const container = ref<HTMLDivElement | null>(null)
  const isLoading = ref(true)
  const isUnavailable = ref(false)
  let widgetId: string | null = null

  function clearToken() {
    options.onInvalid()
  }

  function markLoading() {
    isLoading.value = true
    isUnavailable.value = false
  }

  function markReady() {
    isLoading.value = false
    isUnavailable.value = false
  }

  function markUnavailable() {
    isLoading.value = false
    isUnavailable.value = true
  }

  function handleVerify(token: string) {
    options.onVerify(token)
    options.getCallback?.()?.(token)
  }

  function handleExpired() {
    clearToken()
  }

  function handleError() {
    clearToken()
  }

  function renderTurnstile() {
    if (!container.value || widgetId !== null || !window.turnstile) return false

    try {
      widgetId = window.turnstile.render(container.value, {
        sitekey: options.getSitekey?.() ?? "1x00000000000000000000AA",
        callback: handleVerify,
        theme: options.getTheme?.(),
        size: options.getSize?.() || "flexible",
        action: options.getAction?.(),
        "expired-callback": handleExpired,
        "error-callback": handleError,
      })
      markReady()
      return true
    } catch {
      clearToken()
      markUnavailable()
      return false
    }
  }

  async function startLoading() {
    if (!container.value) {
      markUnavailable()
      return
    }

    if (options.enabled === false) {
      clearToken()
      markReady()
      return
    }

    markLoading()

    try {
      await ensureTurnstileScript()
    } catch {
      clearToken()
      markUnavailable()
      return
    }

    if (!renderTurnstile() && widgetId === null) {
      markUnavailable()
    }
  }

  function retry() {
    clearToken()

    if (widgetId && window.turnstile) {
      try {
        window.turnstile.remove(widgetId)
      } catch {
      }
    }

    widgetId = null
    if (container.value) {
      container.value.replaceChildren()
    }
    startLoading()
  }

  function reset() {
    clearToken()
    if (widgetId && window.turnstile) {
      try {
        window.turnstile.reset(widgetId)
        markReady()
      } catch {
        widgetId = null
        if (container.value) {
          container.value.replaceChildren()
          startLoading()
        }
      }
    } else if (isUnavailable.value) {
      retry()
    }
  }

  function execute() {
    if (widgetId !== null && window.turnstile) {
      window.turnstile.execute(widgetId)
      return
    }

    if (isUnavailable.value) {
      retry()
    }
  }

  onMounted(() => {
    void startLoading()
  })

  onUnmounted(() => {
    if (widgetId && window.turnstile) {
      try {
        window.turnstile.remove(widgetId)
      } catch {
      }
    }
    widgetId = null
  })

  return {
    container,
    isLoading,
    isUnavailable,
    reset,
    execute,
    retry,
  }
}
