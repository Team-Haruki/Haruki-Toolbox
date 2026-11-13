import {
  buildClientConfigYaml,
  CLIENT_CONFIG_FEATURE_SCOPE_OPTIONS,
  CLIENT_CONFIG_MODULE_OPTIONS,
  parseNumberList,
  type ClientConfigBuildResult,
  type ClientConfigForm,
  type ClientFeaturePolicyMode,
  type ClientRunMode,
} from "@/modules/client-config-generator/lib/client-config"

/**
 * The row editors of the generator page (modules, per-feature policies,
 * scoped lists, admins) and how their rows become the text fields that
 * `buildClientConfigYaml` reads.
 */

export interface FeaturePolicyRow {
  key: string
  scope: string
  mode: ClientFeaturePolicyMode
}

export interface ModuleRow {
  key: string
  module: string
}

export interface ScopedAccessRow {
  key: string
  scope: string
  value: string | number
}

export interface AccessIdRow {
  key: string
  value: string | number
}

export interface ClientConfigRows {
  modules: ModuleRow[]
  featurePolicies: FeaturePolicyRow[]
  blacklists: ScopedAccessRow[]
  whitelists: ScopedAccessRow[]
  userBlacklists: ScopedAccessRow[]
  botAdmins: AccessIdRow[]
}

export type ScopedAccessListKey = "blacklists" | "whitelists" | "userBlacklists"

/** Every scope a list row can target: everything, one module, or one feature. */
export const CLIENT_CONFIG_ACCESS_SCOPES: readonly string[] = [
  "all",
  ...CLIENT_CONFIG_MODULE_OPTIONS.filter((value) => value !== "all"),
  ...CLIENT_CONFIG_FEATURE_SCOPE_OPTIONS,
]

let rowSeed = 0

export function createFeaturePolicyRow(scope = "", mode: ClientFeaturePolicyMode = "blacklist"): FeaturePolicyRow {
  return {
    key: `feature-${rowSeed++}`,
    scope,
    mode,
  }
}

export function createModuleRow(module = ""): ModuleRow {
  return {
    key: `module-${rowSeed++}`,
    module,
  }
}

export function createScopedAccessRow(scope = "all", value: string | number = ""): ScopedAccessRow {
  return {
    key: `scoped-access-${rowSeed++}`,
    scope,
    value,
  }
}

export function createAccessIdRow(value: string | number = ""): AccessIdRow {
  return {
    key: `access-id-${rowSeed++}`,
    value,
  }
}

/** What a fresh page starts with: all modules on, and one blank row per list. */
export function createDefaultClientConfigRows(): ClientConfigRows {
  return {
    modules: [createModuleRow("all")],
    featurePolicies: [],
    blacklists: [createScopedAccessRow()],
    whitelists: [createScopedAccessRow()],
    userBlacklists: [createScopedAccessRow()],
    botAdmins: [createAccessIdRow()],
  }
}

/** Puts every editor back to its starting rows, in place. */
export function resetClientConfigRows(rows: ClientConfigRows): void {
  const fresh = createDefaultClientConfigRows()
  rows.modules.splice(0, rows.modules.length, ...fresh.modules)
  rows.featurePolicies.splice(0, rows.featurePolicies.length, ...fresh.featurePolicies)
  rows.blacklists.splice(0, rows.blacklists.length, ...fresh.blacklists)
  rows.whitelists.splice(0, rows.whitelists.length, ...fresh.whitelists)
  rows.userBlacklists.splice(0, rows.userBlacklists.length, ...fresh.userBlacklists)
  rows.botAdmins.splice(0, rows.botAdmins.length, ...fresh.botAdmins)
}

export function serializeFeaturePolicyRows(rows: readonly FeaturePolicyRow[]): string {
  return rows
    .map((row) => ({
      scope: row.scope.trim(),
      mode: row.mode,
    }))
    .filter((row) => row.scope)
    .map((row) => `${row.scope}: ${row.mode}`)
    .join("\n")
}

