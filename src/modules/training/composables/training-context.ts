import { inject, onBeforeUnmount, onMounted, type InjectionKey } from "vue"

/**
 * The training layout owns the one refresh button next to the data time;
 * the active tab registers what "refresh" means for it (its suite subset
 * plus its master tables) and unregisters on leave.
 */
export interface TrainingRefreshRegistry {
  register: (handler: () => void) => () => void
}

export const TRAINING_REFRESH_KEY: InjectionKey<TrainingRefreshRegistry> = Symbol("training-refresh")

export function useTrainingRefresh(handler: () => void) {
  const registry = inject(TRAINING_REFRESH_KEY, null)
  let unregister: (() => void) | null = null

  onMounted(() => {
    unregister = registry?.register(handler) ?? null
  })

  onBeforeUnmount(() => {
    unregister?.()
    unregister = null
  })
}
