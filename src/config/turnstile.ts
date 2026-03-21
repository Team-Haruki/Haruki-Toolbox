export function isEnvFlagEnabled(value: string | null | undefined): boolean {
  return value?.trim().toLowerCase() === "true"
}

export function isCloudflareTurnstileEnabled(): boolean {
  return isEnvFlagEnabled(
    import.meta.env.ENABLE_CLOUDFLARE_TURNSTILE
      ?? import.meta.env.VITE_ENABLE_CLOUDFLARE_TURNSTILE
  )
}

export const CLOUDFLARE_TURNSTILE_ENABLED = isCloudflareTurnstileEnabled()
