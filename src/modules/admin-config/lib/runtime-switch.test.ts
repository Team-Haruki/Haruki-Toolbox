import { describe, expect, test } from "bun:test"
import { RUNTIME_SWITCH_KEYS, buildRuntimeSwitchPayload, readRuntimeSwitch } from "./runtime-switch"

const KEY = RUNTIME_SWITCH_KEYS.oauth2DeviceFlow

describe("readRuntimeSwitch", () => {
  test("uses the backend member name", () => {
    expect(KEY).toBe("oauth2DeviceFlowEnabled")
  })

  test("is on only for an explicit true", () => {
    expect(readRuntimeSwitch({ oauth2DeviceFlowEnabled: true, webhookEnabled: false }, KEY)).toBe(true)
    expect(readRuntimeSwitch({ oauth2DeviceFlowEnabled: false }, KEY)).toBe(false)
  })

  test("a missing member reads as off", () => {
    // A backend without the switch (before BE-6) or a snapshot that lost it.
    expect(readRuntimeSwitch({ webhookEnabled: true, publicApiAllowedKeys: [] }, KEY)).toBe(false)
    expect(readRuntimeSwitch({}, KEY)).toBe(false)
    expect(readRuntimeSwitch(null, KEY)).toBe(false)
    expect(readRuntimeSwitch(undefined, KEY)).toBe(false)
  })

  test("anything but a boolean true reads as off", () => {
    expect(readRuntimeSwitch({ oauth2DeviceFlowEnabled: "true" }, KEY)).toBe(false)
    expect(readRuntimeSwitch({ oauth2DeviceFlowEnabled: 1 }, KEY)).toBe(false)
    expect(readRuntimeSwitch({ oauth2DeviceFlowEnabled: null }, KEY)).toBe(false)
  })
})

describe("buildRuntimeSwitchPayload", () => {
  test("carries only the switch", () => {
    expect(buildRuntimeSwitchPayload(KEY, true)).toEqual({ oauth2DeviceFlowEnabled: true })
    expect(buildRuntimeSwitchPayload(KEY, false)).toEqual({ oauth2DeviceFlowEnabled: false })
  })
})
