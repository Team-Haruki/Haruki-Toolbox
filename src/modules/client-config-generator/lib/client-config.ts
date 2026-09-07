export type ClientRunMode = "blacklist" | "whitelist"

export type ClientFeaturePolicyMode = ClientRunMode

export interface ClientConfigForm {
  host: string
  port: number
  controlApiPort: number
  controlApiAccessToken: string
  useControlApiAccessToken: boolean
  botId: number
  credential: string
  noiseServerPubkey: string
  noiseServerKeyId: string
  trustRootPubkey: string
  serverEndpointOverride: string
  enableDynamicRouting: boolean
  routingConfigURL: string
  enableHelp: boolean
  helpContent: string
  enableCN: boolean
  enablePrivateMessage: boolean
  enableReplyMessage: boolean
  sendBase64Image: boolean
  mysekaiBirthdayMonitorNotifyEmpty: boolean
  mysekaiBirthdayMonitorMode: ClientRunMode
  mysekaiBirthdayMonitorBlacklistText: string
  mysekaiBirthdayMonitorWhitelistText: string
  enableParamEcho: boolean
  strictConfigPermissions: boolean
  enableGroupCommandLimit: boolean
  globalCommandHourlyLimit: number
  globalCommandDailyLimit: number
  runMode: ClientRunMode
  enableModulesText: string
  featurePolicyModesText: string
  blacklistsText: string
  whitelistsText: string
  userBlacklistsText: string
  botAdminsText: string
}

export const DEFAULT_CLIENT_CONFIG_FORM: ClientConfigForm = {
  host: "127.0.0.1",
  port: 8111,
  controlApiPort: 8112,
  controlApiAccessToken: "",
  useControlApiAccessToken: false,
  botId: 0,
  credential: "",
  noiseServerPubkey: "",
  noiseServerKeyId: "",
  trustRootPubkey: "",
  serverEndpointOverride: "",
  enableDynamicRouting: true,
  routingConfigURL: "",
  enableHelp: true,
  helpContent: "",
  enableCN: true,
  enablePrivateMessage: true,
  enableReplyMessage: false,
  sendBase64Image: false,
  mysekaiBirthdayMonitorNotifyEmpty: false,
  mysekaiBirthdayMonitorMode: "blacklist",
  mysekaiBirthdayMonitorBlacklistText: "",
  mysekaiBirthdayMonitorWhitelistText: "",
  enableParamEcho: false,
  strictConfigPermissions: false,
  enableGroupCommandLimit: false,
  globalCommandHourlyLimit: 0,
  globalCommandDailyLimit: 0,
  runMode: "blacklist",
  enableModulesText: "all",
  featurePolicyModesText: "",
  blacklistsText: "",
  whitelistsText: "",
  userBlacklistsText: "",
  botAdminsText: "",
}

export const CLIENT_CONFIG_MODULE_OPTIONS = [
  "all",
  "pjsk",
] as const

export const CLIENT_CONFIG_FEATURE_SCOPE_OPTIONS = [
  "alias",
  "arrest",
  "card",
  "costume",
  "deck",
  "education",
  "event",
  "gacha",
  "misc",
  "music",
  "mysekai",
  "birthday_monitor",
  "profile",
  "custom_profile",
  "score",
  "sk",
  "stamp",
  "vlive",
] as const

export interface ParsedClientConfigLists {
  enableModules: string[]
  featurePolicyModes: Record<string, ClientFeaturePolicyMode>
  blacklists: Record<string, number[]>
  whitelists: Record<string, number[]>
  userBlacklists: Record<string, number[]>
  mysekaiBirthdayMonitorBlacklist: number[]
  mysekaiBirthdayMonitorWhitelist: number[]
  botAdmins: number[]
}

export interface ClientConfigBuildResult {
  yaml: string
  parsed: ParsedClientConfigLists
}

export interface ClientConfigPrefillParams {
  ownerId: string
  botId: number | null
  credential: string
  hasPrefill: boolean
}

export function cloneDefaultClientConfigForm(): ClientConfigForm {
  return { ...DEFAULT_CLIENT_CONFIG_FORM }
}

