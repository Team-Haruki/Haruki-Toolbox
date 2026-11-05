import { translate } from "@/shared/i18n"

/**
 * Thrown by payload guards when a 200 response does not have the shape the
 * page renders (e.g. `{items: []}` where a dashboard was expected). The
 * message is already in the user's language, so `describeError` shows it as
 * is and the page lands in its load-error state instead of crashing a render.
 */
export class UnexpectedPayloadError extends Error {
  readonly path: string

  constructor(path: string) {
    super(translate("core.errors.unexpectedPayload"))
    this.name = "UnexpectedPayloadError"
    this.path = path
  }
}

export function isUnexpectedPayloadError(error: unknown): error is UnexpectedPayloadError {
  return error instanceof UnexpectedPayloadError
}
