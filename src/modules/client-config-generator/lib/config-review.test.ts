import { describe, expect, it } from "bun:test"
import { cloneDefaultClientConfigForm } from "./client-config"
import {
  CLIENT_CONFIG_ADVANCED_FIELDS,
  countAdvancedChanges,
  countChangedFields,
  findMissingEssentials,
  isPrefillStillApplied,
  isValidPort,
  resolveRoutingState,
} from "./config-review"

describe("client config review", () => {
  it("resolves which routing a client will use", () => {
    expect(resolveRoutingState({ serverEndpointOverride: "", enableDynamicRouting: true })).toBe("dynamic")
    expect(resolveRoutingState({ serverEndpointOverride: "   ", enableDynamicRouting: false })).toBe("builtIn")
    expect(resolveRoutingState({ serverEndpointOverride: "https://example.com", enableDynamicRouting: true })).toBe("pinned")
    expect(resolveRoutingState({ serverEndpointOverride: "https://example.com", enableDynamicRouting: false })).toBe("pinned")
  })

  it("accepts whole port numbers in range", () => {
    expect(isValidPort(8111)).toBe(true)
    expect(isValidPort("65535")).toBe(true)
    expect(isValidPort(0)).toBe(false)
    expect(isValidPort(0, 0)).toBe(true)
    expect(isValidPort(65536)).toBe(false)
    expect(isValidPort(80.5)).toBe(false)
    expect(isValidPort("")).toBe(false)
    expect(isValidPort("  ", 0)).toBe(false)
    expect(isValidPort("abc")).toBe(false)
    expect(isValidPort(null)).toBe(false)
    expect(isValidPort(undefined, 0)).toBe(false)
  })

  it("lists the essentials a fresh form still lacks", () => {
    const form = cloneDefaultClientConfigForm()
    expect(findMissingEssentials(form)).toEqual(["botId", "credential"])

    form.botId = 91145149
    expect(findMissingEssentials(form)).toEqual(["credential"])

    form.credential = "  fake-credential  "
    expect(findMissingEssentials(form)).toEqual([])

    expect(findMissingEssentials({ botId: "" as unknown as number, credential: "x" })).toEqual(["botId"])
    expect(findMissingEssentials({ botId: -1, credential: "   " })).toEqual(["botId", "credential"])
    expect(findMissingEssentials({ botId: 1.5, credential: null as unknown as string })).toEqual(["botId", "credential"])
  })

  it("counts nothing as changed on a fresh form", () => {
    expect(countAdvancedChanges(cloneDefaultClientConfigForm())).toEqual({ routing: 0, security: 0, rateLimit: 0, birthday: 0 })
  })

  it("counts changed fields per advanced group", () => {
    const form = cloneDefaultClientConfigForm()
    form.serverEndpointOverride = "https://example.com/pinned"
    form.enableDynamicRouting = false
    form.noiseServerKeyId = "noise-2026-09"
    form.useControlApiAccessToken = true
    form.controlApiAccessToken = "local-token"
    form.enableGroupCommandLimit = true
    form.globalCommandHourlyLimit = 100
    form.globalCommandDailyLimit = 1000
    form.mysekaiBirthdayMonitorMode = "whitelist"
    form.mysekaiBirthdayMonitorNotifyEmpty = true

    expect(countAdvancedChanges(form)).toEqual({ routing: 2, security: 2, rateLimit: 3, birthday: 2 })
  })

  it("ignores whitespace, emptied numbers and the unused token text", () => {
    const form = cloneDefaultClientConfigForm()
    form.routingConfigURL = "   "
    form.controlApiAccessToken = "typed but switched off"
    form.globalCommandHourlyLimit = "" as unknown as number
    form.globalCommandDailyLimit = "0" as unknown as number

    expect(countAdvancedChanges(form)).toEqual({ routing: 0, security: 0, rateLimit: 0, birthday: 0 })
    expect(countChangedFields(form, ["controlApiAccessToken"])).toBe(1)
  })

  it("covers every advanced field exactly once", () => {
    const fields = Object.values(CLIENT_CONFIG_ADVANCED_FIELDS).flat()
    expect(new Set(fields).size).toBe(fields.length)
  })

  it("keeps the registration note while a handed-over value is still in the form", () => {
    const query = { ownerId: "10001", botId: "91145149", credential: "fake-credential" }

    expect(isPrefillStillApplied(query, { botId: 91145149, credential: "fake-credential" })).toBe(true)
    expect(isPrefillStillApplied(query, { botId: 91145149, credential: "edited" })).toBe(true)
    expect(isPrefillStillApplied(query, { botId: 7, credential: "fake-credential" })).toBe(true)
  })

  it("drops the registration note once the handed-over values are gone", () => {
    const query = { ownerId: "10001", botId: "91145149", credential: "fake-credential" }

    expect(isPrefillStillApplied(query, { botId: 0, credential: "" })).toBe(false)
    expect(isPrefillStillApplied({}, { botId: 91145149, credential: "fake-credential" })).toBe(false)
  })

  it("keeps the note for a link that only names the owner", () => {
    expect(isPrefillStillApplied({ owner_id: "10001" }, { botId: 0, credential: "" })).toBe(true)
  })
})
