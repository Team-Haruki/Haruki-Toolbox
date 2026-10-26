import { computed, type Ref } from "vue"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { translate } from "@/shared/i18n"
import { getMissingUploadDataType, isLapsedGrantError } from "./missing-data"
import type { UserSuiteStatus } from "./use-user-suite"

/**
 * Shared state for pages combining an account snapshot with master data.
 *
 * Failures come back as user-language text: `errorMessage` says what
 * happened (translated transport/backend failures, the page's `fallback`
 * otherwise) and `errorDetail` carries the raw backend text, if any, for a
 * muted detail line. A missing upload (`suiteDataMissing`) and a lapsed grant
 * (`grantLapsed`) are distinguished so pages can show the upload guidance or
 * the re-authorization hint instead of a generic error.
 */
export function useUserDataPageState(input: {
  status: Readonly<Ref<UserSuiteStatus>>
  error: Readonly<Ref<unknown>>
  masterLoading: Readonly<Ref<boolean>>
  masterError: Readonly<Ref<string | null>>
  /** The selected account; needed to recognise a lapsed grant (403 on a granted account). */
  account?: Readonly<Ref<{ ownership: "own" | "granted" } | null>>
  /** Localized "failed to load" text used when the failure has no translation of its own. */
  fallback?: () => string
}) {
  const grantLapsed = computed(() =>
    input.status.value === "error" && isLapsedGrantError(input.error.value, input.account?.value?.ownership ?? null))

  const errorDescription = computed<ErrorDescription | null>(() => {
    const fallback = input.fallback?.() ?? translate("core.loadError.title")
    if (input.masterError.value != null) {
      return describeError(input.masterError.value, fallback)
    }
    const error = input.error.value
    if (error == null) {
      return null
    }
    if (grantLapsed.value) {
      return { message: translate("uploadedGameData.grantLapsed") }
    }
    return describeError(error, fallback)
  })

  return {
    isLoading: computed(() => input.status.value === "loading" || input.masterLoading.value),
    hasError: computed(() => input.status.value === "error" || input.masterError.value != null),
    isReady: computed(() => input.status.value === "ready" && !input.masterLoading.value && input.masterError.value == null),
    suiteDataMissing: computed(() => getMissingUploadDataType(input.error.value) != null),
    missingDataType: computed(() => getMissingUploadDataType(input.error.value)),
    grantLapsed,
    errorMessage: computed(() => errorDescription.value?.message ?? null),
    errorDetail: computed(() => errorDescription.value?.detail ?? null),
  }
}
