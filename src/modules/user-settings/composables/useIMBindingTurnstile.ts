import { ref, useTemplateRef } from "vue"

export type TurnstileInstance = {
  execute?: () => void
  reset?: () => void
}

export function useIMBindingTurnstile() {
  const turnstileToken = ref<string | null>(null)
  // Bound to the view's `ref="turnstileRef"` widget.
  const turnstileRef = useTemplateRef<TurnstileInstance>("turnstileRef")

  function onTurnstileVerify(token: string) {
    turnstileToken.value = token
  }

  function onTurnstileInvalid() {
    turnstileToken.value = null
  }

  function resetTurnstileState() {
    try {
      turnstileRef.value?.reset?.()
    } catch {
    }
    turnstileToken.value = null
  }

  function triggerTurnstile() {
    try {
      turnstileRef.value?.execute?.()
    } catch {
    }
  }

  return {
    turnstileToken,
    onTurnstileVerify,
    onTurnstileInvalid,
    resetTurnstileState,
    triggerTurnstile,
  }
}
