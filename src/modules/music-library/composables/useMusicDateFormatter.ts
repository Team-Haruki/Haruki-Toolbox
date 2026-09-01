import { computed, type ComputedRef } from "vue"
import { useI18n } from "vue-i18n"
import { getI18nLocale } from "@/shared/i18n"

/** Medium date formatter following the active UI locale (release dates, event periods). */
export function useMusicDateFormatter(): ComputedRef<Intl.DateTimeFormat> {
  const { locale } = useI18n()
  return computed(() => new Intl.DateTimeFormat(locale.value || getI18nLocale(), { dateStyle: "medium" }))
}
