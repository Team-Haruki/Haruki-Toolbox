// User codes of the OAuth2 device authorization grant (RFC 8628) as the
// /device page handles them. The backend owns the alphabet and length
// (`normalizeDeviceUserCode`); the page only folds what people type the same
// way and checks the rough shape, so a server-side alphabet change never
// needs a frontend release.

/** Path of the verification page the device shows (`verification_uri`). */
export const DEVICE_PAGE_PATH = "/device"

/** Shape check the page applies before asking the backend (doc §8.1). */
const USER_CODE_SHAPE = /^[A-Z0-9]{6,12}$/
/** Group size of the displayed form, `BCDF-GHJK`. */
const USER_CODE_GROUP = 4
/** Longest code the input keeps while typing (the shape check's upper bound). */
const USER_CODE_INPUT_MAX = 12
/** Longest label the backend keeps, in code points. */
export const DEVICE_LABEL_MAX_RUNES = 64

// Separators the backend drops: `-`, `_`, `.`, U+2010–U+2015 (hyphens and
// dashes), U+2212 (minus) and U+30FC (katakana long vowel mark), plus all
// whitespace.
const USER_CODE_SEPARATORS = /[\s\-_.‐-―−ー]/gu

/** Folds full-width ASCII (U+FF01–U+FF5E) and the ideographic space onto ASCII. */
function foldFullWidth(value: string): string {
  let out = ""
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0
    if (code >= 0xff01 && code <= 0xff5e) {
      out += String.fromCodePoint(code - 0xfee0)
    } else if (code === 0x3000) {
      out += " "
    } else {
      out += char
    }
  }
  return out
}

/** Upper-cases ASCII letters only, like the backend (no locale-specific folding). */
function upperAscii(value: string): string {
  return value.replace(/[a-z]/g, (char) => char.toUpperCase())
}

/**
 * Steps ①–③ of the backend normalisation: full-width folding, ASCII upper
 * case and dropping separators. The result may still be malformed.
 */
export function foldDeviceUserCode(raw: string): string {
  return upperAscii(foldFullWidth(raw)).replace(USER_CODE_SEPARATORS, "")
}

/** The folded code when it has a plausible shape, otherwise null (`malformed_code`). */
export function normalizeDeviceUserCode(raw: string): string | null {
  const folded = foldDeviceUserCode(raw)
  return USER_CODE_SHAPE.test(folded) ? folded : null
}

/** Groups a folded code in fours: `BCDFGHJK` → `BCDF-GHJK`. */
export function formatDeviceUserCode(code: string): string {
  const groups: string[] = []
  for (let index = 0; index < code.length; index += USER_CODE_GROUP) {
    groups.push(code.slice(index, index + USER_CODE_GROUP))
  }
  return groups.join("-")
}

/**
 * What the code input shows while someone types or pastes: folded, limited
 * to letters and digits, and grouped in fours. Other characters are dropped
 * so a pasted sentence cannot smuggle text into the field.
 */
export function formatDeviceUserCodeInput(raw: string): string {
  const folded = foldDeviceUserCode(raw).replace(/[^A-Z0-9]/g, "").slice(0, USER_CODE_INPUT_MAX)
  return formatDeviceUserCode(folded)
}

/**
 * The `?user_code=` value of the verification link, or "" when absent. Only
 * a single string counts; an array (repeated parameter) is ignored.
 */
export function readUserCodeQuery(value: unknown): string {
  return typeof value === "string" ? formatDeviceUserCodeInput(value) : ""
}

/** Login target that brings the person back to /device with the code they had. */
export function buildDevicePageTarget(userCode: string): string {
  const code = formatDeviceUserCodeInput(userCode)
  if (!code) {
    return DEVICE_PAGE_PATH
  }
  const params = new URLSearchParams()
  params.set("user_code", code)
  return `${DEVICE_PAGE_PATH}?${params.toString()}`
}

/**
 * The backend's `sanitizeDeviceLabel`: trims, drops Unicode Cc and Cf
 * characters (controls, zero-width and bidi overrides), collapses whitespace
 * runs to one space, and keeps at most 64 code points.
 */
export function sanitizeDeviceLabel(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/\s+/gu, " ")
    .trim()
  return Array.from(cleaned).slice(0, DEVICE_LABEL_MAX_RUNES).join("").trimEnd()
}

/**
 * The label to send with approve, or undefined to leave it out. A label equal
 * to the device's own one is left out too: the backend would otherwise record
 * the device's claim as chosen by the user (`label_source=user`).
 */
export function resolveApproveLabel(input: string, deviceLabel: string): string | undefined {
  const label = sanitizeDeviceLabel(input)
  if (!label || label === sanitizeDeviceLabel(deviceLabel)) {
    return undefined
  }
  return label
}

/** In-app browsers whose cookie jar is not the system browser's (doc §6.8). */
const IN_APP_BROWSER_PATTERN = /MicroMessenger|QQ\/|Telegram/

export function isInAppBrowser(userAgent: string): boolean {
  return IN_APP_BROWSER_PATTERN.test(userAgent)
}

/** True when the page runs inside a frame (anti-clickjacking, doc §5). */
export function isFramedWindow(view: Pick<Window, "top" | "self">): boolean {
  try {
    return view.top !== view.self
  } catch {
    // A cross-origin parent that refuses even the comparison is still a frame.
    return true
  }
}

/** Remaining whole seconds until `expiresAt`, never negative; null when unknown. */
export function secondsUntil(expiresAt: string, now: number): number | null {
  const expires = Date.parse(expiresAt)
  if (Number.isNaN(expires)) {
    return null
  }
  return Math.max(0, Math.ceil((expires - now) / 1000))
}

/** `m:ss` for a countdown. */
export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.trunc(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`
}
