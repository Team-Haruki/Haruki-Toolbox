import { describe, expect, test } from "bun:test"
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios"
import zhCNAdmin from "@/shared/i18n/messages/zh-CN/zh-CN-admin"
import zhTWAdmin from "@/shared/i18n/messages/zh-TW/zh-TW-admin"
import enUSAdmin from "@/shared/i18n/messages/en-US/en-US-admin"
import {
  OAUTH_CLIENT_PAYLOAD_ERROR_MESSAGE_KEYS,
  PUBLIC_CLIENT_HAS_NO_SECRET,
  canRotateClientSecret,
  describeIncompleteRevocation,
  describeOAuthClientActionError,
  readApiErrorCode,
  readIssuedClientSecret,
  readRevocationOutcome,
} from "./client-actions"
import type { ValidatePayloadErrorCode } from "./form"

// Echoes the key and arguments, so the tests see what the view would translate.
function fakeT(key: string, params?: Record<string, unknown>, plural?: number) {
  return JSON.stringify({ key, params, plural })
}

function apiError(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() }
  const response: AxiosResponse = { status, statusText: "", headers: {}, config, data }
  return new AxiosError(`Request failed with status code ${status}`, "ERR_BAD_REQUEST", config, null, response)
}

describe("canRotateClientSecret", () => {
  test("offers rotation for confidential clients only", () => {
    expect(canRotateClientSecret({ clientType: "confidential" })).toBe(true)
    expect(canRotateClientSecret({ clientType: "public" })).toBe(false)
    // normalizeOAuthClient defaults a missing type to confidential; keep the action then.
    expect(canRotateClientSecret({})).toBe(true)
  })
})

describe("readIssuedClientSecret", () => {
  test("returns the one-time secret of a switch to confidential", () => {
    expect(readIssuedClientSecret({ clientId: "bot-1", clientSecret: " s3cr3t ", clientType: "confidential" })).toBe("s3cr3t")
    expect(readIssuedClientSecret({ client_secret: "snake" })).toBe("snake")
  })

  test("returns empty when no secret was issued", () => {
    // The backend omits clientSecret (omitempty) unless the edit switched the type.
    expect(readIssuedClientSecret({ clientId: "bot-1", clientType: "confidential" })).toBe("")
    expect(readIssuedClientSecret({ clientSecret: "   " })).toBe("")
    expect(readIssuedClientSecret({ clientSecret: null })).toBe("")
    expect(readIssuedClientSecret(undefined)).toBe("")
    expect(readIssuedClientSecret("oauth client updated")).toBe("")
    expect(readIssuedClientSecret(["s3cr3t"])).toBe("")
  })
})

describe("readRevocationOutcome", () => {
  test("a complete revocation", () => {
    expect(readRevocationOutcome({ clientId: "bot-1", active: false, revokedSubjects: 5, failedSubjects: [], revocationComplete: true }))
      .toEqual({ complete: true, failedSubjectCount: 0 })
  })

  test("failed subjects make it incomplete", () => {
    expect(readRevocationOutcome({ revokedSubjects: 4, failedSubjects: ["u-3", "kratos-9"], revocationComplete: false }))
      .toEqual({ complete: false, failedSubjectCount: 2 })
  })

  test("revocationComplete false without visible subjects is still incomplete", () => {
    // Listing failed, the access-token cleanup failed, or the failed subjects are hidden from this admin.
    expect(readRevocationOutcome({ revokedSubjects: 0, failedSubjects: [], revocationComplete: false }))
      .toEqual({ complete: false, failedSubjectCount: 0 })
  })

  test("failed subjects count even when the flag is missing", () => {
    expect(readRevocationOutcome({ failedSubjects: ["u-1"] })).toEqual({ complete: false, failedSubjectCount: 1 })
  })

  test("responses without the fields read as complete", () => {
    // Enabling a client, or a backend that predates per-subject revocation.
    expect(readRevocationOutcome({ clientId: "bot-1", active: true })).toEqual({ complete: true, failedSubjectCount: 0 })
    expect(readRevocationOutcome({ failedSubjects: null, revocationComplete: null })).toEqual({ complete: true, failedSubjectCount: 0 })
    expect(readRevocationOutcome(undefined)).toEqual({ complete: true, failedSubjectCount: 0 })
    expect(readRevocationOutcome("")).toEqual({ complete: true, failedSubjectCount: 0 })
  })
})

describe("describeIncompleteRevocation", () => {
  test("is null for a complete revocation", () => {
    expect(describeIncompleteRevocation({ complete: true, failedSubjectCount: 0 }, fakeT)).toBeNull()
  })

  test("names the failed subject count, pluralized", () => {
    expect(JSON.parse(describeIncompleteRevocation({ complete: false, failedSubjectCount: 3 }, fakeT) ?? "null")).toEqual({
      key: "adminOAuthClients.toast.revocationFailedSubjects",
      params: { count: 3 },
      plural: 3,
    })
  })

  test("falls back to a generic warning when no subject is listed", () => {
    expect(JSON.parse(describeIncompleteRevocation({ complete: false, failedSubjectCount: 0 }, fakeT) ?? "null")).toEqual({
      key: "adminOAuthClients.toast.revocationIncomplete",
    })
  })
})

