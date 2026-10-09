import { describe, expect, test } from "bun:test"
import {
  getUploadDataTypeOptions,
  getUploadMethodOptions,
  getUploadServerOptions,
  getUploadSortOptions,
  getUploadSuccessOptions,
  resolveUploadAuthMethodLabel,
  resolveUploadAuthorizationSourceLabel,
  resolveUploadDataTypeLabel,
  resolveUploadLogActor,
  resolveUploadLogOwnerId,
  resolveUploadMethodLabel,
  resolveUploadServerLabel,
} from "./upload-log-meta"

const TEST_TRANSLATIONS: Record<string, string> = {
  "adminStatistics.uploadLogs.method.manual": "Manual upload",
  "userSettings.gameBinding.region.jp": "JP",
  "adminStatistics.uploadLogs.dataType.suite": "Suite",
  "adminStatistics.common.fallback": "—",
  "adminStatistics.uploadLogs.authMethod.oauth2": "OAuth2",
  "adminStatistics.uploadLogs.authorizationSource.grant": "Grant",
}

function t(key: string) {
  return TEST_TRANSLATIONS[key] ?? key
}

describe("upload log meta helpers", () => {
  test("resolve known labels", () => {
    expect(resolveUploadMethodLabel("manual", t)).toBe("Manual upload")
    expect(resolveUploadServerLabel("jp", t)).toBe("JP")
    expect(resolveUploadDataTypeLabel("suite", t)).toBe("Suite")
  })

  test("falls back to raw key when unknown", () => {
    expect(resolveUploadMethodLabel("custom-method", t)).toBe("custom-method")
    expect(resolveUploadServerLabel("custom-server", t)).toBe("custom-server")
    expect(resolveUploadDataTypeLabel("custom-type", t)).toBe("custom-type")
    expect(resolveUploadDataTypeLabel(undefined, t)).toBe("—")
  })

  test("resolves auth method and authorization source labels", () => {
    expect(resolveUploadAuthMethodLabel("oauth2", t)).toBe("OAuth2")
    expect(resolveUploadAuthMethodLabel(undefined, t)).toBe("—")
    expect(resolveUploadAuthorizationSourceLabel("grant", t)).toBe("Grant")
    expect(resolveUploadAuthorizationSourceLabel("", t)).toBe("—")
  })

  test("owner id prefers toolboxUserId over the legacy userId", () => {
    expect(resolveUploadLogOwnerId({ toolboxUserId: "owner", userId: "legacy" })).toBe("owner")
    expect(resolveUploadLogOwnerId({ userId: "legacy" })).toBe("legacy")
    expect(resolveUploadLogOwnerId({})).toBeNull()
  })

  test("actor is distinguished from owner", () => {
    expect(resolveUploadLogActor({ toolboxUserId: "a", actorUserId: "a", authorizationSource: "owner" }))
      .toEqual({ kind: "owner", actorUserId: "a" })
    expect(resolveUploadLogActor({ toolboxUserId: "b", actorUserId: "a", authorizationSource: "grant" }))
      .toEqual({ kind: "delegate", actorUserId: "a" })
    // Module proxies and historical rows carry no actor; never fold them into the owner.
    expect(resolveUploadLogActor({ toolboxUserId: "b", authMethod: "game_session_proxy" } as never))
      .toEqual({ kind: "unknown", actorUserId: null })
    // An unowned record with an actor (e.g. identity not verified) is still a distinct actor.
    expect(resolveUploadLogActor({ actorUserId: "a" })).toEqual({ kind: "delegate", actorUserId: "a" })
  })
})

describe("upload log filter options", () => {
  const identity = (key: string) => key

  test("label every option through its translation key", () => {
    const options = [
      ...getUploadMethodOptions(identity),
      ...getUploadServerOptions(identity),
      ...getUploadDataTypeOptions(identity),
      ...getUploadSortOptions(identity),
      ...getUploadSuccessOptions(identity),
    ]
    expect(options.length).toBeGreaterThan(0)
    for (const option of options) {
      expect(option.label).toMatch(/^[\w-]+(\.[\w-]+)+$/)
    }
    expect(getUploadSuccessOptions(identity).map((option) => option.value)).toEqual(["all", "true", "false"])
  })
})
