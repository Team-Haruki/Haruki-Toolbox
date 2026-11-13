import { describe, expect, it } from "bun:test"
import {
  buildClientConfigYaml,
  cloneDefaultClientConfigForm,
  parseNumberList,
  parseNumberMap,
  parsePolicyModes,
  resolveClientConfigPrefillParams,
} from "./client-config"

describe("client config generator", () => {
  it("builds current Haruki Client v3 YAML", () => {
    const form = cloneDefaultClientConfigForm()
    form.botId = 91145149
    form.credential = "jwt-token"
    form.routingConfigURL = "https://example.com/routing.json"
    form.mysekaiBirthdayMonitorMode = "whitelist"
    form.mysekaiBirthdayMonitorWhitelistText = "10001\n10002"
    form.enableModulesText = "all\npjsk"
    form.blacklistsText = "all: 123,456"
    form.botAdminsText = "1145\n1919"

    expect(buildClientConfigYaml(form).yaml).toBe(`host: "127.0.0.1"
port: 8111
controlApiPort: 8112
controlApiAccessToken: null
botId: 91145149
credential: "jwt-token"
noiseServerPubkey: ""
noiseServerKeyId: ""
trustRootPubkey: ""
serverEndpointOverride: ""
enableDynamicRouting: true
routingConfigURL: "https://example.com/routing.json"
enableHelp: true
helpContent: ""
enableCN: true
enableGroupCommandLimit: false
globalCommandHourlyLimit: 0
globalCommandDailyLimit: 0
runMode: blacklist
enablePrivateMessage: true
featurePolicyModes: {}
enableReplyMessage: false
sendBase64Image: false
mysekaiBirthdayMonitorNotifyEmpty: false
mysekaiBirthdayMonitorMode: whitelist
mysekaiBirthdayMonitorBlacklist: []
mysekaiBirthdayMonitorWhitelist:
  - 10001
  - 10002
enableParamEcho: false
strictConfigPermissions: false
botAdmins:
  - 1145
  - 1919
enableModules:
  - "all"
  - "pjsk"
blacklists:
  all:
    - 123
    - 456
whitelists:
  all: []
userBlacklists:
  all: []
`)
  })

  // Byte-for-byte pins of the generated file: the page was rebuilt around this
  // builder, and a client reads the result, so the output must not drift.
  it("pins the output of the untouched default form", () => {
    expect(buildClientConfigYaml(cloneDefaultClientConfigForm()).yaml).toBe(`host: "127.0.0.1"
port: 8111
controlApiPort: 8112
controlApiAccessToken: null
botId: 0
credential: ""
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
featurePolicyModes: {}
enableReplyMessage: false
sendBase64Image: false
mysekaiBirthdayMonitorNotifyEmpty: false
mysekaiBirthdayMonitorMode: blacklist
mysekaiBirthdayMonitorBlacklist: []
mysekaiBirthdayMonitorWhitelist: []
enableParamEcho: false
strictConfigPermissions: false
botAdmins: []
enableModules:
  - "all"
blacklists:
  all: []
whitelists:
  all: []
userBlacklists:
  all: []
`)
  })

  it("pins the output of a form with every field changed", () => {
    const form = cloneDefaultClientConfigForm()
    form.host = "0.0.0.0"
    form.port = 9001
    form.controlApiPort = 0
    form.useControlApiAccessToken = true
    form.controlApiAccessToken = 'tok"en\\with:odd #chars'
    form.botId = 91145149
    form.credential = "fake.jwt.credential"
    form.noiseServerPubkey = "cd".repeat(32)
    form.noiseServerKeyId = "noise-2026-09"
    form.trustRootPubkey = "ab".repeat(32)
    form.serverEndpointOverride = "https://example.com/pinned"
    form.enableDynamicRouting = false
    form.routingConfigURL = "https://example.com/routing-v3.json"
    form.enableHelp = false
    form.helpContent = "第一行\nsecond line: with colon"
    form.enableCN = false
    form.enablePrivateMessage = false
    form.enableReplyMessage = true
    form.sendBase64Image = true
    form.mysekaiBirthdayMonitorNotifyEmpty = true
    form.mysekaiBirthdayMonitorMode = "whitelist"
    form.mysekaiBirthdayMonitorBlacklistText = "111, 222，333 111"
    form.mysekaiBirthdayMonitorWhitelistText = "444\n555\nabc\n-1"
    form.enableParamEcho = true
    form.strictConfigPermissions = true
    form.enableGroupCommandLimit = true
    form.globalCommandHourlyLimit = 120
    form.globalCommandDailyLimit = 2400
    form.runMode = "whitelist"
    form.enableModulesText = "pjsk"
    form.featurePolicyModesText = "profile: whitelist\nmysekai: blacklist\nbad scope: whitelist\nmusic: nonsense"
    form.blacklistsText = "all: 123, 456\nprofile: 789"
    form.whitelistsText = "pjsk: 1000\ncard: 2000, 3000"
    form.userBlacklistsText = "all: 10001\nsk: 10002"
    form.botAdminsText = "1145\n1919"

    expect(buildClientConfigYaml(form).yaml).toBe(`host: "0.0.0.0"
port: 9001
controlApiPort: 0
controlApiAccessToken: "tok\\"en\\\\with:odd #chars"
botId: 91145149
credential: "fake.jwt.credential"
noiseServerPubkey: "cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd"
noiseServerKeyId: "noise-2026-09"
trustRootPubkey: "abababababababababababababababababababababababababababababababab"
serverEndpointOverride: "https://example.com/pinned"
enableDynamicRouting: false
routingConfigURL: "https://example.com/routing-v3.json"
enableHelp: false
helpContent: "第一行\\nsecond line: with colon"
enableCN: false
enableGroupCommandLimit: true
globalCommandHourlyLimit: 120
globalCommandDailyLimit: 2400
runMode: whitelist
enablePrivateMessage: false
featurePolicyModes:
  profile: whitelist
  mysekai: blacklist
  "bad scope": whitelist
enableReplyMessage: true
sendBase64Image: true
mysekaiBirthdayMonitorNotifyEmpty: true
mysekaiBirthdayMonitorMode: whitelist
mysekaiBirthdayMonitorBlacklist:
  - 111
  - 222
  - 333
mysekaiBirthdayMonitorWhitelist:
  - 444
  - 555
enableParamEcho: true
strictConfigPermissions: true
botAdmins:
  - 1145
  - 1919
enableModules:
  - "pjsk"
blacklists:
  all:
    - 123
    - 456
  profile:
    - 789
whitelists:
  all: []
  pjsk:
    - 1000
  card:
    - 2000
    - 3000
userBlacklists:
  all:
    - 10001
  sk:
    - 10002
`)
  })

  it("pins an endpoint and serializes an access token when requested", () => {
    const form = cloneDefaultClientConfigForm()
    form.serverEndpointOverride = "https://example.com/pinned-endpoint"
    form.useControlApiAccessToken = true
    form.controlApiAccessToken = "local-token"

    const yaml = buildClientConfigYaml(form).yaml

    expect(yaml).toContain('controlApiAccessToken: "local-token"')
    expect(yaml).toContain('serverEndpointOverride: "https://example.com/pinned-endpoint"')
    expect(yaml).toContain("enableDynamicRouting: true")
    expect(yaml).toContain('routingConfigURL: ""')
    expect(yaml).not.toContain("authEncryptionKey")
  })

  it("serializes the new routing, private-chat, trust, and permission fields", () => {
    const form = cloneDefaultClientConfigForm()
    form.noiseServerKeyId = "noise-2026-09"
    form.trustRootPubkey = "ab".repeat(32)
    form.enableDynamicRouting = false
    form.enablePrivateMessage = false
    form.strictConfigPermissions = true

    const yaml = buildClientConfigYaml(form).yaml

    expect(yaml).toContain('noiseServerKeyId: "noise-2026-09"')
    expect(yaml).toContain(`trustRootPubkey: "${"ab".repeat(32)}"`)
    expect(yaml).toContain("enableDynamicRouting: false")
    expect(yaml).toContain("enablePrivateMessage: false")
    expect(yaml).toContain("strictConfigPermissions: true")
  })

  it("parses scoped policy modes and number maps", () => {
    expect(parsePolicyModes("profile: whitelist\nmysekai = blacklist")).toEqual({
      profile: "whitelist",
      mysekai: "blacklist",
    })

    expect(parseNumberMap("all: 100 200\nprofile: 300, 300, invalid")).toEqual({
      all: [100, 200],
      profile: [300],
    })
  })

  it("accepts numeric values from number-like inputs", () => {
    expect(parseNumberList(123456)).toEqual([123456])
    expect(parseNumberList(null)).toEqual([])
  })

  it("resolves registration prefill query params", () => {
    expect(resolveClientConfigPrefillParams({
      ownerId: "114514",
      botId: "91145149",
      credential: "jwt-token",
    })).toEqual({
      ownerId: "114514",
      botId: 91145149,
      credential: "jwt-token",
      hasPrefill: true,
    })

    expect(resolveClientConfigPrefillParams({
      owner_id: ["", "1919810"],
      bot_id: "invalid",
    })).toEqual({
      ownerId: "1919810",
      botId: null,
      credential: "",
      hasPrefill: true,
    })
  })
})
