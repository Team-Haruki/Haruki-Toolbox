import type { RuntimeConfig } from "@/types/admin"

/**
 * The runtime configuration as the JSON editor shows it, and therefore as a
 * save sends it back.
 *
 * `GET /api/admin/config/runtime` also reports the allowlist of game-data
 * keys (`publicApiAllowedKeys`). The backend drops its game-data cache
 * whenever a runtime `PUT` carries that member, changed or not, so an editor
 * that echoed it would empty the cache on every save of anything else. The
 * allowlist has an editor of its own on the page; it is left out here. A
 * `PUT` leaves members it does not carry unchanged.
 */
const SEPARATELY_EDITED_KEYS = ["publicApiAllowedKeys"] as const

export function toRuntimeEditorDocument(config: RuntimeConfig | null | undefined): RuntimeConfig {
  const document: RuntimeConfig = { ...config }
  for (const key of SEPARATELY_EDITED_KEYS) {
    delete document[key]
  }
  return document
}

/** The editor's text for a configuration: the document above, indented. */
export function formatRuntimeEditorJson(config: RuntimeConfig | null | undefined): string {
  return JSON.stringify(toRuntimeEditorDocument(config), null, 2)
}
