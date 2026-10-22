import { SEKAI_REGIONS } from "@/lib/sekai-region"
import { UPLOAD_DATA_TYPES } from "@/lib/upload-data-type"

type TranslateFn = (key: string, params?: Record<string, unknown>) => string
type Option = { value: string; label: string }

export const DEFAULT_UPLOAD_LOG_SORT = "upload_time_desc"

export const CHART_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
] as const

const UPLOAD_METHOD_VALUES = [
  "all",
  "manual",
  "ios_proxy",
  "ios_script",
  "haruki_proxy",
  "inherit",
] as const

const UPLOAD_METHOD_LABEL_KEY: Record<(typeof UPLOAD_METHOD_VALUES)[number], string> = {
  all: "adminStatistics.uploadLogs.filters.allMethods",
  manual: "adminStatistics.uploadLogs.method.manual",
  ios_proxy: "adminStatistics.uploadLogs.method.iosProxy",
  ios_script: "adminStatistics.uploadLogs.method.iosScript",
  haruki_proxy: "adminStatistics.uploadLogs.method.harukiProxy",
  inherit: "adminStatistics.uploadLogs.method.inherit",
}

const UPLOAD_DATA_TYPE_VALUES = ["all", ...UPLOAD_DATA_TYPES] as const

const UPLOAD_DATA_TYPE_LABEL_KEY: Record<(typeof UPLOAD_DATA_TYPE_VALUES)[number], string> = {
  all: "adminStatistics.uploadLogs.filters.allDataTypes",
  suite: "adminStatistics.uploadLogs.dataType.suite",
  mysekai: "adminStatistics.uploadLogs.dataType.mysekai",
}

const UPLOAD_SERVER_VALUES = ["all", ...SEKAI_REGIONS] as const

const UPLOAD_SERVER_LABEL_KEY: Record<(typeof UPLOAD_SERVER_VALUES)[number], string> = {
  all: "adminStatistics.uploadLogs.filters.allServers",
  jp: "userSettings.gameBinding.region.jp",
  en: "userSettings.gameBinding.region.en",
  tw: "userSettings.gameBinding.region.tw",
  kr: "userSettings.gameBinding.region.kr",
  cn: "userSettings.gameBinding.region.cn",
}

const UPLOAD_SORT_VALUES = [
  "upload_time_desc",
  "upload_time_asc",
  "id_desc",
  "id_asc",
] as const

const UPLOAD_SORT_LABEL_KEY: Record<(typeof UPLOAD_SORT_VALUES)[number], string> = {
  upload_time_desc: "adminStatistics.uploadLogs.sort.uploadTimeDesc",
  upload_time_asc: "adminStatistics.uploadLogs.sort.uploadTimeAsc",
  id_desc: "adminStatistics.uploadLogs.sort.idDesc",
  id_asc: "adminStatistics.uploadLogs.sort.idAsc",
}

const UPLOAD_AUTH_METHOD_LABEL_KEY: Record<string, string> = {
  browser_session: "adminStatistics.uploadLogs.authMethod.browserSession",
  oauth2: "adminStatistics.uploadLogs.authMethod.oauth2",
  ios_user_code: "adminStatistics.uploadLogs.authMethod.iosUserCode",
  game_session_proxy: "adminStatistics.uploadLogs.authMethod.gameSessionProxy",
}

const UPLOAD_AUTHORIZATION_SOURCE_LABEL_KEY: Record<string, string> = {
  owner: "adminStatistics.uploadLogs.authorizationSource.owner",
  grant: "adminStatistics.uploadLogs.authorizationSource.grant",
}

const UPLOAD_SUCCESS_VALUES = ["all", "true", "false"] as const

const UPLOAD_SUCCESS_LABEL_KEY: Record<(typeof UPLOAD_SUCCESS_VALUES)[number], string> = {
  all: "adminStatistics.uploadLogs.filters.allStatuses",
  true: "adminStatistics.common.success",
  false: "adminStatistics.common.failure",
}

function toOption<K extends string>(
  values: readonly K[],
  labels: Record<K, string>,
  t: TranslateFn
): Option[] {
  return values.map((value) => ({
    value,
    label: t(labels[value]),
  }))
}

export function getUploadMethodOptions(t: TranslateFn) {
  return toOption(UPLOAD_METHOD_VALUES, UPLOAD_METHOD_LABEL_KEY, t)
}

export function getUploadServerOptions(t: TranslateFn) {
  return toOption(UPLOAD_SERVER_VALUES, UPLOAD_SERVER_LABEL_KEY, t)
}

