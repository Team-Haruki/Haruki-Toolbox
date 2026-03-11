export function isClipboardSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function"
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!isClipboardSupported()) {
    return false
  }

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
