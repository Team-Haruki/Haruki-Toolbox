import { onBeforeUnmount, ref, watch, type Ref } from "vue"

/**
 * Entity-name override for the document title. The web layout is the single
 * writer of `document.title` (route title + app name); detail pages publish
 * their entity name here and the layout's watcher renders it instead of the
 * generic route title. Keeping one writer avoids the races a second
 * `document.title` assignment would have with route/locale changes and the
 * out-in page transition (the previous page unmounts after the next route
 * title was already written).
 */
export const documentTitleOverride: Ref<string | null> = ref(null)

export function useDocumentTitle(title: Ref<string | null | undefined>): void {
  let ownValue: string | null = null

  watch(title, (value) => {
    const trimmed = value?.trim() || null
    ownValue = trimmed
    documentTitleOverride.value = trimmed
  }, { immediate: true })

  onBeforeUnmount(() => {
    // Only clear the override if it is still ours: a sibling detail page may
    // already have published its own title during the page transition.
    if (ownValue != null && documentTitleOverride.value === ownValue) {
      documentTitleOverride.value = null
    }
  })
}