export function resolveClientConfigPrefillParams(params: Record<string, unknown>): ClientConfigPrefillParams {
  const ownerId = readQueryString(params.ownerId) || readQueryString(params.owner_id)
  const rawBotId = readQueryString(params.botId) || readQueryString(params.bot_id)
  const credential = readQueryString(params.credential)
  const botId = parseQueryInteger(rawBotId)

  return {
    ownerId,
    botId,
    credential,
    hasPrefill: Boolean(ownerId || botId !== null || credential),
  }
}

export function buildClientConfigYaml(form: ClientConfigForm): ClientConfigBuildResult {
  const parsed = parseClientConfigLists(form)
  const lines: string[] = [
    `host: ${quoteYamlString(form.host)}`,
    `port: ${normalizeInteger(form.port, DEFAULT_CLIENT_CONFIG_FORM.port)}`,
    `controlApiPort: ${normalizeInteger(form.controlApiPort, DEFAULT_CLIENT_CONFIG_FORM.controlApiPort)}`,
    form.useControlApiAccessToken
      ? `controlApiAccessToken: ${quoteYamlString(form.controlApiAccessToken)}`
      : "controlApiAccessToken: null",
    `botId: ${normalizeInteger(form.botId, 0)}`,
    `credential: ${quoteYamlString(form.credential)}`,
    `noiseServerPubkey: ${quoteYamlString(form.noiseServerPubkey)}`,
    `noiseServerKeyId: ${quoteYamlString(form.noiseServerKeyId)}`,
    `trustRootPubkey: ${quoteYamlString(form.trustRootPubkey)}`,
    `serverEndpointOverride: ${quoteYamlString(form.serverEndpointOverride)}`,
    `enableDynamicRouting: ${form.enableDynamicRouting}`,
    `routingConfigURL: ${quoteYamlString(form.routingConfigURL)}`,
    `enableHelp: ${form.enableHelp}`,
    `helpContent: ${quoteYamlString(form.helpContent)}`,
    `enableCN: ${form.enableCN}`,
    `enableGroupCommandLimit: ${form.enableGroupCommandLimit}`,
    `globalCommandHourlyLimit: ${normalizeInteger(form.globalCommandHourlyLimit, 0)}`,
    `globalCommandDailyLimit: ${normalizeInteger(form.globalCommandDailyLimit, 0)}`,
    `runMode: ${form.runMode}`,
    `enablePrivateMessage: ${form.enablePrivateMessage}`,
    formatYamlPolicyModes("featurePolicyModes", parsed.featurePolicyModes),
    `enableReplyMessage: ${form.enableReplyMessage}`,
    `sendBase64Image: ${form.sendBase64Image}`,
    `mysekaiBirthdayMonitorNotifyEmpty: ${form.mysekaiBirthdayMonitorNotifyEmpty}`,
    `mysekaiBirthdayMonitorMode: ${form.mysekaiBirthdayMonitorMode}`,
    formatYamlNumberList("mysekaiBirthdayMonitorBlacklist", parsed.mysekaiBirthdayMonitorBlacklist),
    formatYamlNumberList("mysekaiBirthdayMonitorWhitelist", parsed.mysekaiBirthdayMonitorWhitelist),
    `enableParamEcho: ${form.enableParamEcho}`,
    `strictConfigPermissions: ${form.strictConfigPermissions}`,
    formatYamlNumberList("botAdmins", parsed.botAdmins),
    formatYamlStringList("enableModules", parsed.enableModules),
    formatYamlNumberMap("blacklists", parsed.blacklists),
    formatYamlNumberMap("whitelists", parsed.whitelists),
    formatYamlNumberMap("userBlacklists", parsed.userBlacklists),
  ]

  return {
    yaml: `${lines.join("\n")}\n`,
    parsed,
  }
}

export function parseClientConfigLists(form: ClientConfigForm): ParsedClientConfigLists {
  return {
    enableModules: parseStringList(form.enableModulesText, ["all"]),
    featurePolicyModes: parsePolicyModes(form.featurePolicyModesText),
    blacklists: ensureAllScope(parseNumberMap(form.blacklistsText)),
    whitelists: ensureAllScope(parseNumberMap(form.whitelistsText)),
    userBlacklists: ensureAllScope(parseNumberMap(form.userBlacklistsText)),
    mysekaiBirthdayMonitorBlacklist: parseNumberList(form.mysekaiBirthdayMonitorBlacklistText),
    mysekaiBirthdayMonitorWhitelist: parseNumberList(form.mysekaiBirthdayMonitorWhitelistText),
    botAdmins: parseNumberList(form.botAdminsText),
  }
}

