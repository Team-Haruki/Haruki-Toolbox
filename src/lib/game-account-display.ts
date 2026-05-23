export type FormatGameAccountLabelParams = {
  regionLabel: string
  uid: string | number
  hideUid: boolean
}

export function formatGameAccountLabel(params: FormatGameAccountLabelParams): string {
  if (params.hideUid) {
    return `${params.regionLabel} / UID ${maskGameUserId(params.uid)}`
  }

  return `${params.regionLabel} / UID ${params.uid}`
}

export function maskGameUserId(uid: string | number): string {
  const normalized = String(uid).trim()
  if (normalized.length <= 6) {
    return normalized
  }

  return `${normalized.slice(0, 2)}${"*".repeat(normalized.length - 6)}${normalized.slice(-4)}`
}
