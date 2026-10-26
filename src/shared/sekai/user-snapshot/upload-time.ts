import { computed, type ComputedRef, type Ref } from "vue"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { i18n } from "@/shared/i18n"
import { suiteUploadTimeToMillis } from "./api"

const UPLOAD_TIME_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
}

/**
 * The one way every snapshot page prints "data uploaded at …": the
 * backend's epoch value (seconds or milliseconds) in the user's locale and
 * local time zone, always with the date and minute precision.
 */
export function formatUploadTime(value: number | null | undefined, fallback = "—"): string {
  return formatLocalizedDateTime(value == null ? null : suiteUploadTimeToMillis(value), UPLOAD_TIME_FORMAT, fallback)
}

/** `formatUploadTime` as a computed that re-renders when the locale changes. */
export function useUploadTimeText(
  uploadTime: Readonly<Ref<number | null>> | ComputedRef<number | null>,
): ComputedRef<string | null> {
  return computed(() => {
    // Touch the locale so a language switch re-formats the text.
    void i18n.global.locale.value
    return uploadTime.value == null ? null : formatUploadTime(uploadTime.value)
  })
}
