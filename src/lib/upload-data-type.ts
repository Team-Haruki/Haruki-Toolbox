import type { UploadDataType } from "@/types"
import { translate } from "@/shared/i18n"

type UploadDataTypeTranslationKey = Record<UploadDataType, string>

export const UPLOAD_DATA_TYPES: readonly UploadDataType[] = ["suite", "mysekai"]

export const UPLOAD_DATA_TYPE_LABEL_KEYS: UploadDataTypeTranslationKey = {
  suite: "tools.uploadData.dataTypes.suite",
  mysekai: "tools.uploadData.dataTypes.mysekai",
}

export const UPLOAD_DATA_TYPE_OPTIONS: ReadonlyArray<{ value: UploadDataType; labelKey: string }> =
  UPLOAD_DATA_TYPES.map((value) => ({
    value,
    labelKey: UPLOAD_DATA_TYPE_LABEL_KEYS[value],
  }))

const UPLOAD_DATA_TYPE_SET = new Set<string>(UPLOAD_DATA_TYPES)

export function isUploadDataType(value: unknown): value is UploadDataType {
  return typeof value === "string" && UPLOAD_DATA_TYPE_SET.has(value)
}

export function uploadDataTypeLabel(value: UploadDataType): string {
  return translate(UPLOAD_DATA_TYPE_LABEL_KEYS[value])
}