export function serializeModuleRows(rows: readonly ModuleRow[]): string {
  const modules = Array.from(new Set(
    rows
      .map((row) => row.module.trim())
      .filter(Boolean),
  ))

  if (modules.length === 0 || modules.includes("all")) {
    return "all"
  }

  return modules.join("\n")
}

export function serializeScopedAccessRows(rows: readonly ScopedAccessRow[]): string {
  const grouped = new Map<string, number[]>()

  for (const row of rows) {
    const ids = parseNumberList(row.value)
    if (ids.length === 0) {
      continue
    }

    const scope = row.scope.trim() || "all"
    grouped.set(scope, [...(grouped.get(scope) ?? []), ...ids])
  }

  return Array.from(grouped.entries())
    .map(([scope, ids]) => `${scope}: ${Array.from(new Set(ids)).join(", ")}`)
    .join("\n")
}

export function serializeAccessIdRows(rows: readonly AccessIdRow[]): string {
  return Array.from(new Set(rows.flatMap((row) => parseNumberList(row.value))))
    .join("\n")
}

/** The file for the form as it stands: the plain fields plus every row editor. */
export function buildClientConfigFromRows(form: ClientConfigForm, rows: ClientConfigRows): ClientConfigBuildResult {
  return buildClientConfigYaml({
    ...form,
    enableModulesText: serializeModuleRows(rows.modules),
    featurePolicyModesText: serializeFeaturePolicyRows(rows.featurePolicies),
    blacklistsText: serializeScopedAccessRows(rows.blacklists),
    whitelistsText: serializeScopedAccessRows(rows.whitelists),
    userBlacklistsText: serializeScopedAccessRows(rows.userBlacklists),
    botAdminsText: serializeAccessIdRows(rows.botAdmins),
  })
}

/** Removes a row; an editor that always shows one row gets a blank one back instead of going empty. */
export function removeRow<T extends { key: string }>(rows: T[], key: string, createBlank?: () => T): void {
  if (createBlank && rows.length <= 1) {
    rows.splice(0, rows.length, createBlank())
    return
  }

  const index = rows.findIndex((row) => row.key === key)
  if (index >= 0) {
    rows.splice(index, 1)
  }
}

/** "All modules" stands alone: adding next to it starts a list of specific modules. */
export function appendModuleRow(rows: ModuleRow[]): void {
  if (rows.some((row) => row.module === "all")) {
    rows.splice(0, rows.length, createModuleRow())
    return
  }

  rows.push(createModuleRow())
}

/** Sets a module row; picking "all" replaces every other row, picking a module drops any "all" row. */
export function selectModule(rows: ModuleRow[], row: ModuleRow, value: unknown): void {
  row.module = isModuleOption(value) ? value : ""
  if (row.module === "all") {
    rows.splice(0, rows.length, row)
    return
  }

  for (let index = rows.length - 1; index >= 0; index -= 1) {
    if (rows[index].module === "all") {
      rows.splice(index, 1)
    }
  }
}

export function isModuleOption(value: unknown): value is typeof CLIENT_CONFIG_MODULE_OPTIONS[number] {
  return typeof value === "string" && CLIENT_CONFIG_MODULE_OPTIONS.includes(value as typeof CLIENT_CONFIG_MODULE_OPTIONS[number])
}

export function isFeatureScopeOption(value: unknown): value is typeof CLIENT_CONFIG_FEATURE_SCOPE_OPTIONS[number] {
  return typeof value === "string" && CLIENT_CONFIG_FEATURE_SCOPE_OPTIONS.includes(value as typeof CLIENT_CONFIG_FEATURE_SCOPE_OPTIONS[number])
}

export function isAccessScope(value: unknown): value is string {
  return typeof value === "string" && CLIENT_CONFIG_ACCESS_SCOPES.includes(value)
}

/** Anything that is not "whitelist" is the default blacklist mode. */
export function normalizeRunMode(value: unknown): ClientRunMode {
  return value === "whitelist" ? "whitelist" : "blacklist"
}
