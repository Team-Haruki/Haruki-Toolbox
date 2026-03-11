import { describe, expect, test } from "bun:test"
import {
  resolveUploadDataTypeLabel,
  resolveUploadMethodLabel,
  resolveUploadServerLabel,
} from "./upload-log-meta"

const TEST_TRANSLATIONS: Record<string, string> = {
  "adminStatistics.uploadLogs.method.manual": "Manual upload",
  "userSettings.gameBinding.region.jp": "JP",
  "adminStatistics.uploadLogs.dataType.suite": "Basic data",
  "adminStatistics.common.fallback": "—",
}

function t(key: string) {
  return TEST_TRANSLATIONS[key] ?? key
}

describe("upload log meta helpers", () => {
  test("resolve known labels", () => {
    expect(resolveUploadMethodLabel("manual", t)).toBe("Manual upload")
    expect(resolveUploadServerLabel("jp", t)).toBe("JP")
    expect(resolveUploadDataTypeLabel("suite", t)).toBe("Basic data")
  })

  test("falls back to raw key when unknown", () => {
    expect(resolveUploadMethodLabel("custom-method", t)).toBe("custom-method")
    expect(resolveUploadServerLabel("custom-server", t)).toBe("custom-server")
    expect(resolveUploadDataTypeLabel("custom-type", t)).toBe("custom-type")
    expect(resolveUploadDataTypeLabel(undefined, t)).toBe("—")
  })
})
