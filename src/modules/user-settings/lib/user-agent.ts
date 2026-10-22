export interface ParsedUserAgent {
  browser: string | null
  os: string | null
}

// Order matters: Edge, Opera and friends also advertise "Chrome", and every
// WebKit browser advertises "Safari".
const BROWSER_RULES: ReadonlyArray<[RegExp, string]> = [
  [/\bMicroMessenger\b/i, "WeChat"],
  [/\bQQ\/|\bMQQBrowser\b/i, "QQ"],
  [/\bEdg(?:e|A|iOS)?\//, "Edge"],
  [/\bOPR\/|\bOpera\b/, "Opera"],
  [/\bSamsungBrowser\//, "Samsung Internet"],
  [/\bFirefox\/|\bFxiOS\//, "Firefox"],
  [/\bChrome\/|\bCriOS\//, "Chrome"],
  [/\bVersion\/[\d.]+.*\bSafari\//, "Safari"],
]

const OS_RULES: ReadonlyArray<[RegExp, string]> = [
  [/\b(?:iPhone|iPad|iPod)\b/, "iOS"],
  [/\bAndroid\b/, "Android"],
  [/\bHarmonyOS\b/i, "HarmonyOS"],
  [/\bWindows NT\b|\bWindows\b/, "Windows"],
  [/\bCrOS\b/, "ChromeOS"],
  [/\bMacintosh\b|\bMac OS X\b/, "macOS"],
  [/\bLinux\b/, "Linux"],
]

/** Browser and OS family from a User-Agent string; null for whatever is unknown. */
export function parseUserAgent(userAgent: string | null | undefined): ParsedUserAgent {
  const ua = userAgent?.trim() ?? ""
  if (!ua) return { browser: null, os: null }
  const browser = BROWSER_RULES.find(([pattern]) => pattern.test(ua))?.[1] ?? null
  const os = OS_RULES.find(([pattern]) => pattern.test(ua))?.[1] ?? null
  return { browser, os }
}

/**
 * "Chrome · macOS" style label for a session's device, or `fallback` when the
 * User-Agent is missing or unrecognised. The raw string never reaches the UI.
 */
export function describeUserAgent(userAgent: string | null | undefined, fallback: string): string {
  const { browser, os } = parseUserAgent(userAgent)
  const parts = [browser, os].filter((part): part is string => part !== null)
  return parts.length > 0 ? parts.join(" · ") : fallback
}
