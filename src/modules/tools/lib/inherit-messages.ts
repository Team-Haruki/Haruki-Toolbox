import {
  isKnownApiErrorCode,
  isKnownJobErrorCode,
  isKnownJobWarningCode,
  remainingParts,
  type InheritProblem,
} from "@/modules/tools/lib/inherit-job"

type Translate = (key: string, params?: Record<string, unknown>) => string

export interface InheritErrorLike {
  code: string
  message: string
  status?: number
  retryAfter?: number | null
}

/**
 * Text for a refused job or vault request: the UI's own sentence for every
 * code of the contract, the backend's (Chinese) message for a code this build
 * does not know, a transport sentence when the server never answered.
 */
export function describeInheritApiError(t: Translate, error: InheritErrorLike): string {
  if (error.code && isKnownApiErrorCode(error.code)) {
    const text = t(`tools.uploadData.inheritErrors.${error.code}`)
    if (error.retryAfter && error.retryAfter > 0) {
      return `${text} ${t("tools.uploadData.inheritErrors.retryAfter", { seconds: error.retryAfter })}`
    }
    return text
  }
  if (error.message && error.status) return error.message
  if (!error.status) return t("tools.uploadData.inheritErrors.network")
  return t("tools.uploadData.inheritErrors.unknown", { status: error.status })
}

/** Why the job stopped. */
export function describeJobError(t: Translate, problem: InheritProblem): string {
  if (isKnownJobErrorCode(problem.code)) return t(`tools.uploadData.inheritJob.errors.${problem.code}`)
  return problem.message || t("tools.uploadData.inheritJob.errors.internal_error")
}

/** A problem that did not stop the job. */
export function describeJobWarning(t: Translate, problem: InheritProblem): string {
  if (isKnownJobWarningCode(problem.code)) return t(`tools.uploadData.inheritJob.warnings.${problem.code}`)
  return problem.message || problem.code
}

/** "2天 3小时" / "3小时 12分" / "4分 9秒" from the shared catalog countdown strings; null once passed. */
export function formatInheritRemaining(t: Translate, target: string | number | null | undefined, now: number): string | null {
  if (target == null) return null
  const targetMs = typeof target === "number" ? target : Date.parse(target)
  if (Number.isNaN(targetMs)) return null
  const parts = remainingParts(targetMs, now)
  if (!parts) return null
  if (parts.days > 0) {
    return `${t("catalog.countdown.days", { days: parts.days })} ${t("catalog.countdown.hours", { hours: parts.hours })}`
  }
  if (parts.hours > 0) {
    return `${t("catalog.countdown.hours", { hours: parts.hours })} ${t("catalog.countdown.minutes", { minutes: parts.minutes })}`
  }
  return `${t("catalog.countdown.minutes", { minutes: parts.minutes })} ${t("catalog.countdown.seconds", { seconds: parts.seconds })}`
}
