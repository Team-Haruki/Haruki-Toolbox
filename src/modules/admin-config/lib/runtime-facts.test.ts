import { describe, expect, it } from "bun:test"
import { readRuntimeFlag, readRuntimeText, summarizeRuntimeSecrets } from "./runtime-facts"

describe("readRuntimeFlag", () => {
  it("reads a boolean and treats anything else as unknown", () => {
    expect(readRuntimeFlag({ webhookEnabled: true }, "webhookEnabled")).toBe(true)
    expect(readRuntimeFlag({ webhookEnabled: false }, "webhookEnabled")).toBe(false)
    expect(readRuntimeFlag({ webhookEnabled: "true" }, "webhookEnabled")).toBeNull()
    expect(readRuntimeFlag({}, "webhookEnabled")).toBeNull()
    expect(readRuntimeFlag(null, "webhookEnabled")).toBeNull()
  })
})

describe("readRuntimeText", () => {
  it("trims text and keeps an empty value apart from a missing one", () => {
    expect(readRuntimeText({ harukiProxyVersion: " v3.2.0 " }, "harukiProxyVersion")).toBe("v3.2.0")
    expect(readRuntimeText({ harukiProxyVersion: "" }, "harukiProxyVersion")).toBe("")
    expect(readRuntimeText({ harukiProxyVersion: 3 }, "harukiProxyVersion")).toBeNull()
    expect(readRuntimeText(undefined, "harukiProxyVersion")).toBeNull()
  })
})

describe("summarizeRuntimeSecrets", () => {
  it("counts the set secrets among the reported ones", () => {
    expect(summarizeRuntimeSecrets({
      privateApiTokenConfigured: true,
      harukiProxySecretConfigured: true,
      harukiProxyUnpackKeyConfigured: false,
      webhookJwtSecretConfigured: true,
    })).toEqual({ configured: 3, known: 4 })
  })

  it("leaves out secrets an older backend does not report", () => {
    expect(summarizeRuntimeSecrets({ privateApiTokenConfigured: true })).toEqual({ configured: 1, known: 1 })
    expect(summarizeRuntimeSecrets({})).toEqual({ configured: 0, known: 0 })
    expect(summarizeRuntimeSecrets(null)).toEqual({ configured: 0, known: 0 })
  })
})
