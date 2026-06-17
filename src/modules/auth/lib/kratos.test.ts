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
  resolveToolboxUserIdFromKratosSession,
  resolveUserSettingsFromKratosSession,
} = await import("./kratos")

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
