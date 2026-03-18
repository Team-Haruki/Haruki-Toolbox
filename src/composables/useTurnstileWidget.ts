import { onMounted, onUnmounted, ref } from "vue"

interface UseTurnstileWidgetOptions {
  getSitekey?: () => string | undefined
  getCallback?: () => ((token: string) => void) | undefined
  getTheme?: () => string | undefined
  getSize?: () => string | undefined
  getAction?: () => string | undefined
  onVerify: (token: string) => void
  onInvalid: () => void
}

const TURNSTILE_POLL_INTERVAL_MS = 200
const TURNSTILE_POLL_TIMEOUT_MS = 10_000

export function useTurnstileWidget(options: UseTurnstileWidgetOptions) {
  const container = ref<HTMLDivElement | null>(null)
  const isLoading = ref(true)
  const isUnavailable = ref(false)
  let widgetId: string | null = null
  let interval: number | null = null

  function clearToken() {
    options.onInvalid()
  }

  function clearPoller() {
    if (interval !== null) {
      clearInterval(interval)
      interval = null
    }
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

  function startLoading() {
    if (!container.value) {
      markUnavailable()
      return
    }

    clearPoller()
    markLoading()

    if (window.turnstile) {
      renderTurnstile()
      return
    }

    const pollDeadline = Date.now() + TURNSTILE_POLL_TIMEOUT_MS
    interval = window.setInterval(() => {
      if (window.turnstile) {
        clearPoller()
        renderTurnstile()
        return
      }

      if (Date.now() >= pollDeadline) {
        clearPoller()
        markUnavailable()
      }
    }, TURNSTILE_POLL_INTERVAL_MS)
  }

  function retry() {
    clearToken()
    clearPoller()

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
    startLoading()
  })

  onUnmounted(() => {
    clearPoller()

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
