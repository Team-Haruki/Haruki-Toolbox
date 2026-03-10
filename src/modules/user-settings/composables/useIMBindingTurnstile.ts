import { ref } from "vue"

export type TurnstileInstance = {
  execute?: () => void
  reset?: () => void
}

export function useIMBindingTurnstile() {
  const turnstileToken = ref<string | null>(null)
  const turnstileRef = ref<TurnstileInstance | null>(null)

  function onTurnstileVerify(token: string) {
    turnstileToken.value = token
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
    turnstileRef,
    onTurnstileVerify,
    resetTurnstileState,
    triggerTurnstile,
  }
}
