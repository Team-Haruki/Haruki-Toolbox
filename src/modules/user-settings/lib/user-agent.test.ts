import { describe, expect, it } from "bun:test"
import { describeUserAgent, parseUserAgent } from "./user-agent"

const CHROME_MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
const SAFARI_IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
const EDGE_WIN = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0"
const FIREFOX_LINUX = "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0"
const WECHAT_ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.0.0 Mobile Safari/537.36 MicroMessenger/8.0.47"

describe("parseUserAgent", () => {
  it("recognises the common desktop and mobile browsers", () => {
    expect(parseUserAgent(CHROME_MAC)).toEqual({ browser: "Chrome", os: "macOS" })
    expect(parseUserAgent(SAFARI_IOS)).toEqual({ browser: "Safari", os: "iOS" })
    expect(parseUserAgent(EDGE_WIN)).toEqual({ browser: "Edge", os: "Windows" })
    expect(parseUserAgent(FIREFOX_LINUX)).toEqual({ browser: "Firefox", os: "Linux" })
    expect(parseUserAgent(WECHAT_ANDROID)).toEqual({ browser: "WeChat", os: "Android" })
  })

  it("returns nulls for empty or unknown strings", () => {
    expect(parseUserAgent("")).toEqual({ browser: null, os: null })
    expect(parseUserAgent(undefined)).toEqual({ browser: null, os: null })
    expect(parseUserAgent("curl/8.4.0")).toEqual({ browser: null, os: null })
  })
})

describe("describeUserAgent", () => {
  it("joins browser and OS with a middle dot", () => {
    expect(describeUserAgent(CHROME_MAC, "unknown")).toBe("Chrome · macOS")
  })

  it("shows the known half alone", () => {
    expect(describeUserAgent("Mozilla/5.0 (Windows NT 10.0) Gecko", "unknown")).toBe("Windows")
  })

  it("falls back when nothing is recognised", () => {
    expect(describeUserAgent("curl/8.4.0", "unknown")).toBe("unknown")
    expect(describeUserAgent(null, "unknown")).toBe("unknown")
  })
})
