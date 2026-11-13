import { describe, expect, it } from "bun:test"
import {
  classifySettingsAction,
  isDangerousSettingsAction,
  isKratosSettingsMethodGroup,
  pickSettingsEnterTarget,
  resolveSettingsDangerKind,
  resolveSettingsDangerVerb,
  resolveSettingsMethodStatus,
  splitSettingsCodeList,
} from "./kratos-settings-groups"

const submit = (name: string, labelId: number | null = null, extra: { value?: string; disabled?: boolean } = {}) => ({
  name,
  labelId,
  ...extra,
})

describe("classifySettingsAction", () => {
  it("marks removals, unlinks and disables as dangerous by node name or label id", () => {
    for (const name of ["unlink", "totp_unlink", "lookup_secret_disable", "webauthn_remove", "passkey_remove"]) {
      expect(isDangerousSettingsAction(submit(name))).toBe(true)
      expect(classifySettingsAction(submit(name))).toBe("danger")
    }
    // A renamed node is still caught by the Kratos text id of its label.
    expect(classifySettingsAction(submit("something_else", 1050020))).toBe("danger")
    expect(isDangerousSettingsAction(submit("method", 1070003))).toBe(false)
  })

  it("treats saves and the backup-code confirmation as the filled button", () => {
    expect(classifySettingsAction(submit("method", 1070003, { value: "profile" }))).toBe("commit")
    expect(classifySettingsAction(submit("method", 1070003, { value: "totp" }))).toBe("commit")
    expect(classifySettingsAction(submit("lookup_secret_confirm", 1050011))).toBe("commit")
    expect(classifySettingsAction(submit("renamed_confirm", 1050011))).toBe("commit")
  })

  it("treats add, generate, reveal and link as outline starters", () => {
    expect(classifySettingsAction(submit("passkey_register_trigger", 1050019))).toBe("start")
    expect(classifySettingsAction(submit("webauthn_register_trigger", 1050012))).toBe("start")
    expect(classifySettingsAction(submit("lookup_secret_regenerate", 1050008))).toBe("start")
    expect(classifySettingsAction(submit("lookup_secret_reveal", 1050007))).toBe("start")
    expect(classifySettingsAction(submit("link", 1050002, { value: "google" }))).toBe("start")
    expect(classifySettingsAction({ name: "link" })).toBe("start")
  })
})

describe("resolveSettingsDangerKind", () => {
  it("names what is being removed", () => {
    expect(resolveSettingsDangerKind(submit("passkey_remove"))).toBe("removePasskey")
    expect(resolveSettingsDangerKind(submit("webauthn_remove"))).toBe("removeSecurityKey")
    expect(resolveSettingsDangerKind(submit("totp_unlink"))).toBe("disableTotp")
    expect(resolveSettingsDangerKind(submit("lookup_secret_disable"))).toBe("disableLookup")
    expect(resolveSettingsDangerKind(submit("unlink"))).toBe("unlinkProvider")
  })

  it("falls back to the label id, then to a generic wording", () => {
    expect(resolveSettingsDangerKind(submit("renamed", 1050018))).toBe("removeSecurityKey")
    expect(resolveSettingsDangerKind(submit("renamed", 1050003))).toBe("unlinkProvider")
    expect(resolveSettingsDangerKind(submit("renamed", 1234))).toBe("generic")
    expect(resolveSettingsDangerKind(submit("renamed"))).toBe("generic")
  })

  it("picks the confirmation verb", () => {
    expect(resolveSettingsDangerVerb("removePasskey")).toBe("remove")
    expect(resolveSettingsDangerVerb("removeSecurityKey")).toBe("remove")
    expect(resolveSettingsDangerVerb("generic")).toBe("remove")
    expect(resolveSettingsDangerVerb("disableTotp")).toBe("disable")
    expect(resolveSettingsDangerVerb("disableLookup")).toBe("disable")
    expect(resolveSettingsDangerVerb("unlinkProvider")).toBe("unlink")
  })
})

describe("resolveSettingsMethodStatus", () => {
  it("knows the second-step method groups", () => {
    expect(isKratosSettingsMethodGroup("totp")).toBe(true)
    expect(isKratosSettingsMethodGroup("lookup_secret")).toBe(true)
    expect(isKratosSettingsMethodGroup("oidc")).toBe(false)
    expect(isKratosSettingsMethodGroup("profile")).toBe(false)
  })

  it("reads passkeys and security keys from their remove buttons", () => {
    expect(resolveSettingsMethodStatus("passkey", [])).toBe("off")
    expect(resolveSettingsMethodStatus("passkey", [submit("passkey_remove")])).toBe("on")
    expect(resolveSettingsMethodStatus("webauthn", [submit("passkey_remove")])).toBe("off")
    expect(resolveSettingsMethodStatus("webauthn", [submit("webauthn_remove"), submit("webauthn_remove")])).toBe("on")
  })

  it("reads the authenticator app from its unlink button", () => {
    expect(resolveSettingsMethodStatus("totp", [submit("method", 1070003, { value: "totp" })])).toBe("off")
    expect(resolveSettingsMethodStatus("totp", [submit("totp_unlink")])).toBe("on")
  })

  it("tells generated-but-unconfirmed backup codes from active ones", () => {
    expect(resolveSettingsMethodStatus("lookup_secret", [submit("lookup_secret_regenerate")])).toBe("off")
    expect(resolveSettingsMethodStatus("lookup_secret", [submit("lookup_secret_confirm")])).toBe("pending")
    expect(resolveSettingsMethodStatus("lookup_secret", [submit("lookup_secret_reveal"), submit("lookup_secret_disable")])).toBe("on")
    expect(resolveSettingsMethodStatus("lookup_secret", [submit("lookup_secret_disable")])).toBe("on")
  })
})

describe("pickSettingsEnterTarget", () => {
  const trigger = (name: string, disabled = false) => ({ name, labelId: null, disabled })

  it("presses the group's save", () => {
    const save = submit("method", 1070003, { value: "totp" })
    expect(pickSettingsEnterTarget([save], [])).toEqual({ kind: "submit", action: save })
  })

  it("never presses a removal, even when it comes first", () => {
    const remove = submit("webauthn_remove", 1050018)
    const add = trigger("webauthn_register_trigger")
    expect(pickSettingsEnterTarget([remove], [add])).toEqual({ kind: "trigger", action: add })
    expect(pickSettingsEnterTarget([remove], [])).toBeNull()
  })

  it("prefers a save over a trigger and a trigger over a plain submit", () => {
    const save = submit("method", 1070003, { value: "profile" })
    const reveal = submit("lookup_secret_reveal", 1050007)
    const add = trigger("passkey_register_trigger")
    expect(pickSettingsEnterTarget([reveal, save], [add])?.action).toBe(save)
    expect(pickSettingsEnterTarget([reveal], [add])?.action).toBe(add)
    expect(pickSettingsEnterTarget([reveal], [])).toEqual({ kind: "submit", action: reveal })
  })

  it("skips disabled buttons", () => {
    const save = submit("method", 1070003, { value: "password", disabled: true })
    expect(pickSettingsEnterTarget([save], [trigger("webauthn_register_trigger", true)])).toBeNull()
  })
})

describe("splitSettingsCodeList", () => {
  it("returns one entry per non-empty line", () => {
    expect(splitSettingsCodeList("ak5vnfk0\n  k5hwo3n2 \r\n\n4digp5ez")).toEqual(["ak5vnfk0", "k5hwo3n2", "4digp5ez"])
    expect(splitSettingsCodeList("")).toEqual([])
  })
})