export function getUploadDataTypeOptions(t: TranslateFn) {
  return toOption(UPLOAD_DATA_TYPE_VALUES, UPLOAD_DATA_TYPE_LABEL_KEY, t)
}

export function getUploadSortOptions(t: TranslateFn) {
  return toOption(UPLOAD_SORT_VALUES, UPLOAD_SORT_LABEL_KEY, t)
}

export function getUploadSuccessOptions(t: TranslateFn) {
  return toOption(UPLOAD_SUCCESS_VALUES, UPLOAD_SUCCESS_LABEL_KEY, t)
}

function resolveLabel(
  value: string | undefined,
  labels: Record<string, string>,
  t: TranslateFn
): string {
  if (!value) {
    return t("adminStatistics.common.fallback")
  }
  const key = labels[value]
  return key ? t(key) : value
}

export function resolveUploadMethodLabel(method: string | undefined, t: TranslateFn) {
  return resolveLabel(method, UPLOAD_METHOD_LABEL_KEY, t)
}

export function resolveUploadServerLabel(server: string | undefined, t: TranslateFn) {
  return resolveLabel(server, UPLOAD_SERVER_LABEL_KEY, t)
}

export function resolveUploadDataTypeLabel(type: string | undefined, t: TranslateFn) {
  return resolveLabel(type, UPLOAD_DATA_TYPE_LABEL_KEY, t)
}

export function resolveUploadAuthMethodLabel(method: string | undefined, t: TranslateFn) {
  return resolveLabel(method, UPLOAD_AUTH_METHOD_LABEL_KEY, t)
}

export function resolveUploadAuthorizationSourceLabel(source: string | undefined, t: TranslateFn) {
  return resolveLabel(source, UPLOAD_AUTHORIZATION_SOURCE_LABEL_KEY, t)
}

/** Filter values the page accepts (also from the URL); "all" is the select's "no filter" entry. */
export const UPLOAD_METHOD_FILTER_VALUES: readonly string[] = UPLOAD_METHOD_VALUES.filter((value) => value !== "all")
export const UPLOAD_DATA_TYPE_FILTER_VALUES: readonly string[] = UPLOAD_DATA_TYPE_VALUES.filter((value) => value !== "all")
export const UPLOAD_SERVER_FILTER_VALUES: readonly string[] = UPLOAD_SERVER_VALUES.filter((value) => value !== "all")
export const UPLOAD_SORT_FILTER_VALUES: readonly string[] = UPLOAD_SORT_VALUES
export const UPLOAD_SUCCESS_FILTER_VALUES: readonly string[] = UPLOAD_SUCCESS_VALUES

/**
 * Summary of a multi-select: the single pick's label, or the first pick plus
 * a "+N" count so the trigger never overflows ("日服 +2"). The full list goes
 * in the trigger's tooltip (`describeMultiFilterSelection`).
 */
export function resolveMultiFilterLabel(
  values: readonly string[],
  options: ReadonlyArray<Option>,
  fallback: string,
  more: (first: string, count: number) => string,
): string {
  const selected = options.filter((option) => values.includes(option.value))
  if (selected.length === 0) {
    return fallback
  }
  const first = selected[0]!.label
  return selected.length === 1 ? first : more(first, selected.length - 1)
}

/** Every selected label, for the trigger's tooltip. */
export function describeMultiFilterSelection(values: readonly string[], options: ReadonlyArray<Option>): string {
  return options
    .filter((option) => values.includes(option.value))
    .map((option) => option.label)
    .join(", ")
}

/** The user the data belongs to; older payloads carried it as `userId`. */
export function resolveUploadLogOwnerId(log: { toolboxUserId?: string; userId?: string }): string | null {
  return log.toolboxUserId || log.userId || null
}

export type UploadLogActorKind = "owner" | "delegate" | "unknown"

/**
 * Who actually performed the upload, relative to the owner. A module proxy
 * (no toolbox user) and historical rows have no actor at all — they are never
 * presented as the owner uploading in person.
 */
export function resolveUploadLogActor(log: {
  toolboxUserId?: string
  userId?: string
  actorUserId?: string
  authorizationSource?: string
}): { kind: UploadLogActorKind; actorUserId: string | null } {
  const actorUserId = log.actorUserId || null
  if (!actorUserId) {
    return { kind: "unknown", actorUserId: null }
  }
  const ownerId = resolveUploadLogOwnerId(log)
  if (ownerId && actorUserId === ownerId && log.authorizationSource !== "grant") {
    return { kind: "owner", actorUserId }
  }
  return { kind: "delegate", actorUserId }
}
