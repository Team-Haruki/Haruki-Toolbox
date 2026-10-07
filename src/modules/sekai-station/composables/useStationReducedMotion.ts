import { computed, type ComputedRef } from "vue"
import { useMediaQuery } from "@vueuse/core"
import { useSettingsStore } from "@/shared/stores/settings"

/** True when cards should appear and leave without animation */
export function useStationReducedMotion(): ComputedRef<boolean> {
  const settings = useSettingsStore()
  const prefersReduced = useMediaQuery("(prefers-reduced-motion: reduce)")
  return computed(() => settings.reducedVisualEffects || prefersReduced.value)
}
