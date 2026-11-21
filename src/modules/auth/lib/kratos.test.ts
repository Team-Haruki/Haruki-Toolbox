import { describe, expect, it } from "bun:test"

const storage = {
  length: 0,
  clear: () => undefined,
  getItem: () => null,
  key: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
}

Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true })
Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true })

const {
  buildKratosBrowserFlowPath,
  resolveKratosSessionState,
  resolveToolboxUserIdFromKratosSession,
  resolveUserSettingsFromKratosSession,
} = await import("./kratos")

describe("buildKratosBrowserFlowPath", () => {
  it("starts a flow with or without a return target", () => {
    expect(buildKratosBrowserFlowPath("login")).toBe("/self-service/login/browser")
    expect(buildKratosBrowserFlowPath("settings", { returnTo: " https://toolbox.example/user/settings?section=mfa " }))
      .toBe("/self-service/settings/browser?return_to=https%3A%2F%2Ftoolbox.example%2Fuser%2Fsettings%3Fsection%3Dmfa")
  })

  it("asks a login flow for the second factor", () => {
    expect(buildKratosBrowserFlowPath("login", { aal: "aal2", returnTo: "https://toolbox.example/admin/dashboard" }))
      .toBe("/self-service/login/browser?aal=aal2&return_to=https%3A%2F%2Ftoolbox.example%2Fadmin%2Fdashboard")
    expect(buildKratosBrowserFlowPath("login", { aal: "aal2" })).toBe("/self-service/login/browser?aal=aal2")
  })

  it("keeps the level off flows that have none", () => {
    expect(buildKratosBrowserFlowPath("registration", { aal: "aal2" })).toBe("/self-service/registration/browser")
  })
})

describe("resolveKratosSessionState", () => {
  it("reads a session and its level", () => {
    const body = { id: "s1", active: true, authenticator_assurance_level: "AAL2", identity: { id: "i1" } }
    expect(resolveKratosSessionState(200, body)).toEqual({ status: "active", aal: "aal2", session: body })
    expect(resolveKratosSessionState(200, { id: "s1" })).toEqual({ status: "active", aal: "", session: { id: "s1" } })
  })

  it("reads 401 as no session", () => {
    expect(resolveKratosSessionState(401, { error: { id: "session_inactive" } })).toEqual({ status: "none" })
    expect(resolveKratosSessionState(401, null)).toEqual({ status: "none" })
  })

  it("reads the aal2 refusal as a session that owes its second factor", () => {
    const body = {
      error: { id: "session_aal2_required", code: 403 },
      redirect_browser_to: "https://auth.example/self-service/login/browser?aal=aal2",
    }
    expect(resolveKratosSessionState(403, body)).toEqual({ status: "second-factor-required" })
  })

  it("does not guess at anything else", () => {
    expect(resolveKratosSessionState(403, { error: { id: "security_csrf_violation" } })).toBeNull()
    expect(resolveKratosSessionState(403, "Forbidden")).toBeNull()
    expect(resolveKratosSessionState(500, { error: { id: "session_aal2_required" } })).toBeNull()
    expect(resolveKratosSessionState(200, null)).toBeNull()
    expect(resolveKratosSessionState(302, {})).toBeNull()
  })
})

describe("kratos session helpers", () => {
  it("resolves toolbox user id from public metadata first", () => {
    const session = {
      identity: {
        external_id: "external-user",
        metadata_public: {
          public_user_id: "public-user",
        },
        metadata_admin: {
          legacy_user_id: "legacy-user",
        },
      },
    }

    expect(resolveToolboxUserIdFromKratosSession(session)).toBe("public-user")
  })

  it("hydrates partial user settings and role from Kratos metadata", () => {
    const session = {
      identity: {
        id: "identity-1",
        traits: {
          email: "admin@example.com",
          name: "Admin",
        },
        metadata_public: {
          publicUserId: "toolbox-user",
        },
        metadata_admin: {
          role: "super-admin",
        },
      },
    }

    expect(resolveUserSettingsFromKratosSession(session)).toEqual({
      userId: "toolbox-user",
      kratosIdentityId: "identity-1",
      name: "Admin",
      role: "super_admin",
      emailInfo: {
        email: "admin@example.com",
        verified: false,
      },
    })
  })
})
