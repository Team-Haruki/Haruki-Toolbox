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

const UPLOAD_SUCCESS_VALUES = ["all", "true", "false"] as const

const UPLOAD_SUCCESS_LABEL_KEY: Record<(typeof UPLOAD_SUCCESS_VALUES)[number], string> = {
  all: "adminStatistics.uploadLogs.filters.allStatuses",
  true: "adminStatistics.common.success",
  false: "adminStatistics.common.failure",
}

function toOption<T extends readonly string[]>(
  values: T,
  labels: Record<T[number], string>,
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