describe("readApiErrorCode", () => {
  test("reads updatedData.code of an API error", () => {
    const error = apiError(400, {
      status: 400,
      message: "public clients have no secret to rotate",
      updatedData: { code: PUBLIC_CLIENT_HAS_NO_SECRET },
    })
    expect(readApiErrorCode(error)).toBe("public_client_has_no_secret")
  })

  test("is empty when there is no code", () => {
    expect(readApiErrorCode(apiError(500, { status: 500, message: "failed to rotate oauth client secret" }))).toBe("")
    expect(readApiErrorCode(apiError(400, { status: 400, message: "bad", updatedData: "nope" }))).toBe("")
    expect(readApiErrorCode(apiError(502, "<html>bad gateway</html>"))).toBe("")
    expect(readApiErrorCode(new Error("network"))).toBe("")
    expect(readApiErrorCode({ response: { data: { updatedData: { code: PUBLIC_CLIENT_HAS_NO_SECRET } } } })).toBe("")
  })
})

describe("describeOAuthClientActionError", () => {
  test("localizes public_client_has_no_secret", () => {
    const error = apiError(400, {
      status: 400,
      message: "public clients have no secret to rotate",
      updatedData: { code: PUBLIC_CLIENT_HAS_NO_SECRET },
    })
    expect(JSON.parse(describeOAuthClientActionError(error, fakeT, "Rotate failed"))).toEqual({
      key: "adminOAuthClients.toast.apiErrors.publicClientHasNoSecret",
    })
  })

  test("keeps the API message for other errors", () => {
    expect(describeOAuthClientActionError(
      apiError(500, { status: 500, message: "failed to rotate oauth client secret" }),
      fakeT,
      "Rotate failed"
    )).toBe("failed to rotate oauth client secret")
    expect(describeOAuthClientActionError(
      apiError(400, { status: 400, message: "unknown", updatedData: { code: "something_else" } }),
      fakeT,
      "Rotate failed"
    )).toBe("unknown")
    expect(describeOAuthClientActionError(new Error("Network Error"), fakeT, "Rotate failed")).toBe("Network Error")
    expect(describeOAuthClientActionError("weird", fakeT, "Rotate failed")).toBe("Rotate failed")
  })
})

// Every 400 code a client create or update answers with (adminoauth/oauth_clients.go).
const BACKEND_PAYLOAD_ERROR_CODES = [
  "unsupported_grant_type",
  "grant_type_required",
  "redirect_uris_required",
  "post_logout_requires_redirect_uris",
  "offline_access_requires_refresh_token",
  "device_requires_user_read",
  "device_write_requires_public_client",
  "invalid_device_policy",
]

function messageAt(bundle: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], bundle)
}

describe("client payload error codes", () => {
  test("every backend code has a message", () => {
    expect([...OAUTH_CLIENT_PAYLOAD_ERROR_MESSAGE_KEYS.keys()].sort()).toEqual([...BACKEND_PAYLOAD_ERROR_CODES].sort())
  })

  test("each message exists in all three locales", () => {
    for (const key of [...OAUTH_CLIENT_PAYLOAD_ERROR_MESSAGE_KEYS.values(), "adminOAuthClients.toast.apiErrors.publicClientHasNoSecret"]) {
      for (const bundle of [zhCNAdmin, zhTWAdmin, enUSAdmin]) {
        expect(typeof messageAt(bundle, key)).toBe("string")
      }
    }
  })

  test("a create or update 400 is explained in the admin's language", () => {
    for (const code of BACKEND_PAYLOAD_ERROR_CODES) {
      const error = apiError(400, { status: 400, message: "raw backend message", updatedData: { code } })
      expect(JSON.parse(describeOAuthClientActionError(error, fakeT, "Save failed"))).toEqual({
        key: OAUTH_CLIENT_PAYLOAD_ERROR_MESSAGE_KEYS.get(code),
      })
    }
  })

  test("form validation codes have messages in all three locales", () => {
    // A Record keyed by the union makes the type checker flag a code missing here.
    const codes: Record<ValidatePayloadErrorCode, true> = {
      clientIdAndNameRequired: true,
      nameRequired: true,
      grantTypeRequired: true,
      redirectUriRequired: true,
      scopeRequired: true,
      oidcScopeRequiresOpenid: true,
      postLogoutRequiresRedirectUris: true,
      offlineAccessRequiresRefreshToken: true,
      deviceRequiresUserRead: true,
      deviceWriteRequiresPublicClient: true,
      invalidDevicePolicy: true,
    }
    for (const code of Object.keys(codes)) {
      for (const bundle of [zhCNAdmin, zhTWAdmin, enUSAdmin]) {
        expect(typeof messageAt(bundle, `adminOAuthClients.toast.validation.${code}`)).toBe("string")
      }
    }
  })
})
