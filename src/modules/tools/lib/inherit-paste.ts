import { INHERIT_ID_PATTERN } from "@/modules/tools/lib/inherit-job"

export interface PastedInheritCredentials {
  inheritId: string
  inheritPassword: string
}

// Only labels are matched case-insensitively. Never normalize the credentials:
// punctuation, case and full-width characters may be part of a password.
// Match only the prefix so a long whitespace gap cannot backtrack against
// a trailing value pattern. The remainder is validated separately.
const FIELD_PREFIX = /^[ \t]*(?:【|\[)?(引[き]?継[ぎ]?[ \t]*(?:ID|コード|パスワード)|引[继繼][ \t]*(?:ID|码|碼|密码|密碼)|transfer[ \t]*(?:ID|code|password)|password|パスワード|密码|密碼)(?:】|\])?(?:[ \t]*[:：][ \t]*|[ \t]+|$)/i

/** Reads one explicitly labelled ID/password pair from game clipboard text. */
export function parseInheritPaste(text: string): PastedInheritCredentials | null {
  if (text.length > 4096) return null
  const lines = text.replace(/\r\n?/g, "\n").split("\n")
  const values = new Map<keyof PastedInheritCredentials, string>()

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!
    const match = line.match(FIELD_PREFIX)
    if (!match) continue
    const field = /password|パスワード|密码|密碼/i.test(match[1]!) ? "inheritPassword" : "inheritId"
    if (values.has(field)) return null

    let value = line.slice(match[0].length).trim()
    // Some game clients put the value on the line after its label.
    if (!value) {
      while (!value && index + 1 < lines.length) value = lines[++index]!.trim()
      // A new labelled field cannot fill a missing value. A bare word such
      // as "password", however, can be the credential itself.
      if (FIELD_PREFIX.test(value) && /[:：]/u.test(value)) return null
    }
    if (!value || /\s/u.test(value)) return null
    values.set(field, value)
  }

  const inheritId = values.get("inheritId")
  const inheritPassword = values.get("inheritPassword")
  if (!inheritId || !INHERIT_ID_PATTERN.test(inheritId) || !inheritPassword) return null
  if (new TextEncoder().encode(inheritPassword).length > 64) return null
  return { inheritId, inheritPassword }
}
