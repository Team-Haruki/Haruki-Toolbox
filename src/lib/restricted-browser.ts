/**
 * In-app browsers that break the toolbox: their web views block downloads,
 * popups, OAuth redirects and the clipboard, and the user has no address bar.
 * Each entry maps a user-agent marker to the app we name on the blocked page,
 * so the page can say "you opened this inside WeChat" instead of the vague
 * "unsupported browser" that users did not know how to act on.
 */
export type RestrictedBrowserApp = "wechat" | "qq" | "weibo" | "dingtalk" | "alipay" | "douyin" | "tiktok"

export type RestrictedBrowserPlatform = "ios" | "android" | "other"

const RESTRICTED_BROWSER_MARKERS: Array<[RestrictedBrowserApp, (ua: string) => boolean]> = [
  ["wechat", (ua) => ua.includes("micromessenger")],
  // Mobile QQ embeds QQBrowser's core (MQQBrowser) on Android and tags itself
  // "QQ/<version>" on iOS, also seen after a space in older builds.
  ["qq", (ua) => ua.includes("mqqbrowser") || ua.includes(" qq/") || ua.includes("qqtheme") || /\bqq\/[\d.]+/.test(ua)],
  ["weibo", (ua) => ua.includes("weibo")],
  ["dingtalk", (ua) => ua.includes("dingtalk")],
  ["alipay", (ua) => ua.includes("alipay")],
  ["douyin", (ua) => ua.includes("douyin")],
  ["tiktok", (ua) => ua.includes("tiktok")],
]

function normalizeUserAgent(userAgent?: string): string {
  return (userAgent ?? globalThis.navigator?.userAgent ?? "").toLowerCase()
}

/** The in-app browser the page is running in, or null in a regular browser. */
export function detectRestrictedBrowserApp(userAgent?: string): RestrictedBrowserApp | null {
  const uaLower = normalizeUserAgent(userAgent)
  return RESTRICTED_BROWSER_MARKERS.find(([, matches]) => matches(uaLower))?.[0] ?? null
}

export function isRestrictedBrowser(userAgent?: string): boolean {
  return detectRestrictedBrowserApp(userAgent) !== null
}

/**
 * Which system browser to point the user at. iPadOS Safari reports itself as
 * a Mac, but in-app web views on iPad keep "iPad" in the user agent, so this
 * is reliable in the only place it is used.
 */
export function detectRestrictedBrowserPlatform(userAgent?: string): RestrictedBrowserPlatform {
  const uaLower = normalizeUserAgent(userAgent)
  if (/iphone|ipad|ipod/.test(uaLower)) return "ios"
  if (uaLower.includes("android")) return "android"
  return "other"
}