export function parseStringList(value: string | number | null | undefined, fallback: string[] = []): string[] {
  const items = normalizeListInput(value)
    .split(/[\n,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)

  return unique(items.length > 0 ? items : fallback)
}

export function parseNumberList(value: string | number | null | undefined): number[] {
  return unique(
    normalizeListInput(value)
      .split(/[\n,，\s]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => Number(item))
      .filter((item) => Number.isSafeInteger(item) && item >= 0),
  )
}

export function parsePolicyModes(value: string): Record<string, ClientFeaturePolicyMode> {
  const result: Record<string, ClientFeaturePolicyMode> = {}

  for (const line of splitMeaningfulLines(value)) {
    const [rawKey, rawValue] = splitKeyValueLine(line)
    const key = rawKey.trim()
    const mode = rawValue.trim()
    if (!key || (mode !== "blacklist" && mode !== "whitelist")) {
      continue
    }
    result[key] = mode
  }

  return result
}

export function parseNumberMap(value: string): Record<string, number[]> {
  const result: Record<string, number[]> = {}

  for (const line of splitMeaningfulLines(value)) {
    const [rawKey, rawValue] = splitKeyValueLine(line)
    const key = rawKey.trim()
    if (!key) {
      continue
    }
    result[key] = parseNumberList(rawValue)
  }

  return result
}

function splitMeaningfulLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
}

function splitKeyValueLine(line: string): [string, string] {
  const separatorIndex = line.search(/[:=：]/)
  if (separatorIndex < 0) {
    return [line, ""]
  }

  return [
    line.slice(0, separatorIndex),
    line.slice(separatorIndex + 1),
  ]
}

function ensureAllScope(map: Record<string, number[]>): Record<string, number[]> {
  return {
    all: [],
    ...map,
  }
}

function formatYamlStringList(key: string, values: string[]): string {
  const normalized = values.length > 0 ? values : ["all"]
  return [
    `${key}:`,
    ...normalized.map((value) => `  - ${quoteYamlString(value)}`),
  ].join("\n")
}

function formatYamlNumberList(key: string, values: number[]): string {
  if (values.length === 0) {
    return `${key}: []`
  }

  return [
    `${key}:`,
    ...values.map((value) => `  - ${value}`),
  ].join("\n")
}

function formatYamlPolicyModes(key: string, values: Record<string, ClientFeaturePolicyMode>): string {
  const entries = Object.entries(values)
  if (entries.length === 0) {
    return `${key}: {}`
  }

  return [
    `${key}:`,
    ...entries.map(([scope, mode]) => `  ${quoteYamlMapKey(scope)}: ${mode}`),
  ].join("\n")
}

function formatYamlNumberMap(key: string, values: Record<string, number[]>): string {
  const entries = Object.entries(values)
  if (entries.length === 0) {
    return `${key}: {}`
  }

  return [
    `${key}:`,
    ...entries.map(([scope, ids]) => (
      ids.length === 0
        ? `  ${quoteYamlMapKey(scope)}: []`
        : [
            `  ${quoteYamlMapKey(scope)}:`,
            ...ids.map((id) => `    - ${id}`),
          ].join("\n")
    )),
  ].join("\n")
}

function quoteYamlMapKey(value: string): string {
  return /^[A-Za-z0-9_-]+$/.test(value) ? value : quoteYamlString(value)
}

function quoteYamlString(value: string): string {
  return JSON.stringify(value ?? "")
}

function normalizeInteger(value: number, fallback: number): number {
  return Number.isSafeInteger(Number(value)) ? Number(value) : fallback
}

function normalizeListInput(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return ""
  }

  return String(value)
}

function readQueryString(value: unknown): string {
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = readQueryString(item)
      if (normalized) {
        return normalized
      }
    }
    return ""
  }

  if (value === null || value === undefined) {
    return ""
  }

  return String(value).trim()
}

function parseQueryInteger(value: string): number | null {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}
