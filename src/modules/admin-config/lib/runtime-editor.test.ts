import { describe, expect, it } from "bun:test"
import { formatRuntimeEditorJson, toRuntimeEditorDocument } from "./runtime-editor"

const REPORTED = {
  publicApiAllowedKeys: ["userCards", "userDecks"],
  privateApiTokenConfigured: true,
  privateApiUserAgent: "HarukiBot",
  webhookJwtSecretConfigured: true,
  webhookEnabled: true,
  oauth2DeviceFlowEnabled: false,
}

describe("toRuntimeEditorDocument", () => {
  it("leaves the allowlist out: it has its own editor, and sending it back empties the game-data cache", () => {
    const document = toRuntimeEditorDocument(REPORTED)
    expect("publicApiAllowedKeys" in document).toBe(false)
    expect(document).toEqual({
      privateApiTokenConfigured: true,
      privateApiUserAgent: "HarukiBot",
      webhookJwtSecretConfigured: true,
      webhookEnabled: true,
      oauth2DeviceFlowEnabled: false,
    })
  })

  it("does not change the configuration it was given", () => {
    const config = { ...REPORTED }
    toRuntimeEditorDocument(config)
    expect(config.publicApiAllowedKeys).toEqual(["userCards", "userDecks"])
  })

  it("reads a missing configuration as empty", () => {
    expect(toRuntimeEditorDocument(null)).toEqual({})
    expect(toRuntimeEditorDocument(undefined)).toEqual({})
    expect(toRuntimeEditorDocument({})).toEqual({})
  })
})

describe("formatRuntimeEditorJson", () => {
  it("is the same text whatever the allowlist holds", () => {
    const text = formatRuntimeEditorJson(REPORTED)
    expect(text).toBe(formatRuntimeEditorJson({ ...REPORTED, publicApiAllowedKeys: [] }))
    expect(text).not.toContain("publicApiAllowedKeys")
    expect(JSON.parse(text)).toEqual(toRuntimeEditorDocument(REPORTED))
    expect(text.startsWith("{\n  \"")).toBe(true)
  })
})
