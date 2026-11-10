import type { InjectionKey } from "vue"

/**
 * Opens the global search dialog. WebLayout provides it (it owns the dialog
 * and loads its chunk on first use); pages inject it to offer their own
 * search entry point.
 */
export const OPEN_GLOBAL_SEARCH_KEY: InjectionKey<() => void> = Symbol("open-global-search")
