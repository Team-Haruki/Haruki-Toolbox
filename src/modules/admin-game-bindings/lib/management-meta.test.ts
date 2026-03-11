import { describe, expect, it } from "bun:test"
import {
  parseBindingKey,
  resolveServerLabel,
  toBindingKey,
} from "@/modules/admin-game-bindings/lib/management-meta"

const TEST_TRANSLATIONS: Record<string, string> = {
  "userSettings.gameBinding.region.jp": "JP",
}

function t(key: string) {
  return TEST_TRANSLATIONS[key] ?? key
}

describe("game binding management meta", () => {
  it("toBindingKey and parseBindingKey round-trip", () => {
    const key = toBindingKey({ server: "jp", gameUserId: "123456" })
    expect(key).toBe("jp:123456")
    expect(parseBindingKey(key)).toEqual({ server: "jp", gameUserId: "123456" })
  })

  it("parseBindingKey returns null for invalid keys", () => {
    expect(parseBindingKey("invalid")).toBeNull()
    expect(parseBindingKey("unknown:123")).toBeNull()
    expect(parseBindingKey("jp:")).toBeNull()
  })

  it("resolveServerLabel returns localized label or fallback", () => {
    expect(resolveServerLabel("jp", t)).toBe("JP")
    expect(resolveServerLabel("unknown", t)).toBe("unknown")
  })
})
