import { describe, expect, it } from "bun:test"
import {
  buildDevicePageTarget,
  foldDeviceUserCode,
  formatCountdown,
  formatDeviceUserCode,
  formatDeviceUserCodeInput,
  isFramedWindow,
  isInAppBrowser,
  normalizeDeviceUserCode,
  readUserCodeQuery,
  resolveApproveLabel,
  sanitizeDeviceLabel,
  secondsUntil,
} from "@/modules/user-settings/lib/device-code"

describe("device user code normalisation", () => {
  it("folds case, separators and whitespace like the backend", () => {
    expect(normalizeDeviceUserCode("bcdf-ghjk")).toBe("BCDFGHJK")
    expect(normalizeDeviceUserCode("  BCDF GHJK  ")).toBe("BCDFGHJK")
    expect(normalizeDeviceUserCode("bc.df_gh-jk")).toBe("BCDFGHJK")
    // Unicode hyphens / dashes, minus sign and the katakana long vowel mark.
    expect(normalizeDeviceUserCode("BCDF‐GHJK")).toBe("BCDFGHJK")
    expect(normalizeDeviceUserCode("BCDF―GHJK")).toBe("BCDFGHJK")
    expect(normalizeDeviceUserCode("BCDF−GHJK")).toBe("BCDFGHJK")
    expect(normalizeDeviceUserCode("BCDFーGHJK")).toBe("BCDFGHJK")
  })

  it("folds full-width letters, digits, hyphen and the ideographic space", () => {
    expect(normalizeDeviceUserCode("ｂｃｄｆ－ｇｈｊｋ")).toBe("BCDFGHJK")
    expect(normalizeDeviceUserCode("ＢＣＤＦ　ＧＨＪＫ")).toBe("BCDFGHJK")
    expect(foldDeviceUserCode("１２３")).toBe("123")
  })

  it("only checks the shape; the alphabet belongs to the server", () => {
    // Vowels are not in the production alphabet, but the shape check passes them.
    expect(normalizeDeviceUserCode("AEIOUAEI")).toBe("AEIOUAEI")
    expect(normalizeDeviceUserCode("ABC123")).toBe("ABC123")
    expect(normalizeDeviceUserCode("ABCDEFGHJKLM")).toBe("ABCDEFGHJKLM")
  })

  it("rejects codes of the wrong shape (malformed_code)", () => {
    expect(normalizeDeviceUserCode("")).toBeNull()
    expect(normalizeDeviceUserCode("ABCDE")).toBeNull()
    expect(normalizeDeviceUserCode("ABCDEFGHJKLMN")).toBeNull()
    expect(normalizeDeviceUserCode("BCDF/GHJK")).toBeNull()
    expect(normalizeDeviceUserCode("ÄBCDFGHJ")).toBeNull()
    // Lower-case non-ASCII letters are not upper-cased into ASCII.
    expect(normalizeDeviceUserCode("ıbcdfghj")).toBeNull()
  })

  it("formats in groups of four", () => {
    expect(formatDeviceUserCode("BCDFGHJK")).toBe("BCDF-GHJK")
    expect(formatDeviceUserCode("ABC123")).toBe("ABC1-23")
    expect(formatDeviceUserCode("")).toBe("")
  })

  it("formats what people type or paste into the input", () => {
    expect(formatDeviceUserCodeInput("bcdf")).toBe("BCDF")
    expect(formatDeviceUserCodeInput("bcdfg")).toBe("BCDF-G")
    expect(formatDeviceUserCodeInput("BCDF-")).toBe("BCDF")
    expect(formatDeviceUserCodeInput("code: bcdf ghjk!")).toBe("CODE-BCDF-GHJK")
    expect(formatDeviceUserCodeInput("ABCDEFGHJKLMNPQ")).toBe("ABCD-EFGH-JKLM")
  })

  it("reads ?user_code= only when it is a single string", () => {
    expect(readUserCodeQuery("bcdf-ghjk")).toBe("BCDF-GHJK")
    expect(readUserCodeQuery(["BCDFGHJK", "XXXXXXXX"])).toBe("")
    expect(readUserCodeQuery(undefined)).toBe("")
    expect(readUserCodeQuery("<script>")).toBe("SCRI-PT")
  })

  it("builds the login return target with the code", () => {
    expect(buildDevicePageTarget("bcdfghjk")).toBe("/device?user_code=BCDF-GHJK")
    expect(buildDevicePageTarget("")).toBe("/device")
    expect(buildDevicePageTarget("--")).toBe("/device")
  })
})

