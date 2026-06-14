import { describe, expect, it } from "bun:test"
import { isRestrictedBrowser } from "@/lib/restricted-browser"

describe("restricted browser detection", () => {
  it("detects mobile QQ embedded webview", () => {
    expect(isRestrictedBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 QQ/9.3.0.612 V1_IPH_SQ_9.3.0_1_APP_A Pixel/1179 MiniAppEnable SimpleUISwitch/1 StudyMode/0 CurrentMode/1 CurrentFontScale/1.000000 QQTheme/2971 AppId/537359287 Core/WKWebView Device/Apple(iPhone X) NetType/WIFI QQExt/0 QBWebViewType/1 WKType/1")).toBe(true)
  })

  it("detects WeChat embedded browser", () => {
    expect(isRestrictedBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a2f) NetType/WIFI Language/zh_HK")).toBe(true)
  })

  it("detects other restricted in-app browser markers", () => {
    expect(isRestrictedBrowser("Mozilla/5.0 MQQBrowser/15.0")).toBe(true)
    expect(isRestrictedBrowser("Mozilla/5.0 Weibo")).toBe(true)
    expect(isRestrictedBrowser("Mozilla/5.0 DingTalk")).toBe(true)
    expect(isRestrictedBrowser("Mozilla/5.0 AlipayClient")).toBe(true)
    expect(isRestrictedBrowser("Mozilla/5.0 aweme Douyin")).toBe(true)
    expect(isRestrictedBrowser("Mozilla/5.0 TikTok")).toBe(true)
  })

  it("allows ordinary mobile browsers", () => {
    expect(isRestrictedBrowser("Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1")).toBe(false)
    expect(isRestrictedBrowser("Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36")).toBe(false)
  })
})
