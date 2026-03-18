function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("Failed to decode image"))
    }
    image.src = objectUrl
  })
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export async function prepareAvatarImageDataUrl(
  file: File,
  options: {
    outputSize?: number
    jpegQuality?: number
  } = {}
): Promise<string> {
  const outputSize = clamp(Math.floor(options.outputSize ?? 512), 128, 1024)
  const jpegQuality = clamp(options.jpegQuality ?? 0.86, 0.5, 0.95)

  const image = await loadImageFromFile(file)
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight)
  if (!Number.isFinite(sourceSize) || sourceSize <= 0) {
    throw new Error("Invalid source image size")
  }

  const sourceX = Math.floor((image.naturalWidth - sourceSize) / 2)
  const sourceY = Math.floor((image.naturalHeight - sourceSize) / 2)

  const canvas = document.createElement("canvas")
  canvas.width = outputSize
  canvas.height = outputSize
  const context = canvas.getContext("2d")
  if (!context) {
    throw new Error("Canvas 2D context is not available")
  }

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    outputSize,
    outputSize
  )

  const usePng = file.type === "image/png"
  if (usePng) {
    return canvas.toDataURL("image/png")
  }

  return canvas.toDataURL("image/jpeg", jpegQuality)
}
