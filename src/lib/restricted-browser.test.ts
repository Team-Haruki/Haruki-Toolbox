import { describe, expect, it } from "bun:test"
import { detectRestrictedBrowserApp, detectRestrictedBrowserPlatform, isRestrictedBrowser } from "@/lib/restricted-browser"

const QQ_IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 QQ/9.3.0.612 V1_IPH_SQ_9.3.0_1_APP_A Pixel/1179 MiniAppEnable SimpleUISwitch/1 StudyMode/0 CurrentMode/1 CurrentFontScale/1.000000 QQTheme/2971 AppId/537359287 Core/WKWebView Device/Apple(iPhone X) NetType/WIFI QQExt/0 QBWebViewType/1 WKType/1"
const WECHAT_IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.74(0x18004a2f) NetType/WIFI Language/zh_HK"
const WECHAT_ANDROID = "Mozilla/5.0 (Linux; Android 15; 2211133C Build/AQ3A.240912.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/134.0.0.0 Mobile Safari/537.36 XWEB/1340129 MMWEBSDK/20250201 MMWEBID/1234 MicroMessenger/8.0.56.2800(0x28003855) WeChat/arm64 Weixin NetType/WIFI Language/zh_CN ABI/arm64"
const SAFARI_IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1"
const CHROME_ANDROID = "Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36"

describe("restricted browser detection", () => {
  it("detects mobile QQ embedded webview", () => {
    expect(isRestrictedBrowser(QQ_IOS)).toBe(true)
    expect(detectRestrictedBrowserApp(QQ_IOS)).toBe("qq")
  })

  it("detects WeChat embedded browser", () => {
    expect(isRestrictedBrowser(WECHAT_IOS)).toBe(true)
    expect(detectRestrictedBrowserApp(WECHAT_IOS)).toBe("wechat")
    expect(detectRestrictedBrowserApp(WECHAT_ANDROID)).toBe("wechat")
  })

  it("names other restricted in-app browsers", () => {
    expect(detectRestrictedBrowserApp("Mozilla/5.0 MQQBrowser/15.0")).toBe("qq")
    expect(detectRestrictedBrowserApp("Mozilla/5.0 Weibo")).toBe("weibo")
    expect(detectRestrictedBrowserApp("Mozilla/5.0 DingTalk")).toBe("dingtalk")
    expect(detectRestrictedBrowserApp("Mozilla/5.0 AlipayClient")).toBe("alipay")
    expect(detectRestrictedBrowserApp("Mozilla/5.0 aweme Douyin")).toBe("douyin")
    expect(detectRestrictedBrowserApp("Mozilla/5.0 TikTok")).toBe("tiktok")
  })

  it("allows ordinary mobile browsers", () => {
    expect(isRestrictedBrowser(SAFARI_IOS)).toBe(false)
    expect(detectRestrictedBrowserApp(SAFARI_IOS)).toBeNull()
    expect(isRestrictedBrowser(CHROME_ANDROID)).toBe(false)
  })

  it("tells iOS from Android so the page can name the right browser", () => {
    expect(detectRestrictedBrowserPlatform(WECHAT_IOS)).toBe("ios")
    expect(detectRestrictedBrowserPlatform("Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) MicroMessenger/8.0")).toBe("ios")
    expect(detectRestrictedBrowserPlatform(WECHAT_ANDROID)).toBe("android")
    expect(detectRestrictedBrowserPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64) MicroMessenger/7.0 WindowsWechat")).toBe("other")
  })
})