describe("device labels", () => {
  it("sanitizes like the backend", () => {
    expect(sanitizeDeviceLabel("  home   server  ")).toBe("home server")
    expect(sanitizeDeviceLabel("a\u200Bb\u202Ec\u2066d")).toBe("abcd")
    expect(sanitizeDeviceLabel("line\nbreak\ttab")).toBe("linebreaktab")
    expect(sanitizeDeviceLabel("\u200B\u200F")).toBe("")
    const long = "家".repeat(70)
    expect(Array.from(sanitizeDeviceLabel(long))).toHaveLength(64)
    // Code points, not UTF-16 units.
    expect(Array.from(sanitizeDeviceLabel("😀".repeat(70)))).toHaveLength(64)
  })

  it("sends a label only when it is set and differs from the device's own", () => {
    expect(resolveApproveLabel("", "Haruki-Client @ home")).toBeUndefined()
    expect(resolveApproveLabel("   ", "Haruki-Client @ home")).toBeUndefined()
    expect(resolveApproveLabel("Haruki-Client  @ home ", "Haruki-Client @ home")).toBeUndefined()
    expect(resolveApproveLabel("My NAS", "Haruki-Client @ home")).toBe("My NAS")
    expect(resolveApproveLabel("My NAS", "")).toBe("My NAS")
    expect(resolveApproveLabel("\u200B", "")).toBeUndefined()
  })
})

describe("browser context", () => {
  it("detects in-app browsers", () => {
    expect(isInAppBrowser("Mozilla/5.0 (iPhone) Mobile/15E148 MicroMessenger/8.0.74")).toBe(true)
    expect(isInAppBrowser("Mozilla/5.0 (iPhone) Mobile/15E148 QQ/9.3.0.612")).toBe(true)
    expect(isInAppBrowser("Mozilla/5.0 (Linux; Android 16) Telegram-Android/11.0")).toBe(true)
    expect(isInAppBrowser("Mozilla/5.0 (iPhone) Version/26.0 Mobile/15E148 Safari/604.1")).toBe(false)
  })

  it("detects frames, including ones that refuse the comparison", () => {
    const self = {} as Window & typeof globalThis
    expect(isFramedWindow({ top: self, self })).toBe(false)
    expect(isFramedWindow({ top: {} as Window & typeof globalThis, self })).toBe(true)
    const hostile = { self } as Pick<Window, "top" | "self">
    Object.defineProperty(hostile, "top", { get: () => { throw new Error("SecurityError") } })
    expect(isFramedWindow(hostile)).toBe(true)
  })
})

describe("countdowns", () => {
  it("counts whole seconds down to zero", () => {
    const now = Date.parse("2026-10-07T08:00:00Z")
    expect(secondsUntil("2026-10-07T08:10:00Z", now)).toBe(600)
    expect(secondsUntil("2026-10-07T08:00:00.400Z", now)).toBe(1)
    expect(secondsUntil("2026-10-07T07:59:00Z", now)).toBe(0)
    // The backend formats in its process time zone, so an offset is the same instant.
    expect(secondsUntil("2026-10-07T16:10:00+08:00", now)).toBe(600)
    expect(secondsUntil("", now)).toBeNull()
  })

  it("formats m:ss", () => {
    expect(formatCountdown(600)).toBe("10:00")
    expect(formatCountdown(65)).toBe("1:05")
    expect(formatCountdown(-3)).toBe("0:00")
  })
})
