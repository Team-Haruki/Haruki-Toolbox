import { onBeforeUnmount, watch, type Ref } from "vue"
import { useI18n } from "vue-i18n"

const APP_TITLE_KEY = "app.name"

/**
 * Overrides `document.title` with an entity name (card, event, song…) while
 * the calling component is mounted. The layout keeps owning the route-level
 * title: it only rewrites `document.title` when the route title changes, so
 * this override survives for the lifetime of the detail page and the layout
 * takes over again on the next navigation. The previous title is restored on
 * unmount to cover same-route-title transitions.
 */
export function useDocumentTitle(title: Ref<string | null | undefined>): void {
  if (typeof document === "undefined") {
    return
  }

  const { t } = useI18n()
  const previous = document.title
  let applied = false

  watch(title, (value) => {
    const trimmed = value?.trim()
    if (!trimmed) {
      if (applied) {
        document.title = previous
        applied = false
      }
      return
    }
    document.title = `${trimmed} | ${t(APP_TITLE_KEY)}`
    applied = true
  }, { immediate: true })

  onBeforeUnmount(() => {
    if (applied) {
      document.title = previous
      applied = false
    }
  })
}
