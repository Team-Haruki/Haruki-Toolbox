import { describe, expect, it } from "bun:test"
import { resolveI18nBundlesForPath } from "@/shared/i18n/bundles"

describe("resolveI18nBundlesForPath", () => {
  it("loads the oauth namespace for the device verification page", () => {
    expect(resolveI18nBundlesForPath("/device")).toEqual(["user-settings"])
    expect(resolveI18nBundlesForPath("/device/done")).toEqual(["user-settings"])
    expect(resolveI18nBundlesForPath("/device?user_code=BCDF-GHJK")).toEqual(["user-settings"])
  })

  it("keeps the other OAuth browser-flow pages on the same bundle", () => {
    expect(resolveI18nBundlesForPath("/oauth2/login")).toEqual(["user-settings"])
    expect(resolveI18nBundlesForPath("/oauth2/consent")).toEqual(["user-settings"])
    expect(resolveI18nBundlesForPath("/logout")).toEqual(["user-settings"])
    expect(resolveI18nBundlesForPath("/user/oauth-authorizations")).toEqual(["user-settings"])
  })

  it("matches whole path segments only", () => {
    expect(resolveI18nBundlesForPath("/devices")).toEqual([])
    expect(resolveI18nBundlesForPath("/")).toEqual([])
  })

  it("merges the bundles of overlapping rules", () => {
    expect(resolveI18nBundlesForPath("/admin/oauth-clients")).toEqual(["admin", "tickets", "tools", "user-settings"])
    expect(resolveI18nBundlesForPath("/cards/123")).toEqual(["catalog"])
  })
})
