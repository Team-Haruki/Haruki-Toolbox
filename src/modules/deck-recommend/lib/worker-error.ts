function readErrorName(error: object): string | undefined {
  const name = error.constructor?.name
  return name && name !== "Object" ? name : undefined
}

function readErrorMessage(error: object): string | undefined {
  if (!("message" in error) || typeof error.message !== "string") {
    return undefined
  }
  return error.message || undefined
}

export function normalizeDeckRecommendWorkerError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error !== "object" || error === null) {
    return String(error)
  }

  const name = readErrorName(error)
  const message = readErrorMessage(error)
  if (message) {
    return name ? `${name}: ${message}` : message
  }
  if (error.constructor?.name === "Exception") {
    return "wasm engine failed to execute recommendation"
  }
  return name ?? String(error)
}
