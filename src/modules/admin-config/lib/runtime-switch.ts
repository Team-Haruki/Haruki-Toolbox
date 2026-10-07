import type { RuntimeConfig } from "@/types/admin"

/**
 * Runtime switches: boolean members of the runtime configuration that the
 * page offers as toggles. Each is updated alone, with a payload that carries
 * only that member (the backend leaves omitted members unchanged).
 */
export const RUNTIME_SWITCH_KEYS = {
  /** Gate of the OAuth2 device authorization grant (RFC 8628). */
  oauth2DeviceFlow: "oauth2DeviceFlowEnabled",
} as const

export type RuntimeSwitchKey = (typeof RUNTIME_SWITCH_KEYS)[keyof typeof RUNTIME_SWITCH_KEYS]

/**
 * Whether a switch is on. Only an explicit `true` is: a missing member (a
 * backend that predates the switch, or a snapshot that lost it) reads as off,
 * which is also how the backend treats it, so the page never shows a gate as
 * open that the backend keeps closed.
 */
export function readRuntimeSwitch(config: RuntimeConfig | null | undefined, key: RuntimeSwitchKey): boolean {
  return config?.[key] === true
}

/** The PUT payload that sets one switch and nothing else. */
export function buildRuntimeSwitchPayload(key: RuntimeSwitchKey, enabled: boolean): RuntimeConfig {
  return { [key]: enabled }
}
