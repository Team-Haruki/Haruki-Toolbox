import { describe, expect, it } from "bun:test"
import {
  LOGIN_SUCCESS_QUERY_PARAM,
  buildAuthPageLink,
  buildFlowReturnTo,
  isAllowedFlowReturnTo,
  parseAllowedReturnToOrigins,
  resolveAuthPageRedirect,
  resolveBrowserOrigin,
  resolveRedirectFromFlowReturnTo,
  resolveSafeReturnPath,
} from "./return-to"

const ORIGIN = "https://haruki.seiunx.com"
const DEVICE_PATH = "/device?user_code=BCDF-GHJK"
const OAUTH_LOGIN_PATH = "/oauth2/login?login_challenge=abc123"
const OFF_ORIGIN_PATHS = [
  "https://evil.example/",
  "//evil.example/",
  "/\\evil.example",
  "/\\\\evil.example",
  "/\t/evil.example",
  "/\n/evil.example",
  "/..//evil.example",
  "javascript:alert(1)",
  "device",
]

describe("auth return_to helpers", () => {
  it("parses configured allowed origins", () => {
    expect(parseAllowedReturnToOrigins([
      "https://haruki-dev.seiunx.com",
    ])).toEqual([])

    expect(parseAllowedReturnToOrigins(
      "https://haruki-dev.seiunx.com, https://haruki-dev.seiunx.com/path bad-value ftp://example.com"
    )).toEqual(["https://haruki-dev.seiunx.com"])
  })

  it("allows configured frontend return_to origins", () => {
    expect(isAllowedFlowReturnTo(
      "https://haruki-dev.seiunx.com/user/settings",
      {
        currentOrigin: "https://haruki.seiunx.com",
        allowedOrigins: ["https://haruki-dev.seiunx.com"],
      }
    )).toBe(true)
  })

  it("allows nested Kratos flow URLs only when their return_to is allowed", () => {
    const kratosFlowUrl = "https://toolbox-auth.haruki.seiunx.com/self-service/login/browser"
    const safeReturnTo = `${kratosFlowUrl}?return_to=${encodeURIComponent("https://haruki-dev.seiunx.com/")}`
    const unsafeReturnTo = `${kratosFlowUrl}?return_to=${encodeURIComponent("https://evil.example/")}`
    const options = {
      currentOrigin: "https://haruki.seiunx.com",
      kratosOrigin: "https://toolbox-auth.haruki.seiunx.com",
      allowedOrigins: ["https://haruki-dev.seiunx.com"],
    }

    expect(isAllowedFlowReturnTo(safeReturnTo, options)).toBe(true)
    expect(isAllowedFlowReturnTo(unsafeReturnTo, options)).toBe(false)
  })

  describe("resolveSafeReturnPath", () => {
    it("keeps same-origin paths with their query", () => {
      expect(resolveSafeReturnPath(DEVICE_PATH)).toBe(DEVICE_PATH)
      expect(resolveSafeReturnPath(OAUTH_LOGIN_PATH)).toBe(OAUTH_LOGIN_PATH)
      expect(resolveSafeReturnPath("  /user/settings  ")).toBe("/user/settings")
    })

    it("rejects external, protocol-relative and parser-confusable targets", () => {
      for (const value of OFF_ORIGIN_PATHS) {
        expect(resolveSafeReturnPath(value)).toBeNull()
      }
    })

    it("rejects non-string values", () => {
      expect(resolveSafeReturnPath(undefined)).toBeNull()
      expect(resolveSafeReturnPath(null)).toBeNull()
      expect(resolveSafeReturnPath(["/user/settings"])).toBeNull()
    })
  })

  describe("buildFlowReturnTo", () => {
    it("resolves a safe redirect against the current origin", () => {
      const returnTo = buildFlowReturnTo(DEVICE_PATH, ORIGIN)
      expect(returnTo).toBe(`${ORIGIN}${DEVICE_PATH}`)
      const url = new URL(returnTo)
      expect(url.origin).toBe(ORIGIN)
      expect(url.searchParams.get("user_code")).toBe("BCDF-GHJK")
    })

    it("returns nothing for a missing or unsafe redirect without a fallback", () => {
      expect(buildFlowReturnTo(undefined, ORIGIN)).toBe("")
      for (const value of OFF_ORIGIN_PATHS) {
        expect(buildFlowReturnTo(value, ORIGIN)).toBe("")
      }
    })

    it("uses the fallback path and adds parameters (the sign-in shape)", () => {
      const options = { fallbackPath: "/", params: { [LOGIN_SUCCESS_QUERY_PARAM]: "1" } }
      expect(buildFlowReturnTo(undefined, ORIGIN, options)).toBe(`${ORIGIN}/?_login_success=1`)
      expect(buildFlowReturnTo("/\\evil.example", ORIGIN, options)).toBe(`${ORIGIN}/?_login_success=1`)
      expect(buildFlowReturnTo(OAUTH_LOGIN_PATH, ORIGIN, options))
        .toBe(`${ORIGIN}/oauth2/login?login_challenge=abc123&_login_success=1`)
    })

    it("never leaves the current origin", () => {
      for (const value of OFF_ORIGIN_PATHS) {
        const returnTo = buildFlowReturnTo(value, ORIGIN, { fallbackPath: "/" })
        expect(new URL(returnTo).origin).toBe(ORIGIN)
      }
    })

    it("falls back to the bare path without a usable origin", () => {
      expect(buildFlowReturnTo(DEVICE_PATH, "")).toBe(DEVICE_PATH)
    })
  })

  describe("resolveRedirectFromFlowReturnTo", () => {
    it("recovers the path, query and hash of a same-origin return_to", () => {
      expect(resolveRedirectFromFlowReturnTo(`${ORIGIN}${DEVICE_PATH}`, ORIGIN)).toBe(DEVICE_PATH)
      expect(resolveRedirectFromFlowReturnTo(`${ORIGIN}/user/settings#security`, ORIGIN)).toBe("/user/settings#security")
    })

    it("drops ignored marker parameters", () => {
      expect(resolveRedirectFromFlowReturnTo(
        `${ORIGIN}/oauth2/login?login_challenge=abc123&_login_success=1`,
        ORIGIN,
        [LOGIN_SUCCESS_QUERY_PARAM]
      )).toBe(OAUTH_LOGIN_PATH)
      expect(resolveRedirectFromFlowReturnTo(`${ORIGIN}/?_login_success=1`, ORIGIN, [LOGIN_SUCCESS_QUERY_PARAM])).toBe("/")
    })

    it("rejects other origins, empty values and protocol-relative paths", () => {
      expect(resolveRedirectFromFlowReturnTo("https://evil.example/device", ORIGIN)).toBeNull()
      expect(resolveRedirectFromFlowReturnTo("https://haruki-dev.seiunx.com/device", ORIGIN)).toBeNull()
      expect(resolveRedirectFromFlowReturnTo("", ORIGIN)).toBeNull()
      expect(resolveRedirectFromFlowReturnTo(`${ORIGIN}//evil.example/`, ORIGIN)).toBeNull()
      expect(resolveRedirectFromFlowReturnTo(`${ORIGIN}/device`, "")).toBeNull()
    })
  })

  describe("resolveAuthPageRedirect", () => {
    it("prefers the page's own safe redirect", () => {
      expect(resolveAuthPageRedirect(DEVICE_PATH, `${ORIGIN}/user/settings`, ORIGIN)).toBe(DEVICE_PATH)
    })

    it("falls back to the loaded flow's return_to without the sign-in marker", () => {
      expect(resolveAuthPageRedirect(undefined, `${ORIGIN}${DEVICE_PATH}&_login_success=1`, ORIGIN)).toBe(DEVICE_PATH)
      expect(resolveAuthPageRedirect("https://evil.example/", `${ORIGIN}${DEVICE_PATH}`, ORIGIN)).toBe(DEVICE_PATH)
    })

    it("returns null when neither source is safe", () => {
      expect(resolveAuthPageRedirect("//evil.example", "https://evil.example/device", ORIGIN)).toBeNull()
      expect(resolveAuthPageRedirect(undefined, "", ORIGIN)).toBeNull()
    })

    it("does not forward the app root, the sign-in page's own fallback", () => {
      // A sign-in page opened without a target loads a flow returning to <origin>/?_login_success=1.
      expect(resolveAuthPageRedirect(undefined, `${ORIGIN}/?_login_success=1`, ORIGIN)).toBeNull()
      expect(resolveAuthPageRedirect(undefined, `${ORIGIN}/`, ORIGIN)).toBeNull()
      expect(resolveAuthPageRedirect("/", "", ORIGIN)).toBeNull()
      // Anything more specific still goes through.
      expect(resolveAuthPageRedirect(undefined, `${ORIGIN}/?tab=events&_login_success=1`, ORIGIN)).toBe("/?tab=events")
      expect(resolveAuthPageRedirect("/user/settings", "", ORIGIN)).toBe("/user/settings")
    })
  })

  describe("buildAuthPageLink", () => {
    it("carries the redirect only when there is one", () => {
      expect(buildAuthPageLink("/user/register", DEVICE_PATH)).toEqual({
        path: "/user/register",
        query: { redirect: DEVICE_PATH },
      })
      expect(buildAuthPageLink("/user/register", null)).toEqual({ path: "/user/register", query: {} })
    })
  })

  it("resolves no browser origin outside a browser", () => {
    expect(resolveBrowserOrigin()).toBe("")
  })
})
