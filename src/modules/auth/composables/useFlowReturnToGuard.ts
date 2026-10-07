import { ref, watch, type Ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { getKratosPublicUrl } from "@/modules/auth/lib/kratos"
import { createAllowedReturnToOrigins, isAllowedFlowReturnTo } from "@/modules/auth/lib/return-to"

interface GuardedFlow {
  loading: Readonly<Ref<boolean>>
  loadError: Readonly<Ref<string>>
  flowReturnTo: Readonly<Ref<string>>
  restartFlow: () => void
}

interface FlowReturnToGuardMessages {
  titleKey: string
  descriptionKey: string
}

function resolveKratosOrigin(): string {
  if (typeof window === "undefined") {
    return ""
  }

  try {
    return new URL(getKratosPublicUrl(), window.location.origin).origin
  } catch {
    return ""
  }
}

function isAllowedBrowserFlowReturnTo(value: string): boolean {
  if (typeof window === "undefined") {
    return false
  }

  return isAllowedFlowReturnTo(value, {
    currentOrigin: window.location.origin,
    kratosOrigin: resolveKratosOrigin(),
    allowedOrigins: createAllowedReturnToOrigins(window.location.origin),
  })
}

/**
 * Restarts a Kratos browser flow once, with a warning toast, when the loaded
 * flow carries a `return_to` outside the allowed origins (for example a flow id
 * someone else created and shared).
 */
export function useFlowReturnToGuard(flow: GuardedFlow, messages: FlowReturnToGuardMessages) {
  const { t } = useI18n()
  const hasForcedSafeReturnTo = ref(false)

  watch(
    [flow.loading, flow.loadError, flow.flowReturnTo],
    ([isLoading, error, returnTo]) => {
      if (isLoading || error || hasForcedSafeReturnTo.value) {
        return
      }

      const normalizedReturnTo = returnTo.trim()
      if (!normalizedReturnTo) {
        return
      }

      if (isAllowedBrowserFlowReturnTo(normalizedReturnTo)) {
        return
      }

      hasForcedSafeReturnTo.value = true
      toast.warning(t(messages.titleKey), {
        description: t(messages.descriptionKey),
      })
      flow.restartFlow()
    },
    { immediate: true }
  )
}
