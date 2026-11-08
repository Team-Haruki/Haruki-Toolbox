import { INHERIT_ID_PATTERN } from "@/modules/tools/lib/inherit-job"

export interface PastedInheritCredentials {
  inheritId: string
  inheritPassword: string
}

// Only labels are matched case-insensitively. Never normalize the credentials:
// punctuation, case and full-width characters may be part of a password.
const FIELD_LINE = /^[ \t]*(?:【|\[)?(引[き]?継[ぎ]?[ \t]*(?:ID|コード|パスワード)|引[继繼][ \t]*(?:ID|码|碼|密码|密碼)|transfer[ \t]*(?:ID|code|password)|password|パスワード|密码|密碼)(?:】|\])?(?:[ \t]*[:：][ \t]*|[ \t]+|$)(.*)$/i

/** Reads one explicitly labelled ID/password pair from game clipboard text. */
export function parseInheritPaste(text: string): PastedInheritCredentials | null {
  if (text.length > 4096) return null
  const lines = text.replace(/\r\n?/g, "\n").split("\n")
  const values = new Map<keyof PastedInheritCredentials, string>()

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index]!.match(FIELD_LINE)
    if (!match) continue
    const field = /password|パスワード|密码|密碼/i.test(match[1]!) ? "inheritPassword" : "inheritId"
    if (values.has(field)) return null

    let value = match[2]!.trim()
    // Some game clients put the value on the line after its label.
    while (!value && index + 1 < lines.length) value = lines[++index]!.trim()
    if (!value || FIELD_LINE.test(value) || /\s/u.test(value)) return null
    values.set(field, value)
  }

  const inheritId = values.get("inheritId")
  const inheritPassword = values.get("inheritPassword")
  if (!inheritId || !INHERIT_ID_PATTERN.test(inheritId) || !inheritPassword) return null
  if (new TextEncoder().encode(inheritPassword).length > 64) return null
  return { inheritId, inheritPassword }
}
