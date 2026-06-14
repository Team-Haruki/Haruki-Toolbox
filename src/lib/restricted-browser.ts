export function isRestrictedBrowser(userAgent?: string): boolean {
  const uaLower = (userAgent ?? globalThis.navigator?.userAgent ?? "").toLowerCase()

  return (
    uaLower.includes("micromessenger") ||
    uaLower.includes("mqqbrowser") ||
    uaLower.includes(" qq/") ||
    uaLower.includes("qqtheme") ||
    /\bqq\/[\d.]+/.test(uaLower) ||
    uaLower.includes("weibo") ||
    uaLower.includes("dingtalk") ||
    uaLower.includes("alipay") ||
    uaLower.includes("douyin") ||
    uaLower.includes("tiktok")
  )
}
