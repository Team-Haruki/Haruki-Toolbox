export function isClipboardSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function"
}

/**
 * Last resort for web views that ship no async clipboard (older in-app
 * browsers): select the text in an off-screen textarea and run the legacy
 * copy command. Only ever reached when the modern API is missing or refused.
 */
function copyTextWithExecCommand(text: string): boolean {
  if (typeof document === "undefined" || typeof document.execCommand !== "function") {
    return false
  }
  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.top = "0"
  textarea.style.left = "0"
  textarea.style.opacity = "0"
  textarea.style.pointerEvents = "none"
  document.body.appendChild(textarea)
  try {
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, text.length)
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    textarea.remove()
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (isClipboardSupported()) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Fall through: some web views expose the API but reject every call.
    }
  }

  return copyTextWithExecCommand(text)
}
