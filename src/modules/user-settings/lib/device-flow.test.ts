import { describe, expect, it } from "bun:test"
import type { DeviceApiError } from "@/modules/user-settings/api/oauth2.device"
import { DEFAULT_RETRY_AFTER_SECONDS, DEVICE_ERROR_CODES, mapDeviceErrorCode } from "@/modules/user-settings/lib/device-flow"

function apiError(status: number | null, code = "", extra: Partial<DeviceApiError> = {}): DeviceApiError {
  return { status, code, retryAfter: null, retryable: null, ...extra }
}

const settled = { approveOutcomeUnknown: false }
const unknownOutcome = { approveOutcomeUnknown: true }

describe("mapDeviceErrorCode (§6.5 page-state column)", () => {
  it("sends 401 to the sign-in card and 404 / feature_disabled to unavailable", () => {
    expect(mapDeviceErrorCode(apiError(401), settled).target).toBe("signedOut")
    expect(mapDeviceErrorCode(apiError(404), settled)).toEqual({ target: "unavailable", message: "feature_disabled" })
    expect(mapDeviceErrorCode(apiError(403, "feature_disabled"), settled)).toEqual({ target: "unavailable", message: "feature_disabled" })
  })

  it("ends on the error card for request and client problems", () => {
    for (const code of ["unsupported_media_type", "origin_rejected", "client_unavailable"]) {
      expect(mapDeviceErrorCode(apiError(code === "unsupported_media_type" ? 415 : 403, code), settled)).toEqual({ target: "error", message: code })
    }
  })

  it("returns to the code input for code and flow problems", () => {
    expect(mapDeviceErrorCode(apiError(400, "malformed_code"), settled)).toEqual({ target: "entry", message: "malformed_code" })
    expect(mapDeviceErrorCode(apiError(400, "invalid_code"), settled)).toEqual({ target: "entry", message: "invalid_code" })
    expect(mapDeviceErrorCode(apiError(409, "flow_conflict"), settled)).toEqual({ target: "entry", message: "flow_conflict" })
    expect(mapDeviceErrorCode(apiError(409, "session_changed"), settled)).toEqual({ target: "entry", message: "session_changed" })
  })

  it("stays put for invalid_request, temporarily_unavailable and network errors", () => {
    expect(mapDeviceErrorCode(apiError(400, "invalid_request"), settled)).toEqual({ target: "stay", message: "invalid_request" })
    expect(mapDeviceErrorCode(apiError(503, "temporarily_unavailable"), settled)).toEqual({ target: "stay", message: "temporarily_unavailable" })
    expect(mapDeviceErrorCode(apiError(null), settled)).toEqual({ target: "stay", message: "unknown" })
    expect(mapDeviceErrorCode(apiError(500), settled)).toEqual({ target: "stay", message: "unknown" })
    expect(mapDeviceErrorCode(apiError(400, "something_new"), settled)).toEqual({ target: "stay", message: "unknown" })
  })

  it("counts rate limits down from updatedData.retryAfter", () => {
    expect(mapDeviceErrorCode(apiError(429, "rate_limited", { retryAfter: 42 }), settled))
      .toEqual({ target: "stay", message: "rate_limited", retryAfter: 42 })
    expect(mapDeviceErrorCode(apiError(429, "rate_limited"), settled).retryAfter).toBe(DEFAULT_RETRY_AFTER_SECONDS)
    expect(mapDeviceErrorCode(apiError(429), settled).retryAfter).toBe(DEFAULT_RETRY_AFTER_SECONDS)
  })

  it("maps expiry and the acknowledgement check", () => {
    expect(mapDeviceErrorCode(apiError(410, "code_expired"), settled)).toEqual({ target: "expired", message: "code_expired" })
    expect(mapDeviceErrorCode(apiError(400, "ack_required"), settled)).toEqual({ target: "review", message: "ack_required", highlightAck: true })
  })

  it("turns already_handled into unconfirmed after an approve without response", () => {
    expect(mapDeviceErrorCode(apiError(409, "already_handled"), settled)).toEqual({ target: "error", message: "already_handled" })
    expect(mapDeviceErrorCode(apiError(409, "already_handled"), unknownOutcome)).toEqual({ target: "unconfirmed", message: "already_handled" })
  })

  it("lets a retryable approval failure go back to the review card", () => {
    expect(mapDeviceErrorCode(apiError(502, "approval_failed", { retryable: true }), settled)).toEqual({ target: "review", message: "approval_failed" })
    expect(mapDeviceErrorCode(apiError(502, "approval_failed", { retryable: false }), settled)).toEqual({ target: "failed", message: "approval_failed" })
    expect(mapDeviceErrorCode(apiError(502, "approval_failed"), settled)).toEqual({ target: "failed", message: "approval_failed" })
  })

  it("has a message for every code it can produce", async () => {
    const [zh, en, tw] = await Promise.all([
      import("@/shared/i18n/messages/zh-CN/zh-CN-user-settings"),
      import("@/shared/i18n/messages/en-US/en-US-user-settings"),
      import("@/shared/i18n/messages/zh-TW/zh-TW-user-settings"),
    ])
    for (const messages of [zh.default, en.default, tw.default]) {
      const errors = messages.oauth.device.error as Record<string, string>
      for (const code of DEVICE_ERROR_CODES) {
        expect(errors[code]).toBeTruthy()
      }
    }
  })

  it("keeps the fixed zh-CN copy of design §6.8", async () => {
    const { default: zh } = await import("@/shared/i18n/messages/zh-CN/zh-CN-user-settings")
    const device = zh.oauth.device
    expect(device.review.phishingWarning).toBe("只有在你本人刚刚发起时才继续；不要输入他人发给你的代码")
    expect(device.review.acknowledge).toBe("我确认这是我本人刚刚在自己的设备或程序上发起的")
    expect(device.review.publicHint).toBe("任何人都可以以此应用的名义发起请求；只有你本人刚刚在自己的设备上发起时才继续")
    expect(device.result.approved).toBe("请回到设备，它应显示『已授权为 {name}』。如果不是你本人操作，请立即到「已授权应用」撤销")
    expect(device.result.unconfirmed).toBe("授权可能已完成，请查看设备；若设备未显示成功，请重新获取代码")
    expect(device.result.retryOnDevice).toBe("请在设备上重新获取代码")
    expect(zh.oauth.scopeDescription.stationRoomWrite).toBe("以你的身份向 Sekai Station 提交车牌（房间号）。")
  })
})
