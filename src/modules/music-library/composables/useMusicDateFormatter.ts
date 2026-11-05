import { computed, type ComputedRef } from "vue"
import { useI18n } from "vue-i18n"
import { DATE_FORMAT_PRESETS } from "@/lib/date-time"
import { getI18nLocale } from "@/shared/i18n"

/** Day-precision formatter (the shared `date` preset) following the active UI locale: release dates, event periods. */
export function useMusicDateFormatter(): ComputedRef<Intl.DateTimeFormat> {
  const { locale } = useI18n()
  return computed(() => new Intl.DateTimeFormat(locale.value || getI18nLocale(), DATE_FORMAT_PRESETS.date))
}
