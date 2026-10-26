import { ref, type Ref } from "vue"
import { toast } from "vue-sonner"
import { translate } from "@/shared/i18n"
import { formatUploadTime } from "./upload-time"
import type { UserSuiteReloadResult } from "./use-user-suite"

/** A refresh task: a suite `reload`, or any loader that reports the same shape (or nothing). */
export type SuiteRefreshTask = () => Promise<UserSuiteReloadResult | void> | void

export type UseSuiteRefreshResult = {
  refreshing: Ref<boolean>
  refresh: () => Promise<void>
}

/**
 * The "刷新" button behaviour every snapshot page shares: run the given
 * reloads with the button disabled, then tell the user whether anything
 * changed ("already up to date" / "updated to <time>"). Failures are not
 * toasted here; the page's error state already shows them.
 */
export function useSuiteRefresh(tasks: readonly SuiteRefreshTask[]): UseSuiteRefreshResult {
  const refreshing = ref(false)

  async function refresh(): Promise<void> {
    if (refreshing.value) {
      return
    }
    refreshing.value = true
    try {
      const results = await Promise.all(tasks.map((task) => task()))
      const outcomes = results.filter((result): result is UserSuiteReloadResult => result != null)
      reportRefreshOutcome(outcomes)
    } finally {
      refreshing.value = false
    }
  }

  return { refreshing, refresh }
}

/** Toasts the outcome of a refresh; the first ready outcome's time names the new snapshot. */
export function reportRefreshOutcome(outcomes: readonly UserSuiteReloadResult[]): void {
  if (outcomes.length === 0 || outcomes.some((outcome) => outcome.status === "error")) {
    return
  }
  const ready = outcomes.filter((outcome) => outcome.status === "ready")
  if (ready.length === 0) {
    return
  }
  const changed = ready.find((outcome) => outcome.changed)
  if (changed) {
    toast.success(translate("uploadedGameData.refreshUpdated", {
      time: formatUploadTime(changed.uploadTime ?? ready[0]?.uploadTime ?? null),
    }))
  } else {
    toast.info(translate("uploadedGameData.refreshUpToDate"))
  }
}
