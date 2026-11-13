/** Hands the viewer a file made in the page, through the browser's download. */
export function downloadFile(name: string, content: BlobPart, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Safari starts the download after the click returns, so the URL outlives it.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
