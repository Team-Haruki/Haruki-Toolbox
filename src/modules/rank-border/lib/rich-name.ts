import type { RichNameSegment } from "./rank-border-types"

/**
 * Parse a player name that may embed game-style `<#rgb>` / `<#rrggbb>` color
 * tags into renderable segments. Malformed tags fall back to the plain text.
 */
export function parseRichNameSegments(value: string): RichNameSegment[] {
  const rawText = value
  const segments: Omit<RichNameSegment, "key">[] = [{ text: "", color: null }]
  let rest = value

  try {
    while (true) {
      const openIndex = rest.indexOf("<#")
      if (openIndex === -1) {
        segments[segments.length - 1].text += rest.replaceAll("</color>", "")
        break
      }

      const closeIndex = rest.indexOf(">", openIndex)
      if (closeIndex === -1) {
        throw new Error("Unclosed color tag")
      }

      segments[segments.length - 1].text += rest.slice(0, openIndex).replaceAll("</color>", "")
      const code = rest.slice(openIndex + 2, closeIndex)
      const color = normalizeRichNameColor(code)
      if (!color) {
        throw new Error("Invalid color tag")
      }

      segments.push({ text: "", color })
      rest = rest.slice(closeIndex + 1)
    }
  } catch {
    return [{ key: "plain", text: rawText, color: null }]
  }

  const visibleSegments = segments.filter((segment) => segment.text.length > 0)
  return visibleSegments.length > 0
    ? visibleSegments.map((segment, index) => ({ ...segment, key: `${index}:${segment.text}:${segment.color ?? ""}` }))
    : [{ key: "plain", text: rawText, color: null }]
}

function normalizeRichNameColor(code: string) {
  if (/^[\dA-Fa-f]{3}$/.test(code)) {
    return `#${code.split("").map((value) => `${value}${value}`).join("").toLowerCase()}`
  }

  if (/^[\dA-Fa-f]{6}$/.test(code)) {
    return `#${code.toLowerCase()}`
  }

  return null
}

export function richNameSegmentStyle(segment: RichNameSegment) {
  return segment.color ? { color: segment.color } : undefined
}
