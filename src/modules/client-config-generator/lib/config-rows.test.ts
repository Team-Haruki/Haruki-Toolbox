import { describe, expect, it } from "bun:test"
import { buildClientConfigYaml, cloneDefaultClientConfigForm } from "./client-config"
import {
  appendModuleRow,
  buildClientConfigFromRows,
  CLIENT_CONFIG_ACCESS_SCOPES,
  createAccessIdRow,
  createDefaultClientConfigRows,
  createFeaturePolicyRow,
  createModuleRow,
  createScopedAccessRow,
  isAccessScope,
  isFeatureScopeOption,
  isModuleOption,
  normalizeRunMode,
  removeRow,
  resetClientConfigRows,
  selectModule,
  serializeAccessIdRows,
  serializeFeaturePolicyRows,
  serializeModuleRows,
  serializeScopedAccessRows,
} from "./config-rows"

describe("client config rows", () => {
  it("starts with all modules and one blank row per list", () => {
    const rows = createDefaultClientConfigRows()

    expect(rows.modules.map((row) => row.module)).toEqual(["all"])
    expect(rows.featurePolicies).toEqual([])
    expect(rows.blacklists.map((row) => [row.scope, row.value])).toEqual([["all", ""]])
    expect(rows.whitelists).toHaveLength(1)
    expect(rows.userBlacklists).toHaveLength(1)
    expect(rows.botAdmins.map((row) => row.value)).toEqual([""])
  })

  it("gives every row its own key", () => {
    const keys = [createModuleRow(), createModuleRow(), createFeaturePolicyRow(), createScopedAccessRow(), createAccessIdRow()].map((row) => row.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("writes the same file as the untouched default form", () => {
    const form = cloneDefaultClientConfigForm()
    expect(buildClientConfigFromRows(form, createDefaultClientConfigRows()).yaml).toBe(buildClientConfigYaml(form).yaml)
  })

  it("pins the file written from filled-in rows", () => {
    const form = cloneDefaultClientConfigForm()
    form.botId = 91145149
    form.credential = "fake-credential"
    const rows = createDefaultClientConfigRows()
    rows.modules.splice(0, 1, createModuleRow("pjsk"), createModuleRow("pjsk"), createModuleRow(""))
    rows.featurePolicies.push(createFeaturePolicyRow("profile", "whitelist"), createFeaturePolicyRow("", "whitelist"), createFeaturePolicyRow(" mysekai "))
    rows.blacklists.splice(0, 1, createScopedAccessRow("all", "123, 456"), createScopedAccessRow("profile", 789), createScopedAccessRow("all", "456 999"), createScopedAccessRow("card", "not a number"))
    rows.whitelists.splice(0, 1, createScopedAccessRow("pjsk", "1000"), createScopedAccessRow("", "2000"))
    rows.userBlacklists.splice(0, 1, createScopedAccessRow("sk", "10002"))
    rows.botAdmins.splice(0, 1, createAccessIdRow("1145"), createAccessIdRow(1919), createAccessIdRow("1145，810"))

    const result = buildClientConfigFromRows(form, rows)

    expect(result.parsed.enableModules).toEqual(["pjsk"])
    expect(result.parsed.botAdmins).toEqual([1145, 1919, 810])
    expect(result.yaml).toBe(`host: "127.0.0.1"
port: 8111
controlApiPort: 8112
controlApiAccessToken: null
botId: 91145149
credential: "fake-credential"
noiseServerPubkey: ""
noiseServerKeyId: ""
trustRootPubkey: ""
serverEndpointOverride: ""
enableDynamicRouting: true
routingConfigURL: ""
enableHelp: true
helpContent: ""
enableCN: true
enableGroupCommandLimit: false
globalCommandHourlyLimit: 0
globalCommandDailyLimit: 0
runMode: blacklist
enablePrivateMessage: true
featurePolicyModes:
  profile: whitelist
  mysekai: blacklist
enableReplyMessage: false
sendBase64Image: false
mysekaiBirthdayMonitorNotifyEmpty: false
mysekaiBirthdayMonitorMode: blacklist
mysekaiBirthdayMonitorBlacklist: []
mysekaiBirthdayMonitorWhitelist: []
enableParamEcho: false
strictConfigPermissions: false
botAdmins:
  - 1145
  - 1919
  - 810
enableModules:
  - "pjsk"
blacklists:
  all:
    - 123
    - 456
    - 999
  profile:
    - 789
whitelists:
  all:
    - 2000
  pjsk:
    - 1000
userBlacklists:
  all: []
  sk:
    - 10002
`)
  })

  it("serializes modules, falling back to all", () => {
    expect(serializeModuleRows([])).toBe("all")
    expect(serializeModuleRows([createModuleRow("")])).toBe("all")
    expect(serializeModuleRows([createModuleRow("pjsk"), createModuleRow("all")])).toBe("all")
    expect(serializeModuleRows([createModuleRow(" pjsk "), createModuleRow("pjsk")])).toBe("pjsk")
  })

  it("serializes feature policies, skipping rows without a scope", () => {
    expect(serializeFeaturePolicyRows([])).toBe("")
    expect(serializeFeaturePolicyRows([createFeaturePolicyRow("card", "whitelist"), createFeaturePolicyRow("  "), createFeaturePolicyRow("music")]))
      .toBe("card: whitelist\nmusic: blacklist")
  })

  it("groups scoped ids by scope and drops duplicates and blanks", () => {
    expect(serializeScopedAccessRows([createScopedAccessRow()])).toBe("")
    expect(serializeScopedAccessRows([
      createScopedAccessRow("all", "1 2"),
      createScopedAccessRow("card", 3),
      createScopedAccessRow("all", "2,4"),
      createScopedAccessRow("  ", "5"),
    ])).toBe("all: 1, 2, 4, 5\ncard: 3")
  })

  it("serializes admin ids one per line without duplicates", () => {
    expect(serializeAccessIdRows([createAccessIdRow()])).toBe("")
    expect(serializeAccessIdRows([createAccessIdRow("1 2"), createAccessIdRow(2), createAccessIdRow("x")])).toBe("1\n2")
  })

  it("removes a row, or blanks the last one of an editor that keeps a row", () => {
    const rows = [createAccessIdRow("1"), createAccessIdRow("2")]
    removeRow(rows, rows[0].key, () => createAccessIdRow())
    expect(rows.map((row) => row.value)).toEqual(["2"])

    removeRow(rows, rows[0].key, () => createAccessIdRow())
    expect(rows.map((row) => row.value)).toEqual([""])

    removeRow(rows, "missing", () => createAccessIdRow("kept"))
    expect(rows.map((row) => row.value)).toEqual(["kept"])
  })

  it("lets an editor without a blank row go empty", () => {
    const rows = [createFeaturePolicyRow("card"), createFeaturePolicyRow("music")]
    removeRow(rows, "missing")
    expect(rows).toHaveLength(2)
    removeRow(rows, rows[0].key)
    removeRow(rows, rows[0].key)
    expect(rows).toEqual([])
  })

  it("starts a specific-module list when adding next to all", () => {
    const rows = [createModuleRow("all")]
    appendModuleRow(rows)
    expect(rows.map((row) => row.module)).toEqual([""])

    selectModule(rows, rows[0], "pjsk")
    appendModuleRow(rows)
    expect(rows.map((row) => row.module)).toEqual(["pjsk", ""])
  })

  it("makes all exclusive with specific modules", () => {
    const rows = [createModuleRow("pjsk"), createModuleRow("")]
    selectModule(rows, rows[1], "all")
    expect(rows.map((row) => row.module)).toEqual(["all"])

    rows.push(createModuleRow(""))
    selectModule(rows, rows[1], "pjsk")
    expect(rows.map((row) => row.module)).toEqual(["pjsk"])

    selectModule(rows, rows[0], "unknown")
    expect(rows.map((row) => row.module)).toEqual([""])
  })

  it("puts every editor back to its starting rows", () => {
    const rows = createDefaultClientConfigRows()
    rows.modules.splice(0, 1, createModuleRow("pjsk"))
    rows.featurePolicies.push(createFeaturePolicyRow("card"))
    rows.blacklists.push(createScopedAccessRow("card", "1"))
    rows.whitelists.push(createScopedAccessRow("card", "2"))
    rows.userBlacklists.push(createScopedAccessRow("card", "3"))
    rows.botAdmins.push(createAccessIdRow("4"))
    const lists = { ...rows }

    resetClientConfigRows(rows)

    // Reset in place: the page's reactive arrays stay the same objects.
    expect(rows.modules).toBe(lists.modules)
    expect(rows.botAdmins).toBe(lists.botAdmins)
    expect(buildClientConfigFromRows(cloneDefaultClientConfigForm(), rows).yaml)
      .toBe(buildClientConfigYaml(cloneDefaultClientConfigForm()).yaml)
    expect(rows.featurePolicies).toEqual([])
    expect(rows.blacklists).toHaveLength(1)
  })

  it("recognises the selectable options", () => {
    expect(isModuleOption("pjsk")).toBe(true)
    expect(isModuleOption("card")).toBe(false)
    expect(isModuleOption(1)).toBe(false)
    expect(isFeatureScopeOption("birthday_monitor")).toBe(true)
    expect(isFeatureScopeOption("all")).toBe(false)
    expect(isFeatureScopeOption(null)).toBe(false)
    expect(isAccessScope("all")).toBe(true)
    expect(isAccessScope("pjsk")).toBe(true)
    expect(isAccessScope("vlive")).toBe(true)
    expect(isAccessScope("nope")).toBe(false)
    expect(isAccessScope(undefined)).toBe(false)
    expect(CLIENT_CONFIG_ACCESS_SCOPES.filter((scope) => scope === "all")).toHaveLength(1)
  })

  it("reads anything but whitelist as blacklist mode", () => {
    expect(normalizeRunMode("whitelist")).toBe("whitelist")
    expect(normalizeRunMode("blacklist")).toBe("blacklist")
    expect(normalizeRunMode(null)).toBe("blacklist")
  })
})
