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
  it("builds current Haruki Client YAML with dynamic routing fields", () => {
    const form = cloneDefaultClientConfigForm()
    form.botId = 91145149
    form.credential = "jwt-token"
    form.routingConfigURL = "https://example.com/routing.json"
    form.enableModulesText = "all\npjsk"
    form.blacklistsText = "all: 123,456"
    form.botAdminsText = "1145\n1919"

    expect(buildClientConfigYaml(form).yaml).toBe(`host: "127.0.0.1"
port: 8111
controlApiPort: 8112
controlApiAccessToken: null
botId: 91145149
credential: "jwt-token"
authEncryptionKey: ""
noiseServerPubkey: ""
serverEndpointOverride: ""
routingConfigURL: "https://example.com/routing.json"
enableHelp: true
helpContent: ""
enableCN: true
enableReplyMessage: false
enableGroupCommandLimit: false
globalCommandHourlyLimit: 0
globalCommandDailyLimit: 0
runMode: blacklist
enableModules:
  - "all"
  - "pjsk"
featurePolicyModes: {}
blacklists:
  all:
    - 123
    - 456
whitelists:
  all: []
userBlacklists:
  all: []
botAdmins:
  - 1145
  - 1919
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
    expect(yaml).toContain('routingConfigURL: ""')
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
