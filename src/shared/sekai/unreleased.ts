import { computed, type ComputedRef } from "vue"
import { storeToRefs } from "pinia"
import { useSettingsStore } from "@/shared/stores/settings"

/**
 * An item counts as unreleased when its release timestamp (releaseAt for
 * cards, publishedAt for musics, startAt for events/gachas; milliseconds) is
 * in the future. Items without a timestamp are treated as released.
 */
export function isUnreleasedContent(releaseTimeMs: number | null | undefined, nowMs: number): boolean {
  return releaseTimeMs != null && releaseTimeMs > nowMs
}

export type UnreleasedContentDisplay = {
  /** Unreleased items are hidden from catalog lists entirely. */
  hideUnreleased: ComputedRef<boolean>
  /** Unreleased items are visible but their artwork must be blurred. */
  blurUnreleased: ComputedRef<boolean>
}

export function useUnreleasedContentDisplay(): UnreleasedContentDisplay {
  const { showUnreleasedContent, blurUnreleasedContent } = storeToRefs(useSettingsStore())

  return {
    hideUnreleased: computed(() => !showUnreleasedContent.value),
    blurUnreleased: computed(() => showUnreleasedContent.value && blurUnreleasedContent.value),
  }
}
