import { describe, expect, it } from "bun:test"
import { RUNTIME_SECRET_KEYS, RUNTIME_TEXT_KEYS, readRuntimeFlag, readRuntimeText, summarizeRuntimeSecrets } from "./runtime-facts"

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
    expect(readRuntimeText({ privateApiUserAgent: " HarukiBot/3 " }, "privateApiUserAgent")).toBe("HarukiBot/3")
    expect(readRuntimeText({ privateApiUserAgent: "" }, "privateApiUserAgent")).toBe("")
    expect(readRuntimeText({ privateApiUserAgent: 3 }, "privateApiUserAgent")).toBeNull()
    expect(readRuntimeText(undefined, "privateApiUserAgent")).toBeNull()
  })
})

describe("summarizeRuntimeSecrets", () => {
  it("counts the set secrets among the reported ones", () => {
    expect(summarizeRuntimeSecrets({
      privateApiTokenConfigured: true,
      webhookJwtSecretConfigured: false,
    })).toEqual({ configured: 1, known: 2 })
    expect(summarizeRuntimeSecrets({
      privateApiTokenConfigured: true,
      webhookJwtSecretConfigured: true,
    })).toEqual({ configured: 2, known: 2 })
  })

  it("does not count what the backend no longer reports", () => {
    // The HarukiProxy shared key went with shared-key uploads (backend 9.3.0).
    expect(summarizeRuntimeSecrets({
      privateApiTokenConfigured: true,
      harukiProxySecretConfigured: true,
      harukiProxyUnpackKeyConfigured: true,
    })).toEqual({ configured: 1, known: 1 })
    expect(RUNTIME_SECRET_KEYS).toEqual(["privateApiTokenConfigured", "webhookJwtSecretConfigured"])
    expect(RUNTIME_TEXT_KEYS).toEqual(["privateApiUserAgent"])
  })

  it("leaves out secrets the backend does not report", () => {
    expect(summarizeRuntimeSecrets({ privateApiTokenConfigured: true })).toEqual({ configured: 1, known: 1 })
    expect(summarizeRuntimeSecrets({})).toEqual({ configured: 0, known: 0 })
    expect(summarizeRuntimeSecrets(null)).toEqual({ configured: 0, known: 0 })
  })
})
