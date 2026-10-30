import { describe, expect, it } from "bun:test"
import type { InheritApiError } from "@/modules/tools/api/inherit"
import { createInheritUnlock } from "@/modules/tools/composables/useInheritUnlock"

const t = (key: string) => key

// A refusal as toInheritApiError builds it; the API module itself pulls in the
// user store (web storage at import), so it is only used as a type here.
function refusal(code: string, status: number): InheritApiError {
  return { name: "InheritApiError", code, message: "", status, retryAfter: null, runningJobId: "" }
}

describe("inherit unlock fields", () => {
  it("asks a password account for its password and a PIN account for its PIN", () => {
    const unlock = createInheritUnlock(t)
    unlock.configure("password", true)
    unlock.state.secret = "pw"
    expect(unlock.validate()).toBe(true)
    expect(unlock.toInput()).toEqual({ password: "pw" })

    unlock.reset()
    unlock.configure("pin", true)
    unlock.state.secret = "12345678"
    expect(unlock.state.creating).toBe(false)
    expect(unlock.validate()).toBe(true)
    expect(unlock.toInput()).toEqual({ vaultPin: "12345678" })
  })

  it("has a first-time PIN typed twice", () => {
    const unlock = createInheritUnlock(t)
    unlock.configure("pin", false)
    expect(unlock.state.creating).toBe(true)
    unlock.state.secret = "12345678"
    unlock.state.repeat = "12345679"
    expect(unlock.validate()).toBe(false)
    expect(unlock.state.repeatError).toBe("tools.uploadData.inheritJob.confirm.pinMismatch")
  })

  it("switches to the secret the backend asked for when the hint was stale", () => {
    const unlock = createInheritUnlock(t)
    unlock.configure("password", false)
    unlock.absorb(refusal("vault_pin_required", 400))
    expect(unlock.state.kind).toBe("pin")
    expect(unlock.state.creating).toBe(true)
    expect(unlock.state.secretError).toBe("tools.uploadData.inheritErrors.vault_pin_required")

    unlock.absorb(refusal("password_required", 400))
    expect(unlock.state.kind).toBe("password")
    expect(unlock.state.creating).toBe(false)
  })

  it("drops the previous-password detour once the vault was reset", () => {
    const unlock = createInheritUnlock(t)
    unlock.configure("password", true)
    unlock.absorb(refusal("vault_password_changed", 409))
    expect(unlock.state.needsPrevious).toBe(true)
    unlock.state.secret = "new-pw"
    expect(unlock.validate()).toBe(false)
    expect(unlock.state.previousError).toBe("tools.uploadData.inheritJob.confirm.previousPasswordRequired")

    // The reset discards the key: the new password creates a new one, no old password needed.
    unlock.configure("password", false)
    expect(unlock.state.needsPrevious).toBe(false)
    expect(unlock.validate()).toBe(true)
    expect(unlock.toInput()).toEqual({ password: "new-pw" })
  })
})
