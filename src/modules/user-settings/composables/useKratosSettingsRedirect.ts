import { ref } from "vue"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { buildKratosUrl, redirectToKratosBrowserFlow } from "@/modules/auth/lib/kratos"

export type KratosRedirectStatus = "idle" | "probing" | "redirecting" | "unreachable"

const PROBE_TIMEOUT_MS = 6000

/**
 * Reachability probe for the identity service. `no-cors` keeps it free of
 * CORS requirements: an opaque response means the host answered, a TypeError
 * means it did not (DNS failure, blocked host, offline). A timeout counts as
 * unreachable too.
 */
async function probeKratos(): Promise<void> {
  await fetch(buildKratosUrl("/health/alive"), {
    mode: "no-cors",
    cache: "no-store",
    credentials: "omit",
    signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
  })
}

/**
 * Leaving the toolbox for the Kratos settings page, with a visible step in
 * between: the page says where it is going and why, probes the identity host
 * first, and shows an inline load error with a retry instead of the browser's
 * own error page when the host cannot be reached.
 */
export function useKratosSettingsRedirect() {
  const status = ref<KratosRedirectStatus>("idle")
  const error = ref<ErrorDescription | null>(null)
  let pendingReturnTo = ""

  async function start(returnTo: string) {
    pendingReturnTo = returnTo
    status.value = "probing"
    error.value = null
    try {
      await probeKratos()
    } catch (err: unknown) {
      status.value = "unreachable"
      error.value = describeError(err)
      return
    }
    status.value = "redirecting"
    redirectToKratosBrowserFlow("settings", returnTo ? { returnTo } : {})
  }

  function retry() {
    void start(pendingReturnTo)
  }

  return { status, error, start, retry }
}
