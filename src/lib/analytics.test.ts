import { describe, expect, it } from "bun:test"
import { GA_MEASUREMENT_ID, configureAnalytics, sanitizeAnalyticsLocation } from "@/lib/analytics"

const ORIGIN = "https://haruki.seiunx.com"

describe("sanitizeAnalyticsLocation", () => {
  it("drops the device user code", () => {
    expect(sanitizeAnalyticsLocation(`${ORIGIN}/device?user_code=BCDF-GHJK`)).toBe(`${ORIGIN}/device`)
  })

  it("drops every Hydra challenge but keeps other parameters", () => {
    expect(sanitizeAnalyticsLocation(`${ORIGIN}/device?device_challenge=x&user_code=BCDF-GHJK&lang=en`)).toBe(`${ORIGIN}/device?lang=en`)
    expect(sanitizeAnalyticsLocation(`${ORIGIN}/oauth2/login?login_challenge=abc`)).toBe(`${ORIGIN}/oauth2/login`)
    expect(sanitizeAnalyticsLocation(`${ORIGIN}/oauth2/consent?consent_challenge=abc`)).toBe(`${ORIGIN}/oauth2/consent`)
    expect(sanitizeAnalyticsLocation(`${ORIGIN}/logout?logout_challenge=abc`)).toBe(`${ORIGIN}/logout`)
  })

  it("cleans the code out of a login redirect target", () => {
    const href = `${ORIGIN}/user/login?redirect=${encodeURIComponent("/device?user_code=BCDF-GHJK")}`
    const sanitized = new URL(sanitizeAnalyticsLocation(href))
    expect(sanitized.pathname).toBe("/user/login")
    expect(sanitized.searchParams.get("redirect")).toBe("/device")
  })

  it("cleans an absolute return_to", () => {
    const returnTo = `${ORIGIN}/oauth2/login?login_challenge=abc&x=1`
    const sanitized = new URL(sanitizeAnalyticsLocation(`${ORIGIN}/user/register?return_to=${encodeURIComponent(returnTo)}`))
    expect(sanitized.searchParams.get("return_to")).toBe(`${ORIGIN}/oauth2/login?x=1`)
  })

  it("leaves ordinary addresses untouched", () => {
    const href = `${ORIGIN}/cards?page=2&sort=id%20desc`
    expect(sanitizeAnalyticsLocation(href)).toBe(href)
    const login = `${ORIGIN}/user/login?redirect=${encodeURIComponent("/cards?page=2")}`
    expect(sanitizeAnalyticsLocation(login)).toBe(login)
    expect(sanitizeAnalyticsLocation("not a url")).toBe("not a url")
  })
})

describe("configureAnalytics", () => {
  function fakeWindow(href: string, calls: unknown[][]) {
    return { location: { href }, gtag: (...args: unknown[]) => calls.push(args) } as unknown as Window
  }

  it("reports a sanitized page_location for a device link", () => {
    const calls: unknown[][] = []
    configureAnalytics(fakeWindow(`${ORIGIN}/device?user_code=BCDF-GHJK`, calls))
    expect(calls).toEqual([["config", GA_MEASUREMENT_ID, { page_location: `${ORIGIN}/device` }]])
  })

  it("keeps gtag's default page_location elsewhere", () => {
    const calls: unknown[][] = []
    configureAnalytics(fakeWindow(`${ORIGIN}/cards`, calls))
    expect(calls).toEqual([["config", GA_MEASUREMENT_ID]])
  })

  it("does nothing without gtag", () => {
    expect(() => configureAnalytics({ location: { href: ORIGIN } } as unknown as Window)).not.toThrow()
  })
})
