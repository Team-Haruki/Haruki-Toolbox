import { computed, type Ref } from "vue"
import { getMissingUploadDataType } from "./missing-data"
import type { UserSuiteStatus } from "./use-user-suite"

/** Shared state for pages combining an account snapshot with master data. */
export function useUserDataPageState(input: {
  status: Readonly<Ref<UserSuiteStatus>>
  error: Readonly<Ref<unknown>>
  masterLoading: Readonly<Ref<boolean>>
  masterError: Readonly<Ref<string | null>>
}) {
  return {
    isLoading: computed(() => input.status.value === "loading" || input.masterLoading.value),
    hasError: computed(() => input.status.value === "error" || input.masterError.value != null),
    isReady: computed(() => input.status.value === "ready" && !input.masterLoading.value && input.masterError.value == null),
    suiteDataMissing: computed(() => getMissingUploadDataType(input.error.value) != null),
    errorDetail: computed(() => {
      if (input.masterError.value != null) return input.masterError.value
      const error = input.error.value
      if (error == null) return null
      return error instanceof Error ? error.message : String(error)
    }),
  }
}
